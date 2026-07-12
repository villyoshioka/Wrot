import { Plugin, TFile, WorkspaceLeaf, Notice, normalizePath, setIcon, MarkdownView } from "obsidian";
import { VIEW_TYPE_WROT } from "./constants";
import { WrotSettings, DEFAULT_SETTINGS, WrotSettingTab, TagColorRule, SubColorScope } from "./settings";
import { WrotView } from "./views/WrotView";
import { registerWrotPostProcessor } from "./postProcessor";
import { createWrEditorExtension, tagRulesChanged, vaultFilesChanged } from "./editorExtension";
import { OGPCache } from "./utils/ogpCache";
import { GraphTagInjector } from "./utils/graphTags";
import { setMathJaxReadyHandler, upgradeMathFallbacks } from "./utils/mathjax";
import { initI18n, t, getActiveLocale } from "./i18n";

const ATTACHMENT_EXT_RE = /^(png|jpe?g|gif|webp|svg|bmp)$/i;

export default class WrotPlugin extends Plugin {
  settings!: WrotSettings;
  ogpCache!: OGPCache;
  graphTags!: GraphTagInjector;
  // Tag-completion candidates (no leading #, newest first). Persisted to tags.json,
  // not data.json, because they are rewritten automatically on every post.
  recentTags: string[] = [];
  // Migration buffer for candidates once stored in data.json; populated by loadSettings.
  private legacyRecentTags: string[] | null = null;
  private bgStyleEl: HTMLStyleElement | null = null;
  private tagRuleStyleEl: HTMLStyleElement | null = null;
  private fontStyleEl: HTMLStyleElement | null = null;
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
    if (this.fontStyleEl) {
      this.fontStyleEl.remove();
    }
    // createElement, not createEl("style"): the latter trips the no-forbidden-elements lint.
    // Style injection is required for dynamic user colors that styles.css cannot express.
    this.fontStyleEl = activeDocument.createElement("style");
    this.fontStyleEl.id = "wr-font-override";
    activeDocument.head.appendChild(this.fontStyleEl);

    if (this.settings.followObsidianFontSize) {
      // Scale from --font-text-size to preserve the 14:13:12 size ratio.
      this.fontStyleEl.textContent = `/* @css */
        body {
          --wr-font-text: var(--font-text-size);
          --wr-font-ui-small: calc(var(--font-text-size) * 0.929);
          --wr-font-ui-smaller: calc(var(--font-text-size) * 0.857);
          --wr-font-date: min(var(--font-text-size), 24px);
        }
      `;
    } else {
      this.fontStyleEl.textContent = `/* @css */
        body {
          --wr-font-text: 14px;
          --wr-font-ui-small: 13px;
          --wr-font-ui-smaller: 12px;
          --wr-font-date: 14px;
        }
      `;
    }
  }

  private validHex(hex: string, fallback: string): string {
    return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : fallback;
  }

  // Adds :not(#...) to every selector for ID-level specificity, beating styles.css/theme rules
  // without !important. Ladder: styles.css base (0-1 IDs) < bg/text stamp (2) < styles.css
  // overrides, e.g. RV copy button (3) < tag-rule CSS (4). The boost is inserted before "::"
  // (pseudo-elements must stay last); comments are stripped as they break selector detection.
  private boostSelectors(css: string, idLevels: number): string {
    let boost = "";
    for (let i = 1; i <= idLevels; i++) boost += `:not(#wr-boost-${i})`;
    const noComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
    return noComments.replace(/([^{}]+)\{/g, (_m, sels: string) => {
      const boosted = sels.split(",").map((sel) => {
        const s = sel.trim();
        if (!s) return s;
        const pe = s.indexOf("::");
        return pe >= 0 ? s.slice(0, pe) + boost + s.slice(pe) : s + boost;
      });
      return boosted.join(",\n") + " {";
    });
  }

  applyBgColor(): void {
    const isDark = activeDocument.body.classList.contains("theme-dark");
    const bgColor = this.validHex(
      isDark ? this.settings.bgColorDark : this.settings.bgColorLight,
      isDark ? DEFAULT_SETTINGS.bgColorDark : DEFAULT_SETTINGS.bgColorLight
    );
    const hoverColor = this.darkenColor(bgColor, 10);
    const textColor = this.validHex(
      isDark ? this.settings.textColorDark : this.settings.textColorLight,
      isDark ? DEFAULT_SETTINGS.textColorDark : DEFAULT_SETTINGS.textColorLight
    );
    const mutedColor = this.blendColor(textColor, bgColor, 0.45);
    const faintColor = this.blendColor(textColor, bgColor, 0.6);
    const unresolvedLinkColor = this.blendColor(textColor, bgColor, 0.3);

    // Remove and re-append to keep this style element last in <head>.
    if (this.bgStyleEl) {
      this.bgStyleEl.remove();
    }
    // createElement, not createEl("style"): avoids the no-forbidden-elements lint error.
    this.bgStyleEl = activeDocument.createElement("style");
    this.bgStyleEl.id = "wr-bg-override";
    activeDocument.head.appendChild(this.bgStyleEl);

    this.bgStyleEl.textContent = this.boostSelectors(`/* @css */
      body {
        --wr-bg-color: ${bgColor};
        --wr-bg-hover: ${hoverColor};
      }
      body .wr-input-area,
      body .wr-card,
      body div.block-language-wr,
      body .language-wr,
      body .wr-ogp-card,
      body .wr-codeblock-line {
        background: ${bgColor};
        background-color: ${bgColor};
      }
      body div.block-language-wr * {
        background: ${bgColor};
        background-color: ${bgColor};
      }
      body .wr-flair-bg {
        background: ${bgColor};
        background-color: ${bgColor};
      }
      body div.block-language-wr .wr-inline-code {
        background: rgba(0, 0, 0, 0.08);
      }
      body div.block-language-wr .wr-highlight {
        background: var(--text-highlight-bg);
      }
      /* LV: code-block-flair doubles as the copy button; its hit area covers the memo tail, so keep it transparent */
      body .wr-codeblock-line .code-block-flair {
        background: transparent;
        background-color: transparent;
      }
      body .wr-ogp-card:hover {
        background: ${hoverColor};
        background-color: ${hoverColor};
      }
      /* Mobile: neutralize the sticky post-tap :hover; show the PC hover color only while :active */
      body.is-mobile .wr-ogp-card:hover {
        background: ${bgColor};
        background-color: ${bgColor};
      }
      body.is-mobile .wr-ogp-card:active {
        background: ${hoverColor};
        background-color: ${hoverColor};
      }
      /* Body textColor stamp. wr-check-done is excluded so the later mutedColor rule wins:
         RV's pre structure never receives this rule, so LV must use the same color source */
      body .wr-content,
      body .wr-textarea,
      body .wr-date-label,
      body .wr-calendar-month-label,
      body .wr-calendar-day:not(.wr-calendar-day-selected):not(.wr-calendar-day-today):not(.wr-calendar-day-outside),
      body .wr-calendar-year:not(.wr-calendar-day-selected):not(.wr-calendar-day-today),
      body .wr-inline-code,
      body .wr-plain-text,
      body div.block-language-wr *:not(.wr-embed-missing):not(.wr-internal-link-unresolved):not(.wr-internal-link):not(.wr-tag):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url):not(.wr-check-done):not(.wr-quote-card-slot):not(.wr-quote-card-slot *):not(.wr-codeblock-display):not(.wr-codeblock-display *),
      body .wr-codeblock-line,
      body .wr-codeblock-line *:not(.wr-embed-missing):not(.wr-internal-link-unresolved):not(.wr-internal-link):not(.wr-tag):not(.wr-url):not(.wr-tag-highlight):not(.wr-internal-link-highlight):not(.wr-url-highlight):not(.wr-check-done):not(.wr-quote-card-slot):not(.wr-quote-card-slot *):not(.wr-codeblock-display):not(.wr-codeblock-display *),
      body .cm-line.wr-codeblock-line,
      body .cm-line.wr-codeblock-line *:not(.wr-embed-missing):not(.wr-internal-link-unresolved):not(.wr-internal-link):not(.wr-tag):not(.wr-url):not(.wr-tag-highlight):not(.wr-internal-link-highlight):not(.wr-url-highlight):not(.wr-check-done):not(.wr-quote-card-slot):not(.wr-quote-card-slot *):not(.wr-codeblock-display):not(.wr-codeblock-display *):not(.wr-lp-marker),
      body .wr-reading-list li,
      body .wr-bullet-list li,
      body .wr-ordered-list li {
        color: ${textColor};
      }
      body .wr-calendar-weekday,
      body .wr-calendar-nav-btn {
        color: ${mutedColor};
      }
      body .wr-calendar-day-outside {
        color: ${faintColor};
      }
      /* Restore Prism token colors inside nested code blocks */
      body .wr-codeblock-display code[class*="language-"],
      body .wr-codeblock-display pre[class*="language-"] {
        color: var(--code-normal);
      }
      body .wr-codeblock-display .token.comment,
      body .wr-codeblock-display .token.prolog,
      body .wr-codeblock-display .token.doctype,
      body .wr-codeblock-display .token.cdata { color: var(--code-comment); }
      body .wr-codeblock-display .token.punctuation { color: var(--code-punctuation); }
      body .wr-codeblock-display .token.property,
      body .wr-codeblock-display .token.tag,
      body .wr-codeblock-display .token.boolean,
      body .wr-codeblock-display .token.number,
      body .wr-codeblock-display .token.constant,
      body .wr-codeblock-display .token.symbol,
      body .wr-codeblock-display .token.deleted { color: var(--code-tag); }
      body .wr-codeblock-display .token.selector,
      body .wr-codeblock-display .token.attr-name,
      body .wr-codeblock-display .token.string,
      body .wr-codeblock-display .token.char,
      body .wr-codeblock-display .token.builtin,
      body .wr-codeblock-display .token.inserted { color: var(--code-string); }
      body .wr-codeblock-display .token.operator,
      body .wr-codeblock-display .token.entity,
      body .wr-codeblock-display .token.url,
      body .wr-codeblock-display .language-css .token.string,
      body .wr-codeblock-display .style .token.string { color: var(--code-operator); }
      body .wr-codeblock-display .token.atrule,
      body .wr-codeblock-display .token.attr-value,
      body .wr-codeblock-display .token.keyword { color: var(--code-keyword); }
      body .wr-codeblock-display .token.function,
      body .wr-codeblock-display .token.class-name { color: var(--code-function); }
      body .wr-codeblock-display .token.regex,
      body .wr-codeblock-display .token.important,
      body .wr-codeblock-display .token.variable { color: var(--code-value); }
      body .wr-nav-btn,
      body .wr-today-btn,
      body .wr-toolbar-btn,
      body .wr-copy-btn,
      body .wr-copy-btn .svg-icon,
      body .wr-menu-btn,
      body .wr-menu-btn .svg-icon,
      body .wr-pin-indicator,
      body .wr-pin-indicator .svg-icon,
      body .wr-timestamp,
      body .wr-submit-btn,
      body .wr-empty,
      body .wr-ogp-title,
      body .wr-ogp-desc,
      body .wr-ogp-site,
      body .wr-flair-bg,
      body .wr-codeblock-line .code-block-flair,
      body .cm-line.wr-codeblock-line .wr-lp-marker,
      body .cm-line.wr-codeblock-line .wr-list-highlight,
      body .cm-line.wr-codeblock-line .wr-check-unchecked,
      body .cm-line.wr-codeblock-line .wr-check-checked,
      body .cm-line.wr-codeblock-line .wr-ol-highlight,
      body .cm-line.wr-codeblock-line .wr-quote-highlight,
      body .wr-blockquote,
      body .wr-blockquote *,
      body .cm-line.wr-blockquote-line,
      body .cm-line.wr-blockquote-line *,
      body .wr-quote-card-slot .wr-quote-card .wr-quote-card-body,
      body .wr-quote-card-slot .wr-quote-card .wr-quote-card-body *:not(.wr-tag):not(.wr-url):not(.wr-internal-link):not(.wr-nested-quote-marker):not(.wr-quote-image-marker):not(.wr-quote-math-marker):not(.wr-quote-code-marker):not(.wr-quote-image-marker *):not(.wr-quote-math-marker *):not(.wr-quote-code-marker *):not(.wr-tag *):not(.wr-url *):not(.wr-internal-link *),
      body .wr-quote-card-slot .wr-quote-card .wr-quote-card-meta,
      body .wr-quote-card-slot .wr-quote-card .wr-quote-image-marker,
      body .wr-quote-card-slot .wr-quote-card .wr-quote-math-marker,
      body .wr-quote-card-slot .wr-quote-card .wr-quote-code-marker,
      body .wr-quote-card-slot .wr-quote-card .wr-nested-quote-marker {
        color: ${mutedColor};
      }
      body .wr-quote-card-slot .wr-quote-card {
        border-color: ${mutedColor};
      }
      body .wr-quote-card-slot .wr-quote-card .wr-quote-card-body .wr-blockquote {
        border-left-color: ${mutedColor};
      }
      body .wr-ogp-card {
        border-color: ${mutedColor};
      }
      /* Re-declared at higher specificity so marker colors also reach LV widget DOM */
      body .cm-line .wr-lp-marker:not(#x):not(#y):not(#z),
      body .cm-line .wr-list-highlight:not(#x):not(#y):not(#z),
      body .cm-line .wr-check-unchecked:not(#x):not(#y):not(#z),
      body .cm-line .wr-check-checked:not(#x):not(#y):not(#z),
      body .cm-line .wr-ol-highlight:not(#x):not(#y):not(#z),
      body .cm-line .wr-quote-highlight:not(#x):not(#y):not(#z),
      body .cm-line.wr-blockquote-line:not(#x):not(#y):not(#z),
      body .cm-line .wr-blockquote-wrap:not(#x):not(#y):not(#z),
      body .cm-line .wr-blockquote-wrap:not(#x):not(#y):not(#z) *:not(.wr-tag-highlight):not(.wr-internal-link-highlight):not(.wr-url-highlight):not(.wr-math-highlight):not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url),
      body .cm-line .wr-ogp-title:not(#x):not(#y):not(#z),
      body .cm-line .wr-ogp-desc:not(#x):not(#y):not(#z),
      body .cm-line .wr-ogp-site:not(#x):not(#y):not(#z),
      body .cm-line .wr-ogp-loading:not(#x):not(#y):not(#z) {
        color: ${mutedColor};
      }
      /* Checkbox border uses the sub color; checked fill uses the theme accent */
      body .wr-check-item input[type="checkbox"],
      body .wr-bullet-list .wr-check-item input[type="checkbox"],
      body .wr-reading-list .wr-check-item input[type="checkbox"],
      body .wr-lp-check input[type="checkbox"] {
        --checkbox-border-color: ${mutedColor};
        --checkbox-border-color-hover: ${mutedColor};
        --checkbox-color: var(--text-accent);
        --checkbox-color-hover: var(--text-accent);
        accent-color: var(--text-accent);
      }
      body .wr-textarea::placeholder {
        color: ${faintColor};
      }
      body .wr-toolbar-btn.wr-toolbar-active {
        color: var(--text-accent);
      }
      /* Menu-open 3-dot button: (0,3,1) beats the muted rule above (0,2,1);
         declared here rather than relying on the static CSS equivalent */
      body .wr-menu-btn.wr-toolbar-active .svg-icon {
        color: var(--text-accent);
        stroke: var(--text-accent);
      }
      body .cm-line.wr-codeblock-line .wr-tag-highlight,
      body .cm-line.wr-codeblock-line .wr-url-highlight,
      body .cm-line.wr-codeblock-line .wr-internal-link-highlight,
      body .cm-line.wr-codeblock-line .wr-math-highlight {
        color: var(--text-accent);
      }
      body .wr-blockquote-wrap,
      body .wr-check-done {
        color: ${mutedColor};
      }
      body .wr-blockquote,
      body .wr-blockquote-wrap {
        border-left-color: ${mutedColor};
      }
      /* LV quote bars (::before, nested via box-shadow) use the same mutedColor as RV's
         border-left so both views share one color source; tag-rule CSS (tier 4) still wins */
      body .cm-line.wr-blockquote-line::before {
        background-color: ${mutedColor};
      }
      body .cm-line.wr-blockquote-depth-2::before {
        box-shadow: 18px 0 0 0 ${mutedColor};
      }
      body .cm-line.wr-blockquote-depth-3::before {
        box-shadow:
          18px 0 0 0 ${mutedColor},
          36px 0 0 0 ${mutedColor};
      }
      body .cm-line.wr-blockquote-depth-4::before {
        box-shadow:
          18px 0 0 0 ${mutedColor},
          36px 0 0 0 ${mutedColor},
          54px 0 0 0 ${mutedColor};
      }
      body .cm-line.wr-blockquote-depth-5::before {
        box-shadow:
          18px 0 0 0 ${mutedColor},
          36px 0 0 0 ${mutedColor},
          54px 0 0 0 ${mutedColor},
          72px 0 0 0 ${mutedColor};
      }
      body .wr-bullet-list > li:not(.wr-check-item)::before,
      body .wr-ordered-list > li::before,
      body ul.wr-reading-list > li:not(.wr-check-item)::before,
      body ol.wr-reading-list > li::before {
        color: ${mutedColor};
      }
      body .wr-tag,
      body .wr-reading-tag,
      body .wr-internal-link,
      body .wr-url,
      body .wr-reading-url,
      body div.block-language-wr a.wr-internal-link,
      body div.block-language-wr .wr-reading-tag,
      body div.block-language-wr .wr-reading-url,
      body div.block-language-wr a,
      body .cm-line.wr-codeblock-line .wr-internal-link,
      body .cm-line.wr-codeblock-line .wr-url {
        color: var(--text-accent);
      }
      body .cm-line.wr-codeblock-line .wr-internal-link.wr-internal-link-unresolved,
      body div.block-language-wr a.wr-internal-link.wr-internal-link-unresolved,
      body .wr-internal-link.wr-internal-link-unresolved {
        color: ${unresolvedLinkColor};
      }
      body .wr-submit-btn.wr-submit-active {
        color: var(--text-on-accent);
      }
      body .wr-copy-btn .svg-icon,
      body .wr-menu-btn .svg-icon,
      body .wr-pin-indicator .svg-icon {
        stroke: ${mutedColor};
      }
      body .wr-menu {
        background: ${bgColor};
        background-color: ${bgColor};
        border-color: ${hoverColor};
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
      body .wr-menu .menu-item {
        color: ${textColor};
        background-color: ${bgColor};
      }
      body .wr-menu .menu-item .menu-item-icon .svg-icon {
        color: ${mutedColor};
        stroke: ${mutedColor};
      }
      .is-mobile body .wr-menu .menu-item:not(.is-label):not(.is-disabled):hover,
      .is-mobile body .wr-menu .menu-item:not(.is-label):not(.is-disabled):active,
      body .wr-menu .menu-item:not(.is-disabled):hover,
      body .wr-menu .menu-item:not(.is-disabled).selected,
      body .wr-menu .menu-item:not(.is-disabled).is-selected,
      body .wr-menu .menu-item:not(.is-disabled):active {
        background-color: ${hoverColor};
      }
      body .wr-menu .menu-separator {
        border-color: ${hoverColor};
        background: transparent;
        background-color: transparent;
      }
      body .wr-menu .menu-item.is-disabled {
        color: ${faintColor};
      }
      body .wr-thumbnail-remove {
        background: ${this.blendColor(textColor, bgColor, 0.7)};
        background-color: ${this.blendColor(textColor, bgColor, 0.7)};
        color: ${bgColor};
      }
      body .wr-thumbnail-remove .svg-icon {
        color: ${bgColor};
        stroke: ${bgColor};
      }
      body .wr-thumbnail-remove:hover {
        background: ${this.blendColor(textColor, bgColor, 0.5)};
        background-color: ${this.blendColor(textColor, bgColor, 0.5)};
      }
    `, 2);
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
    const tags = content.match(/#[^\s#]+/g);
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
    if (this.tagRuleStyleEl) {
      this.tagRuleStyleEl.remove();
      this.tagRuleStyleEl = null;
    }
    if (!this.settings.tagColorRulesEnabled) return;
    const rules = this.settings.tagColorRules || [];
    if (rules.length === 0) return;

    const hexRe = /^#[0-9a-fA-F]{6}$/;
    const parts: string[] = [];
    rules.forEach((rule, i) => {
      if (!hexRe.test(rule.bgColor) || !hexRe.test(rule.textColor)) return;
      const bg = rule.bgColor;
      const fg = rule.textColor;
      const accent = rule.accentColor && hexRe.test(rule.accentColor) ? rule.accentColor : null;
      const hoverBg = this.darkenColor(bg, 10);
      const autoMuted = this.blendColor(fg, bg, 0.45);
      const subSet = !!(rule.subColor && hexRe.test(rule.subColor));
      const userMuted = subSet ? (rule.subColor as string) : autoMuted;
      const scope = rule.subColorScope;
      const pickMuted = (key: keyof SubColorScope): string => {
        if (!subSet) return autoMuted;
        if (!scope) return userMuted;
        return scope[key] === false ? autoMuted : userMuted;
      };
      const mButtons = pickMuted("buttons");
      const mQuote = pickMuted("quote");
      const mList = pickMuted("list");
      const mOgp = pickMuted("ogp");
      // Unresolved link/embed color: same blend logic as the base palette, from this rule's fg/bg.
      const mUnresolved = this.blendColor(fg, bg, 0.3);
      const cls = `wr-tag-rule-${i}`;

      parts.push(`/* @css */
      body .wr-card.${cls},
      body div.block-language-wr.${cls},
      body pre.${cls},
      body .cm-line.wr-codeblock-line.${cls},
      body .wr-lp-codeblock.${cls},
      body .wr-lp-mathblock.${cls},
      body .wr-flair-bg.${cls} {
        background: ${bg};
        background-color: ${bg};
      }
      /* Quote cards block the quoting memo's bg; the quoted memo's own rule paints them */
      body .wr-card.${cls} .wr-quote-card:not([class*="wr-tag-rule-"]),
      body div.block-language-wr.${cls} .wr-quote-card:not([class*="wr-tag-rule-"]),
      body pre.${cls} .wr-quote-card:not([class*="wr-tag-rule-"]),
      body .cm-line.wr-codeblock-line.${cls} .wr-quote-card:not([class*="wr-tag-rule-"]) {
        background: var(--wr-bg-color, #f8f8f8);
        background-color: var(--wr-bg-color, #f8f8f8);
      }
      body div.block-language-wr.${cls} *:not(.wr-inline-code):not(.wr-highlight):not(.wr-quote-card-slot):not(.wr-quote-card-slot *):not(input[type="checkbox"]),
      body pre.${cls} *:not(.wr-inline-code):not(.wr-highlight):not(.wr-quote-card-slot):not(.wr-quote-card-slot *):not(input[type="checkbox"]) {
        background: ${bg};
        background-color: ${bg};
      }

      body .wr-card.${cls} .wr-content,
      body .wr-card.${cls} .wr-content *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-blockquote):not(.wr-quote-card-slot):not(.wr-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-blockquote *):not(.wr-quote-card-slot *) {
        color: ${fg};
      }
      body div.block-language-wr.${cls},
      body div.block-language-wr.${cls} *:not(.wr-reading-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-url):not(.wr-blockquote):not(.wr-quote-card-slot):not(input[type="checkbox"]):not(.copy-code-button):not(.copy-code-button *):not(.wr-reading-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-reading-url *):not(.wr-blockquote *):not(.wr-quote-card-slot *),
      body pre.${cls},
      body pre.${cls} *:not(.wr-reading-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-url):not(.wr-blockquote):not(.wr-quote-card-slot):not(input[type="checkbox"]):not(.copy-code-button):not(.copy-code-button *):not(.wr-reading-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-reading-url *):not(.wr-blockquote *):not(.wr-quote-card-slot *) {
        color: ${fg};
      }
      body .cm-line.wr-codeblock-line.${cls},
      body .cm-line.wr-codeblock-line.${cls} *:not(.wr-tag-highlight):not(.wr-internal-link-highlight):not(.wr-internal-link):not(.wr-url-highlight):not(.wr-lp-marker):not(.wr-list-highlight):not(.wr-ol-highlight):not(.wr-quote-highlight):not(.wr-blockquote-wrap):not(.wr-check-unchecked):not(.wr-check-checked):not(.wr-check-done):not(.wr-quote-card-slot):not(.wr-embed-missing):not(input[type="checkbox"]):not(.wr-tag-highlight *):not(.wr-internal-link-highlight *):not(.wr-url-highlight *):not(.wr-blockquote-wrap *):not(.wr-quote-card-slot *) {
        color: ${fg};
      }

      body .wr-card.${cls} .wr-timestamp,
      body .wr-card.${cls} .wr-copy-btn,
      body .wr-card.${cls} .wr-copy-btn .svg-icon,
      body .wr-card.${cls} .wr-menu-btn,
      body .wr-card.${cls} .wr-menu-btn .svg-icon,
      body .wr-card.${cls} .wr-pin-indicator,
      body .wr-card.${cls} .wr-pin-indicator .svg-icon,
      body pre.${cls} .copy-code-button,
      body pre.${cls} .copy-code-button .svg-icon,
      body div.block-language-wr.${cls} .copy-code-button,
      body div.block-language-wr.${cls} .copy-code-button .svg-icon {
        color: ${mButtons};
      }
      body .wr-card.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote),
      body .wr-card.${cls} .wr-blockquote-wrap:not(.wr-quote-card-slot .wr-blockquote-wrap),
      body .wr-card.${cls} .wr-quote-highlight,
      body div.block-language-wr.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote),
      body pre.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote),
      body .cm-line.wr-codeblock-line.${cls}.wr-blockquote-line,
      body .cm-line.wr-codeblock-line.${cls} .wr-blockquote-wrap {
        color: ${mQuote};
      }
      body .wr-card.${cls} .wr-bullet-list > li:not(.wr-check-item)::before,
      body .wr-card.${cls} .wr-ordered-list > li::before,
      body .wr-card.${cls} .wr-check-done,
      body .wr-card.${cls} .wr-check-unchecked,
      body .wr-card.${cls} .wr-check-checked,
      body .wr-card.${cls} .wr-list-highlight,
      body .wr-card.${cls} .wr-ol-highlight,
      body div.block-language-wr.${cls} ul.wr-reading-list > li:not(.wr-check-item)::before,
      body div.block-language-wr.${cls} ol.wr-reading-list > li::before,
      body pre.${cls} ul.wr-reading-list > li:not(.wr-check-item)::before,
      body pre.${cls} ol.wr-reading-list > li::before,
      body .cm-line.wr-codeblock-line.${cls} .wr-list-highlight,
      body .cm-line.wr-codeblock-line.${cls} .wr-check-unchecked,
      body .cm-line.wr-codeblock-line.${cls} .wr-check-checked,
      body .cm-line.wr-codeblock-line.${cls} .wr-ol-highlight,
      body .cm-line.wr-codeblock-line.${cls} .wr-lp-marker {
        color: ${mList};
      }
      /* Re-declared at ID-equivalent specificity so tag-rule sub colors win in LV widget DOM.
         wr-check-done excluded: static CSS muted wins in RV, so LV defers to static CSS too */
      body .cm-line.${cls} .wr-lp-marker:not(#x):not(#y):not(#z),
      body .cm-line.${cls} .wr-list-highlight:not(#x):not(#y):not(#z),
      body .cm-line.${cls} .wr-check-unchecked:not(#x):not(#y):not(#z),
      body .cm-line.${cls} .wr-check-checked:not(#x):not(#y):not(#z),
      body .cm-line.${cls} .wr-ol-highlight:not(#x):not(#y):not(#z) {
        color: ${mList};
      }
      /* ID-equivalent specificity so quote text and bars take the rule's quote color in LV widget DOM */
      body .cm-line.${cls}.wr-blockquote-line:not(#x):not(#y):not(#z),
      body .cm-line.${cls} .wr-blockquote-wrap:not(#x):not(#y):not(#z),
      body .cm-line.${cls} .wr-blockquote-wrap:not(#x):not(#y):not(#z) *,
      body .cm-line.${cls} .wr-quote-highlight:not(#x):not(#y):not(#z) {
        color: ${mQuote};
      }
      /* Checkbox border uses the sub color; checked fill uses the rule accent */
      body .wr-card.${cls} .wr-check-item input[type="checkbox"],
      body div.block-language-wr.${cls} .wr-check-item input[type="checkbox"],
      body pre.${cls} .wr-check-item input[type="checkbox"],
      body .cm-line.wr-codeblock-line.${cls} .wr-lp-check input[type="checkbox"] {
        --checkbox-border-color: ${mList};
        --checkbox-border-color-hover: ${mList};
        --checkbox-color: ${accent ?? "var(--text-accent)"};
        --checkbox-color-hover: ${accent ?? "var(--text-accent)"};
        accent-color: ${accent ?? "var(--text-accent)"};
      }
      /* Blockquotes inside quote cards belong to the quoted memo, so they are
         excluded from the ancestor (quoting) rule's mQuote */
      body .wr-card.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url):not(.wr-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-reading-tag *):not(.wr-reading-url *),
      body div.block-language-wr.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url):not(.wr-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-reading-tag *):not(.wr-reading-url *),
      body pre.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url):not(.wr-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-reading-tag *):not(.wr-reading-url *) {
        color: ${mQuote};
      }
      /* ID-equivalent re-declaration in case the text-color stamp wins on specificity (quote-card content excluded) */
      body .wr-card.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote):not(#x):not(#y):not(#z),
      body .wr-card.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote):not(#x):not(#y):not(#z) *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url),
      body div.block-language-wr.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote):not(#x):not(#y):not(#z),
      body div.block-language-wr.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote):not(#x):not(#y):not(#z) *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url),
      body pre.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote):not(#x):not(#y):not(#z),
      body pre.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote):not(#x):not(#y):not(#z) *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url) {
        color: ${mQuote};
      }
      body .cm-line.wr-codeblock-line.${cls} .wr-tag-highlight .wr-blockquote-wrap,
      body .cm-line.wr-codeblock-line.${cls} .wr-internal-link-highlight .wr-blockquote-wrap,
      body .cm-line.wr-codeblock-line.${cls} .wr-url-highlight .wr-blockquote-wrap,
      body .cm-line.wr-codeblock-line.${cls} .wr-math-highlight .wr-blockquote-wrap,
      body .cm-line.wr-codeblock-line.${cls} .wr-internal-link .wr-blockquote-wrap,
      body .cm-line.wr-codeblock-line.${cls} .wr-url .wr-blockquote-wrap {
        color: ${accent ?? "var(--text-accent)"};
      }
      body .wr-card.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-tag,
      body .wr-card.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-internal-link,
      body .wr-card.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-url,
      body .wr-card.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-reading-tag,
      body .wr-card.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-reading-url,
      body div.block-language-wr.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-tag,
      body div.block-language-wr.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-internal-link,
      body div.block-language-wr.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-url,
      body div.block-language-wr.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-reading-tag,
      body div.block-language-wr.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-reading-url,
      body pre.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-tag,
      body pre.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-internal-link,
      body pre.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-url,
      body pre.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-reading-tag,
      body pre.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) .wr-reading-url {
        color: ${accent ?? "var(--text-accent)"};
      }
      /* Border color likewise; blockquotes inside quote cards excluded (card content = quoted memo) */
      body .wr-card.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote),
      body .wr-card.${cls} .wr-blockquote-wrap:not(.wr-quote-card-slot .wr-blockquote-wrap),
      body div.block-language-wr.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote),
      body pre.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) {
        border-left-color: ${mQuote};
      }
      /* Border color follows the quoting side's look, so it is not overridden here */
      body .wr-quote-card-slot .wr-quote-card.${cls} {
        background: ${bg};
        background-color: ${bg};
      }
      body .wr-quote-card-slot .wr-quote-card.${cls}:hover {
        background: ${hoverBg};
        background-color: ${hoverBg};
      }
      /* When this rule class sits on the ancestor card, nested quote-card borders follow its sub color */
      body .wr-card.${cls} .wr-quote-card-slot .wr-quote-card,
      body div.block-language-wr.${cls} .wr-quote-card-slot .wr-quote-card,
      body pre.${cls} .wr-quote-card-slot .wr-quote-card,
      body .cm-line.wr-codeblock-line.${cls} .wr-quote-card-slot .wr-quote-card {
        border-color: ${mQuote};
      }
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body,
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-nested-quote-marker):not(.wr-blockquote):not(.wr-quote-image-marker):not(.wr-quote-math-marker):not(.wr-quote-code-marker):not(input[type="checkbox"]):not(.wr-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-quote-image-marker *):not(.wr-quote-math-marker *):not(.wr-quote-code-marker *),
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-meta,
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-blockquote,
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-blockquote * {
        color: ${mQuote};
      }
      /* ID-equivalent re-declaration against the base quote-card mutedColor rule */
      body .wr-quote-card-slot .wr-quote-card.${cls}:not(#x):not(#y):not(#z) .wr-quote-card-body .wr-blockquote,
      body .wr-quote-card-slot .wr-quote-card.${cls}:not(#x):not(#y):not(#z) .wr-quote-card-body .wr-blockquote * {
        color: ${mQuote};
      }
      /* Markers mirror the base muted rule's :not() chain to avoid losing on specificity */
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-quote-image-marker:not(.wr-tag):not(.wr-url):not(.wr-internal-link):not(.wr-nested-quote-marker):not(.wr-tag *):not(.wr-url *):not(.wr-internal-link *),
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-quote-math-marker:not(.wr-tag):not(.wr-url):not(.wr-internal-link):not(.wr-nested-quote-marker):not(.wr-tag *):not(.wr-url *):not(.wr-internal-link *),
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-quote-code-marker:not(.wr-tag):not(.wr-url):not(.wr-internal-link):not(.wr-nested-quote-marker):not(.wr-tag *):not(.wr-url *):not(.wr-internal-link *),
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-nested-quote-marker:not(.wr-tag):not(.wr-url):not(.wr-internal-link):not(.wr-quote-image-marker):not(.wr-tag *):not(.wr-url *):not(.wr-internal-link *) {
        color: ${mQuote};
      }
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-blockquote {
        border-left-color: ${mQuote};
      }
      /* Quote-card checkboxes (custom spans) match the card body color */
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-check {
        border-color: ${mQuote};
      }
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-check-done {
        background-color: ${mQuote};
        border-color: ${mQuote};
      }
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-tag,
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-internal-link,
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-url {
        color: ${accent ?? "var(--text-accent)"};
      }
      body .cm-line.wr-codeblock-line.wr-blockquote-line.${cls}::before {
        background-color: ${mQuote};
      }
      body .cm-line.wr-codeblock-line.wr-blockquote-depth-2.${cls}::before {
        box-shadow: 18px 0 0 0 ${mQuote};
      }
      body .cm-line.wr-codeblock-line.wr-blockquote-depth-3.${cls}::before {
        box-shadow:
          18px 0 0 0 ${mQuote},
          36px 0 0 0 ${mQuote};
      }
      body .cm-line.wr-codeblock-line.wr-blockquote-depth-4.${cls}::before {
        box-shadow:
          18px 0 0 0 ${mQuote},
          36px 0 0 0 ${mQuote},
          54px 0 0 0 ${mQuote};
      }
      body .cm-line.wr-codeblock-line.wr-blockquote-depth-5.${cls}::before {
        box-shadow:
          18px 0 0 0 ${mQuote},
          36px 0 0 0 ${mQuote},
          54px 0 0 0 ${mQuote},
          72px 0 0 0 ${mQuote};
      }
      body .wr-card.${cls} .wr-copy-btn .svg-icon,
      body .wr-card.${cls} .wr-menu-btn .svg-icon,
      body .wr-card.${cls} .wr-pin-indicator .svg-icon {
        stroke: ${mButtons};
      }
      body .wr-card.${cls} .wr-copy-btn.wr-copy-done .svg-icon {
        color: ${accent ?? "var(--text-accent)"};
        stroke: ${accent ?? "var(--text-accent)"};
      }
      /* Menu-open 3-dot button: the static CSS active rule (0,3,1) loses to the mButtons
         rule above (0,4,1), so override here even when no custom accent is set */
      body .wr-card.${cls} .wr-menu-btn.wr-toolbar-active .svg-icon {
        color: ${accent ?? "var(--text-accent)"};
        stroke: ${accent ?? "var(--text-accent)"};
      }
      ${accent ? `
      body .wr-card.${cls} .wr-tag:not(.wr-quote-card-slot *),
      body .wr-card.${cls} .wr-internal-link:not(.wr-quote-card-slot *),
      body .wr-card.${cls} .wr-url:not(.wr-quote-card-slot *),
      body div.block-language-wr.${cls} .wr-reading-tag:not(.wr-quote-card-slot *),
      body div.block-language-wr.${cls} .wr-internal-link:not(.wr-quote-card-slot *),
      body div.block-language-wr.${cls} .wr-reading-url:not(.wr-quote-card-slot *),
      body div.block-language-wr.${cls} a:not(.wr-quote-card-slot):not(.wr-quote-card-slot *),
      body pre.${cls} .wr-reading-tag:not(.wr-quote-card-slot *),
      body pre.${cls} .wr-internal-link:not(.wr-quote-card-slot *),
      body pre.${cls} .wr-reading-url:not(.wr-quote-card-slot *),
      body .cm-line.wr-codeblock-line.${cls} .wr-tag-highlight:not(.wr-quote-card-slot *),
      body .cm-line.wr-codeblock-line.${cls} .wr-internal-link-highlight:not(.wr-quote-card-slot *),
      body .cm-line.wr-codeblock-line.${cls} .wr-url-highlight:not(.wr-quote-card-slot *),
      body .cm-line.wr-codeblock-line.${cls} .wr-math-highlight:not(.wr-quote-card-slot *),
      body .cm-line.wr-codeblock-line.${cls} .wr-internal-link:not(.wr-quote-card-slot *),
      body .cm-line.wr-codeblock-line.${cls} .wr-url:not(.wr-quote-card-slot *) {
        color: ${accent};
      }
      ` : ""}

      body .wr-card.${cls} .wr-internal-link.wr-internal-link-unresolved:not(.wr-quote-card-slot *),
      body .wr-card.${cls} .wr-embed-missing:not(.wr-quote-card-slot *),
      body div.block-language-wr.${cls} .wr-internal-link.wr-internal-link-unresolved:not(.wr-quote-card-slot *),
      body div.block-language-wr.${cls} a.wr-internal-link.wr-internal-link-unresolved:not(.wr-quote-card-slot *),
      body div.block-language-wr.${cls} .wr-embed-missing:not(.wr-quote-card-slot *),
      body pre.${cls} .wr-internal-link.wr-internal-link-unresolved:not(.wr-quote-card-slot *),
      body pre.${cls} .wr-embed-missing:not(.wr-quote-card-slot *),
      body .cm-line.wr-codeblock-line.${cls} .wr-internal-link.wr-internal-link-unresolved:not(.wr-quote-card-slot *),
      body .cm-line.wr-codeblock-line.${cls} .wr-internal-link-highlight.wr-internal-link-unresolved:not(.wr-quote-card-slot *),
      body .cm-line.wr-codeblock-line.${cls} .wr-embed-missing:not(.wr-quote-card-slot *) {
        color: ${mUnresolved};
      }

      body .wr-card.${cls} .wr-ogp-card,
      body div.block-language-wr.${cls} .wr-ogp-card,
      body pre.${cls} .wr-ogp-card,
      body .wr-lp-media.${cls} .wr-ogp-card {
        background: ${bg};
        background-color: ${bg};
        border-color: ${mOgp};
      }
      body .wr-card.${cls} .wr-ogp-card:hover,
      body div.block-language-wr.${cls} .wr-ogp-card:hover,
      body pre.${cls} .wr-ogp-card:hover,
      body .wr-lp-media.${cls} .wr-ogp-card:hover {
        background: ${hoverBg};
        background-color: ${hoverBg};
      }
      /* Mobile: neutralize the sticky post-tap :hover; hover color only while :active */
      body.is-mobile .wr-card.${cls} .wr-ogp-card:hover,
      body.is-mobile div.block-language-wr.${cls} .wr-ogp-card:hover,
      body.is-mobile pre.${cls} .wr-ogp-card:hover,
      body.is-mobile .wr-lp-media.${cls} .wr-ogp-card:hover {
        background: ${bg};
        background-color: ${bg};
      }
      body.is-mobile .wr-card.${cls} .wr-ogp-card:active,
      body.is-mobile div.block-language-wr.${cls} .wr-ogp-card:active,
      body.is-mobile pre.${cls} .wr-ogp-card:active,
      body.is-mobile .wr-lp-media.${cls} .wr-ogp-card:active {
        background: ${hoverBg};
        background-color: ${hoverBg};
      }
      body .wr-card.${cls} .wr-ogp-title,
      body .wr-card.${cls} .wr-ogp-desc,
      body .wr-card.${cls} .wr-ogp-site,
      body .wr-card.${cls} .wr-ogp-loading,
      body div.block-language-wr.${cls} .wr-ogp-title,
      body div.block-language-wr.${cls} .wr-ogp-desc,
      body div.block-language-wr.${cls} .wr-ogp-site,
      body div.block-language-wr.${cls} .wr-ogp-loading,
      body pre.${cls} .wr-ogp-title,
      body pre.${cls} .wr-ogp-desc,
      body pre.${cls} .wr-ogp-site,
      body pre.${cls} .wr-ogp-loading,
      body .wr-lp-media.${cls} .wr-ogp-title,
      body .wr-lp-media.${cls} .wr-ogp-desc,
      body .wr-lp-media.${cls} .wr-ogp-site,
      body .wr-lp-media.${cls} .wr-ogp-loading {
        color: ${mOgp};
      }
      /* ID-equivalent re-declaration in case the parent text-color stamp wins on specificity */
      body .wr-card.${cls} .wr-ogp-title:not(#x):not(#y):not(#z),
      body .wr-card.${cls} .wr-ogp-desc:not(#x):not(#y):not(#z),
      body .wr-card.${cls} .wr-ogp-site:not(#x):not(#y):not(#z),
      body .wr-card.${cls} .wr-ogp-loading:not(#x):not(#y):not(#z),
      body div.block-language-wr.${cls} .wr-ogp-title:not(#x):not(#y):not(#z),
      body div.block-language-wr.${cls} .wr-ogp-desc:not(#x):not(#y):not(#z),
      body div.block-language-wr.${cls} .wr-ogp-site:not(#x):not(#y):not(#z),
      body div.block-language-wr.${cls} .wr-ogp-loading:not(#x):not(#y):not(#z),
      body pre.${cls} .wr-ogp-title:not(#x):not(#y):not(#z),
      body pre.${cls} .wr-ogp-desc:not(#x):not(#y):not(#z),
      body pre.${cls} .wr-ogp-site:not(#x):not(#y):not(#z),
      body pre.${cls} .wr-ogp-loading:not(#x):not(#y):not(#z),
      body .wr-lp-media.${cls} .wr-ogp-title:not(#x):not(#y):not(#z),
      body .wr-lp-media.${cls} .wr-ogp-desc:not(#x):not(#y):not(#z),
      body .wr-lp-media.${cls} .wr-ogp-site:not(#x):not(#y):not(#z),
      body .wr-lp-media.${cls} .wr-ogp-loading:not(#x):not(#y):not(#z) {
        color: ${mOgp};
      }
      `);
    });

    if (parts.length === 0) return;

    // createElement, not createEl("style"): avoids the no-forbidden-elements lint error.
    this.tagRuleStyleEl = activeDocument.createElement("style");
    this.tagRuleStyleEl.id = "wr-tag-rule-override";
    this.tagRuleStyleEl.textContent = this.boostSelectors(parts.join(""), 4);
    activeDocument.head.appendChild(this.tagRuleStyleEl);
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
      const blockTags = rawText.match(/#[^\s#]+/g) || [];
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

  blendColor(fg: string, bg: string, ratio: number): string {
    const fR = parseInt(fg.slice(1, 3), 16);
    const fG = parseInt(fg.slice(3, 5), 16);
    const fB = parseInt(fg.slice(5, 7), 16);
    const bR = parseInt(bg.slice(1, 3), 16);
    const bG = parseInt(bg.slice(3, 5), 16);
    const bB = parseInt(bg.slice(5, 7), 16);
    const r = Math.round(fR + (bR - fR) * ratio);
    const g = Math.round(fG + (bG - fG) * ratio);
    const b = Math.round(fB + (bB - fB) * ratio);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  private darkenColor(hex: string, amount: number): string {
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
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
      const view = leaf.view as WrotView;
      if (view.submitLabelEl) {
        view.submitLabelEl.textContent = `${this.settings.submitLabel} `;
      }
    }
  }

  updateSubmitIcon(): void {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_WROT);
    for (const leaf of leaves) {
      const view = leaf.view as WrotView;
      if (view.submitIconEl) {
        view.submitIconEl.empty();
        if (this.settings.submitIcon) {
          setIcon(view.submitIconEl, this.settings.submitIcon);
        }
      }
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
    // Remove every tag injected for the core integration, leaving no trace.
    this.graphTags?.removeAll();
    this.bgStyleEl?.remove();
    this.bgStyleEl = null;
    this.tagRuleStyleEl?.remove();
    this.tagRuleStyleEl = null;
    this.fontStyleEl?.remove();
    this.fontStyleEl = null;
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
