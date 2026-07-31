import { ItemView, WorkspaceLeaf, Notice, TFile, EventRef, setIcon, Menu, Scope, MarkdownRenderer, renderMath, finishRenderMath } from "obsidian";
import { VIEW_TYPE_WROT } from "../constants";
import { parseMemos, Memo } from "../utils/memoParser";
import { appendMemo, toggleCheckbox } from "../utils/memoWriter";
import { getOrCreateDailyNote, getDailyNoteFile } from "../utils/dailyNote";
import { renderTextWithTagsAndUrls, renderUrlPreviews } from "../utils/urlRenderer";
import { renderQuoteCard } from "../utils/quoteCard";
import { ensureBlockIdOnFence } from "../utils/memoWriter";
import { isImageFile, saveImageToVault, buildEmbedLink } from "../utils/imageAttachment";
import { openCalendarPopover, CalendarPopoverHandle } from "../utils/calendarPopover";
import { TagSuggest, extractTagsForHistory, mergeRecentTags } from "../utils/tagSuggest";
import { isMathJaxReady, requestMathJax } from "../utils/mathjax";
import { quoteMarkerPattern } from "../utils/patterns";
import {
  insertAtLineStart,
  insertFenceBlock,
  insertMarkdownLink,
  isInsideEmbed,
  isInsideMarker,
  lineMarkerState,
  toggleBlockPrefix,
  toggleInlineWrap,
  wrapSelection,
  wrapSelectionWithEmbedBrackets,
} from "../utils/textareaEditor";
import type WrotPlugin from "../main";
import type { PinEntry } from "../settings";
import { t } from "../i18n";

declare const moment: typeof import("moment");

// Inserts an image embed above a trailing quote-card marker or Markdown "> " block
// (quotes always stay at the bottom of a post); otherwise appends at the end.
function insertEmbedAboveBottomBlock(bodyText: string, embed: string): string {
  if (!bodyText) return embed;

  // eslint-disable-next-line no-useless-escape -- escape kept for regex readability
  const markerMatch = bodyText.match(/^([\s\S]*?)\n?(\[\[[^\[\]]+#\^wr-\d{17}\]\])\s*$/);
  if (markerMatch) {
    const before = markerMatch[1].replace(/\n+$/, "");
    const marker = markerMatch[2];
    return before ? `${before}\n${embed}\n${marker}` : `${embed}\n${marker}`;
  }

  const lines = bodyText.split("\n");
  let firstQuoteIdx = lines.length;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^>(\s|$)/.test(lines[i])) {
      firstQuoteIdx = i;
    } else if (lines[i].trim() === "" && firstQuoteIdx === i + 1) {
      firstQuoteIdx = i;
    } else {
      break;
    }
  }
  if (firstQuoteIdx < lines.length) {
    const above = lines.slice(0, firstQuoteIdx);
    const below = lines.slice(firstQuoteIdx);
    const aboveText = above.join("\n").replace(/\n+$/, "");
    const belowText = below.join("\n").replace(/^\n+/, "");
    return aboveText
      ? `${aboveText}\n${embed}\n\n${belowText}`
      : `${embed}\n\n${belowText}`;
  }

  return `${bodyText}\n${embed}`;
}

export class WrotView extends ItemView {
  plugin: WrotPlugin;
  private currentDate: ReturnType<typeof moment>;
  // While true, the view auto-follows the date rollover to today.
  private anchoredToToday: boolean = true;
  private listContainer!: HTMLElement;
  private pinnedContainer: HTMLElement | null = null;
  private dateLabel!: HTMLElement;
  private dateNavEl!: HTMLElement;
  private calendarBtnEl: HTMLElement | null = null;
  private calendarPopover: CalendarPopoverHandle | null = null;
  private tagSuggest: TagSuggest | null = null;
  textarea!: HTMLTextAreaElement;
  submitLabelEl!: HTMLElement;
  submitIconEl!: HTMLElement;
  private fileChangeRef: EventRef | null = null;
  private fileDeleteRef: EventRef | null = null;
  private fileCreateRef: EventRef | null = null;
  private ignoreNextModify = false;
  private ignoreModifyUntil = 0;
  private activeFormatMode: "bold" | "italic" | null = null;
  // Calling focus() from a format-button click fires a focus event whose validation would
  // instantly clear the just-set pending format mode; skip exactly one focus validation.
  private skipNextFocusValidation = false;
  // Dims bold/italic buttons during IME composition. On iOS WebKit, tapping outside mid-IME
  // never delivers pointer/click to the buttons, so treat input right after blur as a forced
  // commit and briefly suppress unlocking instead.
  private imeLocked = false;
  private imeComposing = false;
  private imeValueAtStart = "";
  private imeSuppressUntil = 0;
  private refreshing = false;
  // A change that arrived while a render was in flight; replayed once the render finishes.
  private refreshQueued = false;
  private toolbarResizeObserver: ResizeObserver | null = null;
  private currentMenu: Menu | null = null;
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
      if (activeDocument.activeElement === this.textarea) {
        evt.preventDefault();
        evt.stopPropagation();
        // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
        this.submitMemo();
        return false;
      }
    });

    await this.refresh();

    // Register after the initial render to avoid refresh races.
    this.registerFileWatcher();

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (leaf !== this.leaf) return;
        // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
        this.maybeRollToToday();
      })
    );
  }

  onClose(): Promise<void> {
    this.tagSuggest?.destroy();
    this.tagSuggest = null;
    this.closeCalendarPopover();
    this.unregisterFileWatcher();
    if (this.toolbarResizeObserver) {
      this.toolbarResizeObserver.disconnect();
      this.toolbarResizeObserver = null;
    }
    this.clearPendingImage();
    this.clearPinnedContainer();
    this.contentEl.empty();
    return Promise.resolve();
  }

  private registerFileWatcher(): void {
    this.unregisterFileWatcher();
    this.fileChangeRef = this.app.vault.on("modify", (file) => {
      if (this.ignoreNextModify) {
        this.ignoreNextModify = false;
        return;
      }
      if (Date.now() < this.ignoreModifyUntil) {
        return;
      }
      if (!(file instanceof TFile)) return;
      const currentFile = getDailyNoteFile(
        this.app,
        this.currentDate
      );
      if (currentFile && file.path === currentFile.path) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
        this.refresh();
      }
    });
    // vault "delete" fires before metadataCache updates, so watch metadataCache "deleted" instead.
    this.fileDeleteRef = this.app.metadataCache.on("deleted", (file) => {
      if (!(file instanceof TFile)) return;
      if (!this.affectsCurrentView(file)) return;
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
      this.refresh();
    });
    this.fileCreateRef = this.app.vault.on("create", (file) => {
      if (!(file instanceof TFile)) return;
      if (!this.affectsCurrentView(file)) return;
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
      this.refresh();
    });
  }

  /**
   * Whether creating or deleting this file can change what the timeline shows.
   *
   * Notes only matter when they are the note being displayed -- without this, a bulk operation
   * (first sync, a plugin generating notes) triggers one full re-render per unrelated file.
   * Images stay in scope regardless: an attachment embedded in a memo can appear or disappear
   * without its note being touched.
   */
  private affectsCurrentView(file: TFile): boolean {
    const IMAGE_EXT = /^(png|jpe?g|gif|webp|svg|bmp)$/i;
    if (IMAGE_EXT.test(file.extension)) return true;
    if (file.extension.toLowerCase() !== "md") return false;
    const currentFile = getDailyNoteFile(this.app, this.currentDate);
    return currentFile !== null && file.path === currentFile.path;
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

  private async maybeRollToToday(): Promise<void> {
    if (!this.anchoredToToday) return;
    const now = moment();
    if (this.currentDate.isSame(now, "day")) return;
    this.currentDate = now;
    await this.refresh();
  }

  // Focus an existing tab showing the file (keeping its view mode) or open a new tab.
  private async openOrFocusFile(file: TFile): Promise<WorkspaceLeaf> {
    let existingLeaf: WorkspaceLeaf | null = null;
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (existingLeaf) return;
      const view = leaf.view as { file?: TFile } | undefined;
      if (view?.file?.path === file.path) {
        existingLeaf = leaf;
      }
    });
    if (existingLeaf) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
      this.app.workspace.revealLeaf(existingLeaf);
      this.app.workspace.setActiveLeaf(existingLeaf, { focus: true });
      return existingLeaf;
    }
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.openFile(file);
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
    return leaf;
  }

  private buildDateNav(container: HTMLElement): void {
    const nav = container.createDiv({ cls: "wr-date-nav" });
    this.dateNavEl = nav;

    const prevBtn = nav.createEl("button", { cls: "wr-nav-btn" });
    setIcon(prevBtn, "chevron-left");
    prevBtn.addEventListener("click", () => {
      this.currentDate = this.currentDate.clone().subtract(1, "day");
      this.anchoredToToday = false;
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
      this.refresh();
    });

    this.dateLabel = nav.createSpan({ cls: "wr-date-label" });
    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- async handler intentionally used as a callback
    this.dateLabel.addEventListener("click", async () => {
      this.dateLabel.classList.add("wr-date-label-active");
      window.setTimeout(() => this.dateLabel.classList.remove("wr-date-label-active"), 300);
      const file = getDailyNoteFile(this.app, this.currentDate)
        ?? await getOrCreateDailyNote(this.app, this.currentDate);
      await this.openOrFocusFile(file);
    });

    const nextBtn = nav.createEl("button", { cls: "wr-nav-btn" });
    setIcon(nextBtn, "chevron-right");
    nextBtn.addEventListener("click", () => {
      this.currentDate = this.currentDate.clone().add(1, "day");
      this.anchoredToToday = false;
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
      this.refresh();
    });

    const todayBtn = nav.createEl("button", { cls: "wr-today-btn", text: t("view.dateNav.today") });
    todayBtn.addEventListener("click", () => {
      this.currentDate = moment();
      this.anchoredToToday = true;
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
      this.refresh();
    });

    this.updateCalendarButton();
  }

  // Creates/removes the calendar button per showCalendarButton; kept standalone so the
  // settings tab can call it right after the toggle changes.
  updateCalendarButton(): void {
    if (!this.dateNavEl) return;
    if (!this.plugin.settings.showCalendarButton) {
      this.closeCalendarPopover();
      this.calendarBtnEl?.remove();
      this.calendarBtnEl = null;
      return;
    }
    if (this.calendarBtnEl) return;
    // Custom calendar popover instead of native input[type=date], whose look and
    // behavior differ per platform.
    const calendarBtn = this.dateNavEl.createEl("button", { cls: "wr-nav-btn wr-calendar-btn" });
    setIcon(calendarBtn, "calendar-1");
    calendarBtn.setAttr("aria-label", t("view.dateNav.today"));
    calendarBtn.addEventListener("click", () => {
      if (this.calendarPopover) {
        this.closeCalendarPopover();
        return;
      }
      // Keep the hover-like style while the popover is open.
      calendarBtn.toggleClass("wr-toolbar-active", true);
      this.calendarPopover = openCalendarPopover({
        anchor: calendarBtn,
        container: this.contentEl,
        initialDate: this.currentDate,
        onSelect: (date) => {
          this.currentDate = date;
          this.anchoredToToday = false;
          // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
          this.refresh();
        },
        onClose: () => {
          this.calendarPopover = null;
          calendarBtn.toggleClass("wr-toolbar-active", false);
        },
      });
    });
    this.calendarBtnEl = calendarBtn;
  }

  private closeCalendarPopover(): void {
    this.calendarPopover?.close();
    this.calendarPopover = null;
  }

  // Recomputes the submit button's label/icon/aria-label together so the two settings
  // never combine into a fully blank button: an empty label only renders as icon-only
  // when an icon is actually set, otherwise it falls back to the default label text.
  refreshSubmitButton(): void {
    if (!this.submitBtnEl) return;
    const { submitLabel, submitIcon } = this.plugin.settings;
    const label = submitLabel || (submitIcon ? "" : t("defaults.submitLabel"));
    this.submitLabelEl.textContent = label ? `${label} ` : "";
    this.submitBtnEl.toggleClass("wr-submit-icon-only", !label);
    if (label) {
      this.submitBtnEl.removeAttribute("aria-label");
    } else {
      this.submitBtnEl.setAttr("aria-label", t("defaults.submitLabel"));
    }
    this.submitIconEl.empty();
    if (submitIcon) {
      setIcon(this.submitIconEl, submitIcon);
    }
  }

  private buildInputArea(container: HTMLElement): void {
    const inputArea = container.createDiv({ cls: "wr-input-area" });

    const header = inputArea.createDiv({ cls: "wr-input-header" });
    const submitBtn = header.createEl("button", {
      cls: "wr-submit-btn",
    });
    this.submitLabelEl = submitBtn.createSpan();
    this.submitIconEl = submitBtn.createSpan({ cls: "wr-submit-icon" });
    this.submitBtnEl = submitBtn;
    this.refreshSubmitButton();
    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- async handler intentionally used as a callback
    submitBtn.addEventListener("click", () => this.submitMemo());

    this.textarea = inputArea.createEl("textarea", {
      cls: "wr-textarea",
      attr: { placeholder: this.plugin.settings.inputPlaceholder },
    });

    const autoGrow = () => {
      this.textarea.setCssStyles({ height: "auto" });
      this.textarea.style.height = this.textarea.scrollHeight + "px";
    };
    this.textarea.addEventListener("input", autoGrow);

    // Enablement is read per call, so the settings toggle takes effect immediately.
    this.tagSuggest = new TagSuggest({
      textarea: this.textarea,
      container,
      getCandidates: () => this.plugin.recentTags,
      isEnabled: () => this.plugin.settings.tagSuggestEnabled,
    });

    this.textarea.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.isComposing) return;
      // Suggest dropdown handles navigation keys first; Mod+Enter only closes it
      // without being consumed, so it falls through to the submit handling below.
      if (this.tagSuggest?.handleKeydown(e)) return;
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
    this.thumbnailContainer.setCssStyles({ display: "none" });

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

    // The suggest dropdown can overlap the toolbar; while it is shown (and during the
    // ghost-click window right after a tap-commit) toolbar buttons must not react.
    const toolbarSuppressed = () => this.tagSuggest?.isSuppressingUi() ?? false;

    const imageAddBtn = toolbar.createEl("button", { cls: "wr-toolbar-btn" });
    setIcon(imageAddBtn, "image-plus");
    imageAddBtn.addEventListener("mousedown", (e) => e.preventDefault());
    imageAddBtn.addEventListener("click", () => {
      if (toolbarSuppressed()) return;
      this.openImagePicker();
    });
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
      if (toolbarSuppressed()) return;
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
      const boldActive = this.activeFormatMode === "bold" || insideBold;
      const italicActive = this.activeFormatMode === "italic" || insideItalic;
      boldBtn.toggleClass("wr-toolbar-active", boldActive);
      italicBtn.toggleClass("wr-toolbar-active", italicActive);
      // Bold/italic are mutually exclusive: disable the other while one is pending or applied.
      boldBtn.toggleClass("wr-toolbar-disabled", this.activeFormatMode === "italic" || insideItalic);
      italicBtn.toggleClass("wr-toolbar-disabled", this.activeFormatMode === "bold" || insideBold);
      // Mute only the active button during IME composition to prevent accidental presses.
      boldBtn.toggleClass("wr-toolbar-ime-muted", this.imeLocked && boldActive);
      italicBtn.toggleClass("wr-toolbar-ime-muted", this.imeLocked && italicActive);
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
      if (toolbarSuppressed()) return;
      // During IME, block only when active (condition must match updateFormatBtns).
      if (this.imeLocked && (this.activeFormatMode === "bold" || this.isInsideMarker("**"))) return;
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
        this.skipNextFocusValidation = true;
      }
      ta.focus();
      ta.dispatchEvent(new Event("input"));
      updateFormatBtns();
    });
    italicBtn.addEventListener("click", () => {
      if (toolbarSuppressed()) return;
      // During IME, block only when active (condition must match updateFormatBtns).
      if (this.imeLocked && (this.activeFormatMode === "italic" || this.isInsideMarker("*"))) return;
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
        this.skipNextFocusValidation = true;
      }
      ta.focus();
      ta.dispatchEvent(new Event("input"));
      updateFormatBtns();
    });
    listBtn.addEventListener("click", () => {
      if (toolbarSuppressed()) return;
      this.insertAtLineStart("- ");
      this.updateToolbarActive(listBtn, checkBtn, olBtn);
    });
    checkBtn.addEventListener("click", () => {
      if (toolbarSuppressed()) return;
      this.insertAtLineStart("- [ ] ");
      this.updateToolbarActive(listBtn, checkBtn, olBtn);
    });
    olBtn.addEventListener("click", () => {
      if (toolbarSuppressed()) return;
      this.insertAtLineStart("1. ");
      this.updateToolbarActive(listBtn, checkBtn, olBtn);
    });
    const formatBtn = toolbar.createEl("button", { cls: "wr-toolbar-btn wr-format-btn" });
    setIcon(formatBtn, "ellipsis");
    formatBtn.addEventListener("mousedown", (e) => e.preventDefault());
    formatBtn.addEventListener("click", (e) => {
      if (toolbarSuppressed()) return;
      const ta = this.textarea;
      const hasSelection = ta.selectionStart !== ta.selectionEnd;
      this.openMenu(formatBtn, (menu) => {
        menu.addItem((item) => item.setTitle(t("view.formatMenu.code")).setIcon("code").onClick(() => {
          const t = this.textarea;
          if (t.selectionStart !== t.selectionEnd) {
            this.wrapSelection("`", "`");
          } else {
            this.insertCodeBlock();
          }
        }));
        menu.addItem((item) => item.setTitle(t("view.formatMenu.math")).setIcon("sigma").onClick(() => {
          const t = this.textarea;
          if (t.selectionStart !== t.selectionEnd) {
            this.wrapSelection("$", "$");
          } else {
            this.insertMathBlock();
          }
        }));
        menu.addItem((item) => item.setTitle(t("view.formatMenu.quote")).setIcon("quote").onClick(() => this.toggleBlockPrefix("> ")));
        menu.addSeparator();
        menu.addItem((item) => {
          item.setTitle(t("view.formatMenu.link")).setIcon("link").onClick(() => this.insertMarkdownLink());
          if (!hasSelection) item.setDisabled(true);
        });
        menu.addItem((item) => {
          item.setTitle(t("view.formatMenu.strikethrough")).setIcon("strikethrough").onClick(() => this.wrapSelection("~~", "~~"));
          if (!hasSelection) item.setDisabled(true);
        });
        menu.addItem((item) => {
          item.setTitle(t("view.formatMenu.highlight")).setIcon("highlighter").onClick(() => this.wrapSelection("==", "=="));
          if (!hasSelection) item.setDisabled(true);
        });
        menu.addSeparator();
        menu.addItem((item) => {
          item.setTitle(t("view.formatMenu.settings")).setIcon("settings").onClick(() => {
            const settingApi = (this.app as { setting?: { open?: () => void; openTabById?: (id: string) => void } }).setting;
            if (settingApi?.open && settingApi?.openTabById) {
              settingApi.open();
              settingApi.openTabById("wrot");
            }
          });
        });
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- assertion needed for cross-version Obsidian typings
      }, e as MouseEvent, -4);
    });

    const updateActive = () => {
      validateActiveFormatMode();
      this.updateToolbarActive(listBtn, checkBtn, olBtn);
      this.updateEmbedBtnActive(embedBtn);
      updateFormatBtns();
      this.updateSubmitBtnState();
    };
    // document selectionchange catches every caret/selection move; input/keyup/click/select
    // miss cases like Shift+Arrow. Runs only while the textarea is focused.
    this.registerDomEvent(activeDocument, "selectionchange", () => {
      if (activeDocument.activeElement === this.textarea) {
        updateActive();
        // Close or reposition the tag dropdown when the caret moves off the tag.
        this.tagSuggest?.refresh();
      }
    });
    // selectionchange does not fire on focus gain, so sync explicitly.
    this.textarea.addEventListener("focus", () => {
      // The focus() triggered by a format-button click must skip validation: the marker
      // is not before the caret yet and validation would clear the pending mode.
      if (this.skipNextFocusValidation) {
        this.skipNextFocusValidation = false;
        this.updateToolbarActive(listBtn, checkBtn, olBtn);
        this.updateEmbedBtnActive(embedBtn);
        updateFormatBtns();
        this.updateSubmitBtnState();
        return;
      }
      updateActive();
    });
    // Catches IME commits and pastes; updateActive is idempotent, double firing is fine.
    this.textarea.addEventListener("input", updateActive);
    // Lock on compositionstart. Unlock only once a post-IME input shows the value grew:
    // compositionend can be spuriously triggered by button taps, so only a real commit counts.
    this.textarea.addEventListener("compositionstart", () => {
      this.imeLocked = true;
      this.imeComposing = true;
      this.imeValueAtStart = this.textarea.value;
      updateFormatBtns();
    });
    this.textarea.addEventListener("compositionend", () => {
      this.imeComposing = false;
      // On desktop the post-commit input may not arrive, so unlock here if the value grew.
      // Forced commits right after blur are already suppressed via imeSuppressUntil.
      if (!this.imeLocked) return;
      if (Date.now() < this.imeSuppressUntil) return;
      if (this.textarea.value.length > this.imeValueAtStart.length) {
        this.imeLocked = false;
        updateFormatBtns();
      }
    });
    // On iOS, tapping outside mid-IME forces a commit as blur -> input(shrink) ->
    // input(restore) -> compositionend; treat input right after blur as forced and keep the lock.
    this.textarea.addEventListener("blur", () => {
      if (this.imeLocked) this.imeSuppressUntil = Date.now() + 400;
    });
    this.textarea.addEventListener("input", () => {
      if (!this.imeLocked) return;
      // Inputs caused by a forced commit are not grounds for unlocking.
      if (Date.now() < this.imeSuppressUntil) return;
      const len = this.textarea.value.length;
      const baseLen = this.imeValueAtStart.length;
      if (this.imeComposing) {
        // Still composing: unlock if all uncommitted text was deleted (back to start length).
        if (len <= baseLen) {
          this.imeLocked = false;
          updateFormatBtns();
        }
        return;
      }
      // After IME ended: unlock only if committed text was actually inserted.
      if (len > baseLen) {
        this.imeLocked = false;
        updateFormatBtns();
      }
    });

    // Refresh on both input and compositionend so uncommitted IME text also filters candidates.
    this.textarea.addEventListener("input", () => this.tagSuggest?.refresh());
    this.textarea.addEventListener("compositionend", () => this.tagSuggest?.refresh());
    this.textarea.addEventListener("blur", () => this.tagSuggest?.notifyBlur());

    // Wrap detection via offsetTop, which padding changes don't affect, so the
    // ResizeObserver cannot loop.
    const updateToolbarWrapped = () => {
      const buttons = toolbar.querySelectorAll<HTMLElement>(".wr-toolbar-btn");
      if (buttons.length < 2) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      const wrapped = last.offsetTop > first.offsetTop;
      toolbar.toggleClass("wr-toolbar-wrapped", wrapped);
    };
    window.requestAnimationFrame(updateToolbarWrapped);
    if (typeof ResizeObserver !== "undefined") {
      this.toolbarResizeObserver = new ResizeObserver(() => {
        window.requestAnimationFrame(updateToolbarWrapped);
      });
      this.toolbarResizeObserver.observe(toolbar);
    }

    // On mobile/startup Electron can leave the input area's initial layout pending
    // (blank until a tap); force a reflow on the next frame to settle it.
    window.requestAnimationFrame(() => {
      inputArea.getBoundingClientRect();
      this.textarea?.getBoundingClientRect();
    });
  }

  private openImagePicker(): void {
    if (this.pendingImage) return;
    const input = createEl("input");
    input.type = "file";
    input.accept = "image/png, image/gif, image/jpeg";
    input.multiple = false;
    input.setCssStyles({ display: "none" });
    activeDocument.body.appendChild(input);

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

    // Dismissing the dialog fires "cancel" but never "change", so without this the hidden input
    // stays in the document for the rest of the session.
    input.addEventListener("cancel", () => {
      input.remove();
      deactivate();
    });

    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (file) {
        this.setPendingImage(file);
      }
      input.remove();
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
      this.thumbnailContainer.setCssStyles({ display: "none" });
    }
    this.updateImageAddBtnState();
    this.updateSubmitBtnState();
  }

  private renderThumbnail(): void {
    if (!this.thumbnailContainer || !this.pendingImageUrl) return;
    this.thumbnailContainer.empty();
    this.thumbnailContainer.setCssStyles({ display: "" });
    const wrap = this.thumbnailContainer.createDiv({ cls: "wr-thumbnail" });
    const img = wrap.createEl("img", { cls: "wr-thumbnail-img" });
    img.src = this.pendingImageUrl;
    const removeBtn = wrap.createEl("button", { cls: "wr-thumbnail-remove" });
    setIcon(removeBtn, "x");
    removeBtn.setAttr("aria-label", t("view.image.removeAria"));
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

    // Re-anchor to today just before resolving the target file (matters for
    // weekly/monthly aggregate note formats).
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
        bodyText = insertEmbedAboveBottomBlock(bodyText, embed);
      }

      this.ignoreNextModify = true;
      await appendMemo(this.app, file, bodyText);

      // Record used tags only after a successful post. rawText already has fullwidth #
      // normalized; extraction matches the display-side tag rules.
      if (this.plugin.settings.tagSuggestEnabled) {
        const usedTags = extractTagsForHistory(rawText);
        if (usedTags.length > 0) {
          this.plugin.recentTags = mergeRecentTags(this.plugin.recentTags, usedTags);
          await this.plugin.saveRecentTags();
        }
      }

      this.textarea.value = "";
      this.textarea.setCssStyles({ height: "" });
      this.activeFormatMode = null;
      this.clearPendingImage();
      this.textarea.dispatchEvent(new Event("input"));
      await this.refresh();
    } catch (e) {
      new Notice(t("view.notice.saveFailed", { error: String(e) }));
    }
  }

  async refresh(): Promise<void> {
    // Changes can land while an earlier render is awaiting a file read. Remember that and
    // replay once, instead of dropping the change and leaving stale content on screen.
    if (this.refreshing) {
      this.refreshQueued = true;
      return;
    }
    // Skip renders entirely during the modify-suppression window (e.g. right after a checkbox toggle).
    if (Date.now() < this.ignoreModifyUntil) return;
    this.refreshing = true;
    try {
      const isToday = this.currentDate.isSame(moment(), "day");
      const dateText = this.currentDate.format(this.plugin.settings.headerDateFormat);
      this.dateLabel.setText(isToday ? `${dateText}${t("view.dateNav.todaySuffix")}` : dateText);

      this.listContainer.empty();
      this.clearPinnedContainer();

      // Resolve pins first; they render at the top independent of the current date.
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
        if (pinnedResolved.length === 0) this.renderEmptyState();
        return;
      }

      const content = await this.app.vault.cachedRead(file);
      const memos = parseMemos(content);

      let rendered = 0;
      for (const memo of memos) {
        if (pinnedTimestamps.has(memo.time)) continue;
        // Pinned memos above are deliberately exempt: pinning names a single memo,
        // which outranks a rule that hides a whole tag.
        if (this.plugin.isHiddenFromTimeline(memo.tags)) continue;
        this.renderMemoCard(memo, { pinned: false, filePath: file.path });
        rendered++;
      }

      // Covers both "the note has no memos" and "every memo is hidden by a rule":
      // the same message reads for either, and the list never ends up blank.
      if (pinnedResolved.length === 0 && rendered === 0) this.renderEmptyState();
    } finally {
      this.refreshing = false;
      if (this.refreshQueued) {
        this.refreshQueued = false;
        // eslint-disable-next-line @typescript-eslint/no-floating-promises -- replay must not alter this call's result
        this.refresh();
      }
    }
  }

  private renderEmptyState(): void {
    this.listContainer.createDiv({
      cls: "wr-empty",
      text: t("view.empty.noMemos"),
    });
  }

  private clearPinnedContainer(): void {
    this.pinnedContainer?.remove();
    this.pinnedContainer = null;
  }

  private ensurePinnedContainer(): HTMLElement {
    if (this.pinnedContainer) return this.pinnedContainer;
    const container = this.contentEl.createDiv({ cls: "wr-pinned-section" });
    this.listContainer.insertAdjacentElement("beforebegin", container);
    this.pinnedContainer = container;
    return container;
  }

  // Resolves pinned memos from settings; orphan cleanup happens on pin add/remove.
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
    const host = options.pinned
      ? this.ensurePinnedContainer()
      : this.listContainer;
    const card = host.createDiv({ cls: "wr-card" });
    if (options.pinned) card.classList.add("wr-card-pinned");
    const T = memo.time.replace(/[-:.TZ+]/g, "").slice(0, 17);
    card.classList.add(`wr-block-id-wr-${T}`);
    const rule = this.plugin.findTagColorRule(memo.tags);
    if (rule) {
      const idx = this.plugin.settings.tagColorRules.indexOf(rule);
      if (idx >= 0) card.classList.add(`wr-tag-rule-${idx}`);
    }

    const contentEl = card.createDiv({ cls: "wr-content" });
    const resolveImagePath = (fileName: string): string | null => {
      const file = this.app.metadataCache.getFirstLinkpathDest(fileName, "");
      return file ? this.app.vault.getResourcePath(file) : null;
    };
    const currentFile = getDailyNoteFile(this.app, this.currentDate);
    const currentFilePath = currentFile?.path || "";
    const urls = renderTextWithTagsAndUrls(contentEl, memo.content, {
      onTagClick: (tag) => this.openSearch(tag),
      // eslint-disable-next-line @typescript-eslint/no-misused-promises -- async handler intentionally used as a callback
      onCheckToggle: async (lineIndex) => {
        const file = getDailyNoteFile(this.app, this.currentDate);
        if (!file) return;
        const fileLine = memo.lineStart + 1 + lineIndex;
        // Suppress the burst of modify events so full re-renders don't flicker the cards.
        this.ignoreModifyUntil = Date.now() + 500;
        await toggleCheckbox(this.app, file, fileLine);
        // Re-arm after the write: a slow write can land modify past the first window and jank.
        // The strikethrough was already applied via class toggle, so no re-render is needed.
        this.ignoreModifyUntil = Date.now() + 500;
      },
      onInternalLinkClick: (linkName) => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
        this.app.workspace.openLinkText(linkName, "", false);
      },
      checkStrikethrough: this.plugin.settings.checkStrikethrough,
      resolveImagePath,
      resolveLinkTarget: (linkName) => {
        return this.app.metadataCache.getFirstLinkpathDest(linkName, "") !== null;
      },
      renderQuoteCard: (slot, fileName, blockId) => {
        renderQuoteCard(slot, fileName, blockId, this.app, currentFilePath, {
          timestampFormat: this.plugin.settings.timestampFormat,
          resolveRuleClass: (content) => this.plugin.getTagRuleClassForContent(content),
          resolveRuleAccent: (ruleClass) => this.plugin.getRuleAccentColor(ruleClass),
          checkStrikethrough: this.plugin.settings.checkStrikethrough,
        });
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
          // MathJax loads lazily (see utils/mathjax.ts): fall back until loaded, then
          // only the fallback elements get swapped in place.
          if (!isMathJaxReady()) throw new Error("MathJax not loaded yet");
          const rendered = renderMath(tex, true);
          blockEl.appendChild(rendered);
          // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
          finishRenderMath();
        } catch {
          blockEl.classList.add("wr-math-fallback");
          blockEl.textContent = tex;
          requestMathJax();
        }
      },
    });

    // Trailing media area for OGP/Twitter URL cards; inserted just before the
    // quote-card slot so quotes stay at the bottom.
    const previewUrls = urls.filter(
      (pu) => pu.type === "image" || !pu.url.startsWith("obsidian://")
    );
    if (previewUrls.length > 0) {
      const mediaEl = createDiv();
      mediaEl.className = "wr-media-area";
      const quoteSlot = contentEl.querySelector(".wr-quote-card-slot");
      if (quoteSlot && quoteSlot.parentNode) {
        quoteSlot.parentNode.insertBefore(mediaEl, quoteSlot);
      } else {
        card.appendChild(mediaEl);
      }
      renderUrlPreviews(mediaEl, previewUrls, this.plugin.ogpCache, resolveImagePath);
    }

    // The pin indicator lives outside the footer so it can't shift the menu button's
    // position or hit area.
    const footer = card.createDiv({ cls: "wr-card-footer" });

    const fmt = this.plugin.settings.timestampFormat || "YYYY/MM/DD HH:mm:ss";
    const formatted = moment(memo.time).format(fmt);
    footer.createSpan({ cls: "wr-timestamp", text: formatted });

    const menuBtn = footer.createSpan({ cls: "wr-menu-btn" });
    setIcon(menuBtn, "ellipsis");
    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- async handler intentionally used as a callback
    menuBtn.addEventListener("click", async (e) => {
      // Drop orphaned pins before evaluating the pin limit.
      await this.cleanupOrphanPins();
      const pinned = this.isPinned(memo);
      const pinLimit = this.plugin.settings.pinLimit;
      const limitReached = !pinned && this.plugin.settings.pins.length >= pinLimit;
      this.openMenu(menuBtn, (menu) => {
        menu.addItem((item) =>
          item.setTitle(t("view.postMenu.copy")).setIcon("copy").onClick(async () => {
            await navigator.clipboard.writeText(memo.content);
          })
        );
        menu.addItem((item) =>
          item.setTitle(t("view.postMenu.quotePost")).setIcon("quote").onClick(() => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
            this.insertQuoteToForm(memo, options.filePath);
          })
        );
        if (pinned) {
          menu.addItem((item) =>
            item.setTitle(t("view.postMenu.unpin")).setIcon("pin-off").onClick(async () => {
              await this.removePin(memo);
            })
          );
        } else {
          menu.addItem((item) => {
            item.setTitle(t("view.postMenu.pin")).setIcon("pin").onClick(async () => {
              if (limitReached) return;
              await this.addPin(memo, options.filePath);
            });
            if (limitReached) item.setDisabled(true);
          });
          if (limitReached) {
            menu.addItem((item) => {
              item
                .setTitle(t("view.postMenu.pinLimitHint", { limit: pinLimit }))
                .setDisabled(true);
              const itemDom = (item as { dom?: HTMLElement }).dom;
              itemDom?.classList.add("wr-menu-hint", "is-label");
            });
          }
        }
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- assertion needed for cross-version Obsidian typings
      }, e as MouseEvent);
    });

    if (options.pinned) {
      const pinIndicator = card.createSpan({ cls: "wr-pin-indicator" });
      setIcon(pinIndicator, "pin");
    }
  }


  private insertAtLineStart(prefix: string): void {
    insertAtLineStart(this.textarea, prefix);
  }

  private async insertQuoteToForm(memo: Memo, srcFilePath: string): Promise<void> {
    const T = memo.time.replace(/[-:.TZ+]/g, "").slice(0, 17);
    const blockId = `wr-${T}`;
    const srcFile = this.app.vault.getAbstractFileByPath(srcFilePath);
    if (!(srcFile instanceof TFile)) return;
    this.ignoreNextModify = true;
    await ensureBlockIdOnFence(this.app, srcFile, memo.time, blockId);
    const fileBaseName = srcFile.basename;
    const marker = `[[${fileBaseName}#^${blockId}]]`;
    const ta = this.textarea;
    const QUOTE_RE = quoteMarkerPattern();
    const existing = ta.value;
    let next: string;
    let cursorPos: number;
    if (QUOTE_RE.test(existing)) {
      next = existing.replace(QUOTE_RE, marker);
      cursorPos = 0;
    } else if (existing.length === 0) {
      next = `\n${marker}`;
      cursorPos = 0;
    } else {
      next = `${existing}\n\n${marker}`;
      cursorPos = existing.length + 1; // start of the blank line after existing text
    }
    ta.value = next;
    ta.selectionStart = ta.selectionEnd = cursorPos;
    ta.focus();
    ta.dispatchEvent(new Event("input"));
  }

  private insertCodeBlock(): void {
    insertFenceBlock(this.textarea, "~~~\n\n~~~");
  }

  private insertMathBlock(): void {
    insertFenceBlock(this.textarea, "$$\n\n$$");
  }

  private updateToolbarActive(listBtn: HTMLElement, checkBtn: HTMLElement, olBtn: HTMLElement): void {
    const { isList, isCheck, isOl } = lineMarkerState(this.textarea);
    listBtn.toggleClass("wr-toolbar-active", isList);
    checkBtn.toggleClass("wr-toolbar-active", isCheck);
    olBtn.toggleClass("wr-toolbar-active", isOl);
  }

  private isInsideMarker(marker: "**" | "*"): boolean {
    return isInsideMarker(this.textarea, marker);
  }

  private updateEmbedBtnActive(embedBtn: HTMLElement): void {
    embedBtn.toggleClass("wr-toolbar-active", isInsideEmbed(this.textarea));
  }

  private toggleInlineWrap(open: string, close: string): void {
    toggleInlineWrap(this.textarea, open, close);
  }

  private wrapSelection(open: string, close: string): void {
    wrapSelection(this.textarea, open, close);
  }

  private wrapSelectionWithEmbedBrackets(): void {
    wrapSelectionWithEmbedBrackets(this.textarea);
  }

  private toggleBlockPrefix(prefix: string): void {
    toggleBlockPrefix(this.textarea, prefix);
  }

  private openSearch(tag: string): void {
    this.plugin.openTagSearch(tag);
  }

  private insertMarkdownLink(): void {
    insertMarkdownLink(this.textarea);
  }

  // Only one menu open at a time; the trigger keeps an active class while open.
  // yOffset nudges the menu vertically (positive = down).
  openMenu(trigger: HTMLElement, buildMenu: (m: Menu) => void, evt: MouseEvent, yOffset = 0): void {
    if (this.currentMenu) {
      this.currentMenu.hide();
    }

    const menu = new Menu();
    buildMenu(menu);

    const menuDom = (menu as { dom?: HTMLElement }).dom;
    menuDom?.classList.add("wr-menu");

    trigger.toggleClass("wr-toolbar-active", true);
    this.currentMenu = menu;

    menu.onHide(() => {
      trigger.toggleClass("wr-toolbar-active", false);
      if (this.currentMenu === menu) {
        this.currentMenu = null;
      }
    });

    // Anchor the menu to the button's left edge, opening rightward.
    const rect = trigger.getBoundingClientRect();
    const doc = trigger.ownerDocument ?? activeDocument;
    menu.showAtPosition({ x: rect.left, y: rect.bottom + yOffset }, doc);
  }

}
