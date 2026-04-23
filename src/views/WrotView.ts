import { ItemView, WorkspaceLeaf, Notice, TFile, EventRef, setIcon, Menu, Scope, Platform, WorkspaceSidedock, MarkdownRenderer, renderMath, finishRenderMath } from "obsidian";
import { VIEW_TYPE_WROT } from "../constants";
import { parseMemos, Memo } from "../utils/memoParser";
import { appendMemo, toggleCheckbox } from "../utils/memoWriter";
import { getOrCreateDailyNote, getDailyNoteFile } from "../utils/dailyNote";
import { renderTextWithTagsAndUrls, renderUrlPreviews } from "../utils/urlRenderer";
import type WrotPlugin from "../main";

declare const moment: typeof import("moment");

export class WrotView extends ItemView {
  plugin: WrotPlugin;
  private currentDate: ReturnType<typeof moment>;
  private listContainer: HTMLElement;
  private dateLabel: HTMLElement;
  textarea: HTMLTextAreaElement;
  submitLabelEl: HTMLElement;
  submitIconEl: HTMLElement;
  private fileChangeRef: EventRef | null = null;
  private fileDeleteRef: EventRef | null = null;
  private fileCreateRef: EventRef | null = null;
  private ignoreNextModify = false;
  private activeFormatMode: "bold" | "italic" | null = null;
  private refreshing = false;
  private isCollapsed = false;
  private toolbarResizeObserver: ResizeObserver | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: WrotPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.currentDate = moment();
    this.scope = new Scope(this.app.scope);
  }

  getViewType(): string {
    return VIEW_TYPE_WROT;
  }

  getDisplayText(): string {
    return "Wrot";
  }

  getIcon(): string {
    return "feather";
  }

  async onOpen(): Promise<void> {
    const container = this.contentEl;
    container.empty();
    container.addClass("wr-container");

    // Date navigation
    this.buildDateNav(container);

    // Input area
    this.buildInputArea(container);

    // Memo list
    this.listContainer = container.createDiv({ cls: "wr-list" });

    // Mod+Enter to submit memo (register on view scope to override Obsidian's built-in hotkey)
    this.scope!.register(["Mod"], "Enter", (evt) => {
      if (document.activeElement === this.textarea) {
        evt.preventDefault();
        evt.stopPropagation();
        this.submitMemo();
        return false;
      }
    });

    // Shorten date label on iPad pinned sidebar (WorkspaceSidedock = pinned)
    if (Platform.isTablet && this.leaf.getRoot() instanceof WorkspaceSidedock) {
      this.isCollapsed = true;
    }

    await this.refresh();

    // Watch for file changes (after initial refresh to avoid race condition)
    this.registerFileWatcher();
  }

  async onClose(): Promise<void> {
    this.unregisterFileWatcher();
    if (this.toolbarResizeObserver) {
      this.toolbarResizeObserver.disconnect();
      this.toolbarResizeObserver = null;
    }
    this.contentEl.empty();
  }

  private registerFileWatcher(): void {
    this.unregisterFileWatcher();
    this.fileChangeRef = this.app.vault.on("modify", (file) => {
      if (this.ignoreNextModify) {
        this.ignoreNextModify = false;
        return;
      }
      if (!(file instanceof TFile)) return;
      const currentFile = getDailyNoteFile(
        this.app,
        this.currentDate
      );
      if (currentFile && file.path === currentFile.path) {
        this.refresh();
      }
    });
    // Watch for file deletion — refresh to update unresolved-link styling as well
    this.fileDeleteRef = this.app.vault.on("delete", (file) => {
      if (!(file instanceof TFile)) return;
      if (file.extension !== "md") return;
      this.refresh();
    });
    // Watch for file creation so that previously-unresolved `[[X]]` links pick up their
    // newly-created target and re-render in normal (resolved) style.
    this.fileCreateRef = this.app.vault.on("create", (file) => {
      if (!(file instanceof TFile)) return;
      if (file.extension !== "md") return;
      this.refresh();
    });
  }

  private unregisterFileWatcher(): void {
    if (this.fileChangeRef) {
      this.app.vault.offref(this.fileChangeRef);
      this.fileChangeRef = null;
    }
    if (this.fileDeleteRef) {
      this.app.vault.offref(this.fileDeleteRef);
      this.fileDeleteRef = null;
    }
    if (this.fileCreateRef) {
      this.app.vault.offref(this.fileCreateRef);
      this.fileCreateRef = null;
    }
  }

  private buildDateNav(container: HTMLElement): void {
    const nav = container.createDiv({ cls: "wr-date-nav" });

    const prevBtn = nav.createEl("button", { cls: "wr-nav-btn" });
    setIcon(prevBtn, "chevron-left");
    prevBtn.addEventListener("click", () => {
      this.currentDate = this.currentDate.clone().subtract(1, "day");
      this.refresh();
    });

    this.dateLabel = nav.createEl("span", { cls: "wr-date-label" });
    this.dateLabel.addEventListener("click", async () => {
      this.dateLabel.classList.add("wr-date-label-active");
      setTimeout(() => this.dateLabel.classList.remove("wr-date-label-active"), 300);
      const file = getDailyNoteFile(this.app, this.currentDate)
        ?? await getOrCreateDailyNote(this.app, this.currentDate);
      this.app.workspace.getLeaf("tab").openFile(file);
    });

    const nextBtn = nav.createEl("button", { cls: "wr-nav-btn" });
    setIcon(nextBtn, "chevron-right");
    nextBtn.addEventListener("click", () => {
      this.currentDate = this.currentDate.clone().add(1, "day");
      this.refresh();
    });

    const todayBtn = nav.createEl("button", { cls: "wr-today-btn", text: "\u4eca\u65e5" });
    todayBtn.addEventListener("click", () => {
      this.currentDate = moment();
      this.refresh();
    });
  }

  private buildInputArea(container: HTMLElement): void {
    const inputArea = container.createDiv({ cls: "wr-input-area" });

    // Header: right-aligned submit button
    const header = inputArea.createDiv({ cls: "wr-input-header" });
    const submitBtn = header.createEl("button", {
      cls: "wr-submit-btn",
    });
    this.submitLabelEl = submitBtn.createSpan({ text: `${this.plugin.settings.submitLabel} ` });
    this.submitIconEl = submitBtn.createSpan({ cls: "wr-submit-icon" });
    if (this.plugin.settings.submitIcon) {
      setIcon(this.submitIconEl, this.plugin.settings.submitIcon);
    }
    submitBtn.addEventListener("click", () => this.submitMemo());

    // Textarea
    this.textarea = inputArea.createEl("textarea", {
      cls: "wr-textarea",
      attr: { placeholder: this.plugin.settings.inputPlaceholder },
    });

    // Auto-grow: expand textarea as content grows
    const autoGrow = () => {
      this.textarea.style.height = "auto";
      this.textarea.style.height = this.textarea.scrollHeight + "px";
    };
    this.textarea.addEventListener("input", autoGrow);

    this.textarea.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.isComposing) return; // IME変換中は無視
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        return; // Handled by Obsidian command
      }
      if (e.key === "Enter" && !e.shiftKey) {
        const ta = this.textarea;
        const pos = ta.selectionStart;
        const val = ta.value;
        const lineStart = val.lastIndexOf("\n", pos - 1) + 1;
        const line = val.slice(lineStart, pos);

        // Check for list patterns
        const checkMatch = line.match(/^- \[[ x]\] (.*)$/);
        const listMatch = !checkMatch && line.match(/^- (.*)$/);
        const olMatch = !checkMatch && !listMatch && line.match(/^(\d+)\.\s?(.*)$/);

        if (checkMatch) {
          e.preventDefault();
          if (checkMatch[1] === "") {
            ta.value = val.slice(0, lineStart) + val.slice(pos);
            ta.selectionStart = ta.selectionEnd = lineStart;
          } else {
            const insert = "\n- [ ] ";
            ta.value = val.slice(0, pos) + insert + val.slice(pos);
            ta.selectionStart = ta.selectionEnd = pos + insert.length;
          }
          ta.dispatchEvent(new Event("input"));
        } else if (listMatch) {
          e.preventDefault();
          if (listMatch[1] === "") {
            ta.value = val.slice(0, lineStart) + val.slice(pos);
            ta.selectionStart = ta.selectionEnd = lineStart;
          } else {
            const insert = "\n- ";
            ta.value = val.slice(0, pos) + insert + val.slice(pos);
            ta.selectionStart = ta.selectionEnd = pos + insert.length;
          }
          ta.dispatchEvent(new Event("input"));
        } else if (olMatch) {
          e.preventDefault();
          if (olMatch[2] === "") {
            ta.value = val.slice(0, lineStart) + val.slice(pos);
            ta.selectionStart = ta.selectionEnd = lineStart;
          } else {
            const nextNum = parseInt(olMatch[1]) + 1;
            const insert = `\n${nextNum}. `;
            ta.value = val.slice(0, pos) + insert + val.slice(pos);
            ta.selectionStart = ta.selectionEnd = pos + insert.length;
          }
          ta.dispatchEvent(new Event("input"));
        }
      }
    }, true);

    // Bottom toolbar (Misskey-style icon buttons)
    const toolbar = inputArea.createDiv({ cls: "wr-input-toolbar" });

    const embedBtn = toolbar.createEl("button", { cls: "wr-toolbar-btn" });
    setIcon(embedBtn, "paperclip");
    embedBtn.addEventListener("mousedown", (e) => e.preventDefault());

    const boldBtn = toolbar.createEl("button", { cls: "wr-toolbar-btn" });
    setIcon(boldBtn, "bold");
    boldBtn.addEventListener("mousedown", (e) => e.preventDefault());

    const italicBtn = toolbar.createEl("button", { cls: "wr-toolbar-btn" });
    setIcon(italicBtn, "italic");
    italicBtn.addEventListener("mousedown", (e) => e.preventDefault());

    const listBtn = toolbar.createEl("button", { cls: "wr-toolbar-btn" });
    setIcon(listBtn, "list");
    listBtn.addEventListener("mousedown", (e) => e.preventDefault());

    const checkBtn = toolbar.createEl("button", { cls: "wr-toolbar-btn" });
    setIcon(checkBtn, "list-checks");
    checkBtn.addEventListener("mousedown", (e) => e.preventDefault());

    const olBtn = toolbar.createEl("button", { cls: "wr-toolbar-btn" });
    setIcon(olBtn, "list-ordered");
    olBtn.addEventListener("mousedown", (e) => e.preventDefault());

    // Click handlers
    embedBtn.addEventListener("click", () => {
      const ta = this.textarea;
      if (ta.selectionStart !== ta.selectionEnd) {
        this.wrapSelectionWithEmbedBrackets();
      } else {
        this.toggleInlineWrap("![[", "]]");
      }
      this.updateEmbedBtnActive(embedBtn);
    });
    const updateFormatBtns = () => {
      boldBtn.toggleClass("wr-toolbar-active", this.activeFormatMode === "bold");
      italicBtn.toggleClass("wr-toolbar-active", this.activeFormatMode === "italic");
      boldBtn.toggleClass("wr-toolbar-disabled", this.activeFormatMode === "italic");
      italicBtn.toggleClass("wr-toolbar-disabled", this.activeFormatMode === "bold");
    };
    const validateActiveFormatMode = () => {
      if (this.activeFormatMode === null) return;
      const ta = this.textarea;
      const pos = ta.selectionStart;
      const before = ta.value.slice(0, pos);
      if (this.activeFormatMode === "bold") {
        if (!before.includes("**")) {
          this.activeFormatMode = null;
          updateFormatBtns();
        }
      } else if (this.activeFormatMode === "italic") {
        const stripped = before.replace(/\*\*/g, "");
        if (!stripped.includes("*")) {
          this.activeFormatMode = null;
          updateFormatBtns();
        }
      }
    };

    boldBtn.addEventListener("click", () => {
      if (this.activeFormatMode === "italic") return;
      const ta = this.textarea;
      if (ta.selectionStart !== ta.selectionEnd) {
        this.wrapSelection("**", "**");
        return;
      }
      if (this.activeFormatMode === "bold") {
        // Close bold mode — if empty, remove opening marker too
        const pos = ta.selectionStart;
        if (pos >= 2 && ta.value.slice(pos - 2, pos) === "**") {
          ta.value = ta.value.slice(0, pos - 2) + ta.value.slice(pos);
          ta.selectionStart = ta.selectionEnd = pos - 2;
        } else {
          ta.value = ta.value.slice(0, pos) + "**" + ta.value.slice(pos);
          ta.selectionStart = ta.selectionEnd = pos + 2;
        }
        this.activeFormatMode = null;
      } else {
        // Open bold mode
        const pos = ta.selectionStart;
        ta.value = ta.value.slice(0, pos) + "**" + ta.value.slice(pos);
        ta.selectionStart = ta.selectionEnd = pos + 2;
        this.activeFormatMode = "bold";
      }
      ta.focus();
      ta.dispatchEvent(new Event("input"));
      updateFormatBtns();
    });
    italicBtn.addEventListener("click", () => {
      if (this.activeFormatMode === "bold") return;
      const ta = this.textarea;
      if (ta.selectionStart !== ta.selectionEnd) {
        this.wrapSelection("*", "*");
        return;
      }
      if (this.activeFormatMode === "italic") {
        // Close italic mode — if empty, remove opening marker too
        const pos = ta.selectionStart;
        if (pos >= 1 && ta.value.slice(pos - 1, pos) === "*") {
          ta.value = ta.value.slice(0, pos - 1) + ta.value.slice(pos);
          ta.selectionStart = ta.selectionEnd = pos - 1;
        } else {
          ta.value = ta.value.slice(0, pos) + "*" + ta.value.slice(pos);
          ta.selectionStart = ta.selectionEnd = pos + 1;
        }
        this.activeFormatMode = null;
      } else {
        // Open italic mode
        const pos = ta.selectionStart;
        ta.value = ta.value.slice(0, pos) + "*" + ta.value.slice(pos);
        ta.selectionStart = ta.selectionEnd = pos + 1;
        this.activeFormatMode = "italic";
      }
      ta.focus();
      ta.dispatchEvent(new Event("input"));
      updateFormatBtns();
    });
    listBtn.addEventListener("click", () => {
      this.insertAtLineStart("- ");
      this.updateToolbarActive(listBtn, checkBtn, olBtn);
    });
    checkBtn.addEventListener("click", () => {
      this.insertAtLineStart("- [ ] ");
      this.updateToolbarActive(listBtn, checkBtn, olBtn);
    });
    olBtn.addEventListener("click", () => {
      this.insertAtLineStart("1. ");
      this.updateToolbarActive(listBtn, checkBtn, olBtn);
    });
    // Format menu button (3-dot)
    const formatBtn = toolbar.createEl("button", { cls: "wr-toolbar-btn wr-format-btn" });
    setIcon(formatBtn, "more-horizontal");
    formatBtn.addEventListener("mousedown", (e) => e.preventDefault());
    formatBtn.addEventListener("click", (e) => {
      const ta = this.textarea;
      const hasSelection = ta.selectionStart !== ta.selectionEnd;
      const menu = new Menu();
      menu.addItem((item) => item.setTitle("コード").setIcon("code").onClick(() => {
        const t = this.textarea;
        if (t.selectionStart !== t.selectionEnd) {
          this.wrapSelection("`", "`");
        } else {
          this.insertCodeBlock();
        }
      }));
      menu.addItem((item) => item.setTitle("数式").setIcon("sigma").onClick(() => {
        const t = this.textarea;
        if (t.selectionStart !== t.selectionEnd) {
          this.wrapSelection("$", "$");
        } else {
          this.insertMathBlock();
        }
      }));
      menu.addItem((item) => item.setTitle("引用").setIcon("quote").onClick(() => this.toggleBlockPrefix("> ")));
      menu.addSeparator();
      menu.addItem((item) => {
        item.setTitle("リンク").setIcon("link").onClick(() => this.insertMarkdownLink());
        if (!hasSelection) item.setDisabled(true);
      });
      menu.addItem((item) => {
        item.setTitle("取り消し線").setIcon("strikethrough").onClick(() => this.wrapSelection("~~", "~~"));
        if (!hasSelection) item.setDisabled(true);
      });
      menu.addItem((item) => {
        item.setTitle("ハイライト").setIcon("highlighter").onClick(() => this.wrapSelection("==", "=="));
        if (!hasSelection) item.setDisabled(true);
      });
      menu.addSeparator();
      menu.addItem((item) => {
        item.setTitle("設定").setIcon("settings").onClick(() => {
          const settingApi = (this.app as any).setting;
          if (settingApi?.open && settingApi?.openTabById) {
            settingApi.open();
            settingApi.openTabById("wrot");
          }
        });
      });
      const menuDom = (menu as any).dom as HTMLElement | undefined;
      menuDom?.classList.add("wr-menu");
      menu.showAtMouseEvent(e as MouseEvent);
    });

    // Update submit button state
    const updateSubmitBtn = () => {
      submitBtn.toggleClass("wr-submit-active", this.textarea.value.trim().length > 0);
    };

    // Update active state on cursor move / input
    const updateActive = () => {
      validateActiveFormatMode();
      this.updateToolbarActive(listBtn, checkBtn, olBtn);
      this.updateEmbedBtnActive(embedBtn);
      updateFormatBtns();
      updateSubmitBtn();
    };
    this.textarea.addEventListener("input", updateActive);
    this.textarea.addEventListener("keyup", updateActive);
    this.textarea.addEventListener("click", updateActive);
    this.textarea.addEventListener("select", updateActive);

    // Detect toolbar wrapping: compare first and last button offsetTop.
    // offsetTop is unaffected by padding changes, so toggling the wrapped class
    // will not feedback-loop through ResizeObserver.
    const updateToolbarWrapped = () => {
      const buttons = toolbar.querySelectorAll<HTMLElement>(".wr-toolbar-btn");
      if (buttons.length < 2) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      const wrapped = last.offsetTop > first.offsetTop;
      toolbar.toggleClass("wr-toolbar-wrapped", wrapped);
    };
    requestAnimationFrame(updateToolbarWrapped);
    if (typeof ResizeObserver !== "undefined") {
      this.toolbarResizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(updateToolbarWrapped);
      });
      this.toolbarResizeObserver.observe(toolbar);
    }
  }

  async submitMemo(): Promise<void> {
    // Auto-close format mode before submit
    if (this.activeFormatMode) {
      const marker = this.activeFormatMode === "bold" ? "**" : "*";
      this.textarea.value = this.textarea.value + marker;
      this.activeFormatMode = null;
    }
    const text = this.textarea.value.trim().replace(/＃/g, "#");
    if (!text) return;

    try {
      const file = await getOrCreateDailyNote(
        this.app,
        this.currentDate
      );
      this.ignoreNextModify = true;
      await appendMemo(this.app, file, text);
      this.textarea.value = "";
      this.textarea.style.height = "";
      this.activeFormatMode = null;
      this.textarea.dispatchEvent(new Event("input"));
      await this.refresh();
    } catch (e) {
      new Notice(`\u30e1\u30e2\u306e\u4fdd\u5b58\u306b\u5931\u6557\u3057\u307e\u3057\u305f: ${e}`);
    }
  }

  async refresh(): Promise<void> {
    if (this.refreshing) return;
    this.refreshing = true;
    try {
      // Update date label
      const isToday = this.currentDate.isSame(moment(), "day");
      const dateText = this.isCollapsed
        ? this.currentDate.format("MM/DD")
        : this.currentDate.format("YYYY\u5e74MM\u6708DD\u65e5");
      this.dateLabel.setText(isToday ? `${dateText}\uff08\u4eca\u65e5\uff09` : dateText);

      // Clear list
      this.listContainer.empty();

      // Get daily note file (don't create if it doesn't exist)
      const file = getDailyNoteFile(
        this.app,
        this.currentDate
      );

      if (!file) {
        this.listContainer.createDiv({
          cls: "wr-empty",
          text: "\u30e1\u30e2\u306f\u3042\u308a\u307e\u305b\u3093",
        });
        return;
      }

      const content = await this.app.vault.cachedRead(file);
      const memos = parseMemos(content);

      if (memos.length === 0) {
        this.listContainer.createDiv({
          cls: "wr-empty",
          text: "\u30e1\u30e2\u306f\u3042\u308a\u307e\u305b\u3093",
        });
        return;
      }

      for (const memo of memos) {
        this.renderMemoCard(memo);
      }
    } finally {
      this.refreshing = false;
    }
  }

  private renderMemoCard(memo: Memo): void {
    const card = this.listContainer.createDiv({ cls: "wr-card" });
    const rule = this.plugin.findTagColorRule(memo.tags);
    if (rule) {
      const idx = this.plugin.settings.tagColorRules.indexOf(rule);
      if (idx >= 0) card.classList.add(`wr-tag-rule-${idx}`);
    }

    // Content with inline tag + URL highlighting
    const contentEl = card.createDiv({ cls: "wr-content" });
    const urls = renderTextWithTagsAndUrls(contentEl, memo.content, {
      onTagClick: (tag) => this.openSearch(tag),
      onCheckToggle: async (lineIndex) => {
        const file = getDailyNoteFile(this.app, this.currentDate);
        if (!file) return;
        const fileLine = memo.lineStart + 1 + lineIndex;
        this.ignoreNextModify = true;
        await toggleCheckbox(this.app, file, fileLine);
      },
      onInternalLinkClick: (linkName) => {
        this.app.workspace.openLinkText(linkName, "", false);
      },
      checkStrikethrough: this.plugin.settings.checkStrikethrough,
      resolveImagePath: (fileName) => {
        const file = this.app.metadataCache.getFirstLinkpathDest(fileName, "");
        if (file) {
          return this.app.vault.getResourcePath(file);
        }
        return null;
      },
      resolveLinkTarget: (linkName) => {
        return this.app.metadataCache.getFirstLinkpathDest(linkName, "") !== null;
      },
      renderCodeBlock: (code, lang, blockEl, fenceTildes) => {
        const fence = "~".repeat(Math.max(3, fenceTildes));
        const source = (lang ? `${fence}${lang}\n` : `${fence}\n`) + code + `\n${fence}`;
        MarkdownRenderer.render(this.app, source, blockEl, "", this).catch(() => {
          const pre = blockEl.createEl("pre");
          const codeEl = pre.createEl("code");
          if (lang) codeEl.addClass(`language-${lang}`);
          codeEl.textContent = code;
        });
      },
      renderMathBlock: (tex, blockEl) => {
        try {
          const rendered = renderMath(tex, true);
          blockEl.appendChild(rendered);
          finishRenderMath();
        } catch {
          blockEl.textContent = tex;
        }
      },
    });

    // Rich previews (images, OGP cards, Twitter cards)
    if (urls.length > 0) {
      const mediaEl = card.createDiv({ cls: "wr-media-area" });
      renderUrlPreviews(mediaEl, urls, this.plugin.ogpCache);
    }

    // Footer: timestamp + copy
    const footer = card.createDiv({ cls: "wr-card-footer" });
    const fmt = this.plugin.settings.timestampFormat || "YYYY/MM/DD HH:mm:ss";
    const formatted = moment(memo.time).format(fmt);
    footer.createEl("span", { cls: "wr-timestamp", text: formatted });
    const copyBtn = footer.createEl("span", { cls: "wr-copy-btn" });
    setIcon(copyBtn, "copy");
    copyBtn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(memo.content);
      const successColor =
        rule?.accentColor && /^#[0-9a-fA-F]{6}$/.test(rule.accentColor)
          ? rule.accentColor
          : getComputedStyle(document.body).getPropertyValue("--text-accent").trim() || "#adc718";
      copyBtn.empty();
      copyBtn.classList.add("wr-copy-done");
      const checkSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      checkSvg.setAttribute("width", "11");
      checkSvg.setAttribute("height", "11");
      checkSvg.setAttribute("viewBox", "0 0 24 24");
      checkSvg.setAttribute("fill", "none");
      checkSvg.setAttribute("stroke", successColor);
      checkSvg.setAttribute("stroke-width", "2");
      checkSvg.setAttribute("stroke-linecap", "round");
      checkSvg.setAttribute("stroke-linejoin", "round");
      const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      polyline.setAttribute("points", "20 6 9 17 4 12");
      polyline.setAttribute("stroke", successColor);
      checkSvg.appendChild(polyline);
      copyBtn.appendChild(checkSvg);
      setTimeout(() => {
        copyBtn.classList.remove("wr-copy-done");
        copyBtn.empty();
        setIcon(copyBtn, "copy");
      }, 1500);
    });
  }

  private insertAtLineStart(prefix: string): void {
    const ta = this.textarea;
    const pos = ta.selectionStart;
    const val = ta.value;
    const lineStart = val.lastIndexOf("\n", pos - 1) + 1;
    const lineText = val.slice(lineStart, val.indexOf("\n", lineStart) === -1 ? undefined : val.indexOf("\n", lineStart));

    // Check if line already has a list prefix
    const prefixes = ["- [ ] ", "- [x] ", "- "];
    let existingPrefix = "";
    for (const p of prefixes) {
      if (lineText.startsWith(p)) {
        existingPrefix = p;
        break;
      }
    }
    if (!existingPrefix) {
      const olMatch = lineText.match(/^\d+\.\s?/);
      if (olMatch) existingPrefix = olMatch[0];
    }

    const isSameType = existingPrefix === prefix ||
      (prefix === "1. " && existingPrefix.match(/^\d+\. $/));
    if (isSameType) {
      // Toggle off: remove prefix
      ta.value = val.slice(0, lineStart) + val.slice(lineStart + existingPrefix.length);
      ta.selectionStart = ta.selectionEnd = lineStart;
    } else if (existingPrefix) {
      // Replace existing prefix
      ta.value = val.slice(0, lineStart) + prefix + val.slice(lineStart + existingPrefix.length);
      ta.selectionStart = ta.selectionEnd = lineStart + prefix.length;
    } else {
      // Insert new prefix
      ta.value = val.slice(0, lineStart) + prefix + val.slice(lineStart);
      ta.selectionStart = ta.selectionEnd = lineStart + prefix.length;
    }
    ta.focus();
    ta.dispatchEvent(new Event("input"));
  }

  private insertCodeBlock(): void {
    const ta = this.textarea;
    const pos = ta.selectionStart;
    const val = ta.value;

    const lineStart = val.lastIndexOf("\n", pos - 1) + 1;
    const currentLineIsEmpty = val.slice(lineStart, pos).trim() === "" &&
      (val.indexOf("\n", pos) === -1 || val.slice(pos, val.indexOf("\n", pos)).trim() === "");

    let before = val.slice(0, lineStart);
    let after = val.slice(lineStart);

    if (!currentLineIsEmpty) {
      const needsLeadingNewline = before.length > 0 && !before.endsWith("\n\n");
      if (needsLeadingNewline) before += before.endsWith("\n") ? "\n" : "\n\n";
      after = "\n" + after;
    }

    const insert = "~~~\n\n~~~";
    const cursorOffset = before.length + 3; // after opening "~~~"

    ta.value = before + insert + after;
    ta.selectionStart = ta.selectionEnd = cursorOffset;
    ta.focus();
    ta.dispatchEvent(new Event("input"));
  }

  private insertMathBlock(): void {
    const ta = this.textarea;
    const pos = ta.selectionStart;
    const val = ta.value;

    const lineStart = val.lastIndexOf("\n", pos - 1) + 1;
    const currentLineIsEmpty = val.slice(lineStart, pos).trim() === "" &&
      (val.indexOf("\n", pos) === -1 || val.slice(pos, val.indexOf("\n", pos)).trim() === "");

    let before = val.slice(0, lineStart);
    let after = val.slice(lineStart);

    if (!currentLineIsEmpty) {
      const needsLeadingNewline = before.length > 0 && !before.endsWith("\n\n");
      if (needsLeadingNewline) before += before.endsWith("\n") ? "\n" : "\n\n";
      after = "\n" + after;
    }

    const insert = "$$\n\n$$";
    const cursorOffset = before.length + 3; // after opening "$$\n"

    ta.value = before + insert + after;
    ta.selectionStart = ta.selectionEnd = cursorOffset;
    ta.focus();
    ta.dispatchEvent(new Event("input"));
  }

  private updateToolbarActive(listBtn: HTMLElement, checkBtn: HTMLElement, olBtn: HTMLElement): void {
    const ta = this.textarea;
    const pos = ta.selectionStart;
    const val = ta.value;
    const lineStart = val.lastIndexOf("\n", pos - 1) + 1;
    const lineEnd = val.indexOf("\n", lineStart);
    const line = val.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);

    const isList = line.startsWith("- ") && !line.match(/^- \[[ x]\] /);
    const isCheck = !!line.match(/^- \[[ x]\] /);
    const isOl = !!line.match(/^\d+\.\s?/);

    listBtn.toggleClass("wr-toolbar-active", isList);
    checkBtn.toggleClass("wr-toolbar-active", isCheck);
    olBtn.toggleClass("wr-toolbar-active", isOl);
  }

  private updateEmbedBtnActive(embedBtn: HTMLElement): void {
    const ta = this.textarea;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;

    let isEmbed = false;
    if (start !== end) {
      // Selection mode: the whole selection is a complete `![[...]]` or `[[...]]` link
      isEmbed = /^!?\[\[[^\]]*\]\]$/.test(val.slice(start, end));
    } else {
      // Caret mode: the caret sits inside an existing `![[...]]`
      const before = val.slice(Math.max(0, start - 100), start);
      const after = val.slice(start, start + 100);
      isEmbed = !!before.match(/!\[\[([^\]]*?)$/) && !!after.match(/^([^\]]*?)\]\]/);
    }

    embedBtn.toggleClass("wr-toolbar-active", isEmbed);
  }

  private toggleInlineWrap(open: string, close: string): void {
    const ta = this.textarea;
    const pos = ta.selectionStart;
    const val = ta.value;
    const before = val.slice(Math.max(0, pos - 100), pos);
    const after = val.slice(pos, pos + 100);

    // Define all wrap types: [open, close, beforeRegex, afterRegex]
    const wrapTypes: [string, string, RegExp, RegExp][] = [
      ["![[", "]]", /!\[\[([^\]]*?)$/, /^([^\]]*?)\]\]/],
      ["`", "`", /`([^`]*?)$/, /^([^`]*?)`/],
      ["$", "$", /\$([^$]*?)$/, /^([^$]*?)\$/],
    ];

    // Find which wrap type the cursor is currently inside
    let currentType: [string, string] | null = null;
    let currentBefore: RegExpMatchArray | null = null;
    let currentAfter: RegExpMatchArray | null = null;

    for (const [wo, wc, beforeRe, afterRe] of wrapTypes) {
      const bm = before.match(beforeRe);
      const am = after.match(afterRe);
      if (bm && am) {
        currentType = [wo, wc];
        currentBefore = bm;
        currentAfter = am;
        break;
      }
    }

    if (!currentType || !currentBefore || !currentAfter) {
      // Not inside any wrap → insert new
      const insert = open + close;
      ta.value = val.slice(0, pos) + insert + val.slice(pos);
      ta.selectionStart = ta.selectionEnd = pos + open.length;
      ta.focus();
      ta.dispatchEvent(new Event("input"));
      return;
    }

    const start = pos - currentBefore[0].length;
    const end = pos + currentAfter[0].length;
    const content = currentBefore[1] + currentAfter[1];

    if (currentType[0] === open) {
      // Same type → remove
      ta.value = val.slice(0, start) + content + val.slice(end);
      ta.selectionStart = ta.selectionEnd = start + currentBefore[1].length;
    } else {
      // Different type → switch
      ta.value = val.slice(0, start) + open + content + close + val.slice(end);
      ta.selectionStart = ta.selectionEnd = start + open.length + currentBefore[1].length;
    }
    ta.focus();
    ta.dispatchEvent(new Event("input"));
  }

  private wrapSelection(open: string, close: string): void {
    const ta = this.textarea;
    let start = ta.selectionStart;
    let end = ta.selectionEnd;
    if (start === end) return;
    const val = ta.value;

    // Check if selection is already wrapped with any format marker
    const markers = ["**", "*", "~~", "==", "$"];
    let unwrapped = false;
    for (const m of markers) {
      const before = val.slice(start - m.length, start);
      const after = val.slice(end, end + m.length);
      if (before === m && after === m) {
        // Remove existing marker
        const newVal = val.slice(0, start - m.length) + val.slice(start, end) + val.slice(end + m.length);
        start -= m.length;
        end -= m.length;
        ta.value = newVal;
        unwrapped = true;
        if (m === open) {
          // Same format → just toggle off
          ta.selectionStart = start;
          ta.selectionEnd = end;
          ta.focus();
          ta.dispatchEvent(new Event("input"));
          return;
        }
        break;
      }
    }

    // Apply new format
    const currentVal = ta.value;
    ta.value = currentVal.slice(0, start) + open + currentVal.slice(start, end) + close + currentVal.slice(end);
    ta.selectionStart = start + open.length;
    ta.selectionEnd = end + open.length;
    ta.focus();
    ta.dispatchEvent(new Event("input"));
  }

  /**
   * Wrap the current selection with `![[...]]` embed brackets, or unwrap if the selection is
   * already a complete `![[...]]` or `[[...]]` link (including the brackets and the optional `!`).
   * If the selection contains a `[[...]]` or `![[...]]` inside but is not a clean wrap,
   * does nothing to avoid producing nested or malformed link syntax.
   * After either action, the selection is cleared and the caret is placed at the end of the result.
   */
  private wrapSelectionWithEmbedBrackets(): void {
    const ta = this.textarea;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start === end) return;
    const val = ta.value;
    const selected = val.slice(start, end);

    // Unwrap case: the selection itself is a complete `![[...]]` or `[[...]]` link
    const unwrapMatch = selected.match(/^(!?)\[\[([^\]]*)\]\]$/);
    if (unwrapMatch) {
      const inner = unwrapMatch[2];
      const newVal = val.slice(0, start) + inner + val.slice(end);
      ta.value = newVal;
      const caret = start + inner.length;
      ta.selectionStart = ta.selectionEnd = caret;
      ta.focus();
      ta.dispatchEvent(new Event("input"));
      return;
    }

    // If the selection contains any partial `[[...]]` / `![[...]]` inside but is not
    // the clean unwrap case above, bail out to avoid nesting.
    if (/!?\[\[[^\]]*\]\]/.test(selected)) return;

    // Wrap with `![[...]]` and drop the selection, placing the caret after the closing `]]`.
    const wrapped = "![[" + selected + "]]";
    const newVal = val.slice(0, start) + wrapped + val.slice(end);
    ta.value = newVal;
    const caret = start + wrapped.length;
    ta.selectionStart = ta.selectionEnd = caret;
    ta.focus();
    ta.dispatchEvent(new Event("input"));
  }

  private toggleBlockPrefix(prefix: string): void {
    const ta = this.textarea;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;

    // Find line boundaries for selection
    const lineStart = val.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = val.indexOf("\n", end - 1);
    const blockEnd = lineEnd === -1 ? val.length : lineEnd;
    const block = val.slice(lineStart, blockEnd);
    const lines = block.split("\n");

    // Check if all lines already have the prefix
    const allHavePrefix = lines.every((l) => l.startsWith(prefix));

    const newLines = allHavePrefix
      ? lines.map((l) => l.slice(prefix.length))
      : lines.map((l) => prefix + l);

    const newBlock = newLines.join("\n");
    ta.value = val.slice(0, lineStart) + newBlock + val.slice(blockEnd);

    const diff = newBlock.length - block.length;
    ta.selectionStart = ta.selectionEnd = blockEnd + diff;
    ta.focus();
    ta.dispatchEvent(new Event("input"));
  }

  private openSearch(tag: string): void {
    // Use Obsidian's global search
    const searchPlugin = (this.app as any).internalPlugins?.getPluginById?.(
      "global-search"
    );
    if (searchPlugin?.instance) {
      searchPlugin.instance.openGlobalSearch(`"${tag.replace(/"/g, '\\"')}"`);
    } else {
      new Notice("\u691c\u7d22\u30d7\u30e9\u30b0\u30a4\u30f3\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093");
    }
  }

  private insertMarkdownLink(): void {
    const ta = this.textarea;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start === end) return;
    const val = ta.value;
    const selected = val.slice(start, end);
    ta.value = val.slice(0, start) + "[" + selected + "](" + ")" + val.slice(end);
    const cursorPos = start + 1 + selected.length + 2;
    ta.selectionStart = ta.selectionEnd = cursorPos;
    ta.focus();
    ta.dispatchEvent(new Event("input"));
  }

}
