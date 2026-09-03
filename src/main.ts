import { Plugin, TFile, WorkspaceLeaf, Notice, normalizePath, MarkdownView } from "obsidian";
import { VIEW_TYPE_WROT } from "./constants";
import {
  WrotSettings,
  DEFAULT_SETTINGS,
  WrotSettingTab,
  TagColorRule,
  PinEntry,
  ScheduledPinEntry,
  ToolbarSlot,
} from "./settings";
import { WrotView } from "./views/WrotView";
import { registerWrotPostProcessor } from "./postProcessor";
import { createWrEditorExtension, tagRulesChanged, vaultFilesChanged } from "./editorExtension";
import { OGPCache } from "./utils/ogpCache";
import { GraphTagInjector } from "./utils/graphTags";
import { ATTACHMENT_EXT_RE, matchTags, tagPattern } from "./utils/patterns";
import { blendColor, darkenColor, validHex } from "./utils/color";
import { boostSelectors, WrStyleSheet } from "./styles/styleInjector";
import { buildPaletteCss } from "./styles/paletteCss";
import { buildTagRuleCss } from "./styles/tagRuleCss";
import { setMathJaxReadyHandler, upgradeMathFallbacks } from "./utils/mathjax";
import { initI18n, t, getActiveLocale } from "./i18n";

/** State kept beside data.json, and the settings keys that used to hold it there. */
const PINS_FILE = "pins.json";
const TAG_RULES_FILE = "tagrules.json";
const LAYOUT_FILE = "layout.json";
const DRAFT_FILE = "draft.json";
const MOVED_OUT_OF_SETTINGS = ["pins", "scheduledPins", "tagColorRules", "toolbarLayout"] as const;

export default class WrotPlugin extends Plugin {
  settings!: WrotSettings;
  ogpCache!: OGPCache;
  graphTags!: GraphTagInjector;
  // Tag-completion candidates (no leading #, newest first). Persisted to tags.json,
  // not data.json, because they are rewritten automatically on every post.
  recentTags: string[] = [];
  // Migration buffer for candidates once stored in data.json; populated by loadSettings.
  private legacyRecentTags: string[] | null = null;
  draft = "";
  private lastWrittenDraft: string | null = null;
  // The in-flight read of pins.json / tagrules.json. Started during load but never awaited
  // there, so it stays off the blocking path; anything that writes those files waits on it
  // first, so a save can never land on top of values that have not been read yet.
  private deferredState: Promise<void> | null = null;
  private bgSheet = new WrStyleSheet("wr-bg-override");
  private tagRuleSheet = new WrStyleSheet("wr-tag-rule-override");
  private fontSheet = new WrStyleSheet("wr-font-override");
  // Documents of the open popout windows. Runtime styles go to every window Wrot can appear
  // in, not just the focused one: with settings opened in their own window, that window would
  // otherwise be the only one to get them.
  private popoutDocs = new Set<Document>();
  // Guards against the MathJax-ready callback re-rendering through an already
  // unregistered postProcessor (stripping wr decorations) after the plugin is disabled.
  private unloading = false;

  async onload(): Promise<void> {
    initI18n();
    await this.loadSettings();
    await this.loadRecentTags();
    // Started, not awaited: onload returns without waiting on these two reads, so they stay
    // out of the startup measurement, and by the time anything needs them they are in.
    this.deferredState = this.loadDeferredState();
    this.ogpCache = new OGPCache();
    this.ogpCache.enabled = this.settings.enableOgpFetch;
    this.graphTags = new GraphTagInjector(this);

    this.registerView(
      VIEW_TYPE_WROT,
      (leaf) => new WrotView(leaf, this)
    );

    this.addRibbonIcon("feather", "Wrot", () => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
      this.activateView();
    });

    this.addCommand({
      id: "open",
      name: "Open",
      callback: () => this.activateView(),
    });

    registerWrotPostProcessor(this);

    this.registerEditorExtension([createWrEditorExtension(this.ogpCache, this.app, this, () => this.settings.checkStrikethrough)]);

    this.applyFontFollow();
    this.applyCalendarDayShape();
    this.registerEvent(
      this.app.workspace.on("css-change", () => {
        this.applyBgColor();
        this.applyTagColorRules();
      })
    );
    this.registerEvent(
      this.app.workspace.on("window-open", (win) => {
        this.popoutDocs.add(win.doc);
        this.syncStyleDocs();
      })
    );
    this.registerEvent(
      this.app.workspace.on("window-close", (win) => {
        this.popoutDocs.delete(win.doc);
      })
    );
    // MathJax is fully lazy-loaded (see utils/mathjax.ts); only register the
    // handler that redraws fallback math once loading completes.
    setMathJaxReadyHandler(() => this.onMathJaxReady());

    // The palette and tag-rule sheets are built here rather than during load: adopting a
    // sheet parses it and invalidates document style synchronously, which is dead weight in
    // the blocking load path. Applying them once after layout is enough — adopted sheets
    // always sort after the document's own stylesheets, so unlike the <style> elements this
    // replaced, they no longer need re-applying to win the specificity ladder.
    this.app.workspace.onLayoutReady(() => {
      this.applyBgColor();
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure leaves pins and rules empty, which every reader tolerates
      this.startDeferredWork();
    });

    // Incremental graph-tag updates use metadataCache "changed" (fires after re-parse, with
    // fresh cache and content) instead of vault "modify", avoiding parser races and double reads.
    this.registerEvent(
      this.app.metadataCache.on("changed", (file, data, cache) => {
        this.graphTags.onFileChanged(file, data, cache);
      })
    );
    this.registerEvent(
      this.app.metadataCache.on("deleted", (file) => {
        this.graphTags.onFileDeleted(file.path);
      })
    );
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        if (file instanceof TFile) this.graphTags.onFileRenamed(file.path, oldPath);
      })
    );

    // Deletions are watched via metadataCache: vault "delete" fires before the cache updates.
    const onAttachmentChange = (file: unknown) => {
      if (!(file instanceof TFile)) return;
      if (!ATTACHMENT_EXT_RE.test(file.extension)) return;
      this.refreshAttachmentDecorations();
    };
    this.registerEvent(this.app.metadataCache.on("deleted", onAttachmentChange));
    this.registerEvent(this.app.vault.on("create", onAttachmentChange));
    this.registerEvent(this.app.vault.on("rename", onAttachmentChange));
  }

  // Shared entry point for tag clicks (timeline/RV/LV). Integrated, non-excluded tags use the
  // native tag: query (same as clicking a graph tag node); others fall back to plain string search.
  openTagSearch(tag: string): void {
    const searchPlugin = (
      this.app as {
        internalPlugins?: {
          getPluginById?: (id: string) => { instance?: { openGlobalSearch: (query: string) => void } } | undefined;
        };
      }
    ).internalPlugins?.getPluginById?.("global-search");
    if (searchPlugin?.instance) {
      const useIntegrated =
        this.graphTags.enabled && !this.graphTags.isExcludedTag(tag);
      const query = useIntegrated
        ? this.graphTags.buildTagSearchQuery(tag)
        : `"${tag.replace(/"/g, '\\"')}"`;
      searchPlugin.instance.openGlobalSearch(query);
    } else {
      new Notice(t("view.notice.searchPluginNotFound"));
    }
  }

  // On MathJax lazy-load completion: upgrade fallback-rendered math in place and nudge Live
  // Preview (hadMathJax is part of widget eq(), so only fallback math widgets rebuild — no flicker).
  private onMathJaxReady(): void {
    window.setTimeout(() => {
      if (this.unloading) return;
      upgradeMathFallbacks();
      this.app.workspace.iterateAllLeaves((leaf) => {
        const view = leaf.view;
        if (!(view instanceof MarkdownView)) return;
        const cm = (view.editor as { cm?: { dispatch?: (tr: { effects: unknown }) => void } })?.cm;
        if (cm?.dispatch) {
          try {
            cm.dispatch({ effects: vaultFilesChanged.of(null) });
          // eslint-disable-next-line no-empty -- intentional no-op
          } catch {}
        }
      });
    }, 100);
  }

  refreshAttachmentDecorations(): void {
    this.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view;
      if (!(view instanceof MarkdownView)) return;

      const previewMode = (view as { previewMode?: { rerender?: (full: boolean) => void } }).previewMode;
      if (previewMode?.rerender) {
        try {
          previewMode.rerender(true);
        // eslint-disable-next-line no-empty -- intentional no-op
        } catch {}
      }

      const cm = (view.editor as { cm?: { dispatch?: (tr: { effects: unknown }) => void } })?.cm;
      if (cm?.dispatch) {
        try {
          cm.dispatch({ effects: vaultFilesChanged.of(null) });
        // eslint-disable-next-line no-empty -- intentional no-op
        } catch {}
      }
    });
  }

  applyFontFollow(): void {
    for (const doc of this.styleDocs()) {
      doc.body.classList.toggle("wr-font-follow", this.settings.followObsidianFontSize);
    }
    if (this.settings.followObsidianFontSize) {
      // Scale from --font-text-size to preserve the 14:13:12 size ratio.
      this.fontSheet.apply(`/* @css */
        body {
          --wr-font-text: var(--font-text-size);
          --wr-font-ui-small: calc(var(--font-text-size) * 0.929);
          --wr-font-ui-smaller: calc(var(--font-text-size) * 0.857);
          --wr-font-date: min(var(--font-text-size), 24px);
        }
      `, this.styleDocs());
    } else {
      this.fontSheet.apply(`/* @css */
        body {
          --wr-font-text: 14px;
          --wr-font-ui-small: 13px;
          --wr-font-ui-smaller: 12px;
          --wr-font-date: 14px;
        }
      `, this.styleDocs());
    }
  }

  applyBgColor(): void {
    const isDark = activeDocument.body.classList.contains("theme-dark");
    const bgColor = validHex(
      isDark ? this.settings.bgColorDark : this.settings.bgColorLight,
      isDark ? DEFAULT_SETTINGS.bgColorDark : DEFAULT_SETTINGS.bgColorLight
    );
    const textColor = validHex(
      isDark ? this.settings.textColorDark : this.settings.textColorLight,
      isDark ? DEFAULT_SETTINGS.textColorDark : DEFAULT_SETTINGS.textColorLight
    );
    const css = buildPaletteCss({
      bgColor,
      hoverColor: darkenColor(bgColor, 10),
      textColor,
      mutedColor: blendColor(textColor, bgColor, 0.45),
      faintColor: blendColor(textColor, bgColor, 0.6),
      unresolvedLinkColor: blendColor(textColor, bgColor, 0.3),
    });
    this.bgSheet.apply(boostSelectors(css, 2), this.styleDocs());
  }

  findTagColorRule(memoTags: string[]): TagColorRule | null {
    if (!this.settings.tagColorRulesEnabled) return null;
    const rules = this.settings.tagColorRules;
    if (!rules || rules.length === 0 || !memoTags || memoTags.length === 0) return null;
    for (const raw of memoTags) {
      const tag = raw.replace(/^#/, "").toLowerCase().trim();
      if (!tag) continue;
      for (const rule of rules) {
        const ruleTag = rule.tag.replace(/^#/, "").toLowerCase().trim();
        if (!ruleTag) continue;
        if (ruleTag === tag) return rule;
      }
    }
    return null;
  }

  // Whether a rule keeps memos with this tag out of the timeline. Only active while
  // tag rules are enabled — same gate as the colour rules.
  // Every rule is scanned rather than going through findTagColorRule: that one stops at
  // the first tag that matches any rule, so a memo carrying both a colour tag and a
  // hidden tag would slip through depending on the order the tags appear in.
  isHiddenFromTimeline(memoTags: string[]): boolean {
    return this.matchesRuleFlag(memoTags, (rule) => rule.hideFromTimeline === true);
  }

  // A memo is protected as soon as any one of its tags asks for it, so adding a
  // second tag can never take the protection away.
  isProtectedFromDelete(memoTags: string[]): boolean {
    return this.matchesRuleFlag(memoTags, (rule) => rule.protectFromDelete === true);
  }

  private matchesRuleFlag(
    memoTags: string[],
    hasFlag: (rule: TagColorRule) => boolean
  ): boolean {
    if (!this.settings.tagColorRulesEnabled) return false;
    const rules = this.settings.tagColorRules;
    if (!rules || rules.length === 0 || !memoTags || memoTags.length === 0) return false;

    const flagged = new Set<string>();
    for (const rule of rules) {
      if (!hasFlag(rule)) continue;
      const ruleTag = rule.tag.replace(/^#/, "").toLowerCase().trim();
      if (ruleTag) flagged.add(ruleTag);
    }
    if (flagged.size === 0) return false;

    return memoTags.some((raw) => {
      const tag = raw.replace(/^#/, "").toLowerCase().trim();
      return tag !== "" && flagged.has(tag);
    });
  }

  getTagRuleClassForContent(content: string): string | null {
    if (!this.settings.tagColorRulesEnabled) return null;
    const tags = content.match(tagPattern());
    if (!tags) return null;
    const rule = this.findTagColorRule(tags);
    if (!rule) return null;
    const idx = this.settings.tagColorRules.indexOf(rule);
    if (idx < 0) return null;
    return `wr-tag-rule-${idx}`;
  }

  getRuleAccentColor(ruleClass: string): string | null {
    const m = ruleClass.match(/^wr-tag-rule-(\d+)$/);
    if (!m) return null;
    const idx = parseInt(m[1], 10);
    const rule = this.settings.tagColorRules?.[idx];
    if (!rule) return null;
    const hexRe = /^#[0-9a-fA-F]{6}$/;
    if (rule.accentColor && hexRe.test(rule.accentColor)) return rule.accentColor;
    return null;
  }

  applyCalendarDayShape(): void {
    const radiusMap = { circle: "50%", rounded: "6px", square: "0px" } as const;
    const radius = radiusMap[this.settings.calendarDayShape ?? "circle"];
    for (const doc of this.styleDocs()) {
      doc.body.style.setProperty("--wr-cal-day-radius", radius);
    }
  }

  // The main window plus every open popout. `document` is the main window's own document:
  // activeDocument would follow the focus instead, which sends styles to the wrong window
  // as soon as anything is driven from a separate settings window.
  private styleDocs(): Document[] {
    return [document, ...this.popoutDocs];
  }

  // Hands a newly opened window the styles that are already in effect.
  private syncStyleDocs(): void {
    const docs = this.styleDocs();
    this.bgSheet.sync(docs);
    this.tagRuleSheet.sync(docs);
    this.fontSheet.sync(docs);
    this.applyFontFollow();
    this.applyCalendarDayShape();
  }

  applyTagColorRules(): void {
    this.tagRuleSheet.remove();
    if (!this.settings.tagColorRulesEnabled) return;
    const rules = this.settings.tagColorRules || [];
    if (rules.length === 0) return;

    const css = buildTagRuleCss(rules);
    if (css.length === 0) return;

    this.tagRuleSheet.apply(boostSelectors(css, 4), this.styleDocs());
  }

  refreshReadingViews(): void {
    // Sweep stale wr-tag-rule-<n> classes off existing blocks; settings-UI classes lack the numeric suffix.
    const sweepSelector =
      '.wr-card[class*="wr-tag-rule-"], ' +
      'div.block-language-wr[class*="wr-tag-rule-"], ' +
      'pre[class*="wr-tag-rule-"], ' +
      '.cm-line[class*="wr-tag-rule-"], ' +
      '.code-block-flair[class*="wr-tag-rule-"], ' +
      '.copy-code-button[class*="wr-tag-rule-"], ' +
      '.wr-flair-bg[class*="wr-tag-rule-"]';
    // Every window, not just the focused one: a change made from a separate settings
    // window would otherwise never reach the notes the user is looking at.
    const docs = this.styleDocs();
    for (const doc of docs) {
      doc.querySelectorAll<HTMLElement>(sweepSelector).forEach((el) => {
        const existing = Array.from(el.classList);
        for (const cls of existing) {
          if (/^wr-tag-rule-\d+$/.test(cls)) el.classList.remove(cls);
        }
      });
    }

    if (!this.settings.tagColorRulesEnabled) return;

    const codeBlocks = docs.flatMap((doc) =>
      Array.from(
        doc.querySelectorAll('code.language-wr, .block-language-wr code, pre > code[class*="language-wr"]')
      )
    );
    codeBlocks.forEach((code) => {
      const block = code.closest(".block-language-wr") || code.closest("pre");
      if (!(block instanceof HTMLElement)) return;

      const targets: HTMLElement[] = [block];
      const container = block.parentElement;
      if (container) {
        container.querySelectorAll(".code-block-flair, .copy-code-button").forEach((el) => {
          if (el.instanceOf(HTMLElement)) targets.push(el);
        });
      }
      block.querySelectorAll(".code-block-flair, .copy-code-button").forEach((el) => {
        if (el.instanceOf(HTMLElement)) targets.push(el);
      });

      const rawText = code.getAttribute("data-wr-original") || code.textContent || "";
      const blockTags = matchTags(rawText);
      const rule = this.findTagColorRule(blockTags);
      if (!rule) return;
      const idx = this.settings.tagColorRules.indexOf(rule);
      if (idx < 0) return;

      const cls = `wr-tag-rule-${idx}`;
      for (const t of targets) t.classList.add(cls);
    });
  }

  refreshAllWrDecorations(): void {
    this.refreshViews();
    this.refreshReadingViews();
    this.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view;
      if (!(view instanceof MarkdownView)) return;
      const cm = (view.editor as { cm?: { dispatch?: (tr: { effects: unknown }) => void } })?.cm;
      if (cm?.dispatch) {
        try {
          cm.dispatch({ effects: tagRulesChanged.of(null) });
        // eslint-disable-next-line no-empty -- intentional no-op
        } catch {}
      }
    });
  }

  /** Runs `fn` against every open Wrot view, in the main window and any popout. */
  private forEachView(fn: (view: WrotView) => void): void {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_WROT)) {
      fn(leaf.view as WrotView);
    }
  }

  refreshViews(): void {
    this.forEachView((view) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
      view.refresh();
    });
  }

  updateSubmitButton(): void {
    this.forEachView((view) => view.refreshSubmitButton());
  }

  updateCalendarButton(): void {
    this.forEachView((view) => view.updateCalendarButton());
  }

  updateToolbarLayout(): void {
    this.forEachView((view) => view.applyToolbarLayout());
  }

  updateInputPlaceholder(): void {
    this.forEachView((view) => {
      view.textarea?.setAttribute("placeholder", this.settings.inputPlaceholder);
    });
  }

  onunload(): void {
    this.unloading = true;
    setMathJaxReadyHandler(null);
    // Stop the background reconcile first: otherwise it keeps injecting after the cleanup below.
    this.graphTags?.stop();
    // Remove every tag injected for the core integration, leaving no trace.
    this.graphTags?.removeAll();
    this.bgSheet.remove();
    this.tagRuleSheet.remove();
    this.fontSheet.remove();
    for (const doc of this.styleDocs()) doc.body.classList.remove("wr-font-follow");
  }

  async activateView(): Promise<void> {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(VIEW_TYPE_WROT);

    if (existing.length > 0) {
      await workspace.revealLeaf(existing[0]);
      this.focusViewInput(existing[0]);
      return;
    }

    let leaf: WorkspaceLeaf;
    switch (this.settings.viewPlacement) {
      case "left":
        leaf = workspace.getLeftLeaf(false)!;
        break;
      case "right":
        leaf = workspace.getRightLeaf(false)!;
        break;
      case "main":
      default:
        leaf = workspace.getLeaf("tab");
        break;
    }

    await leaf.setViewState({ type: VIEW_TYPE_WROT, active: true });
    await workspace.revealLeaf(leaf);
    this.focusViewInput(leaf);
  }

  private focusViewInput(leaf: WorkspaceLeaf): void {
    if (leaf.view instanceof WrotView) leaf.view.focusInput();
  }

  /**
   * Everything that waits for layout, in the order it has to happen.
   *
   * Pins and tag rules come off disk first: the settings tab enumerates the rules the moment
   * it is registered, the tag-rule sheet is built from them, and the graph integration reads
   * which rules opt out of it. Anything drawn before they arrived carries no rule class, so
   * the same re-apply a settings change uses puts them on -- skipped when there are no rules,
   * which is the default and costs nothing.
   */
  private async startDeferredWork(): Promise<void> {
    await this.deferredState;

    // Registering the tab evaluates getSettingDefinitions() right away, because the
    // settings modal indexes every definition for its search. That work is only needed
    // once the user opens settings, so it stays out of the blocking load path.
    this.addSettingTab(new WrotSettingTab(this.app, this));
    this.applyTagColorRules();
    if (this.settings.tagColorRulesEnabled && this.settings.tagColorRules.length > 0) {
      this.refreshAllWrDecorations();
    } else if (this.settings.pins.length > 0 || this.settings.scheduledPins.length > 0) {
      // A timeline restored with the workspace drew before the pins were known.
      this.refreshViews();
    }
    // Same story for the toolbar: a form built before layout.json arrived shows the
    // shipped arrangement, so redraw it once the saved one is in hand.
    if (this.settings.toolbarLayout.length > 0) this.updateToolbarLayout();
    if (this.draft) this.forEachView((view) => view.restoreDraft());
    // Integrate memo tags into the core graph view / native tag search:
    // inject from the cached map immediately, reconcile diffs in the background.
    void this.graphTags.start();
  }

  async loadSettings(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- value from untyped Obsidian/CodeMirror internal API
    const raw = (await this.loadData()) ?? {};
    let dirty = false;
    // Migrate completion candidates once stored in data.json: stash the value, drop the key.
    // loadRecentTags writes tags.json only when it doesn't exist yet.
    const rawRecentTags = (raw as { recentTags?: unknown }).recentTags;
    if (Array.isArray(rawRecentTags)) {
      this.legacyRecentTags = rawRecentTags.filter((v): v is string => typeof v === "string");
    }
    // Pins and tag rules moved out to files of their own, but their keys are deliberately
    // left in raw here: Object.assign below carries them onto settings, and loadDeferredState
    // clears them from data.json only once they are safely written elsewhere.
    for (const key of ["autoLinkEnabled", "autoLinkExcludeList", "zenMode", "zenModePins", "recentTags"]) {
      if (key in raw) {
        delete (raw as Record<string, unknown>)[key];
        dirty = true;
      }
    }
    // Migrate the pre-release 4-value graphTagsMode: anything except "off" carries over as enabled.
    if ("graphTagsMode" in raw) {
      const mode = (raw as { graphTagsMode?: unknown }).graphTagsMode;
      (raw as Record<string, unknown>).graphTagsEnabled = mode !== "off";
      delete (raw as Record<string, unknown>).graphTagsMode;
      dirty = true;
    }
    // Locale-dependent defaults apply only to fresh installs; existing users'
    // saved values arrive in raw and win via Object.assign.
    const localizedDefaults: WrotSettings = {
      ...DEFAULT_SETTINGS,
      headerDateFormat: t("defaults.headerDateFormat"),
      submitLabel: t("defaults.submitLabel"),
      updateLabel: t("defaults.updateLabel"),
      inputPlaceholder: t("defaults.inputPlaceholder"),
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- value from untyped Obsidian/CodeMirror internal API
    this.settings = Object.assign({}, localizedDefaults, raw);

    // Missing calendarDayShape: fresh installs get "rounded", existing users keep "circle".
    // Presence of viewPlacement (a day-one settings key) tells the two apart.
    if (!("calendarDayShape" in raw)) {
      this.settings.calendarDayShape = ("viewPlacement" in raw) ? "circle" : "rounded";
      dirty = true;
    }

    // If Obsidian's language changed since last run, force-reset the text settings to the new
    // locale's defaults (custom values lose meaning across languages). Missing lastLocale (pre-i18n users): record only, no reset.
    const currentLocale = getActiveLocale();
    const previousLocale = (raw as { lastLocale?: string }).lastLocale;
    if (previousLocale !== undefined && previousLocale !== currentLocale) {
      this.settings.headerDateFormat = t("defaults.headerDateFormat");
      this.settings.submitLabel = t("defaults.submitLabel");
      this.settings.updateLabel = t("defaults.updateLabel");
      this.settings.inputPlaceholder = t("defaults.inputPlaceholder");
      dirty = true;
    }
    if (previousLocale !== currentLocale) {
      this.settings.lastLocale = currentLocale;
      dirty = true;
    }

    if (dirty) {
      // Written whole, not through writeSettingsFile: the pins and rules may still be living
      // here, and stripping them before loadDeferredState has copied them out would lose them.
      await this.saveData(this.settings);
    }
  }

  /**
   * data.json holds the settings alone.
   *
   * Pins and tag rules stay on `settings` in memory, so every reader is unchanged, but they
   * are stripped on the way out — otherwise the split would last exactly until the next save.
   */
  private async writeSettingsFile(): Promise<void> {
    const toWrite: Record<string, unknown> = { ...this.settings };
    for (const key of MOVED_OUT_OF_SETTINGS) delete toWrite[key];
    await this.saveData(toWrite);
  }

  async saveSettings(): Promise<void> {
    // Waits for the same reason savePins does: stripping the moved keys before they have
    // been copied out would take them with it.
    await this.deferredState;
    await this.writeSettingsFile();
    if (this.ogpCache) {
      this.ogpCache.enabled = this.settings.enableOgpFetch;
    }
  }

  /**
   * data.json is what the user decided; everything that piles up on its own lives beside it.
   *
   * Pins move whenever a memo is pinned from the timeline and tag rules grow with every rule
   * added, so leaving either in the settings file meant it was rewritten by ordinary use and
   * got longer the more the plugin was used. Split out, data.json only changes when a setting
   * does. Each gets its own file for the same reason: pins move daily, rules only when
   * settings are open, and the toolbar arrangement is rewritten on every press while it is
   * being arranged, so one file would drag all of it along with each of them.
   */
  private pluginFilePath(name: string): string | null {
    const dir = this.manifest.dir;
    return dir ? normalizePath(`${dir}/${name}`) : null;
  }

  /** Reads a JSON file kept beside data.json. Returns null when there is nothing to read. */
  private async readSideFile(name: string): Promise<unknown> {
    const path = this.pluginFilePath(name);
    if (!path) return null;
    try {
      if (!(await this.app.vault.adapter.exists(path))) return null;
      return JSON.parse(await this.app.vault.adapter.read(path));
    } catch {
      // Unreadable or malformed: treated as absent rather than failing the load.
      return null;
    }
  }

  private async writeSideFile(name: string, value: unknown): Promise<void> {
    const path = this.pluginFilePath(name);
    if (!path) return;
    try {
      await this.app.vault.adapter.write(path, JSON.stringify(value));
    } catch {
      // Save failure is non-fatal; the next change tries again.
    }
  }

  // Tag-completion history lives in tags.json, kept separate from settings (data.json).
  private tagHistoryPath(): string | null {
    return this.pluginFilePath("tags.json");
  }

  async loadRecentTags(): Promise<void> {
    const path = this.tagHistoryPath();
    if (!path) return;
    try {
      if (await this.app.vault.adapter.exists(path)) {
        const parsed: unknown = JSON.parse(await this.app.vault.adapter.read(path));
        this.recentTags = Array.isArray(parsed)
          ? parsed.filter((v): v is string => typeof v === "string")
          : [];
      } else if (this.legacyRecentTags) {
        // One-time migration from the data.json era: adopt the values and create tags.json.
        this.recentTags = this.legacyRecentTags;
        await this.saveRecentTags();
      }
    } catch {
      // Unreadable file: restart empty; candidates re-accumulate with each post.
      this.recentTags = [];
    }
    this.legacyRecentTags = null;
  }

  async saveRecentTags(): Promise<void> {
    const path = this.tagHistoryPath();
    if (!path) return;
    try {
      await this.app.vault.adapter.write(path, JSON.stringify(this.recentTags));
    } catch {
      // Save failure is non-fatal; retried on the next post.
    }
  }

  /**
   * Pins and tag rules, read after layout rather than during load.
   *
   * Nothing needs either until then: the tag-rule sheet and the graph-tag integration both
   * already start after layout, and the timeline reads pins only once it is open. Keeping
   * the reads out of onload keeps them out of the startup measurement too.
   */
  async loadDeferredState(): Promise<void> {
    const [pinData, ruleData, layoutData, draftData] = await Promise.all([
      this.readSideFile(PINS_FILE),
      this.readSideFile(TAG_RULES_FILE),
      this.readSideFile(LAYOUT_FILE),
      this.readSideFile(DRAFT_FILE),
    ]);

    if (typeof draftData === "string") {
      this.draft = draftData;
      this.lastWrittenDraft = draftData;
    }

    // Nothing was read, but settings already hold values: they came from data.json, which is
    // where these used to live. Copy them out first and only then let data.json drop them --
    // clearing the keys before the new file exists would lose them if the app stopped between.
    let migrated = false;

    const pins = pinData as { pins?: unknown; scheduledPins?: unknown } | null;
    if (pins) {
      this.settings.pins = Array.isArray(pins.pins) ? (pins.pins as PinEntry[]) : [];
      this.settings.scheduledPins = Array.isArray(pins.scheduledPins)
        ? (pins.scheduledPins as ScheduledPinEntry[])
        : [];
    } else if (this.settings.pins.length > 0 || this.settings.scheduledPins.length > 0) {
      // Written directly rather than through savePins, which waits on this very read.
      await this.writeSideFile(PINS_FILE, {
        pins: this.settings.pins,
        scheduledPins: this.settings.scheduledPins,
      });
      migrated = true;
    }

    if (Array.isArray(ruleData)) {
      this.settings.tagColorRules = ruleData as TagColorRule[];
    } else if (this.settings.tagColorRules.length > 0) {
      await this.writeSideFile(TAG_RULES_FILE, this.settings.tagColorRules);
      migrated = true;
    }

    if (Array.isArray(layoutData)) {
      this.settings.toolbarLayout = layoutData as ToolbarSlot[];
    } else if (this.settings.toolbarLayout.length > 0) {
      await this.writeSideFile(LAYOUT_FILE, this.settings.toolbarLayout);
      migrated = true;
    }

    // writeSettingsFile strips both, so this is what actually shortens data.json.
    if (migrated) await this.writeSettingsFile();
  }

  // Both wait on the read first: writing before it lands would put the empty starting value
  // over whatever the file — or the data.json being migrated from — still holds.
  async savePins(): Promise<void> {
    await this.deferredState;
    await this.writeSideFile(PINS_FILE, {
      pins: this.settings.pins,
      scheduledPins: this.settings.scheduledPins,
    });
  }

  async saveTagRules(): Promise<void> {
    await this.deferredState;
    await this.writeSideFile(TAG_RULES_FILE, this.settings.tagColorRules);
  }

  async saveToolbarLayout(): Promise<void> {
    await this.deferredState;
    await this.writeSideFile(LAYOUT_FILE, this.settings.toolbarLayout);
  }

  draftFilePath(): string | null {
    return this.pluginFilePath(DRAFT_FILE);
  }

  /** Re-reads draft.json (it can change through sync). True when it differs from what was last known. */
  async reloadDraft(): Promise<boolean> {
    await this.deferredState;
    const data = await this.readSideFile(DRAFT_FILE);
    const text = typeof data === "string" ? data : "";
    if (text === this.lastWrittenDraft) return false;
    this.draft = text;
    this.lastWrittenDraft = text;
    return true;
  }

  async saveDraft(text: string): Promise<void> {
    this.draft = text;
    await this.deferredState;
    if (text === this.lastWrittenDraft) return;
    this.lastWrittenDraft = text;
    await this.writeSideFile(DRAFT_FILE, text);
  }
}
