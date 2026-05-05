import { ItemView, WorkspaceLeaf, Notice, TFile, EventRef, setIcon, Menu, Scope, MarkdownRenderer, renderMath, finishRenderMath } from "obsidian";
import { VIEW_TYPE_WROT } from "../constants";
import { parseMemos, Memo } from "../utils/memoParser";
import { appendMemo, toggleCheckbox } from "../utils/memoWriter";
import { getOrCreateDailyNote, getDailyNoteFile } from "../utils/dailyNote";
import { renderTextWithTagsAndUrls, renderUrlPreviews } from "../utils/urlRenderer";
import { isImageFile, saveImageToVault, buildEmbedLink } from "../utils/imageAttachment";
import type WrotPlugin from "../main";
import type { PinEntry } from "../settings";

declare const moment: typeof import("moment");

export class WrotView extends ItemView {
  plugin: WrotPlugin;
  private currentDate: ReturnType<typeof moment>;
  // 「今日」追従中フラグ。trueのときだけ日付変更を跨いで自動更新する
  private anchoredToToday: boolean = true;
  private listContainer!: HTMLElement;
  private dateLabel!: HTMLElement;
  textarea!: HTMLTextAreaElement;
  submitLabelEl!: HTMLElement;
  submitIconEl!: HTMLElement;
  private fileChangeRef: EventRef | null = null;
  private fileDeleteRef: EventRef | null = null;
  private fileCreateRef: EventRef | null = null;
  private ignoreNextModify = false;
  private activeFormatMode: "bold" | "italic" | null = null;
  private refreshing = false;
  private toolbarResizeObserver: ResizeObserver | null = null;
  private currentMenu: Menu | null = null;
  private currentMenuTrigger: HTMLElement | null = null;
  private pendingImage: File | null = null;
  private pendingImageUrl: string | null = null;
  private thumbnailContainer: HTMLElement | null = null;
  private imageAddBtn: HTMLButtonElement | null = null;
  private submitBtnEl: HTMLButtonElement | null = null;

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

    this.buildDateNav(container);
    this.buildInputArea(container);
    this.listContainer = container.createDiv({ cls: "wr-list" });

    this.scope!.register(["Mod"], "Enter", (evt) => {
      if (document.activeElement === this.textarea) {
        evt.preventDefault();
        evt.stopPropagation();
        this.submitMemo();
        return false;
      }
    });

    await this.refresh();

    // 初回描画後に登録（競合回避のため）
    this.registerFileWatcher();

    // 日付追従中にWrotへ戻ったら今日へスナップ（週次/月次フォーマット対応）
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (leaf !== this.leaf) return;
        this.maybeRollToToday();
      })
    );
  }

  async onClose(): Promise<void> {
    this.unregisterFileWatcher();
    if (this.toolbarResizeObserver) {
      this.toolbarResizeObserver.disconnect();
      this.toolbarResizeObserver = null;
    }
    this.clearPendingImage();
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
    // 削除はvault.on("delete")だとmetadataCache更新前に発火するためmetadataCache側で監視
    const TRIGGER_EXT = /^(md|png|jpe?g|gif|webp|svg|bmp)$/i;
    this.fileDeleteRef = this.app.metadataCache.on("deleted", (file) => {
      if (!(file instanceof TFile)) return;
      if (!TRIGGER_EXT.test(file.extension)) return;
      this.refresh();
    });
    this.fileCreateRef = this.app.vault.on("create", (file) => {
      if (!(file instanceof TFile)) return;
      if (!TRIGGER_EXT.test(file.extension)) return;
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

  // 「今日」追従中のみ、現在日付を最新の今日へ更新する
  private async maybeRollToToday(): Promise<void> {
    if (!this.anchoredToToday) return;
    const now = moment();
    if (this.currentDate.isSame(now, "day")) return;
    this.currentDate = now;
    await this.refresh();
  }

  // 既に開かれているタブがあればそこへフォーカスし、なければ新規タブで開く
  private openOrFocusFile(file: TFile): void {
    let existingLeaf: WorkspaceLeaf | null = null;
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (existingLeaf) return;
      const view = leaf.view as { file?: TFile } | undefined;
      if (view?.file?.path === file.path) {
        existingLeaf = leaf;
      }
    });
    if (existingLeaf) {
      this.app.workspace.revealLeaf(existingLeaf);
      return;
    }
    this.app.workspace.getLeaf("tab").openFile(file);
  }

  private buildDateNav(container: HTMLElement): void {
    const nav = container.createDiv({ cls: "wr-date-nav" });

    const prevBtn = nav.createEl("button", { cls: "wr-nav-btn" });
    setIcon(prevBtn, "chevron-left");
    prevBtn.addEventListener("click", () => {
      this.currentDate = this.currentDate.clone().subtract(1, "day");
      this.anchoredToToday = false;
      this.refresh();
    });

    this.dateLabel = nav.createEl("span", { cls: "wr-date-label" });
    this.dateLabel.addEventListener("click", async () => {
      this.dateLabel.classList.add("wr-date-label-active");
      setTimeout(() => this.dateLabel.classList.remove("wr-date-label-active"), 300);
      const file = getDailyNoteFile(this.app, this.currentDate)
        ?? await getOrCreateDailyNote(this.app, this.currentDate);
      this.openOrFocusFile(file);
    });

    const nextBtn = nav.createEl("button", { cls: "wr-nav-btn" });
    setIcon(nextBtn, "chevron-right");
    nextBtn.addEventListener("click", () => {
      this.currentDate = this.currentDate.clone().add(1, "day");
      this.anchoredToToday = false;
      this.refresh();
    });

    const todayBtn = nav.createEl("button", { cls: "wr-today-btn", text: "\u4eca\u65e5" });
    todayBtn.addEventListener("click", () => {
      this.currentDate = moment();
      this.anchoredToToday = true;
      this.refresh();
    });
  }

  private buildInputArea(container: HTMLElement): void {
    const inputArea = container.createDiv({ cls: "wr-input-area" });

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
    this.submitBtnEl = submitBtn;

    this.textarea = inputArea.createEl("textarea", {
      cls: "wr-textarea",
      attr: { placeholder: this.plugin.settings.inputPlaceholder },
    });

    const autoGrow = () => {
      this.textarea.style.height = "auto";
      this.textarea.style.height = this.textarea.scrollHeight + "px";
    };
    this.textarea.addEventListener("input", autoGrow);

    this.textarea.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.isComposing) return;
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        const ta = this.textarea;
        const pos = ta.selectionStart;
        const val = ta.value;
        const lineStart = val.lastIndexOf("\n", pos - 1) + 1;
        const line = val.slice(lineStart, pos);

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

    this.thumbnailContainer = inputArea.createDiv({ cls: "wr-thumbnail-container" });
    this.thumbnailContainer.style.display = "none";

    this.textarea.addEventListener("paste", (e: ClipboardEvent) => {
      const files = e.clipboardData?.files;
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!isImageFile(file)) return;
      e.preventDefault();
      this.setPendingImage(file);
    });

    this.textarea.addEventListener("dragover", (e: DragEvent) => {
      if (e.dataTransfer?.types.includes("Files")) {
        e.preventDefault();
      }
    });

    this.textarea.addEventListener("drop", (e: DragEvent) => {
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!isImageFile(file)) return;
      e.preventDefault();
      this.setPendingImage(file);
    });

    const toolbar = inputArea.createDiv({ cls: "wr-input-toolbar" });

    const imageAddBtn = toolbar.createEl("button", { cls: "wr-toolbar-btn" });
    setIcon(imageAddBtn, "image-plus");
    imageAddBtn.addEventListener("mousedown", (e) => e.preventDefault());
    imageAddBtn.addEventListener("click", () => this.openImagePicker());
    this.imageAddBtn = imageAddBtn;

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
      const insideBold = this.isInsideMarker("**");
      const insideItalic = this.isInsideMarker("*");
      boldBtn.toggleClass("wr-toolbar-active", this.activeFormatMode === "bold" || insideBold);
      italicBtn.toggleClass("wr-toolbar-active", this.activeFormatMode === "italic" || insideItalic);
      // 排他: 予告モード中 or 選択が既に他方装飾済みなら他方ボタンを無効化
      boldBtn.toggleClass("wr-toolbar-disabled", this.activeFormatMode === "italic" || insideItalic);
      italicBtn.toggleClass("wr-toolbar-disabled", this.activeFormatMode === "bold" || insideBold);
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
      if (this.activeFormatMode === "italic" || this.isInsideMarker("*")) return;
      const ta = this.textarea;
      if (ta.selectionStart !== ta.selectionEnd) {
        this.wrapSelection("**", "**");
        updateFormatBtns();
        return;
      }
      if (this.activeFormatMode === "bold") {
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
      if (this.activeFormatMode === "bold" || this.isInsideMarker("**")) return;
      const ta = this.textarea;
      if (ta.selectionStart !== ta.selectionEnd) {
        this.wrapSelection("*", "*");
        updateFormatBtns();
        return;
      }
      if (this.activeFormatMode === "italic") {
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
    const formatBtn = toolbar.createEl("button", { cls: "wr-toolbar-btn wr-format-btn" });
    setIcon(formatBtn, "ellipsis");
    formatBtn.addEventListener("mousedown", (e) => e.preventDefault());
    formatBtn.addEventListener("click", (e) => {
      const ta = this.textarea;
      const hasSelection = ta.selectionStart !== ta.selectionEnd;
      this.openMenu(formatBtn, (menu) => {
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
      }, e as MouseEvent);
    });

    const updateActive = () => {
      validateActiveFormatMode();
      this.updateToolbarActive(listBtn, checkBtn, olBtn);
      this.updateEmbedBtnActive(embedBtn);
      updateFormatBtns();
      this.updateSubmitBtnState();
    };
    // 選択範囲・カーソル位置変更はdocumentのselectionchangeで網羅的に拾う。
    // input/keyup/click/selectは取りこぼし(シフト+矢印など)が出るため不採用。
    // textareaフォーカス中のみ実行して無駄を抑える。
    this.registerDomEvent(document, "selectionchange", () => {
      if (document.activeElement === this.textarea) updateActive();
    });
    // フォーカス取得直後はselectionchangeが発火しないため明示同期
    this.textarea.addEventListener("focus", updateActive);
    // IME確定・ペースト等の値変更を拾う(updateActiveは冪等なので二重発火OK)
    this.textarea.addEventListener("input", updateActive);

    // ツールバーの折り返し検出。offsetTopはpadding変更の影響を受けないためResizeObserverでループしない
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

  private openImagePicker(): void {
    if (this.pendingImage) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png, image/gif, image/jpeg";
    input.multiple = false;
    input.style.display = "none";
    document.body.appendChild(input);

    this.imageAddBtn?.toggleClass("wr-toolbar-active", true);
    const deactivate = () => {
      this.imageAddBtn?.toggleClass("wr-toolbar-active", false);
      window.removeEventListener("focus", deactivate);
      window.removeEventListener("pointerdown", onUserTap, true);
    };
    const onUserTap = (e: PointerEvent) => {
      if (this.imageAddBtn?.contains(e.target as Node)) return;
      deactivate();
    };
    window.addEventListener("focus", deactivate);
    window.addEventListener("pointerdown", onUserTap, true);

    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (file) {
        this.setPendingImage(file);
      }
      document.body.removeChild(input);
      deactivate();
    });
    input.click();
  }

  private setPendingImage(file: File): void {
    this.clearPendingImage();
    this.pendingImage = file;
    this.pendingImageUrl = URL.createObjectURL(file);
    this.renderThumbnail();
    this.updateImageAddBtnState();
    this.updateSubmitBtnState();
  }

  private clearPendingImage(): void {
    if (this.pendingImageUrl) {
      URL.revokeObjectURL(this.pendingImageUrl);
      this.pendingImageUrl = null;
    }
    this.pendingImage = null;
    if (this.thumbnailContainer) {
      this.thumbnailContainer.empty();
      this.thumbnailContainer.style.display = "none";
    }
    this.updateImageAddBtnState();
    this.updateSubmitBtnState();
  }

  private renderThumbnail(): void {
    if (!this.thumbnailContainer || !this.pendingImageUrl) return;
    this.thumbnailContainer.empty();
    this.thumbnailContainer.style.display = "";
    const wrap = this.thumbnailContainer.createDiv({ cls: "wr-thumbnail" });
    const img = wrap.createEl("img", { cls: "wr-thumbnail-img" });
    img.src = this.pendingImageUrl;
    const removeBtn = wrap.createEl("button", { cls: "wr-thumbnail-remove" });
    setIcon(removeBtn, "x");
    removeBtn.setAttr("aria-label", "画像を削除");
    removeBtn.addEventListener("mousedown", (e) => e.preventDefault());
    removeBtn.addEventListener("click", () => this.clearPendingImage());
  }

  private updateImageAddBtnState(): void {
    if (!this.imageAddBtn) return;
    const disabled = this.pendingImage !== null;
    this.imageAddBtn.toggleClass("wr-toolbar-disabled", disabled);
    this.imageAddBtn.disabled = disabled;
  }

  private updateSubmitBtnState(): void {
    if (!this.submitBtnEl) return;
    const hasContent = this.textarea.value.trim().length > 0 || this.pendingImage !== null;
    this.submitBtnEl.toggleClass("wr-submit-active", hasContent);
  }

  async submitMemo(): Promise<void> {
    if (this.activeFormatMode) {
      const marker = this.activeFormatMode === "bold" ? "**" : "*";
      this.textarea.value = this.textarea.value + marker;
      this.activeFormatMode = null;
    }
    const rawText = this.textarea.value.trim().replace(/＃/g, "#");
    if (!rawText && !this.pendingImage) return;

    // 投稿先を確定する直前に「今日」へ再追従する（週次/月次の集約フォーマット対策）
    if (this.anchoredToToday && !this.currentDate.isSame(moment(), "day")) {
      this.currentDate = moment();
    }

    try {
      const file = await getOrCreateDailyNote(
        this.app,
        this.currentDate
      );

      let bodyText = rawText;
      if (this.pendingImage) {
        const savedFile = await saveImageToVault(this.app, this.pendingImage, file);
        const embed = buildEmbedLink(savedFile);
        bodyText = bodyText ? `${bodyText}\n${embed}` : embed;
      }

      this.ignoreNextModify = true;
      await appendMemo(this.app, file, bodyText);
      this.textarea.value = "";
      this.textarea.style.height = "";
      this.activeFormatMode = null;
      this.clearPendingImage();
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
      const isToday = this.currentDate.isSame(moment(), "day");
      const dateText = this.currentDate.format(this.plugin.settings.headerDateFormat);
      this.dateLabel.setText(isToday ? `${dateText}\uff08\u4eca\u65e5\uff09` : dateText);

      this.listContainer.empty();

      // \u30d4\u30f3\u7559\u3081\u306f\u73fe\u5728\u65e5\u4ed8\u3068\u72ec\u7acb\u3057\u3066\u30bf\u30a4\u30e0\u30e9\u30a4\u30f3\u5148\u982d\u306b\u8868\u793a\u3059\u308b\u305f\u3081\u5148\u306b\u89e3\u6c7a
      const pinnedResolved = await this.resolvePinnedMemos();
      const pinnedTimestamps = new Set(pinnedResolved.map((p) => p.memo.time));
      for (const { memo, filePath } of pinnedResolved) {
        this.renderMemoCard(memo, { pinned: true, filePath });
      }

      const file = getDailyNoteFile(
        this.app,
        this.currentDate
      );

      if (!file) {
        if (pinnedResolved.length === 0) {
          this.listContainer.createDiv({
            cls: "wr-empty",
            text: "\u30e1\u30e2\u306f\u3042\u308a\u307e\u305b\u3093",
          });
        }
        return;
      }

      const content = await this.app.vault.cachedRead(file);
      const memos = parseMemos(content);

      if (memos.length === 0) {
        if (pinnedResolved.length === 0) {
          this.listContainer.createDiv({
            cls: "wr-empty",
            text: "\u30e1\u30e2\u306f\u3042\u308a\u307e\u305b\u3093",
          });
        }
        return;
      }

      for (const memo of memos) {
        if (pinnedTimestamps.has(memo.time)) continue;
        this.renderMemoCard(memo, { pinned: false, filePath: file.path });
      }
    } finally {
      this.refreshing = false;
    }
  }

  // \u30d4\u30f3\u8a2d\u5b9a\u304b\u3089\u5b9f\u4f53\u30e1\u30e2\u3092\u89e3\u6c7a\u3059\u308b\uff08\u8a2d\u5b9a\u306e\u6574\u7406\u306f\u30d4\u30f3\u8ffd\u52a0/\u524a\u9664\u5074\u3067\u884c\u3046\uff09
  private async resolvePinnedMemos(): Promise<{ memo: Memo; filePath: string }[]> {
    const pins = this.plugin.settings.pins;
    if (!pins || pins.length === 0) return [];

    const resolved: { memo: Memo; filePath: string }[] = [];
    const seenFiles = new Map<string, Memo[] | null>();

    for (const pin of pins) {
      let memos = seenFiles.get(pin.file);
      if (memos === undefined) {
        const file = this.app.vault.getAbstractFileByPath(pin.file);
        if (!(file instanceof TFile)) {
          seenFiles.set(pin.file, null);
          continue;
        }
        const content = await this.app.vault.cachedRead(file);
        memos = parseMemos(content);
        seenFiles.set(pin.file, memos);
      }
      if (!memos) continue;
      const memo = memos.find((m) => m.time === pin.timestamp);
      if (memo) {
        resolved.push({ memo, filePath: pin.file });
      }
    }

    return resolved;
  }

  private isPinned(memo: Memo): boolean {
    return this.plugin.settings.pins.some((p) => p.timestamp === memo.time);
  }

  // 実体が消えたピンを除去
  private async cleanupOrphanPins(): Promise<boolean> {
    const pins = this.plugin.settings.pins;
    if (pins.length === 0) return false;

    const cache = new Map<string, Memo[] | null>();
    const surviving: PinEntry[] = [];
    for (const pin of pins) {
      let memos = cache.get(pin.file);
      if (memos === undefined) {
        const file = this.app.vault.getAbstractFileByPath(pin.file);
        if (!(file instanceof TFile)) {
          cache.set(pin.file, null);
          continue;
        }
        const content = await this.app.vault.cachedRead(file);
        memos = parseMemos(content);
        cache.set(pin.file, memos);
      }
      if (!memos) continue;
      if (memos.some((m) => m.time === pin.timestamp)) {
        surviving.push(pin);
      }
    }

    if (surviving.length === pins.length) return false;
    this.plugin.settings.pins = surviving;
    await this.plugin.saveSettings();
    return true;
  }

  private async addPin(memo: Memo, filePath: string): Promise<void> {
    await this.cleanupOrphanPins();
    const limit = this.plugin.settings.pinLimit;
    if (this.plugin.settings.pins.length >= limit) return;
    if (this.isPinned(memo)) return;
    this.plugin.settings.pins = [
      { timestamp: memo.time, file: filePath },
      ...this.plugin.settings.pins,
    ];
    await this.plugin.saveSettings();
    await this.refresh();
  }

  private async removePin(memo: Memo): Promise<void> {
    const before = this.plugin.settings.pins.length;
    this.plugin.settings.pins = this.plugin.settings.pins.filter(
      (p) => p.timestamp !== memo.time
    );
    if (this.plugin.settings.pins.length !== before) {
      await this.plugin.saveSettings();
    }
    await this.cleanupOrphanPins();
    await this.refresh();
  }

  private renderMemoCard(memo: Memo, options: { pinned: boolean; filePath: string }): void {
    const card = this.listContainer.createDiv({ cls: "wr-card" });
    if (options.pinned) card.classList.add("wr-card-pinned");
    const rule = this.plugin.findTagColorRule(memo.tags);
    if (rule) {
      const idx = this.plugin.settings.tagColorRules.indexOf(rule);
      if (idx >= 0) card.classList.add(`wr-tag-rule-${idx}`);
    }

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

    // 画像以外のobsidian:// URLは空のメディアブロックを生まないよう除外
    const previewUrls = urls.filter(
      (pu) => pu.type === "image" || !pu.url.startsWith("obsidian://")
    );
    if (previewUrls.length > 0) {
      const mediaEl = card.createDiv({ cls: "wr-media-area" });
      renderUrlPreviews(mediaEl, previewUrls, this.plugin.ogpCache, (fileName) => {
        const file = this.app.metadataCache.getFirstLinkpathDest(fileName, "");
        return file ? this.app.vault.getResourcePath(file) : null;
      });
    }

    // ピン表示は3点メニューの位置/当たり判定に影響しないようフッター外に配置
    const footer = card.createDiv({ cls: "wr-card-footer" });

    const fmt = this.plugin.settings.timestampFormat || "YYYY/MM/DD HH:mm:ss";
    const formatted = moment(memo.time).format(fmt);
    footer.createEl("span", { cls: "wr-timestamp", text: formatted });

    const menuBtn = footer.createEl("span", { cls: "wr-menu-btn" });
    setIcon(menuBtn, "ellipsis");
    menuBtn.addEventListener("click", async (e) => {
      // ピン上限の判定前に、実体が消えたピンを除去する
      await this.cleanupOrphanPins();
      const pinned = this.isPinned(memo);
      const pinLimit = this.plugin.settings.pinLimit;
      const limitReached = !pinned && this.plugin.settings.pins.length >= pinLimit;
      this.openMenu(menuBtn, (menu) => {
        menu.addItem((item) =>
          item.setTitle("コピー").setIcon("copy").onClick(async () => {
            await navigator.clipboard.writeText(memo.content);
          })
        );
        if (pinned) {
          menu.addItem((item) =>
            item.setTitle("ピンを外す").setIcon("pin-off").onClick(async () => {
              await this.removePin(memo);
            })
          );
        } else {
          menu.addItem((item) => {
            item.setTitle("ピン留め").setIcon("pin").onClick(async () => {
              if (limitReached) return;
              await this.addPin(memo, options.filePath);
            });
            if (limitReached) item.setDisabled(true);
          });
          if (limitReached) {
            menu.addItem((item) => {
              item
                .setTitle(`ピン留めは${pinLimit}件までです。`)
                .setDisabled(true);
              const itemDom = (item as any).dom as HTMLElement | undefined;
              itemDom?.classList.add("wr-menu-hint", "is-label");
            });
          }
        }
      }, e as MouseEvent);
    });

    if (options.pinned) {
      const pinIndicator = card.createEl("span", { cls: "wr-pin-indicator" });
      setIcon(pinIndicator, "pin");
    }
  }


  private insertAtLineStart(prefix: string): void {
    const ta = this.textarea;
    const pos = ta.selectionStart;
    const val = ta.value;
    const lineStart = val.lastIndexOf("\n", pos - 1) + 1;
    const lineText = val.slice(lineStart, val.indexOf("\n", lineStart) === -1 ? undefined : val.indexOf("\n", lineStart));

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
      ta.value = val.slice(0, lineStart) + val.slice(lineStart + existingPrefix.length);
      ta.selectionStart = ta.selectionEnd = lineStart;
    } else if (existingPrefix) {
      ta.value = val.slice(0, lineStart) + prefix + val.slice(lineStart + existingPrefix.length);
      ta.selectionStart = ta.selectionEnd = lineStart + prefix.length;
    } else {
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
    const cursorOffset = before.length + 3;

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
    const cursorOffset = before.length + 3;

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

  // 選択範囲が指定マーカー(**または*)で完全に囲まれているか判定する。
  // 選択なし時は常にfalse(カーソル移動でボタン状態が揺れるUXを避けるため)
  private isInsideMarker(marker: "**" | "*"): boolean {
    const ta = this.textarea;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start === end) return false;
    const selected = ta.value.slice(start, end);
    if (marker === "**") {
      return /^\*\*[\s\S]+\*\*$/.test(selected);
    }
    if (!/^\*[\s\S]+\*$/.test(selected)) return false;
    // **xxx** を斜体として誤判定しないよう除外
    if (selected.startsWith("**") || selected.endsWith("**")) return false;
    return true;
  }

  private updateEmbedBtnActive(embedBtn: HTMLElement): void {
    const ta = this.textarea;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;

    let isEmbed = false;
    if (start !== end) {
      isEmbed = /^!?\[\[[^\]]*\]\]$/.test(val.slice(start, end));
    } else {
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

    const wrapTypes: [string, string, RegExp, RegExp][] = [
      ["![[", "]]", /!\[\[([^\]]*?)$/, /^([^\]]*?)\]\]/],
      ["`", "`", /`([^`]*?)$/, /^([^`]*?)`/],
      ["$", "$", /\$([^$]*?)$/, /^([^$]*?)\$/],
    ];

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
      ta.value = val.slice(0, start) + content + val.slice(end);
      ta.selectionStart = ta.selectionEnd = start + currentBefore[1].length;
    } else {
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

    const markers = ["**", "*", "~~", "==", "$"];

    // 1) マーカー込み選択 [**ああ**] を剥がす。
    //    太字/斜体の混同を避けるため open に近い種別を優先
    const orderedForInner = open === "*"
      ? ["*", "**", "~~", "==", "$"]
      : open === "**"
        ? ["**", "*", "~~", "==", "$"]
        : markers;
    for (const m of orderedForInner) {
      const selected = val.slice(start, end);
      // *単体マッチで両端が**なら太字扱いでスキップ
      if (m === "*" && (selected.startsWith("**") || selected.endsWith("**"))) continue;
      if (selected.length >= m.length * 2 && selected.startsWith(m) && selected.endsWith(m)) {
        const inner = selected.slice(m.length, selected.length - m.length);
        ta.value = val.slice(0, start) + inner + val.slice(end);
        ta.selectionStart = start;
        ta.selectionEnd = start + inner.length;
        ta.focus();
        ta.dispatchEvent(new Event("input"));
        return;
      }
    }

    // 2) 外側マーカー **[ああ]** を剥がす
    let unwrapped = false;
    for (const m of markers) {
      const before = val.slice(start - m.length, start);
      const after = val.slice(end, end + m.length);
      if (before === m && after === m) {
        const newVal = val.slice(0, start - m.length) + val.slice(start, end) + val.slice(end + m.length);
        start -= m.length;
        end -= m.length;
        ta.value = newVal;
        unwrapped = true;
        if (m === open) {
          ta.selectionStart = start;
          ta.selectionEnd = end;
          ta.focus();
          ta.dispatchEvent(new Event("input"));
          return;
        }
        break;
      }
    }

    // 3) 新規に囲む。マーカー込みで選択を維持するため selectionEnd に close.length も加算
    const currentVal = ta.value;
    ta.value = currentVal.slice(0, start) + open + currentVal.slice(start, end) + close + currentVal.slice(end);
    ta.selectionStart = start;
    ta.selectionEnd = end + open.length + close.length;
    ta.focus();
    ta.dispatchEvent(new Event("input"));
  }

  // 選択範囲を `![[...]]` で挟む。既に挟まれていれば外す。入れ子になる場合は何もしない
  private wrapSelectionWithEmbedBrackets(): void {
    const ta = this.textarea;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start === end) return;
    const val = ta.value;
    const selected = val.slice(start, end);

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

    if (/!?\[\[[^\]]*\]\]/.test(selected)) return;

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

    const lineStart = val.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = val.indexOf("\n", end - 1);
    const blockEnd = lineEnd === -1 ? val.length : lineEnd;
    const block = val.slice(lineStart, blockEnd);
    const lines = block.split("\n");

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

  // メニューは同時に1つだけ開く。トリガーボタンには開いている間 active クラスを付与
  openMenu(trigger: HTMLElement, buildMenu: (m: Menu) => void, evt: MouseEvent): void {
    if (this.currentMenu) {
      this.currentMenu.hide();
    }

    const menu = new Menu();
    buildMenu(menu);

    const menuDom = (menu as any).dom as HTMLElement | undefined;
    menuDom?.classList.add("wr-menu");

    trigger.toggleClass("wr-toolbar-active", true);
    this.currentMenu = menu;
    this.currentMenuTrigger = trigger;

    menu.onHide(() => {
      trigger.toggleClass("wr-toolbar-active", false);
      if (this.currentMenu === menu) {
        this.currentMenu = null;
        this.currentMenuTrigger = null;
      }
    });

    menu.showAtMouseEvent(evt);
  }

}
