import { Plugin, TFile, WorkspaceLeaf, Notice, normalizePath, MarkdownView } from "obsidian";
import { VIEW_TYPE_WROT } from "./constants";
import { WrotSettings, DEFAULT_SETTINGS, WrotSettingTab, TagColorRule } from "./settings";
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


export default class WrotPlugin extends Plugin {
  settings!: WrotSettings;
  ogpCache!: OGPCache;
  graphTags!: GraphTagInjector;
  // Tag-completion candidates (no leading #, newest first). Persisted to tags.json,
  // not data.json, because they are rewritten automatically on every post.
  recentTags: string[] = [];
  // Migration buffer for candidates once stored in data.json; populated by loadSettings.
  private legacyRecentTags: string[] | null = null;
  private bgSheet = new WrStyleSheet("wr-bg-override");
  private tagRuleSheet = new WrStyleSheet("wr-tag-rule-override");
  private fontSheet = new WrStyleSheet("wr-font-override");
  // Guards against the MathJax-ready callback re-rendering through an already
  // unregistered postProcessor (stripping wr decorations) after the plugin is disabled.
  private unloading = false;

  async onload(): Promise<void> {
    initI18n();
    await this.loadSettings();
    await this.loadRecentTags();
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

    this.addSettingTab(new WrotSettingTab(this.app, this));

    this.applyFontFollow();
    this.applyBgColor();
    this.applyTagColorRules();
    this.applyCalendarDayShape();
    this.registerEvent(
      this.app.workspace.on("css-change", () => {
        this.applyBgColor();
        this.applyTagColorRules();
      })
    );
    // MathJax is fully lazy-loaded (see utils/mathjax.ts); only register the
    // handler that redraws fallback math once loading completes.
    setMathJaxReadyHandler(() => this.onMathJaxReady());

    // No-!important policy: injected styles win specificity ties by sitting last in
    // <head>. Re-append after layout so startup CSS load order doesn't matter.
    this.app.workspace.onLayoutReady(() => {
      this.applyBgColor();
      this.applyTagColorRules();
      // Integrate memo tags into the core graph view / native tag search:
      // inject from the cached map immediately, reconcile diffs in the background.
      void this.graphTags.start();
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
    activeDocument.body.classList.toggle("wr-font-follow", this.settings.followObsidianFontSize);
    if (this.settings.followObsidianFontSize) {
      // Scale from --font-text-size to preserve the 14:13:12 size ratio.
      this.fontSheet.apply(`/* @css */
        body {
          --wr-font-text: var(--font-text-size);
          --wr-font-ui-small: calc(var(--font-text-size) * 0.929);
          --wr-font-ui-smaller: calc(var(--font-text-size) * 0.857);
          --wr-font-date: min(var(--font-text-size), 24px);
        }
      `);
    } else {
      this.fontSheet.apply(`/* @css */
        body {
          --wr-font-text: 14px;
          --wr-font-ui-small: 13px;
          --wr-font-ui-smaller: 12px;
          --wr-font-date: 14px;
        }
      `);
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
    this.bgSheet.apply(boostSelectors(css, 2));
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
    activeDocument.body.style.setProperty("--wr-cal-day-radius", radius);
  }

  applyTagColorRules(): void {
    this.tagRuleSheet.remove();
    if (!this.settings.tagColorRulesEnabled) return;
    const rules = this.settings.tagColorRules || [];
    if (rules.length === 0) return;

    const css = buildTagRuleCss(rules);
    if (css.length === 0) return;

    this.tagRuleSheet.apply(boostSelectors(css, 4));
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
    activeDocument.querySelectorAll<HTMLElement>(sweepSelector).forEach((el) => {
      const existing = Array.from(el.classList);
      for (const cls of existing) {
        if (/^wr-tag-rule-\d+$/.test(cls)) el.classList.remove(cls);
      }
    });

    if (!this.settings.tagColorRulesEnabled) return;

    activeDocument.querySelectorAll('code.language-wr, .block-language-wr code, pre > code[class*="language-wr"]').forEach((code) => {
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

  refreshViews(): void {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_WROT);
    for (const leaf of leaves) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
      (leaf.view as WrotView).refresh();
    }
  }

  updateSubmitLabel(): void {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_WROT);
    for (const leaf of leaves) {
      (leaf.view as WrotView).refreshSubmitButton();
    }
  }

  updateSubmitIcon(): void {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_WROT);
    for (const leaf of leaves) {
      (leaf.view as WrotView).refreshSubmitButton();
    }
  }

  updateCalendarButton(): void {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_WROT);
    for (const leaf of leaves) {
      (leaf.view as WrotView).updateCalendarButton();
    }
  }

  updateInputPlaceholder(): void {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_WROT);
    for (const leaf of leaves) {
      const view = leaf.view as WrotView;
      if (view.textarea) {
        view.textarea.setAttribute("placeholder", this.settings.inputPlaceholder);
      }
    }
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
    activeDocument.body.classList.remove("wr-font-follow");
  }

  async activateView(): Promise<void> {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(VIEW_TYPE_WROT);

    if (existing.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
      workspace.revealLeaf(existing[0]);
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
    // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
    workspace.revealLeaf(leaf);
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

    // If Obsidian's language changed since last run, force-reset the three text settings to the new
    // locale's defaults (custom values lose meaning across languages). Missing lastLocale (pre-i18n users): record only, no reset.
    const currentLocale = getActiveLocale();
    const previousLocale = (raw as { lastLocale?: string }).lastLocale;
    if (previousLocale !== undefined && previousLocale !== currentLocale) {
      this.settings.headerDateFormat = t("defaults.headerDateFormat");
      this.settings.submitLabel = t("defaults.submitLabel");
      this.settings.inputPlaceholder = t("defaults.inputPlaceholder");
      dirty = true;
    }
    if (previousLocale !== currentLocale) {
      this.settings.lastLocale = currentLocale;
      dirty = true;
    }

    if (dirty) {
      await this.saveData(this.settings);
    }
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    if (this.ogpCache) {
      this.ogpCache.enabled = this.settings.enableOgpFetch;
    }
  }

  // Tag-completion history lives in tags.json, kept separate from settings (data.json).
  private tagHistoryPath(): string | null {
    const dir = this.manifest.dir;
    return dir ? normalizePath(`${dir}/tags.json`) : null;
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
}
