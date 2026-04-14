import { Plugin, WorkspaceLeaf, loadMathJax, setIcon } from "obsidian";
import { VIEW_TYPE_WROT } from "./constants";
import { WrotSettings, DEFAULT_SETTINGS, WrotSettingTab } from "./settings";
import { WrotView } from "./views/WrotView";
import { registerWrotPostProcessor } from "./postProcessor";
import { createWrEditorExtension } from "./editorExtension";
import { OGPCache } from "./utils/ogpCache";

export default class WrotPlugin extends Plugin {
  settings: WrotSettings;
  ogpCache: OGPCache;
  private bgStyleEl: HTMLStyleElement | null = null;

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
    this.registerEditorExtension([createWrEditorExtension(this.ogpCache, this.app, () => this.settings.checkStrikethrough)]);

    this.addSettingTab(new WrotSettingTab(this.app, this));

    this.applyBgColor();
    this.registerEvent(
      this.app.workspace.on("css-change", () => this.applyBgColor())
    );
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
      body .wr-nav-btn,
      body .wr-toolbar-btn,
      body .wr-copy-btn,
      body .wr-copy-btn .svg-icon,
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
