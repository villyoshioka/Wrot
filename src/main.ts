import { Plugin, WorkspaceLeaf, loadMathJax, setIcon, MarkdownView } from "obsidian";
import { VIEW_TYPE_WROT } from "./constants";
import { WrotSettings, DEFAULT_SETTINGS, WrotSettingTab, TagColorRule } from "./settings";
import { WrotView } from "./views/WrotView";
import { registerWrotPostProcessor } from "./postProcessor";
import { createWrEditorExtension, tagRulesChanged } from "./editorExtension";
import { OGPCache } from "./utils/ogpCache";

export default class WrotPlugin extends Plugin {
  settings: WrotSettings;
  ogpCache: OGPCache;
  private bgStyleEl: HTMLStyleElement | null = null;
  private tagRuleStyleEl: HTMLStyleElement | null = null;
  private fontStyleEl: HTMLStyleElement | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();
    await loadMathJax();
    this.ogpCache = new OGPCache();
    this.ogpCache.enabled = this.settings.enableOgpFetch;

    this.registerView(
      VIEW_TYPE_WROT,
      (leaf) => new WrotView(leaf, this)
    );

    this.addRibbonIcon("feather", "Wrot", () => {
      this.activateView();
    });

    this.addCommand({
      id: "open-wrot",
      name: "Open Wrot",
      callback: () => this.activateView(),
    });

    registerWrotPostProcessor(this);

    // Live Preview: highlight #tags and URLs + rich previews in qm code blocks
    this.registerEditorExtension([createWrEditorExtension(this.ogpCache, this.app, this, () => this.settings.checkStrikethrough)]);

    this.addSettingTab(new WrotSettingTab(this.app, this));

    this.applyFontFollow();
    this.applyBgColor();
    this.applyTagColorRules();
    this.registerEvent(
      this.app.workspace.on("css-change", () => {
        this.applyBgColor();
        this.applyTagColorRules();
      })
    );
  }

  applyFontFollow(): void {
    document.body.classList.toggle("wr-font-follow", this.settings.followObsidianFontSize);
    if (this.fontStyleEl) {
      this.fontStyleEl.remove();
    }
    this.fontStyleEl = document.createElement("style");
    this.fontStyleEl.id = "wr-font-override";
    document.head.appendChild(this.fontStyleEl);

    if (this.settings.followObsidianFontSize) {
      this.fontStyleEl.textContent = `
        body {
          --wr-font-text: var(--font-text-size);
          --wr-font-ui-small: var(--font-ui-small);
          --wr-font-ui-smaller: var(--font-ui-smaller);
          --wr-font-date: min(var(--font-text-size), 24px);
        }
      `;
    } else {
      this.fontStyleEl.textContent = `
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

  applyBgColor(): void {
    const isDark = document.body.classList.contains("theme-dark");
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

    // Remove and re-append to ensure it's always last in <head>
    if (this.bgStyleEl) {
      this.bgStyleEl.remove();
    }
    this.bgStyleEl = document.createElement("style");
    this.bgStyleEl.id = "wr-bg-override";
    document.head.appendChild(this.bgStyleEl);

    this.bgStyleEl.textContent = `
      body .wr-input-area,
      body .wr-card,
      body div.wr-reading-card,
      body div.block-language-wr,
      body .language-wr,
      body .wr-ogp-card,
      body .wr-codeblock-line {
        background: ${bgColor} !important;
        background-color: ${bgColor} !important;
      }
      body div.block-language-wr * {
        background: ${bgColor} !important;
        background-color: ${bgColor} !important;
      }
      body .wr-flair-bg {
        background: ${bgColor} !important;
        background-color: ${bgColor} !important;
      }
      body div.block-language-wr .wr-inline-code {
        background: rgba(0, 0, 0, 0.08) !important;
      }
      body div.block-language-wr .wr-highlight {
        background: var(--text-highlight-bg) !important;
      }
      /* LV: the .code-block-flair span doubles as the copy button in Live Preview and
         its absolute-positioned hit area extends leftward across the memo text. Keeping
         a filled background here would hide the end of long memos. Force transparent so
         the underlying card background shows through. RV is unaffected because the
         .wr-codeblock-line class is Live Preview only. */
      body .wr-codeblock-line .code-block-flair {
        background: transparent !important;
        background-color: transparent !important;
      }
      body .wr-ogp-card:hover {
        background: ${hoverColor} !important;
        background-color: ${hoverColor} !important;
      }
      body .wr-content,
      body .wr-textarea,
      body .wr-date-label,
      body .wr-today-btn,
      body .wr-reading-content,
      body .wr-ogp-title,
      body .wr-inline-code,
      body .wr-plain-text,
      body div.block-language-wr *,
      body .wr-codeblock-line,
      body .wr-codeblock-line *,
      body .cm-line.wr-codeblock-line,
      body .cm-line.wr-codeblock-line *,
      body .wr-reading-list li,
      body .wr-bullet-list li,
      body .wr-ordered-list li {
        color: ${textColor} !important;
      }
      /* Restore Prism token colors inside nested code blocks.
         The base color rule above uses !important so we need !important here too. */
      body .wr-codeblock-display code[class*="language-"],
      body .wr-codeblock-display pre[class*="language-"] {
        color: var(--code-normal) !important;
      }
      body .wr-codeblock-display .token.comment,
      body .wr-codeblock-display .token.prolog,
      body .wr-codeblock-display .token.doctype,
      body .wr-codeblock-display .token.cdata { color: var(--code-comment) !important; }
      body .wr-codeblock-display .token.punctuation { color: var(--code-punctuation) !important; }
      body .wr-codeblock-display .token.property,
      body .wr-codeblock-display .token.tag,
      body .wr-codeblock-display .token.boolean,
      body .wr-codeblock-display .token.number,
      body .wr-codeblock-display .token.constant,
      body .wr-codeblock-display .token.symbol,
      body .wr-codeblock-display .token.deleted { color: var(--code-tag) !important; }
      body .wr-codeblock-display .token.selector,
      body .wr-codeblock-display .token.attr-name,
      body .wr-codeblock-display .token.string,
      body .wr-codeblock-display .token.char,
      body .wr-codeblock-display .token.builtin,
      body .wr-codeblock-display .token.inserted { color: var(--code-string) !important; }
      body .wr-codeblock-display .token.operator,
      body .wr-codeblock-display .token.entity,
      body .wr-codeblock-display .token.url,
      body .wr-codeblock-display .language-css .token.string,
      body .wr-codeblock-display .style .token.string { color: var(--code-operator) !important; }
      body .wr-codeblock-display .token.atrule,
      body .wr-codeblock-display .token.attr-value,
      body .wr-codeblock-display .token.keyword { color: var(--code-keyword) !important; }
      body .wr-codeblock-display .token.function,
      body .wr-codeblock-display .token.class-name { color: var(--code-function) !important; }
      body .wr-codeblock-display .token.regex,
      body .wr-codeblock-display .token.important,
      body .wr-codeblock-display .token.variable { color: var(--code-value) !important; }
      body .wr-nav-btn,
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
      body .wr-ogp-desc,
      body .wr-ogp-site,
      body .wr-reading-time,
      body .wr-reading-copy-btn,
      body .wr-flair-bg,
      body .wr-codeblock-line .code-block-flair,
      body .wr-lp-marker,
      body .wr-list-highlight,
      body .wr-check-unchecked,
      body .wr-check-checked,
      body .wr-ol-highlight,
      body .wr-quote-highlight,
      body .wr-blockquote,
      body .wr-blockquote-line {
        color: ${mutedColor} !important;
      }
      body .wr-textarea::placeholder {
        color: ${faintColor} !important;
      }
      body .wr-toolbar-btn.wr-toolbar-active {
        color: var(--text-accent) !important;
      }
      body .cm-line.wr-codeblock-line .wr-tag-highlight,
      body .cm-line.wr-codeblock-line .wr-url-highlight,
      body .cm-line.wr-codeblock-line .wr-internal-link-highlight,
      body .cm-line.wr-codeblock-line .wr-math-highlight {
        color: var(--text-accent) !important;
      }
      body .wr-blockquote-wrap,
      body .wr-check-done {
        color: ${mutedColor} !important;
      }
      body .wr-blockquote,
      body .wr-blockquote-wrap {
        border-left-color: ${mutedColor} !important;
      }
      body .wr-bullet-list > li:not(.wr-check-item)::before,
      body .wr-ordered-list > li::before,
      body ul.wr-reading-list > li:not(.wr-check-item)::before,
      body ol.wr-reading-list > li::before {
        color: ${mutedColor} !important;
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
        color: var(--text-accent) !important;
      }
      body .cm-line.wr-codeblock-line .wr-internal-link.wr-internal-link-unresolved,
      body div.block-language-wr a.wr-internal-link.wr-internal-link-unresolved,
      body .wr-internal-link.wr-internal-link-unresolved {
        color: ${unresolvedLinkColor} !important;
      }
      body .wr-submit-btn.wr-submit-active {
        color: var(--text-on-accent) !important;
      }
      body .wr-copy-btn .svg-icon {
        stroke: ${mutedColor} !important;
      }
      body .wr-menu {
        background: ${bgColor} !important;
        background-color: ${bgColor} !important;
        border-color: ${hoverColor} !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
      }
      body .wr-menu .menu-item {
        color: ${textColor} !important;
        background-color: ${bgColor} !important;
      }
      body .wr-menu .menu-item .menu-item-icon .svg-icon {
        color: ${mutedColor} !important;
        stroke: ${mutedColor} !important;
      }
      .is-mobile body .wr-menu .menu-item:not(.is-label):not(.is-disabled):hover,
      .is-mobile body .wr-menu .menu-item:not(.is-label):not(.is-disabled):active,
      body .wr-menu .menu-item:not(.is-disabled):hover,
      body .wr-menu .menu-item:not(.is-disabled).selected,
      body .wr-menu .menu-item:not(.is-disabled).is-selected,
      body .wr-menu .menu-item:not(.is-disabled):active {
        background-color: ${hoverColor} !important;
      }
      body .wr-menu .menu-separator {
        border-color: ${hoverColor} !important;
        background: transparent !important;
        background-color: transparent !important;
      }
      body .wr-menu .menu-item.is-disabled {
        color: ${faintColor} !important;
      }
    `;
  }

  findTagColorRule(memoTags: string[]): TagColorRule | null {
    if (!this.settings.tagColorRulesEnabled) return null;
    const rules = this.settings.tagColorRules;
    if (!rules || rules.length === 0 || !memoTags || memoTags.length === 0) return null;
    // Walk memo tags in the order they appear in the post body; first tag that has
    // a matching rule wins. The order of rules in settings does not matter.
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
      const muted = this.blendColor(fg, bg, 0.45);
      const cls = `wr-tag-rule-${i}`;

      parts.push(`
      /* --- Rule ${i}: background --- */
      body .wr-card.${cls},
      body div.block-language-wr.${cls},
      body pre.${cls},
      body .cm-line.wr-codeblock-line.${cls},
      body .wr-lp-codeblock.${cls},
      body .wr-lp-mathblock.${cls},
      body .wr-flair-bg.${cls} {
        background: ${bg} !important;
        background-color: ${bg} !important;
      }
      body div.block-language-wr.${cls} *:not(.wr-inline-code):not(.wr-highlight):not(input[type="checkbox"]),
      body pre.${cls} *:not(.wr-inline-code):not(.wr-highlight):not(input[type="checkbox"]) {
        background: ${bg} !important;
        background-color: ${bg} !important;
      }

      /* --- Rule ${i}: text color (excluding tags/links/urls) --- */
      body .wr-card.${cls} .wr-content,
      body .wr-card.${cls} .wr-content *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-tag *):not(.wr-internal-link *):not(.wr-url *) {
        color: ${fg} !important;
      }
      body div.block-language-wr.${cls},
      body div.block-language-wr.${cls} *:not(.wr-reading-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-url):not(input[type="checkbox"]):not(.wr-reading-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-reading-url *),
      body pre.${cls},
      body pre.${cls} *:not(.wr-reading-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-url):not(input[type="checkbox"]):not(.wr-reading-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-reading-url *) {
        color: ${fg} !important;
      }
      body .cm-line.wr-codeblock-line.${cls},
      body .cm-line.wr-codeblock-line.${cls} *:not(.wr-tag-highlight):not(.wr-internal-link-highlight):not(.wr-url-highlight):not(input[type="checkbox"]):not(.wr-tag-highlight *):not(.wr-internal-link-highlight *):not(.wr-url-highlight *) {
        color: ${fg} !important;
      }

      /* --- Rule ${i}: muted elements --- */
      body .wr-card.${cls} .wr-timestamp,
      body .wr-card.${cls} .wr-copy-btn,
      body .wr-card.${cls} .wr-copy-btn .svg-icon,
      body .wr-card.${cls} .wr-menu-btn,
      body .wr-card.${cls} .wr-menu-btn .svg-icon,
      body .wr-card.${cls} .wr-pin-indicator,
      body .wr-card.${cls} .wr-pin-indicator .svg-icon,
      body .wr-card.${cls} .wr-blockquote,
      body .wr-card.${cls} .wr-blockquote-wrap,
      body .wr-card.${cls} .wr-bullet-list > li:not(.wr-check-item)::before,
      body .wr-card.${cls} .wr-ordered-list > li::before,
      body .wr-card.${cls} .wr-check-done,
      body .wr-card.${cls} .wr-check-unchecked,
      body .wr-card.${cls} .wr-check-checked,
      body .wr-card.${cls} .wr-list-highlight,
      body .wr-card.${cls} .wr-ol-highlight,
      body .wr-card.${cls} .wr-quote-highlight,
      body div.block-language-wr.${cls} .wr-reading-time,
      body div.block-language-wr.${cls} .wr-reading-copy-btn,
      body div.block-language-wr.${cls} .wr-blockquote,
      body div.block-language-wr.${cls} ul.wr-reading-list > li:not(.wr-check-item)::before,
      body div.block-language-wr.${cls} ol.wr-reading-list > li::before,
      body pre.${cls} .wr-reading-time,
      body pre.${cls} .wr-reading-copy-btn,
      body pre.${cls} .wr-blockquote,
      body pre.${cls} ul.wr-reading-list > li:not(.wr-check-item)::before,
      body pre.${cls} ol.wr-reading-list > li::before,
      body .cm-line.wr-codeblock-line.${cls}.wr-blockquote-line,
      body .cm-line.wr-codeblock-line.${cls} .wr-blockquote-wrap,
      body .cm-line.wr-codeblock-line.${cls} .wr-list-highlight,
      body .cm-line.wr-codeblock-line.${cls} .wr-check-unchecked,
      body .cm-line.wr-codeblock-line.${cls} .wr-check-checked,
      body .cm-line.wr-codeblock-line.${cls} .wr-check-done,
      body .cm-line.wr-codeblock-line.${cls} .wr-ol-highlight,
      body .cm-line.wr-codeblock-line.${cls} .wr-lp-marker {
        color: ${muted} !important;
      }
      body .wr-card.${cls} .wr-blockquote,
      body .wr-card.${cls} .wr-blockquote-wrap,
      body div.block-language-wr.${cls} .wr-blockquote,
      body pre.${cls} .wr-blockquote {
        border-left-color: ${muted} !important;
      }
      body .wr-card.${cls} .wr-copy-btn .svg-icon,
      body .wr-card.${cls} .wr-menu-btn .svg-icon,
      body .wr-card.${cls} .wr-pin-indicator .svg-icon {
        stroke: ${muted} !important;
      }
      body .wr-card.${cls} .wr-copy-btn.wr-copy-done .svg-icon {
        color: ${accent ?? "var(--text-accent)"} !important;
        stroke: ${accent ?? "var(--text-accent)"} !important;
      }
      ${accent ? `
      /* --- Rule ${i}: accent color override --- */
      body .wr-card.${cls} .wr-tag,
      body .wr-card.${cls} .wr-internal-link,
      body .wr-card.${cls} .wr-url,
      body div.block-language-wr.${cls} .wr-reading-tag,
      body div.block-language-wr.${cls} .wr-internal-link,
      body div.block-language-wr.${cls} .wr-reading-url,
      body div.block-language-wr.${cls} a,
      body pre.${cls} .wr-reading-tag,
      body pre.${cls} .wr-internal-link,
      body pre.${cls} .wr-reading-url,
      body .cm-line.wr-codeblock-line.${cls} .wr-tag-highlight,
      body .cm-line.wr-codeblock-line.${cls} .wr-internal-link-highlight,
      body .cm-line.wr-codeblock-line.${cls} .wr-url-highlight,
      body .cm-line.wr-codeblock-line.${cls} .wr-math-highlight,
      body .cm-line.wr-codeblock-line.${cls} .wr-internal-link,
      body .cm-line.wr-codeblock-line.${cls} .wr-url {
        color: ${accent} !important;
      }
      body .wr-card.${cls} .wr-menu-btn.wr-toolbar-active .svg-icon {
        color: ${accent} !important;
        stroke: ${accent} !important;
      }
      ` : ""}

      /* --- Rule ${i}: OGP / Twitter cards --- */
      body .wr-card.${cls} .wr-ogp-card,
      body div.block-language-wr.${cls} .wr-ogp-card,
      body pre.${cls} .wr-ogp-card,
      body .wr-lp-media.${cls} .wr-ogp-card {
        background: ${bg} !important;
        background-color: ${bg} !important;
      }
      body .wr-card.${cls} .wr-ogp-title,
      body div.block-language-wr.${cls} .wr-ogp-title,
      body pre.${cls} .wr-ogp-title,
      body .wr-lp-media.${cls} .wr-ogp-title {
        color: ${fg} !important;
      }
      body .wr-card.${cls} .wr-ogp-desc,
      body .wr-card.${cls} .wr-ogp-site,
      body .wr-card.${cls} .wr-ogp-loading,
      body div.block-language-wr.${cls} .wr-ogp-desc,
      body div.block-language-wr.${cls} .wr-ogp-site,
      body div.block-language-wr.${cls} .wr-ogp-loading,
      body pre.${cls} .wr-ogp-desc,
      body pre.${cls} .wr-ogp-site,
      body pre.${cls} .wr-ogp-loading,
      body .wr-lp-media.${cls} .wr-ogp-desc,
      body .wr-lp-media.${cls} .wr-ogp-site,
      body .wr-lp-media.${cls} .wr-ogp-loading {
        color: ${muted} !important;
      }
      `);
    });

    if (parts.length === 0) return;

    this.tagRuleStyleEl = document.createElement("style");
    this.tagRuleStyleEl.id = "wr-tag-rule-override";
    this.tagRuleStyleEl.textContent = parts.join("\n");
    document.head.appendChild(this.tagRuleStyleEl);
  }

  refreshReadingViews(): void {
    // Sweep lingering per-rule classes (wr-tag-rule-0, wr-tag-rule-1, ...) on blocks
    // we no longer touch. Constrain to element types we actually apply the class to
    // and match only trailing-digit class names so settings UI classes like
    // .wr-tag-rule-label-setting / .wr-tag-rule-separator / .wr-tag-rules-container
    // are left alone.
    const sweepSelector =
      '.wr-card[class*="wr-tag-rule-"], ' +
      'div.block-language-wr[class*="wr-tag-rule-"], ' +
      'pre[class*="wr-tag-rule-"], ' +
      '.cm-line[class*="wr-tag-rule-"], ' +
      '.code-block-flair[class*="wr-tag-rule-"], ' +
      '.copy-code-button[class*="wr-tag-rule-"], ' +
      '.wr-flair-bg[class*="wr-tag-rule-"]';
    document.querySelectorAll<HTMLElement>(sweepSelector).forEach((el) => {
      const existing = Array.from(el.classList);
      for (const cls of existing) {
        if (/^wr-tag-rule-\d+$/.test(cls)) el.classList.remove(cls);
      }
    });

    if (!this.settings.tagColorRulesEnabled) return;

    document.querySelectorAll('code.language-wr, .block-language-wr code, pre > code[class*="language-wr"]').forEach((code) => {
      const block = code.closest(".block-language-wr") || code.closest("pre");
      if (!(block instanceof HTMLElement)) return;

      const targets: HTMLElement[] = [block];
      const container = block.parentElement;
      if (container) {
        container.querySelectorAll(".code-block-flair, .copy-code-button").forEach((el) => {
          if (el instanceof HTMLElement) targets.push(el);
        });
      }
      block.querySelectorAll(".code-block-flair, .copy-code-button").forEach((el) => {
        if (el instanceof HTMLElement) targets.push(el);
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
      const cm = (view.editor as any)?.cm;
      if (cm?.dispatch) {
        try {
          cm.dispatch({ effects: tagRulesChanged.of(null) });
        } catch {
          // ignore
        }
      }
    });
  }

  private blendColor(fg: string, bg: string, ratio: number): string {
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
    this.bgStyleEl?.remove();
    this.bgStyleEl = null;
    this.tagRuleStyleEl?.remove();
    this.tagRuleStyleEl = null;
    this.fontStyleEl?.remove();
    this.fontStyleEl = null;
    document.body.classList.remove("wr-font-follow");
  }

  async activateView(): Promise<void> {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(VIEW_TYPE_WROT);

    if (existing.length > 0) {
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
    workspace.revealLeaf(leaf);
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    if (this.ogpCache) {
      this.ogpCache.enabled = this.settings.enableOgpFetch;
    }
  }
}
