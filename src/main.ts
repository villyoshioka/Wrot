import { Plugin, TFile, WorkspaceLeaf, loadMathJax, setIcon, MarkdownView } from "obsidian";
import { VIEW_TYPE_WROT } from "./constants";
import { WrotSettings, DEFAULT_SETTINGS, WrotSettingTab, TagColorRule, SubColorScope } from "./settings";
import { WrotView } from "./views/WrotView";
import { registerWrotPostProcessor } from "./postProcessor";
import { createWrEditorExtension, tagRulesChanged, vaultFilesChanged } from "./editorExtension";
import { OGPCache } from "./utils/ogpCache";

const ATTACHMENT_EXT_RE = /^(png|jpe?g|gif|webp|svg|bmp)$/i;

export default class WrotPlugin extends Plugin {
  settings!: WrotSettings;
  ogpCache!: OGPCache;
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

    // 削除はvault.on("delete")だとmetadataCache更新前に発火するためmetadataCache側で監視
    const onAttachmentChange = (file: unknown) => {
      if (!(file instanceof TFile)) return;
      if (!ATTACHMENT_EXT_RE.test(file.extension)) return;
      this.refreshAttachmentDecorations();
    };
    this.registerEvent(this.app.metadataCache.on("deleted", onAttachmentChange));
    this.registerEvent(this.app.vault.on("create", onAttachmentChange));
    this.registerEvent(this.app.vault.on("rename", onAttachmentChange));
  }

  refreshAttachmentDecorations(): void {
    this.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view;
      if (!(view instanceof MarkdownView)) return;

      const previewMode = (view as any).previewMode;
      if (previewMode?.rerender) {
        try {
          previewMode.rerender(true);
        } catch {}
      }

      const cm = (view.editor as any)?.cm;
      if (cm?.dispatch) {
        try {
          cm.dispatch({ effects: vaultFilesChanged.of(null) });
        } catch {}
      }
    });
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
      // 14:13:12 の比率を保つため --font-text-size を基準にスケールする
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

    // <head>末尾を維持するため一度remove → append し直す
    if (this.bgStyleEl) {
      this.bgStyleEl.remove();
    }
    this.bgStyleEl = document.createElement("style");
    this.bgStyleEl.id = "wr-bg-override";
    document.head.appendChild(this.bgStyleEl);

    this.bgStyleEl.textContent = `/* @css */
      body {
        --wr-bg-color: ${bgColor};
      }
      body .wr-input-area,
      body .wr-card,
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
      /* LV: code-block-flair はコピーボタンを兼ねる。当たり判定がメモ末尾を覆うため透過させる */
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
      body .wr-inline-code,
      body .wr-plain-text,
      body div.block-language-wr *:not(.wr-embed-missing):not(.wr-internal-link-unresolved):not(.wr-internal-link):not(.wr-tag):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url):not(.wr-quote-card-slot):not(.wr-quote-card-slot *):not(.wr-codeblock-display):not(.wr-codeblock-display *),
      body .wr-codeblock-line,
      body .wr-codeblock-line *:not(.wr-embed-missing):not(.wr-internal-link-unresolved):not(.wr-internal-link):not(.wr-tag):not(.wr-url):not(.wr-tag-highlight):not(.wr-internal-link-highlight):not(.wr-url-highlight):not(.wr-quote-card-slot):not(.wr-quote-card-slot *):not(.wr-codeblock-display):not(.wr-codeblock-display *),
      body .cm-line.wr-codeblock-line,
      body .cm-line.wr-codeblock-line *:not(.wr-embed-missing):not(.wr-internal-link-unresolved):not(.wr-internal-link):not(.wr-tag):not(.wr-url):not(.wr-tag-highlight):not(.wr-internal-link-highlight):not(.wr-url-highlight):not(.wr-quote-card-slot):not(.wr-quote-card-slot *):not(.wr-codeblock-display):not(.wr-codeblock-display *):not(.wr-lp-marker),
      body .wr-reading-list li,
      body .wr-bullet-list li,
      body .wr-ordered-list li {
        color: ${textColor} !important;
      }
      /* ネストコードブロック内でPrismトークン色を復元する */
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
      body .wr-quote-card-slot .wr-quote-card .wr-quote-code-marker {
        color: ${mutedColor} !important;
      }
      body .wr-quote-card-slot .wr-quote-card {
        border-color: ${mutedColor} !important;
      }
      body .wr-quote-card-slot .wr-quote-card .wr-quote-card-body .wr-blockquote {
        border-left-color: ${mutedColor} !important;
      }
      body .wr-ogp-card {
        border-color: ${mutedColor} !important;
      }
      /* LV内のWidget DOMでも確実にマーカー色を当てるため、上記より高い特異度で再宣言 */
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
        color: ${mutedColor} !important;
      }
      /* チェックボックス(input)の枠線はサブカラー、チェック済み塗りつぶしはテーマのアクセントカラー */
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
      body .wr-copy-btn .svg-icon,
      body .wr-menu-btn .svg-icon,
      body .wr-pin-indicator .svg-icon {
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
      body .wr-thumbnail-remove {
        background: ${this.blendColor(textColor, bgColor, 0.7)} !important;
        background-color: ${this.blendColor(textColor, bgColor, 0.7)} !important;
        color: ${bgColor} !important;
      }
      body .wr-thumbnail-remove .svg-icon {
        color: ${bgColor} !important;
        stroke: ${bgColor} !important;
      }
      body .wr-thumbnail-remove:hover {
        background: ${this.blendColor(textColor, bgColor, 0.5)} !important;
        background-color: ${this.blendColor(textColor, bgColor, 0.5)} !important;
      }
    `;
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
      // 未解決リンク・未解決埋め込みの色。 ベース (line 138) は textColor/bgColor の
      // blend で計算してるので、 タグルールごとも同じロジックで rule の fg/bg から計算する。
      const mUnresolved = this.blendColor(fg, bg, 0.3);
      const cls = `wr-tag-rule-${i}`;

      parts.push(`/* @css */
      /* Rule ${i}: 背景 */
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
      /* 引用カードは引用先 bg を遮断 (引用元のルールに任せる) */
      body .wr-card.${cls} .wr-quote-card:not([class*="wr-tag-rule-"]),
      body div.block-language-wr.${cls} .wr-quote-card:not([class*="wr-tag-rule-"]),
      body pre.${cls} .wr-quote-card:not([class*="wr-tag-rule-"]),
      body .cm-line.wr-codeblock-line.${cls} .wr-quote-card:not([class*="wr-tag-rule-"]) {
        background: var(--wr-bg-color, #f8f8f8) !important;
        background-color: var(--wr-bg-color, #f8f8f8) !important;
      }
      body div.block-language-wr.${cls} *:not(.wr-inline-code):not(.wr-highlight):not(.wr-quote-card-slot):not(.wr-quote-card-slot *):not(input[type="checkbox"]),
      body pre.${cls} *:not(.wr-inline-code):not(.wr-highlight):not(.wr-quote-card-slot):not(.wr-quote-card-slot *):not(input[type="checkbox"]) {
        background: ${bg} !important;
        background-color: ${bg} !important;
      }

      /* Rule ${i}: 文字色（タグ/リンク/URL/引用ブロック/引用カード除く）。
         引用カード以下は slot 単位で除外し、外枠＝引用先 / 中身＝引用元 の境界線を
         祖先カラーが越えて子孫に降りないようにする。 */
      body .wr-card.${cls} .wr-content,
      body .wr-card.${cls} .wr-content *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-blockquote):not(.wr-quote-card-slot):not(.wr-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-blockquote *):not(.wr-quote-card-slot *) {
        color: ${fg} !important;
      }
      body div.block-language-wr.${cls},
      body div.block-language-wr.${cls} *:not(.wr-reading-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-url):not(.wr-blockquote):not(.wr-quote-card-slot):not(input[type="checkbox"]):not(.copy-code-button):not(.copy-code-button *):not(.wr-reading-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-reading-url *):not(.wr-blockquote *):not(.wr-quote-card-slot *),
      body pre.${cls},
      body pre.${cls} *:not(.wr-reading-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-url):not(.wr-blockquote):not(.wr-quote-card-slot):not(input[type="checkbox"]):not(.copy-code-button):not(.copy-code-button *):not(.wr-reading-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-reading-url *):not(.wr-blockquote *):not(.wr-quote-card-slot *) {
        color: ${fg} !important;
      }
      body .cm-line.wr-codeblock-line.${cls},
      body .cm-line.wr-codeblock-line.${cls} *:not(.wr-tag-highlight):not(.wr-internal-link-highlight):not(.wr-internal-link):not(.wr-url-highlight):not(.wr-lp-marker):not(.wr-list-highlight):not(.wr-ol-highlight):not(.wr-quote-highlight):not(.wr-blockquote-wrap):not(.wr-check-unchecked):not(.wr-check-checked):not(.wr-check-done):not(.wr-quote-card-slot):not(.wr-embed-missing):not(input[type="checkbox"]):not(.wr-tag-highlight *):not(.wr-internal-link-highlight *):not(.wr-url-highlight *):not(.wr-blockquote-wrap *):not(.wr-quote-card-slot *) {
        color: ${fg} !important;
      }

      /* Rule ${i}: サブ要素 - タイムスタンプ・メニュー・ピン・コピー */
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
        color: ${mButtons} !important;
      }
      /* Rule ${i}: サブ要素 - 引用 (引用カード内のブロック引用は除外。
         カードの中身は「引用元」扱いなので外側=引用先の mQuote を巻き込ませない) */
      body .wr-card.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote),
      body .wr-card.${cls} .wr-blockquote-wrap:not(.wr-quote-card-slot .wr-blockquote-wrap),
      body .wr-card.${cls} .wr-quote-highlight,
      body div.block-language-wr.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote),
      body pre.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote),
      body .cm-line.wr-codeblock-line.${cls}.wr-blockquote-line,
      body .cm-line.wr-codeblock-line.${cls} .wr-blockquote-wrap {
        color: ${mQuote} !important;
      }
      /* Rule ${i}: サブ要素 - リスト・チェックボックス */
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
      body .cm-line.wr-codeblock-line.${cls} .wr-check-done,
      body .cm-line.wr-codeblock-line.${cls} .wr-ol-highlight,
      body .cm-line.wr-codeblock-line.${cls} .wr-lp-marker {
        color: ${mList} !important;
      }
      /* LV内のWidget DOMでもタグルールのサブカラーが勝つように、IDセレクタ相当の特異度で再宣言 */
      body .cm-line.${cls} .wr-lp-marker:not(#x):not(#y):not(#z),
      body .cm-line.${cls} .wr-list-highlight:not(#x):not(#y):not(#z),
      body .cm-line.${cls} .wr-check-unchecked:not(#x):not(#y):not(#z),
      body .cm-line.${cls} .wr-check-checked:not(#x):not(#y):not(#z),
      body .cm-line.${cls} .wr-check-done:not(#x):not(#y):not(#z),
      body .cm-line.${cls} .wr-ol-highlight:not(#x):not(#y):not(#z) {
        color: ${mList} !important;
      }
      /* LV内のWidget DOMでも引用の本文・縦線がタグルールのquote色になるよう、IDセレクタ相当の特異度で再宣言 */
      body .cm-line.${cls}.wr-blockquote-line:not(#x):not(#y):not(#z),
      body .cm-line.${cls} .wr-blockquote-wrap:not(#x):not(#y):not(#z),
      body .cm-line.${cls} .wr-blockquote-wrap:not(#x):not(#y):not(#z) *,
      body .cm-line.${cls} .wr-quote-highlight:not(#x):not(#y):not(#z) {
        color: ${mQuote} !important;
      }
      /* チェックボックス(input)の枠線はサブカラー、チェック済み塗りつぶしはアクセントカラー */
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
      /* 引用カード内のブロック引用は「カードの中身=引用元」のサブカラーで塗るため、
         祖先=引用先の mQuote で塗るルールから除外する (slot 配下は対象外)。 */
      body .wr-card.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url):not(.wr-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-reading-tag *):not(.wr-reading-url *),
      body div.block-language-wr.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url):not(.wr-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-reading-tag *):not(.wr-reading-url *),
      body pre.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url):not(.wr-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-reading-tag *):not(.wr-reading-url *) {
        color: ${mQuote} !important;
      }
      /* 492行などの文字色当てに特異度で負ける環境向けに、 ID相当の特異度で再宣言 (引用カード内は除外) */
      body .wr-card.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote):not(#x):not(#y):not(#z),
      body .wr-card.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote):not(#x):not(#y):not(#z) *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url),
      body div.block-language-wr.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote):not(#x):not(#y):not(#z),
      body div.block-language-wr.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote):not(#x):not(#y):not(#z) *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url),
      body pre.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote):not(#x):not(#y):not(#z),
      body pre.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote):not(#x):not(#y):not(#z) *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-reading-tag):not(.wr-reading-url) {
        color: ${mQuote} !important;
      }
      body .cm-line.wr-codeblock-line.${cls} .wr-tag-highlight .wr-blockquote-wrap,
      body .cm-line.wr-codeblock-line.${cls} .wr-internal-link-highlight .wr-blockquote-wrap,
      body .cm-line.wr-codeblock-line.${cls} .wr-url-highlight .wr-blockquote-wrap,
      body .cm-line.wr-codeblock-line.${cls} .wr-math-highlight .wr-blockquote-wrap,
      body .cm-line.wr-codeblock-line.${cls} .wr-internal-link .wr-blockquote-wrap,
      body .cm-line.wr-codeblock-line.${cls} .wr-url .wr-blockquote-wrap {
        color: ${accent ?? "var(--text-accent)"} !important;
      }
      /* Rule ${i}: ブロック引用内のリンク・タグは「その場のアクセント」で塗る。
         引用カードと同じく「引用コンテキスト = アクセントで強調」する統一原則。
         ブロック引用は元先関係を持たないため、その場（このルール）のアクセントを使う。
         引用カード内のブロック引用は「カードの中身=引用元」扱いのため、ここでは除外する。 */
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
        color: ${accent ?? "var(--text-accent)"} !important;
      }
      /* 枠線色も同様、引用カード内のブロック引用は除外 (カードの中身=引用元扱い) */
      body .wr-card.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote),
      body .wr-card.${cls} .wr-blockquote-wrap:not(.wr-quote-card-slot .wr-blockquote-wrap),
      body div.block-language-wr.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote),
      body pre.${cls} .wr-blockquote:not(.wr-quote-card-slot .wr-blockquote) {
        border-left-color: ${mQuote} !important;
      }
      /* Rule ${i}: 引用カード自身にルールクラスが付いた = 引用元のルール */
      /* 枠線色は引用先(=表示する側)の見た目に合わせるため、ここでは上書きしない */
      body .wr-quote-card-slot .wr-quote-card.${cls} {
        background: ${bg} !important;
        background-color: ${bg} !important;
      }
      body .wr-quote-card-slot .wr-quote-card.${cls}:hover {
        background: ${hoverBg} !important;
        background-color: ${hoverBg} !important;
      }
      /* このルールクラスが祖先カードに付いている場合、配下の引用カードの枠線も自分のサブカラーに揃える */
      body .wr-card.${cls} .wr-quote-card-slot .wr-quote-card,
      body div.block-language-wr.${cls} .wr-quote-card-slot .wr-quote-card,
      body pre.${cls} .wr-quote-card-slot .wr-quote-card,
      body .cm-line.wr-codeblock-line.${cls} .wr-quote-card-slot .wr-quote-card {
        border-color: ${mQuote} !important;
      }
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body,
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body *:not(.wr-tag):not(.wr-internal-link):not(.wr-url):not(.wr-nested-quote-marker):not(.wr-blockquote):not(.wr-quote-image-marker):not(.wr-quote-math-marker):not(.wr-quote-code-marker):not(input[type="checkbox"]):not(.wr-tag *):not(.wr-internal-link *):not(.wr-url *):not(.wr-quote-image-marker *):not(.wr-quote-math-marker *):not(.wr-quote-code-marker *),
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-meta,
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-blockquote,
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-blockquote * {
        color: ${mQuote} !important;
      }
      /* ベースの引用カード本文 mutedColor ルールに特異度負けする環境向けに、ID相当の特異度で再宣言 */
      body .wr-quote-card-slot .wr-quote-card.${cls}:not(#x):not(#y):not(#z) .wr-quote-card-body .wr-blockquote,
      body .wr-quote-card-slot .wr-quote-card.${cls}:not(#x):not(#y):not(#z) .wr-quote-card-body .wr-blockquote * {
        color: ${mQuote} !important;
      }
      /* マーカーは標準 muted ルールの :not() 列に specificity 負けするため同列で揃える */
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-quote-image-marker:not(.wr-tag):not(.wr-url):not(.wr-internal-link):not(.wr-nested-quote-marker):not(.wr-tag *):not(.wr-url *):not(.wr-internal-link *),
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-quote-math-marker:not(.wr-tag):not(.wr-url):not(.wr-internal-link):not(.wr-nested-quote-marker):not(.wr-tag *):not(.wr-url *):not(.wr-internal-link *),
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-quote-code-marker:not(.wr-tag):not(.wr-url):not(.wr-internal-link):not(.wr-nested-quote-marker):not(.wr-tag *):not(.wr-url *):not(.wr-internal-link *) {
        color: ${mQuote} !important;
      }
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-blockquote {
        border-left-color: ${mQuote} !important;
      }
      /* 引用カード内チェックボックス(独自スパン): カード本体と色揃え */
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-check {
        border-color: ${mQuote} !important;
      }
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-check-done {
        background-color: ${mQuote} !important;
        border-color: ${mQuote} !important;
      }
      /* 引用カード内のリンク・タグ・省略QT（ネスト引用マーカー）の色は
         「引用元 (カードの中身＝元ネタ) のアクセント」で塗る。
         引用カード自身に setupClick で付与される wr-tag-rule-* は引用元の
         ルールクラスなので、 .wr-quote-card.${cls} を起点にすれば1系統で
         3ビュー (タイムライン/RV/LV) を一括カバーできる。 */
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-tag,
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-internal-link,
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-url,
      body .wr-quote-card-slot .wr-quote-card.${cls} .wr-quote-card-body .wr-nested-quote-marker {
        color: ${accent ?? "var(--text-accent)"} !important;
      }
      body .cm-line.wr-codeblock-line.wr-blockquote-line.${cls}::before {
        background-color: ${mQuote} !important;
      }
      body .cm-line.wr-codeblock-line.wr-blockquote-depth-2.${cls}::before {
        box-shadow: 18px 0 0 0 ${mQuote} !important;
      }
      body .cm-line.wr-codeblock-line.wr-blockquote-depth-3.${cls}::before {
        box-shadow:
          18px 0 0 0 ${mQuote},
          36px 0 0 0 ${mQuote} !important;
      }
      body .cm-line.wr-codeblock-line.wr-blockquote-depth-4.${cls}::before {
        box-shadow:
          18px 0 0 0 ${mQuote},
          36px 0 0 0 ${mQuote},
          54px 0 0 0 ${mQuote} !important;
      }
      body .cm-line.wr-codeblock-line.wr-blockquote-depth-5.${cls}::before {
        box-shadow:
          18px 0 0 0 ${mQuote},
          36px 0 0 0 ${mQuote},
          54px 0 0 0 ${mQuote},
          72px 0 0 0 ${mQuote} !important;
      }
      body .wr-card.${cls} .wr-copy-btn .svg-icon,
      body .wr-card.${cls} .wr-menu-btn .svg-icon,
      body .wr-card.${cls} .wr-pin-indicator .svg-icon {
        stroke: ${mButtons} !important;
      }
      body .wr-card.${cls} .wr-copy-btn.wr-copy-done .svg-icon {
        color: ${accent ?? "var(--text-accent)"} !important;
        stroke: ${accent ?? "var(--text-accent)"} !important;
      }
      ${accent ? `
      /* Rule ${i}: アクセント色（引用カード以下は slot 単位で除外。
         引用カード内のリンク・タグは「引用元のアクセント」で別途塗るため、
         ここで引用先のアクセントを巻き込まない） */
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
        color: ${accent} !important;
      }
      body .wr-card.${cls} .wr-menu-btn.wr-toolbar-active .svg-icon {
        color: ${accent} !important;
        stroke: ${accent} !important;
      }
      ` : ""}

      /* Rule ${i}: 未解決の内部リンク・埋め込み (アクセント注入より specificity が
         同等以上になるよう .wr-internal-link-unresolved / .wr-embed-missing をクラスに
         追加することで勝ち、 タグルールのトーンに馴染んだ薄色で表示する) */
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
        color: ${mUnresolved} !important;
      }

      /* Rule ${i}: OGP/Twitterカード */
      body .wr-card.${cls} .wr-ogp-card,
      body div.block-language-wr.${cls} .wr-ogp-card,
      body pre.${cls} .wr-ogp-card,
      body .wr-lp-media.${cls} .wr-ogp-card {
        background: ${bg} !important;
        background-color: ${bg} !important;
        border-color: ${mOgp} !important;
      }
      body .wr-card.${cls} .wr-ogp-card:hover,
      body div.block-language-wr.${cls} .wr-ogp-card:hover,
      body pre.${cls} .wr-ogp-card:hover,
      body .wr-lp-media.${cls} .wr-ogp-card:hover {
        background: ${hoverBg} !important;
        background-color: ${hoverBg} !important;
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
        color: ${mOgp} !important;
      }
      /* 親要素の文字色当てに特異度負けする環境向けに、 ID相当の特異度で再宣言 */
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
        color: ${mOgp} !important;
      }
      `);
    });

    if (parts.length === 0) return;

    this.tagRuleStyleEl = document.createElement("style");
    this.tagRuleStyleEl.id = "wr-tag-rule-override";
    this.tagRuleStyleEl.textContent = parts.join("");
    document.head.appendChild(this.tagRuleStyleEl);
  }

  refreshReadingViews(): void {
    // 既存blockに残ったwr-tag-rule-数字クラスを掃除する。設定UIのクラスは末尾数字でないため対象外
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
    const raw = (await this.loadData()) ?? {};
    let dirty = false;
    for (const key of ["autoLinkEnabled", "autoLinkExcludeList"]) {
      if (key in raw) {
        delete (raw as Record<string, unknown>)[key];
        dirty = true;
      }
    }
    this.settings = Object.assign({}, DEFAULT_SETTINGS, raw);
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
}
