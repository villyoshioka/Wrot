import { ItemView, WorkspaceLeaf, Notice, TFile, EventRef, setIcon, Menu, MenuItem, Platform, Scope, MarkdownRenderer, renderMath, finishRenderMath } from "obsidian";
import { VIEW_TYPE_WROT } from "../constants";
import { parseMemos, Memo } from "../utils/memoParser";
import { appendMemo, deleteMemo, toggleCheckbox, updateMemo } from "../utils/memoWriter";
import { getOrCreateDailyNote, getDailyNoteFile, dailyNotePathFor } from "../utils/dailyNote";
import { renderTextWithTagsAndUrls, renderUrlPreviews } from "../utils/urlRenderer";
import { invalidateMemoCache, renderQuoteCard } from "../utils/quoteCard";
import { ensureBlockIdOnFence } from "../utils/memoWriter";
import { isImageFile, saveImageToVault, buildEmbedLink } from "../utils/imageAttachment";
import { openCalendarPopover, CalendarPopoverHandle } from "../utils/calendarPopover";
import { buildDateDrum } from "../utils/dateDrum";
import { TagSuggest, extractTagsForHistory, mergeRecentTags, rebuildFocus } from "../utils/tagSuggest";
import { isMathJaxReady, requestMathJax } from "../utils/mathjax";
import { quoteMarkerPattern } from "../utils/patterns";
import {
  closeInlineMarker,
  continueListOnEnter,
  insertAtLineStart,
  insertFenceBlock,
  insertMarkdownLink,
  isInsideEmbed,
  isInsideMarker,
  lineMarkerState,
  shiftListIndent,
  syncListFormatting,
  toggleBlockPrefix,
  toggleInlineWrap,
  wrapSelection,
  wrapSelectionWithEmbedBrackets,
} from "../utils/textareaEditor";
import type WrotPlugin from "../main";
import type { PinEntry, ScheduledPinEntry, ToolbarSlot } from "../settings";
import { resolveToolbarLayout } from "../settings";
import { t } from "../i18n";

declare const moment: typeof import("moment");

/**
 * Every action the bar can carry, described once: its icon, the label it answers to, and
 * what it needs before it will run. The order here is the order the overflow menu shows
 * them in, whatever their places on the bar — grouped by what the hand has to do first:
 * the ones that act on the caret, then the ones that need something selected (bold and
 * italic lead those, being the pair most often reached for), and last the one that sets a
 * state rather than writing anything, which puts it beside the entries that end the menu.
 */
const TOOLBAR_ACTION_SPECS: ReadonlyArray<{
  id: string;
  icon: string;
  labelKey: Parameters<typeof t>[0];
  needsSelection?: boolean;
  pendingMode?: boolean;
}> = [
  { id: "image", icon: "image-plus", labelKey: "view.toolbarAction.image" },
  { id: "embed", icon: "paperclip", labelKey: "view.toolbarAction.embed" },
  { id: "list", icon: "list", labelKey: "view.toolbarAction.list" },
  { id: "check", icon: "list-checks", labelKey: "view.toolbarAction.check" },
  { id: "ol", icon: "list-ordered", labelKey: "view.toolbarAction.ol" },
  { id: "code", icon: "code", labelKey: "view.formatMenu.code" },
  { id: "math", icon: "sigma", labelKey: "view.formatMenu.math" },
  { id: "quote", icon: "quote", labelKey: "view.formatMenu.quote" },
  { id: "bold", icon: "bold", labelKey: "view.toolbarAction.bold", pendingMode: true },
  { id: "italic", icon: "italic", labelKey: "view.toolbarAction.italic", pendingMode: true },
  { id: "link", icon: "link", labelKey: "view.formatMenu.link", needsSelection: true },
  { id: "strikethrough", icon: "strikethrough", labelKey: "view.formatMenu.strikethrough", needsSelection: true },
  { id: "highlight", icon: "highlighter", labelKey: "view.formatMenu.highlight", needsSelection: true },
  { id: "schedule", icon: "clock-fading", labelKey: "view.postMenu.schedulePin" },
];

/** One entry of the toolbar's action list, wherever that entry currently sits. */
interface ToolbarAction {
  id: string;
  label: string;
  icon: string;
  run: () => void;
  // Insertion has nothing to wrap without a selection, so the action is offered greyed out.
  needsSelection?: boolean;
  // Actions that hold a state carry a tick in the menu, the way the toolbar button lights.
  checked?: () => boolean;
  // Greyed out in the menu under the same terms as the toolbar button.
  disabled?: () => boolean;
  /**
   * Opens a marker and writes inside it, with a lit button as the only sign that mode is
   * running. Off the bar there is nothing to light, so in the menu the action is offered
   * as a plain wrap of the selection — the same terms the strikethrough has always had.
   */
  pendingMode?: boolean;
}

const DRAFT_IDLE_MS = 1000;
const REFRESH_COALESCE_MS = 300;
const OWN_WRITE_WINDOW_MS = 1000;

// The same block can sit in two notes (copied by hand or doubled by sync), so the
// timestamp alone is not unique.
function pinKey(filePath: string, time: string): string {
  return `${filePath}\n${time}`;
}

function matchesPin(pin: PinEntry, memo: Memo, filePath: string): boolean {
  return pin.timestamp === memo.time && pin.file === filePath;
}

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
  // Calendar day the list was last drawn on, as YYYY-MM-DD. A scheduled pin comes due by
  // the day turning over rather than by anything happening, so this is what tells a
  // catch-up whether there is anything to pick up.
  private lastRenderedDay: string | null = null;
  private listContainer!: HTMLElement;
  private pinnedContainer: HTMLElement | null = null;
  private dateLabel!: HTMLElement;
  private dateNavEl!: HTMLElement;
  private calendarBtnEl: HTMLElement | null = null;
  private calendarPopover: CalendarPopoverHandle | null = null;
  // Separate handle from the date-nav calendar: this one hangs off a card's menu.
  private schedulePopover: CalendarPopoverHandle | null = null;
  // The button the open schedule picker belongs to, so that button can close it again.
  private schedulePickerAnchor: HTMLElement | null = null;
  // Timestamp of the memo whose day is being chosen, if any.
  private schedulingTime: string | null = null;
  // Day armed on the post being written, applied the moment it is posted.
  private armedSchedule: string | null = null;
  private scheduleArmBtn: HTMLButtonElement | null = null;
  private tagSuggest: TagSuggest | null = null;
  textarea!: HTMLTextAreaElement;
  submitLabelEl!: HTMLElement;
  submitIconEl!: HTMLElement;
  private fileChangeRef: EventRef | null = null;
  private fileDeleteRef: EventRef | null = null;
  private fileCreateRef: EventRef | null = null;
  private fileRawRef: EventRef | null = null;
  private refreshTimer: number | null = null;
  private ignoreNextModify = false;
  private ownWriteAt = 0;
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
  private draftTimer: number | null = null;
  private currentMenu: Menu | null = null;
  private pendingImage: File | null = null;
  private pendingImageUrl: string | null = null;
  private thumbnailContainer: HTMLElement | null = null;
  private imageAddBtn: HTMLButtonElement | null = null;
  private submitBtnEl: HTMLButtonElement | null = null;
  // Sits at the left edge of the input header and only shows while editing.
  private cancelBtnEl: HTMLButtonElement | null = null;
  // Takes the same place and shape while the toolbar itself is being arranged.
  private toolbarDoneBtnEl: HTMLButtonElement | null = null;
  private toolbarEl: HTMLElement | null = null;
  private formatBtnEl: HTMLButtonElement | null = null;
  // Every action's button, built up front whether or not it is on the bar: the handlers
  // stay bound to it, so hiding one is only a matter of taking it out of the DOM.
  private toolbarBtns: Map<string, HTMLButtonElement> = new Map();
  private toolbarActions: ToolbarAction[] = [];
  // Working copy of the saved layout, mutated while arranging and written back on each change.
  private toolbarLayout: ToolbarSlot[] = [];
  private toolbarEditing = false;
  // Edit mode: the memo whose body the form is rewriting. time is the unique key;
  // filePath keeps the write target stable across date navigation and for pinned
  // memos living in another file.
  private editingMemo: { time: string; filePath: string } | null = null;
  // Timestamp of the memo whose delete has taken its first press, if any.
  private deleteArmedTime: string | null = null;
  private deleteArmTimer: number | null = null;
  // Draft stashed on entering edit mode, restored on update or cancel. The image
  // is kept as a File reference: its object URL is revoked with the thumbnail,
  // but setPendingImage regenerates one on restore.
  private savedDraft: {
    text: string;
    image: File | null;
    selStart: number;
    selEnd: number;
  } | null = null;

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

    // The view has no clock of its own, so it catches up at the moments attention lands
    // on it: the panel being reached for, and the window being come back to. Both are
    // cheap when the day has not turned -- catchUpToToday compares a date and stops.
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (leaf !== this.leaf) return;
        // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
        this.catchUpToToday();
      })
    );
    // The view's own window, not the main one: a timeline living in a popout is come
    // back to by focusing that popout.
    this.registerDomEvent(this.containerEl.win, "focus", () => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
      this.catchUpToToday();
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
      this.syncDraftFromDisk();
    });
    this.registerDomEvent(this.containerEl.win, "blur", () => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
      this.persistDraft();
    });
    // "raw" is undocumented: the vault's change signal for every path, .obsidian included.
    // The only way to see draft.json change under a focused window (sync writes it).
    const draftPath = this.plugin.draftFilePath();
    if (draftPath) {
      const vault = this.app.vault as unknown as {
        on(name: "raw", cb: (path: string) => void): EventRef;
      };
      this.registerEvent(
        vault.on("raw", (path) => {
          if (path !== draftPath) return;
          // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
          this.syncDraftFromDisk();
        })
      );
    }
  }

  onClose(): Promise<void> {
    if (this.draftTimer !== null) window.clearTimeout(this.draftTimer);
    this.draftTimer = null;
    // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
    this.persistDraft();
    this.tagSuggest?.destroy();
    this.tagSuggest = null;
    this.closeCalendarPopover();
    this.unregisterFileWatcher();
    if (this.toolbarResizeObserver) {
      this.toolbarResizeObserver.disconnect();
      this.toolbarResizeObserver = null;
    }
    this.clearPendingImage();
    this.clearDeleteArm();
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
      if ((currentFile && file.path === currentFile.path) || this.holdsPinnedMemo(file.path)) {
        this.requestRefresh();
      }
    });
    // vault "delete" fires before metadataCache updates, so watch metadataCache "deleted" instead.
    this.fileDeleteRef = this.app.metadataCache.on("deleted", (file) => {
      if (!(file instanceof TFile)) return;
      if (!this.affectsCurrentView(file)) return;
      this.requestRefresh();
    });
    this.fileCreateRef = this.app.vault.on("create", (file) => {
      if (!(file instanceof TFile)) return;
      if (!this.affectsCurrentView(file)) return;
      this.requestRefresh();
    });
    // On mobile, a note rewritten by sync does not always raise "modify"; the undocumented
    // "raw" signal still fires. Desktop gets "modify" reliably and would refresh twice.
    if (Platform.isMobile) {
      const vault = this.app.vault as unknown as {
        on(name: "raw", cb: (path: string) => void): EventRef;
      };
      this.fileRawRef = vault.on("raw", (path) => {
        // "modify" may have consumed the flag already; the time window covers the rest.
        if (this.ignoreNextModify || Date.now() < this.ignoreModifyUntil) return;
        if (Date.now() - this.ownWriteAt < OWN_WRITE_WINDOW_MS) return;
        if (path !== dailyNotePathFor(this.currentDate) && !this.holdsPinnedMemo(path)) return;
        this.requestRefresh();
      });
    }
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
    // Matched by path rather than by looking the note up: a deleted file is no longer there
    // to be found, and the timeline would sit on the posts of a note that is gone.
    if (file.path === dailyNotePathFor(this.currentDate)) return true;
    // Pins show above the day's posts whatever date is open, so their notes count too.
    return this.holdsPinnedMemo(file.path);
  }

  /** Whether a pinned memo lives in this note, which the timeline shows on every date. */
  private holdsPinnedMemo(path: string): boolean {
    // Scheduled pins count too: their memo can be edited away before its day arrives.
    return this.allPinEntries().some((pin) => pin.file === path);
  }

  /** Both pin lists as one, for the checks that treat a pin as a pin. */
  private allPinEntries(): PinEntry[] {
    const { pins, scheduledPins } = this.plugin.settings;
    return [...(pins ?? []), ...(scheduledPins ?? [])];
  }

  private markOwnWrite(): void {
    this.ignoreNextModify = true;
    this.ownWriteAt = Date.now();
  }

  // One sync can raise several change signals in a row; they redraw once.
  private requestRefresh(): void {
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = null;
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
      this.refresh();
    }, REFRESH_COALESCE_MS);
  }

  private unregisterFileWatcher(): void {
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
    this.refreshTimer = null;
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
    if (this.fileRawRef) {
      this.app.vault.offref(this.fileRawRef);
      this.fileRawRef = null;
    }
  }

  /**
   * Brings the view up to date with the calendar. Called whenever attention lands on it.
   *
   * Two things go stale while the view sits untouched: the day it is showing, and a
   * scheduled pin whose day has come. The first only moves while the view is still
   * following today; the second has to be picked up either way, since pins sit above the
   * timeline whatever date is open.
   *
   * Nothing here watches the clock. The day is checked when the view is looked at, which
   * is the only moment the answer is worth anything.
   */
  private async catchUpToToday(): Promise<void> {
    // A redraw would take an edit in progress or an open picker with it. Whatever lands
    // on the view next catches up instead.
    if (this.editingMemo || this.schedulingTime || this.schedulePopover) return;
    const now = moment();
    const rollTo = this.anchoredToToday && !this.currentDate.isSame(now, "day");
    if (!rollTo && this.lastRenderedDay === now.format("YYYY-MM-DD")) return;
    if (rollTo) this.currentDate = now;
    await this.refresh();
  }

  focusInput(): void {
    this.textarea?.focus();
  }

  private scheduleDraftSave(): void {
    if (this.draftTimer !== null) window.clearTimeout(this.draftTimer);
    this.draftTimer = window.setTimeout(() => {
      this.draftTimer = null;
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
      this.persistDraft();
    }, DRAFT_IDLE_MS);
  }

  // While editing, the textarea holds the post and the real draft sits in savedDraft.
  private async persistDraft(): Promise<void> {
    if (!this.textarea || this.editingMemo) return;
    await this.plugin.saveDraft(this.textarea.value);
  }

  // Text typed here but not yet written wins over whatever arrived on disk.
  private async syncDraftFromDisk(afterCompose = false): Promise<void> {
    if (!this.textarea || this.editingMemo) return;
    const local = this.textarea.value;
    const known = this.plugin.draft;
    // Own writes echo back as a change signal too; nothing below runs for those.
    if (!afterCompose && !(await this.plugin.reloadDraft())) return;
    if (this.editingMemo) return;
    // Replacing the value mid-composition strands the IME: blur to force-commit, wait for
    // compositionend, then come back with afterCompose set (same dance as tag completion).
    if (this.imeComposing && !afterCompose) {
      const ta = this.textarea;
      let done = false;
      const finish = (): void => {
        if (done) return;
        done = true;
        ta.removeEventListener("compositionend", finish);
        // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
        this.syncDraftFromDisk(true);
      };
      ta.addEventListener("compositionend", finish);
      ta.blur();
      window.setTimeout(finish, 150);
      return;
    }
    // The commit itself changed the value; that is not typing to preserve.
    if (!afterCompose && local !== known) return;
    this.textarea.value = this.plugin.draft;
    if (afterCompose && activeDocument.activeElement !== this.textarea) {
      rebuildFocus(this.textarea, this.contentEl);
    }
    this.textarea.dispatchEvent(new Event("input"));
  }

  restoreDraft(): void {
    const draft = this.plugin.draft;
    if (!draft || !this.textarea || this.textarea.value || this.editingMemo) return;
    this.textarea.value = draft;
    this.textarea.dispatchEvent(new Event("input"));
  }

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
    const calendarBtn = this.dateNavEl.createEl("button", { cls: "wr-nav-btn wr-calendar-btn" });
    setIcon(calendarBtn, "calendar-1");
    calendarBtn.setAttr("aria-label", t("view.dateNav.today"));
    calendarBtn.addEventListener("click", () => {
      if (this.calendarPopover) {
        this.closeCalendarPopover();
        return;
      }
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
    const { submitLabel, submitIcon, updateLabel, updateIcon } = this.plugin.settings;
    const editing = this.editingMemo !== null;
    // While editing, both the label and the icon swap to their update variants
    // under the same rules as posting: an empty label goes icon-only when the
    // effective icon is set, default text otherwise. An empty update icon
    // shares the post button's icon.
    const icon = editing ? updateIcon || submitIcon : submitIcon;
    const label = editing
      ? updateLabel || (icon ? "" : t("defaults.updateLabel"))
      : submitLabel || (icon ? "" : t("defaults.submitLabel"));
    this.submitLabelEl.textContent = label ? `${label} ` : "";
    this.submitBtnEl.toggleClass("wr-submit-icon-only", !label);
    this.submitBtnEl.toggleClass("wr-submit-editing", editing);
    if (label) {
      this.submitBtnEl.removeAttribute("aria-label");
    } else {
      this.submitBtnEl.setAttr(
        "aria-label",
        editing ? t("defaults.updateLabel") : t("defaults.submitLabel")
      );
    }
    this.submitIconEl.empty();
    if (icon) {
      setIcon(this.submitIconEl, icon);
    }
    if (this.cancelBtnEl) this.cancelBtnEl.hidden = !editing;
    if (editing) this.setToolbarEditing(false);
    if (editing && this.armedSchedule) this.setArmedSchedule(null);
    else this.setArmedSchedule(this.armedSchedule);
  }

  private buildInputArea(container: HTMLElement): void {
    const inputArea = container.createDiv({ cls: "wr-input-area" });

    const header = inputArea.createDiv({ cls: "wr-input-header" });
    // Third way out of edit mode, next to Escape and the card menu's cancel item:
    // both of those can be out of reach on mobile or with the card scrolled away.
    const cancelBtn = header.createEl("button", { cls: "wr-toolbar-btn wr-cancel-btn" });
    setIcon(cancelBtn, "x");
    cancelBtn.setAttr("aria-label", t("view.postMenu.cancelEdit"));
    this.cancelBtnEl = cancelBtn;
    cancelBtn.addEventListener("click", () => this.exitEditMode());
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
      // Escape leaves edit mode from the keyboard: the cancel menu item can be out
      // of reach when the target card is scrolled away or on another date.
      if (e.key === "Escape" && this.editingMemo) {
        e.preventDefault();
        this.exitEditMode();
        return;
      }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        if (continueListOnEnter(this.textarea)) e.preventDefault();
      }
      // Tab only moves list items; anywhere else it still leaves the textarea.
      if (e.key === "Tab") {
        if (shiftListIndent(this.textarea, e.shiftKey)) e.preventDefault();
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
      if (this.toolbarEditing) return;
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
      if (this.toolbarEditing) return;
      this.setPendingImage(file);
    });

    const toolbar = inputArea.createDiv({ cls: "wr-input-toolbar" });
    this.toolbarEl = toolbar;
    this.toolbarBtns.clear();

    // The suggest dropdown can overlap the toolbar; while it is shown (and during the
    // ghost-click window right after a tap-commit) toolbar buttons must not react.
    const toolbarSuppressed = () => this.tagSuggest?.isSuppressingUi() ?? false;

    // Buttons are born detached: applyToolbarLayout is the only thing that puts one on
    // the bar, so an action that lives in the overflow menu simply never gets appended.
    for (const spec of TOOLBAR_ACTION_SPECS) {
      const btn = createEl("button", { cls: "wr-toolbar-btn" });
      setIcon(btn, spec.icon);
      btn.setAttr("aria-label", t(spec.labelKey));
      btn.setAttr("data-wr-action", spec.id);
      btn.addEventListener("mousedown", (e) => e.preventDefault());
      this.toolbarBtns.set(spec.id, btn);
    }
    // Every id above was just registered, so the lookup cannot come back empty.
    const btnFor = (id: string): HTMLButtonElement =>
      this.toolbarBtns.get(id) as HTMLButtonElement;

    const imageAddBtn = btnFor("image");
    imageAddBtn.addEventListener("click", () => {
      if (toolbarSuppressed()) return;
      this.openImagePicker();
    });
    this.imageAddBtn = imageAddBtn;

    const embedBtn = btnFor("embed");
    const boldBtn = btnFor("bold");
    const italicBtn = btnFor("italic");
    const listBtn = btnFor("list");
    const checkBtn = btnFor("check");
    const olBtn = btnFor("ol");

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
        this.wrapSelection("**", "**", true);
        updateFormatBtns();
        return;
      }
      if (this.activeFormatMode === "bold") {
        const pos = ta.selectionStart;
        if (pos >= 2 && ta.value.slice(pos - 2, pos) === "**") {
          ta.value = ta.value.slice(0, pos - 2) + ta.value.slice(pos);
          ta.selectionStart = ta.selectionEnd = pos - 2;
        } else {
          closeInlineMarker(ta, "**");
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
        this.wrapSelection("*", "*", true);
        updateFormatBtns();
        return;
      }
      if (this.activeFormatMode === "italic") {
        const pos = ta.selectionStart;
        if (pos >= 1 && ta.value.slice(pos - 1, pos) === "*") {
          ta.value = ta.value.slice(0, pos - 1) + ta.value.slice(pos);
          ta.selectionStart = ta.selectionEnd = pos - 1;
        } else {
          closeInlineMarker(ta, "*");
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
    const scheduleBtn = btnFor("schedule");
    this.scheduleArmBtn = scheduleBtn;
    scheduleBtn.addEventListener("click", (e) => {
      if (toolbarSuppressed()) return;
      // Editing rewrites a post that already exists; its day is set from its own card.
      if (this.editingMemo) return;
      // The picker hangs off whatever is on screen: the button itself while it is on the
      // bar, the overflow button once it has been put away, since a picker cannot be
      // placed against something that is not laid out.
      const anchor = scheduleBtn.parentElement ? scheduleBtn : this.formatBtnEl ?? scheduleBtn;
      // The picker this button opened closes on the same button, the way the date
      // nav's calendar does. The popover ignores presses on its own anchor so a day
      // cell's click can land, which leaves the press to fall through to here.
      if (this.schedulePickerAnchor === anchor) {
        this.schedulePopover?.close();
        return;
      }
      if (this.armedSchedule) {
        this.setArmedSchedule(null);
        return;
      }
      this.openSchedulePicker(anchor, e, null, (from) => this.setArmedSchedule(from));
    });

    // The actions that ship inside the overflow menu. They own buttons of their own so
    // that promoting one to the bar needs nothing beyond a change of layout.
    const runCode = () => {
      const ta = this.textarea;
      if (ta.selectionStart !== ta.selectionEnd) this.wrapSelection("`", "`");
      else this.insertCodeBlock();
    };
    const runMath = () => {
      const ta = this.textarea;
      if (ta.selectionStart !== ta.selectionEnd) this.wrapSelection("$", "$");
      else this.insertMathBlock();
    };
    // Keyed by id: an action listed here gets its click handler from this table, and the
    // rest already carry handlers of their own from further up.
    const menuBornRuns: Record<string, () => void> = {
      code: runCode,
      math: runMath,
      quote: () => this.toggleBlockPrefix("> "),
      link: () => this.insertMarkdownLink(),
      strikethrough: () => this.wrapSelection("~~", "~~"),
      highlight: () => this.wrapSelection("==", "=="),
    };
    for (const spec of TOOLBAR_ACTION_SPECS) {
      const run = menuBornRuns[spec.id];
      if (!run) continue;
      btnFor(spec.id).addEventListener("click", () => {
        if (toolbarSuppressed()) return;
        const ta = this.textarea;
        if (spec.needsSelection && ta.selectionStart === ta.selectionEnd) return;
        run();
      });
    }

    // Pressing a button is the definition of what its action does, so every action runs by
    // pressing its own button rather than keeping a second copy of the same logic.
    this.toolbarActions = TOOLBAR_ACTION_SPECS.map((spec) => ({
      id: spec.id,
      icon: spec.icon,
      label: t(spec.labelKey),
      needsSelection: spec.needsSelection,
      pendingMode: spec.pendingMode,
      run: () => this.toolbarBtns.get(spec.id)?.click(),
    }));
    // The armed day is the one state an action carries into the menu.
    const scheduleAction = this.toolbarActions.find((a) => a.id === "schedule");
    if (scheduleAction) {
      scheduleAction.checked = () => this.armedSchedule !== null;
      scheduleAction.disabled = () =>
        this.editingMemo !== null ||
        (this.armedSchedule === null &&
          this.scheduledClaimCount() >= this.plugin.settings.pinLimit);
    }

    const toolbarDoneBtn = createEl("button", {
      cls: "wr-toolbar-btn wr-toolbar-commit-btn",
    });
    setIcon(toolbarDoneBtn, "check");
    toolbarDoneBtn.setAttr("aria-label", t("view.toolbarEdit.done"));
    toolbarDoneBtn.addEventListener("mousedown", (e) => e.preventDefault());
    this.toolbarDoneBtnEl = toolbarDoneBtn;

    const formatBtn = toolbar.createEl("button", { cls: "wr-toolbar-btn wr-format-btn" });
    setIcon(formatBtn, "ellipsis");
    formatBtn.setAttr("aria-label", t("view.toolbarAction.more"));
    this.formatBtnEl = formatBtn;
    formatBtn.addEventListener("mousedown", (e) => e.preventDefault());
    formatBtn.addEventListener("click", (e) => {
      if (toolbarSuppressed()) return;
      const ta = this.textarea;
      const hasSelection = ta.selectionStart !== ta.selectionEnd;
      this.openMenu(formatBtn, (menu) => {
        let rendered = 0;
        for (const action of this.hiddenActions()) {
          rendered++;
          menu.addItem((item) => {
            item.setTitle(action.label).setIcon(action.icon).onClick(() => action.run());
            if (action.checked?.()) item.setChecked(true);
            const wrapOnly = action.needsSelection || action.pendingMode;
            if ((wrapOnly && !hasSelection) || action.disabled?.()) item.setDisabled(true);
          });
        }
        if (rendered > 0) menu.addSeparator();
        if (this.plugin.settings.toolbarEditEnabled) {
          menu.addItem((item) => {
            item
              .setTitle(t("view.formatMenu.editToolbar"))
              .setIcon("wrench")
              .onClick(() => this.setToolbarEditing(true));
            // Editing a post already owns the header's ×; the toolbar cannot claim it too.
            if (this.editingMemo) item.setDisabled(true);
          });
        }
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
      }, e as MouseEvent, -4, undefined, true);
    });

    // Every press inside the bar belongs to arranging it while that is what is going on;
    // catching them here leaves each action's own handler untouched. The corner is the
    // one exception: it backs out of arranging, leaving the bar as it was found.
    toolbar.addEventListener(
      "click",
      (e) => {
        if (!this.toolbarEditing) return;
        e.preventDefault();
        e.stopPropagation();
        if (formatBtn.contains(e.target as Node)) this.setToolbarEditing(false);
        else if (toolbarDoneBtn.contains(e.target as Node)) this.commitToolbarLayout();
      },
      true
    );
    this.setupToolbarArrange(toolbar);
    this.applyToolbarLayout();

    const updateActive = () => {
      validateActiveFormatMode();
      this.updateToolbarActive(listBtn, checkBtn, olBtn);
      this.updateEmbedBtnActive(embedBtn);
      updateFormatBtns();
      this.updateSelectionBtns();
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
      // Reaching for the form is reaching for the view; if the day turned while it sat
      // there, this is a good moment to notice.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
      this.catchUpToToday();
      // The focus() triggered by a format-button click must skip validation: the marker
      // is not before the caret yet and validation would clear the pending mode.
      if (this.skipNextFocusValidation) {
        this.skipNextFocusValidation = false;
        this.updateToolbarActive(listBtn, checkBtn, olBtn);
        this.updateEmbedBtnActive(embedBtn);
        updateFormatBtns();
        this.updateSelectionBtns();
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

    // Indenting an item by hand moves it to another level, so its number has to follow.
    // Held back mid-composition: rewriting the value then would drop the IME's pending text.
    this.textarea.addEventListener("input", (e) => {
      if (e.isComposing) return;
      syncListFormatting(this.textarea);
    });

    // Refresh on both input and compositionend so uncommitted IME text also filters candidates.
    this.textarea.addEventListener("input", () => this.scheduleDraftSave());
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
      // The overflow button carries a margin that sets it apart from the actions beside it.
      // Landing at the start of a wrapped row, that margin indents it past the column the
      // row above stands on. The class takes it back visually only: dropping the margin
      // itself would change the width that decided the wrap, and the two would oscillate.
      const prev = buttons[buttons.length - 2];
      last.toggleClass("wr-toolbar-row-start", last.offsetTop > prev.offsetTop);
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

    this.restoreDraft();
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
    this.setBtnDisabled(this.imageAddBtn, this.pendingImage !== null);
  }

  /**
   * Out-of-reach state for a toolbar button. While the bar is being arranged it is parked
   * rather than applied: a disabled button dispatches no events at all, so it could be
   * neither moved nor switched back on. It is handed back when arranging ends.
   */
  private setBtnDisabled(btn: HTMLButtonElement, disabled: boolean): void {
    if (this.toolbarEditing) {
      if (disabled) btn.setAttr("data-wr-was-disabled", "1");
      else btn.removeAttribute("data-wr-was-disabled");
      return;
    }
    btn.toggleClass("wr-toolbar-disabled", disabled);
    btn.disabled = disabled;
  }

  private updateSubmitBtnState(): void {
    if (!this.submitBtnEl) return;
    const hasContent = this.textarea.value.trim().length > 0 || this.pendingImage !== null;
    this.submitBtnEl.toggleClass("wr-submit-active", hasContent);
  }

  private isEditingTarget(memo: Memo): boolean {
    return this.editingMemo?.time === memo.time;
  }

  private enterEditMode(memo: Memo, filePath: string): void {
    // Stash the draft before clearing the pending image: clearPendingImage only
    // revokes the object URL, the File reference stays valid for the restore.
    this.savedDraft = {
      text: this.textarea.value,
      image: this.pendingImage,
      selStart: this.textarea.selectionStart,
      selEnd: this.textarea.selectionEnd,
    };
    this.clearPendingImage();
    this.editingMemo = { time: memo.time, filePath };
    this.activeFormatMode = null;
    // The caret lands at the end of the recalled text. If that end is a tag, pad
    // it with the same trailing space the tag completion inserts — otherwise the
    // caret would sit inside the tag and pop the suggest dropdown right away.
    // A trailing space is trimmed away on submit, so the content stays intact.
    const content = /#[^\s#]+$/.test(memo.content) ? `${memo.content} ` : memo.content;
    this.textarea.value = content;
    // Order matters: gaining focus momentarily resets the selection to 0 — the
    // first line — and the toolbar state computed at that instant would stick
    // (e.g. a lit list button on a list-starting memo). Place the caret after
    // focus(), then fire input so every dependent state (toolbar highlights,
    // autoGrow, submit button) is recomputed synchronously with the final caret.
    this.textarea.focus();
    this.textarea.selectionStart = this.textarea.selectionEnd = this.textarea.value.length;
    this.textarea.dispatchEvent(new Event("input"));
    this.refreshSubmitButton();
    this.applyEditModeClasses();
  }

  private exitEditMode(): void {
    if (!this.editingMemo) return;
    this.editingMemo = null;
    this.activeFormatMode = null;
    const draft = this.savedDraft;
    this.textarea.value = draft?.text ?? "";
    this.clearPendingImage();
    if (draft?.image) this.setPendingImage(draft.image);
    this.savedDraft = null;
    this.textarea.setCssStyles({ height: "" });
    // Same order as enterEditMode: focus first (gaining focus transiently
    // resets the selection), then restore the draft's caret, then fire input
    // so all dependent state is recomputed with the final caret.
    this.textarea.focus();
    const len = this.textarea.value.length;
    this.textarea.setSelectionRange(
      Math.min(draft?.selStart ?? len, len),
      Math.min(draft?.selEnd ?? len, len)
    );
    this.textarea.dispatchEvent(new Event("input"));
    this.refreshSubmitButton();
    this.applyEditModeClasses();
  }

  // Syncs the editing/locked card classes in place. Rendering also applies them
  // (renderMemoCard reads the state), so this only covers mode changes that
  // happen without a re-render, like entering or cancelling an edit.
  private applyEditModeClasses(): void {
    const editing = this.editingMemo;
    const targetClass = editing
      ? `wr-block-id-wr-${editing.time.replace(/[-:.TZ+]/g, "").slice(0, 17)}`
      : null;
    this.contentEl.querySelectorAll<HTMLElement>(".wr-card").forEach((card) => {
      const isTarget = targetClass !== null && card.classList.contains(targetClass);
      card.classList.toggle("wr-card-editing", isTarget);
      card.classList.toggle("wr-card-menu-locked", editing !== null && !isTarget);
      this.setEditingAccentVars(card, isTarget);
    });
  }

  // Same convention as the quote-jump flash: a tag-rule card with a custom
  // accent carries it as inline CSS vars while highlighted; without them the
  // stylesheet defaults fall back to the theme accent.
  private setEditingAccentVars(card: HTMLElement, editing: boolean): void {
    const ruleClass = Array.from(card.classList).find((c) => /^wr-tag-rule-\d+$/.test(c));
    const accent = editing && ruleClass ? this.plugin.getRuleAccentColor(ruleClass) : null;
    if (accent) {
      const r = parseInt(accent.slice(1, 3), 16);
      const g = parseInt(accent.slice(3, 5), 16);
      const b = parseInt(accent.slice(5, 7), 16);
      card.style.setProperty("--wr-editing-ring-color", `rgba(${r}, ${g}, ${b}, 0.45)`);
      card.style.setProperty("--wr-editing-tint-color", `rgba(${r}, ${g}, ${b}, 0.07)`);
      card.style.setProperty("--wr-editing-accent", accent);
    } else {
      card.style.removeProperty("--wr-editing-ring-color");
      card.style.removeProperty("--wr-editing-tint-color");
      card.style.removeProperty("--wr-editing-accent");
    }
  }

  // The folder attached images go to, or undefined to leave the choice to Obsidian's
  // own attachment setting.
  private attachmentFolder(): string | undefined {
    const { useCustomAttachmentFolder, attachmentFolder } = this.plugin.settings;
    return useCustomAttachmentFolder ? attachmentFolder : undefined;
  }

  // Writes the edited body back into the original memo block. The opening fence
  // line is untouched, so the timestamp and any block ID survive and quotes or
  // pins referencing this memo keep resolving.
  private async applyEdit(rawText: string): Promise<void> {
    const target = this.editingMemo;
    if (!target) return;
    const file = this.app.vault.getAbstractFileByPath(target.filePath);
    if (!(file instanceof TFile)) {
      // The target file is gone; nothing to write. Leaving edit mode restores
      // the draft, and the edited text was theirs to begin with.
      this.exitEditMode();
      return;
    }
    try {
      let bodyText = rawText;
      if (this.pendingImage) {
        const savedFile = await saveImageToVault(
          this.app,
          this.pendingImage,
          file,
          this.attachmentFolder()
        );
        const embed = buildEmbedLink(savedFile);
        bodyText = insertEmbedAboveBottomBlock(bodyText, embed);
      }

      this.markOwnWrite();
      await updateMemo(this.app, file, target.time, bodyText);

      if (this.plugin.settings.tagSuggestEnabled) {
        const usedTags = extractTagsForHistory(rawText);
        if (usedTags.length > 0) {
          this.plugin.recentTags = mergeRecentTags(this.plugin.recentTags, usedTags);
          await this.plugin.saveRecentTags();
        }
      }

      this.exitEditMode();
      await this.refresh();
    } catch {
      // Stay in edit mode so the typed text is not lost; the user can retry.
    }
  }

  async submitMemo(): Promise<void> {
    if (this.toolbarEditing) return;
    // The post keeps whatever was typed: a decoration left open stays open, rather than
    // being closed on the author's behalf at the end of the text.
    this.activeFormatMode = null;
    const rawText = this.textarea.value.trim().replace(/＃/g, "#");
    if (!rawText && !this.pendingImage) return;

    if (this.editingMemo) {
      await this.applyEdit(rawText);
      return;
    }

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
        const savedFile = await saveImageToVault(
          this.app,
          this.pendingImage,
          file,
          this.attachmentFolder()
        );
        const embed = buildEmbedLink(savedFile);
        bodyText = insertEmbedAboveBottomBlock(bodyText, embed);
      }

      this.markOwnWrite();
      const postedTime = await appendMemo(this.app, file, bodyText);

      // The armed day lands on the post the moment it exists. Its place was taken
      // when it was armed, so there is nothing left to check here.
      if (this.armedSchedule) {
        const settings = this.plugin.settings;
        settings.scheduledPins = [
          { timestamp: postedTime, file: file.path, from: this.armedSchedule },
          ...(settings.scheduledPins ?? []),
        ];
        await this.plugin.savePins();
        this.setArmedSchedule(null);
      }

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
      await this.plugin.saveDraft("");
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
    // Past both skips above, so this render is going to happen: record the day now rather
    // than at the end, where the "no note for this date" branch returns early.
    this.lastRenderedDay = moment().format("YYYY-MM-DD");
    try {
      const isToday = this.currentDate.isSame(moment(), "day");
      const dateText = this.currentDate.format(this.plugin.settings.headerDateFormat);
      this.dateLabel.setText(isToday ? `${dateText}${t("view.dateNav.todaySuffix")}` : dateText);

      // Resolve pins first; they render at the top independent of the current date.
      // Scheduled pins whose day has come join them, below the ones pinned by hand:
      // those arrive on their own, so keeping them out of the manual order means the
      // top of the section stays as it was left.
      const { pins, scheduledPins } = this.plugin.settings;
      const arrived: ScheduledPinEntry[] = [];
      const notYet: ScheduledPinEntry[] = [];
      for (const entry of scheduledPins ?? []) {
        if (this.isScheduleDue(entry)) arrived.push(entry);
        else notYet.push(entry);
      }
      const byHand = await this.resolvePinEntries(pins);
      const bySchedule = await this.resolvePinEntries(arrived);
      // Waiting pins are read only to learn whether their memo still exists.
      const byWait = await this.resolvePinEntries(notYet);
      const pinnedResolved = [
        ...byHand.resolved.map((p) => ({ ...p, fromSchedule: false })),
        ...bySchedule.resolved.map((p) => ({ ...p, fromSchedule: true })),
      ];
      // Pins whose note is missing are not stale: the note may still be arriving through sync.
      const stale = new Set([...byHand.stale, ...bySchedule.stale, ...byWait.stale]);
      const waiting = new Set(
        notYet.filter((e) => !stale.has(e)).map((e) => pinKey(e.file, e.timestamp))
      );
      if (stale.size > 0) {
        const settings = this.plugin.settings;
        settings.pins = settings.pins.filter((p) => !stale.has(p));
        settings.scheduledPins = (settings.scheduledPins ?? []).filter((p) => !stale.has(p));
        await this.plugin.savePins();
        this.setArmedSchedule(this.armedSchedule);
      }
      const pinnedKeys = new Set(pinnedResolved.map((p) => pinKey(p.filePath, p.memo.time)));

      const file = getDailyNoteFile(
        this.app,
        this.currentDate
      );
      // Read from disk: on mobile the cache can still hold the note as it was before sync.
      const content = file ? await this.app.vault.read(file) : null;

      // Every read is done; the list is only now emptied so it is never blank while waiting.
      this.listContainer.empty();
      this.clearPinnedContainer();
      for (const { memo, filePath, fromSchedule } of pinnedResolved) {
        this.renderMemoCard(memo, { pinned: true, filePath, fromSchedule });
      }

      if (!file || content === null) {
        if (pinnedResolved.length === 0) this.renderEmptyState();
        return;
      }

      const memos = parseMemos(content);

      let rendered = 0;
      for (const memo of memos) {
        const key = pinKey(file.path, memo.time);
        if (pinnedKeys.has(key)) continue;
        // Pinned memos above are deliberately exempt: pinning names a single memo,
        // which outranks a rule that hides a whole tag.
        if (this.plugin.isHiddenFromTimeline(memo.tags)) continue;
        this.renderMemoCard(memo, {
          pinned: false,
          filePath: file.path,
          waitingSchedule: waiting.has(key),
        });
        rendered++;
      }

      // Covers both "the note has no memos" and "every memo is hidden by a rule":
      // the same message reads for either, and the list never ends up blank.
      if (pinnedResolved.length === 0 && rendered === 0) this.renderEmptyState();
    } finally {
      // Pins may have been added or taken down; the arm button's reach follows them.
      this.setArmedSchedule(this.armedSchedule);
      this.refreshing = false;
      await this.releaseEditModeIfTargetGone().catch(() => {});
      if (this.refreshQueued) {
        this.refreshQueued = false;
        // eslint-disable-next-line @typescript-eslint/no-floating-promises -- replay must not alter this call's result
        this.refresh();
      }
    }
  }

  // While editing, watch the target memo: if it vanished (deleted or rewritten
  // externally), release the mode quietly but keep every character the user
  // typed — the edit buffer stays in the textarea, the stashed draft is
  // appended after it.
  private async releaseEditModeIfTargetGone(): Promise<void> {
    const target = this.editingMemo;
    if (!target) return;
    const file = this.app.vault.getAbstractFileByPath(target.filePath);
    let alive = false;
    if (file instanceof TFile) {
      const content = await this.app.vault.cachedRead(file);
      alive = parseMemos(content).some((m) => m.time === target.time);
    }
    if (alive) return;
    const typed = this.textarea.value;
    const draft = this.savedDraft?.text ?? "";
    const draftImage = this.savedDraft?.image ?? null;
    this.editingMemo = null;
    this.savedDraft = null;
    this.textarea.value = typed && draft ? `${typed}\n\n${draft}` : typed || draft;
    if (draftImage && !this.pendingImage) this.setPendingImage(draftImage);
    this.textarea.dispatchEvent(new Event("input"));
    this.refreshSubmitButton();
    this.applyEditModeClasses();
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

  // `stale`: entries whose note was read but no longer holds the memo.
  private async resolvePinEntries<T extends PinEntry>(
    pins: T[] | undefined
  ): Promise<{ resolved: { memo: Memo; filePath: string }[]; stale: T[] }> {
    const resolved: { memo: Memo; filePath: string }[] = [];
    const stale: T[] = [];
    if (!pins || pins.length === 0) return { resolved, stale };

    const seenFiles = new Map<string, Memo[] | null>();

    for (const pin of pins) {
      let memos = seenFiles.get(pin.file);
      if (memos === undefined) {
        const file = this.app.vault.getAbstractFileByPath(pin.file);
        if (!(file instanceof TFile)) {
          seenFiles.set(pin.file, null);
          continue;
        }
        // From disk, not the cache: a stale cache after sync would prune a live pin.
        const content = await this.app.vault.read(file);
        memos = parseMemos(content);
        seenFiles.set(pin.file, memos);
      }
      if (!memos) continue;
      const memo = memos.find((m) => m.time === pin.timestamp);
      if (memo) {
        resolved.push({ memo, filePath: pin.file });
      } else {
        stale.push(pin);
      }
    }

    return { resolved, stale };
  }

  private isPinned(memo: Memo, filePath: string): boolean {
    return this.plugin.settings.pins.some((p) => matchesPin(p, memo, filePath));
  }

  /** The scheduled pin on this memo, whether its day has come or not. */
  private findScheduledPin(memo: Memo, filePath: string): ScheduledPinEntry | undefined {
    return (this.plugin.settings.scheduledPins ?? []).find((p) => matchesPin(p, memo, filePath));
  }

  /**
   * How much of the scheduled allowance is spoken for. A day armed on the post being
   * written holds a place of its own: it is claimed the moment it is armed, so the
   * post it was armed for cannot find the allowance gone by the time it is written.
   */
  private scheduledClaimCount(): number {
    return (this.plugin.settings.scheduledPins?.length ?? 0) + (this.armedSchedule ? 1 : 0);
  }

  /** Whether a scheduled pin's day has arrived. Compared by day, never by clock time. */
  private isScheduleDue(entry: ScheduledPinEntry): boolean {
    return moment(entry.from, "YYYY-MM-DD").isSameOrBefore(moment(), "day");
  }

  private async cleanupOrphanPins(): Promise<boolean> {
    const settings = this.plugin.settings;
    const cache = new Map<string, Memo[] | null>();
    // One cache across both lists: the same note commonly holds pins of either kind.
    const alive = async (pin: PinEntry): Promise<boolean> => {
      let memos = cache.get(pin.file);
      if (memos === undefined) {
        const file = this.app.vault.getAbstractFileByPath(pin.file);
        if (!(file instanceof TFile)) {
          cache.set(pin.file, null);
          return false;
        }
        const content = await this.app.vault.cachedRead(file);
        memos = parseMemos(content);
        cache.set(pin.file, memos);
      }
      return memos !== null && memos.some((m) => m.time === pin.timestamp);
    };

    const survivingPins: PinEntry[] = [];
    for (const pin of settings.pins) {
      if (await alive(pin)) survivingPins.push(pin);
    }
    const survivingScheduled: ScheduledPinEntry[] = [];
    for (const pin of settings.scheduledPins ?? []) {
      if (await alive(pin)) survivingScheduled.push(pin);
    }

    const changed =
      survivingPins.length !== settings.pins.length ||
      survivingScheduled.length !== (settings.scheduledPins?.length ?? 0);
    if (!changed) return false;
    settings.pins = survivingPins;
    settings.scheduledPins = survivingScheduled;
    await this.plugin.savePins();
    return true;
  }

  private async addPin(memo: Memo, filePath: string): Promise<void> {
    await this.cleanupOrphanPins();
    const limit = this.plugin.settings.pinLimit;
    if (this.plugin.settings.pins.length >= limit) return;
    if (this.isPinned(memo, filePath) || this.findScheduledPin(memo, filePath)) return;
    this.plugin.settings.pins = [
      { timestamp: memo.time, file: filePath },
      ...this.plugin.settings.pins,
    ];
    await this.plugin.savePins();
    await this.refresh();
  }

  private async addScheduledPin(memo: Memo, filePath: string, from: string): Promise<void> {
    await this.cleanupOrphanPins();
    const settings = this.plugin.settings;
    if (this.scheduledClaimCount() >= settings.pinLimit) return;
    if (this.isPinned(memo, filePath) || this.findScheduledPin(memo, filePath)) return;
    settings.scheduledPins = [
      { timestamp: memo.time, file: filePath, from },
      ...(settings.scheduledPins ?? []),
    ];
    await this.plugin.savePins();
    await this.refresh();
  }

  // Clears the memo from both lists: once a scheduled pin has arrived it is just a
  // pin, and taking it down is the same gesture as unpinning one placed by hand.
  private async removePin(memo: Memo, filePath: string): Promise<void> {
    const settings = this.plugin.settings;
    const before = settings.pins.length + (settings.scheduledPins?.length ?? 0);
    settings.pins = settings.pins.filter((p) => !matchesPin(p, memo, filePath));
    settings.scheduledPins = (settings.scheduledPins ?? []).filter(
      (p) => !matchesPin(p, memo, filePath)
    );
    if (settings.pins.length + settings.scheduledPins.length !== before) {
      await this.plugin.savePins();
    }
    await this.cleanupOrphanPins();
    await this.refresh();
  }

  // The delete confirm outlives the menu it was armed in, so a native menu —
  // which cannot be reworded in place — can carry the first press over into a
  // second opening. Expires on its own so an abandoned confirm never lingers.
  private armDelete(memo: Memo, onExpire?: () => void): void {
    this.clearDeleteArm();
    this.deleteArmedTime = memo.time;
    this.deleteArmTimer = window.setTimeout(() => {
      this.deleteArmedTime = null;
      this.deleteArmTimer = null;
      onExpire?.();
    }, 3000);
  }

  private clearDeleteArm(): void {
    if (this.deleteArmTimer !== null) {
      window.clearTimeout(this.deleteArmTimer);
      this.deleteArmTimer = null;
    }
    this.deleteArmedTime = null;
  }

  private isDeleteArmed(memo: Memo): boolean {
    return this.deleteArmedTime === memo.time;
  }

  // Removes the memo's block from its note. Deliberately silent: the card
  // disappearing is the success signal, and it staying put is the failure one,
  // matching how editing reports itself.
  private async deletePost(memo: Memo, filePath: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file instanceof TFile) {
      try {
        this.markOwnWrite();
        const removed = await deleteMemo(this.app, file, memo.time, memo.lineStart);
        if (removed) {
          // Quote cards read a per-file memo cache; drop it so this refresh
          // cannot repaint a quote of the memo we just removed.
          invalidateMemoCache(file.path);
          const settings = this.plugin.settings;
          const before = settings.pins.length + (settings.scheduledPins?.length ?? 0);
          settings.pins = settings.pins.filter((p) => !matchesPin(p, memo, file.path));
          settings.scheduledPins = (settings.scheduledPins ?? []).filter(
            (p) => !matchesPin(p, memo, file.path)
          );
          if (settings.pins.length + settings.scheduledPins.length !== before) {
            await this.plugin.savePins();
          }
        }
      } catch {
        // Nothing was removed; the card stays and the user can retry.
      }
    }
    // A pinned memo can live outside the current note, so the other leaves
    // would filter away the modify event that should refresh them.
    this.plugin.refreshViews();
  }

  // Last year a memo can be sent to. Far enough that the drum never feels like it
  // runs out under the finger.
  private static readonly SCHEDULE_LAST_YEAR = 2099;

  /**
   * The day is rolled to rather than picked off a grid or typed: a scheduled day is
   * usually one nobody has the date of in their head, so reaching it by eye beats
   * both aiming at a cramped month grid and counting the date out to type it.
   *
   * The menu is only the shell — Obsidian places it beside the button on desktop and
   * raises it from the bottom of the screen on mobile, so a card near the end of the
   * timeline can still reach it, which an anchored popover could not.
   */
  private openSchedulePicker(
    trigger: HTMLElement,
    evt: MouseEvent,
    memo: Memo | null,
    onPick: (from: string) => void
  ): void {
    const earliest = moment().add(1, "day").startOf("day");
    // Only a card's picker locks the timeline behind it. Armed from the toolbar there
    // is no card yet, so there is nothing for the other cards to be locked out of.
    if (memo) this.beginScheduling(memo);
    // Closing puts the trigger's light out, which for the toolbar button is the light
    // that says a day is armed. Restore it once the picker is gone.
    const afterClose = () => {
      this.endScheduling();
      this.setArmedSchedule(this.armedSchedule);
    };
    // Touch rolls; a pointer clicks. On desktop the month grid is quicker to aim at
    // and there is room beside the button to hang it, so the drums are the mobile
    // and tablet shape only.
    if (!Platform.isMobile) {
      this.schedulePopover?.close();
      // The card menu is still closing as its item fires, and its own hide handler
      // puts the button's lit state out. Light it again once that has run: the
      // picker is still the same card's.
      window.setTimeout(() => trigger.toggleClass("wr-toolbar-active", true), 0);
      // The popover is placed once, against the button's position at the time, so the
      // list is held still while it is open — scrolling either way would slide the
      // card out from under it. Before locking, the list is sent down far enough for
      // the whole calendar to clear the bottom edge, which a card near the end of the
      // timeline never does on its own.
      const fitIntoView = () => {
        const popover = this.schedulePopover;
        if (!popover) return;
        const overflow =
          popover.el.getBoundingClientRect().bottom -
          this.contentEl.getBoundingClientRect().bottom +
          8;
        if (overflow > 0) {
          // The last card in the timeline has no scroll left underneath it, so the
          // room is made rather than found: the list grows a floor of empty space for
          // as long as the calendar is open. Opening upward instead would put the
          // calendar over the very post the day is being chosen for.
          // The floor's height is measured, so it is the one value that has to be
          // written as a property rather than carried by a class.
          this.listContainer.setCssProps({ "--wr-list-floor": `${overflow}px` });
          this.listContainer.scrollTop += overflow;
          popover.reposition();
        }
        // Held by refusing the scroll outright rather than by putting it back: undoing
        // each frame fights the momentum and the list shudders.
        this.listContainer.addClass("wr-list-held");
      };
      this.schedulePickerAnchor = trigger;
      const form = trigger.closest<HTMLElement>(".wr-input-area") ?? undefined;
      this.schedulePopover = openCalendarPopover({
        anchor: trigger,
        alignTo: form,
        container: this.contentEl,
        initialDate: earliest,
        minDate: earliest,
        onSelect: (date) => onPick(date.format("YYYY-MM-DD")),
        onClose: () => {
          this.listContainer.removeClass("wr-list-held");
          this.listContainer.setCssProps({ "--wr-list-floor": "0px" });
          this.schedulePopover = null;
          this.schedulePickerAnchor = null;
          trigger.toggleClass("wr-toolbar-active", false);
          afterClose();
        },
      });
      // The handle has to exist before the fit can measure it, and the popover needs
      // a frame on screen before its box is worth measuring.
      window.requestAnimationFrame(fitIntoView);
      // The pane can be dragged with the calendar still open, and one left behind reads as
      // belonging to nothing. Checked per frame for the same reason the menu is: the pane
      // divider moves the form without resizing anything the popover can observe. The loop
      // ends when this popover does.
      if (form) {
        const handle = this.schedulePopover;
        let lastRight = Number.NaN;
        let lastBottom = Number.NaN;
        const track = () => {
          if (this.schedulePopover !== handle) return;
          const right = form.getBoundingClientRect().right;
          const bottom = trigger.getBoundingClientRect().bottom;
          if (right !== lastRight || bottom !== lastBottom) {
            lastRight = right;
            lastBottom = bottom;
            handle.reposition();
          }
          window.requestAnimationFrame(track);
        };
        window.requestAnimationFrame(track);
      }
      return;
    }
    this.openMenu(
      trigger,
      (menu) => {
        let chosen = earliest.clone();
        let confirmItem: MenuItem | null = null;
        const renderChosen = () => {
          confirmItem?.setTitle(chosen.format(this.plugin.settings.headerDateFormat));
        };

        menu.addItem((item) => {
          const itemDom = (item as { dom?: HTMLElement }).dom;
          if (!itemDom) return;
          // The row is only a mounting point; its menu-item behaviour is dropped so
          // rolling a drum cannot dismiss the menu out from under the finger.
          itemDom.empty();
          itemDom.className = "wr-menu-drum";
          itemDom.addEventListener("click", (e) => e.stopPropagation());
          buildDateDrum(itemDom, {
            earliest,
            lastYear: WrotView.SCHEDULE_LAST_YEAR,
            onChange: (date) => {
              chosen = date;
              renderChosen();
            },
          });
        });

        menu.addItem((item) => {
          confirmItem = item;
          (item as { dom?: HTMLElement }).dom?.classList.add("wr-menu-schedule-confirm");
          item.setIcon("clock-fading").onClick(() => {
            onPick(chosen.format("YYYY-MM-DD"));
          });
          renderChosen();
        });
      },
      evt,
      0,
      afterClose,
      // A tablet rolls the drums like a phone but hangs the menu beside the button like a
      // desktop, so it is the one shape that can be lined up with the form the way the
      // overflow menu is. A phone raises the menu from the bottom edge and has nothing to
      // line up; a card has no form around it either.
      Platform.isTablet && trigger.closest(".wr-input-area") !== null
    );
  }

  // The armed day lives on the toolbar button and nowhere else: lit means the post
  // being written carries one. Its tooltip names the day, for anyone who wants to
  // check without taking it off.
  private setArmedSchedule(from: string | null): void {
    this.armedSchedule = from;
    if (!this.scheduleArmBtn) return;
    this.scheduleArmBtn.toggleClass("wr-toolbar-active", from !== null);
    // Out of reach while an edit is running — that rewrites a post which already
    // exists, and its day is set from its own card — and while the allowance is
    // full, since there would be nowhere for the armed day to land. A day already
    // armed keeps the button live: taking it back off has to stay possible.
    const full = this.scheduledClaimCount() >= this.plugin.settings.pinLimit;
    this.setBtnDisabled(
      this.scheduleArmBtn,
      this.editingMemo !== null || (full && from === null)
    );
    this.scheduleArmBtn.setAttr(
      "aria-label",
      from
        ? moment(from, "YYYY-MM-DD").format(this.plugin.settings.headerDateFormat)
        : t("view.postMenu.schedulePin")
    );
  }

  private beginScheduling(memo: Memo): void {
    this.schedulingTime = memo.time;
    this.applySchedulingClasses();
  }

  private endScheduling(): void {
    if (!this.schedulingTime) return;
    this.schedulingTime = null;
    this.applySchedulingClasses();
  }

  private applySchedulingClasses(): void {
    const time = this.schedulingTime;
    const targetClass = time
      ? `wr-block-id-wr-${time.replace(/[-:.TZ+]/g, "").slice(0, 17)}`
      : null;
    this.contentEl.querySelectorAll<HTMLElement>(".wr-card").forEach((card) => {
      const isTarget = targetClass !== null && card.classList.contains(targetClass);
      card.classList.toggle("wr-card-menu-locked", time !== null && !isTarget);
    });
  }

  private renderMemoCard(
    memo: Memo,
    options: {
      pinned: boolean;
      filePath: string;
      waitingSchedule?: boolean;
      fromSchedule?: boolean;
    }
  ): void {
    const host = options.pinned
      ? this.ensurePinnedContainer()
      : this.listContainer;
    const card = host.createDiv({ cls: "wr-card" });
    if (options.pinned) card.classList.add("wr-card-pinned");
    const T = memo.time.replace(/[-:.TZ+]/g, "").slice(0, 17);
    card.classList.add(`wr-block-id-wr-${T}`);
    // State-driven so the classes survive any full re-render during an edit.
    if (this.isEditingTarget(memo)) card.classList.add("wr-card-editing");
    else if (this.editingMemo) card.classList.add("wr-card-menu-locked");
    const rule = this.plugin.findTagColorRule(memo.tags);
    if (rule) {
      const idx = this.plugin.settings.tagColorRules.indexOf(rule);
      if (idx >= 0) card.classList.add(`wr-tag-rule-${idx}`);
    }
    // After the rule class: the accent vars are resolved from it.
    if (this.isEditingTarget(memo)) this.setEditingAccentVars(card, true);

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
    // Named so the delete confirm can re-open the menu on itself: with native
    // menus there is no row to rewrite in place, so the second state has to be a
    // second opening.
    const openPostMenu = async (e: MouseEvent): Promise<void> => {
      // While editing, every other card's menu is locked; only the card being
      // edited keeps its menu (it carries the cancel action).
      if (this.editingMemo && !this.isEditingTarget(memo)) return;
      // Same while a day is being chosen: the picker belongs to one card, and the
      // menu behind it stays that card's.
      if (this.schedulingTime && this.schedulingTime !== memo.time) return;
      // Drop orphaned pins before evaluating the pin limit.
      await this.cleanupOrphanPins();
      const pinned = this.isPinned(memo, options.filePath);
      const scheduled = this.findScheduledPin(memo, options.filePath);
      // An arrived schedule is a pin in every way the menu cares about.
      const onBoard = pinned || (scheduled !== undefined && this.isScheduleDue(scheduled));
      const pinLimit = this.plugin.settings.pinLimit;
      const claimed = pinned || scheduled !== undefined;
      const limitReached = !claimed && this.plugin.settings.pins.length >= pinLimit;
      const scheduleLimitReached = !claimed && this.scheduledClaimCount() >= pinLimit;
      this.openMenu(menuBtn, (menu) => {
        menu.addItem((item) =>
          item.setTitle(t("view.postMenu.copy")).setIcon("copy").onClick(async () => {
            await navigator.clipboard.writeText(memo.content);
          })
        );
        menu.addItem((item) => {
          item.setTitle(t("view.postMenu.quotePost")).setIcon("quote").onClick(() => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
            this.insertQuoteToForm(memo, options.filePath);
          });
          // Quoting writes into the form, which would clobber the edit in progress.
          if (this.isEditingTarget(memo)) item.setDisabled(true);
        });
        if (this.isEditingTarget(memo)) {
          menu.addItem((item) =>
            item.setTitle(t("view.postMenu.cancelEdit")).setIcon("pencil-off").onClick(() => {
              this.exitEditMode();
            })
          );
        } else {
          menu.addItem((item) =>
            item.setTitle(t("view.postMenu.edit")).setIcon("pencil").onClick(() => {
              this.enterEditMode(memo, options.filePath);
            })
          );
        }
        // Menu groups: text actions, placement, then delete.
        menu.addSeparator();
        const addLimitHint = () => {
          menu.addItem((item) => {
            item.setTitle(t("view.postMenu.pinLimitHint", { limit: pinLimit })).setDisabled(true);
            const itemDom = (item as { dom?: HTMLElement }).dom;
            itemDom?.classList.add("wr-menu-hint", "is-label");
          });
        };
        // Taking a pin down is worded the same whether it is already up or still
        // waiting for its day: one gesture, one name. A memo still waiting is offered
        // nothing else — changing the day means taking it down and setting it again,
        // which keeps this menu the same height as every other card's.
        // An edit in progress puts the whole group out of reach: an edit and a day
        // being chosen both take over the card, and holding one while starting the
        // other only muddles which of them the card is currently in.
        const editingThis = this.isEditingTarget(memo);
        if (onBoard || scheduled) {
          menu.addItem((item) => {
            item.setTitle(t("view.postMenu.unpin")).setIcon("pin-off").onClick(async () => {
              if (editingThis) return;
              await this.removePin(memo, options.filePath);
            });
            if (editingThis) item.setDisabled(true);
          });
        } else {
          menu.addItem((item) => {
            item.setTitle(t("view.postMenu.pin")).setIcon("pin").onClick(async () => {
              if (limitReached || editingThis) return;
              await this.addPin(memo, options.filePath);
            });
            if (limitReached || editingThis) item.setDisabled(true);
          });
          if (limitReached && !editingThis) addLimitHint();
          menu.addItem((item) => {
            item
              .setTitle(t("view.postMenu.schedulePin"))
              .setIcon("clock-fading")
              .onClick(() => {
                if (scheduleLimitReached || editingThis) return;
                this.openSchedulePicker(menuBtn, e, memo, (from) => {
                  // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure leaves the memo unscheduled
                  this.addScheduledPin(memo, options.filePath, from);
                });
              });
            if (scheduleLimitReached || editingThis) item.setDisabled(true);
          });
          if (scheduleLimitReached && !editingThis) addLimitHint();
        }
        // Deleting is irreversible and there is no undo, so the item only exists
        // once it has been asked for in the settings, and then only fires on the
        // second press. Last and below a separator, like Obsidian's own file menu.
        if (this.plugin.settings.showPostDelete) {
          menu.addSeparator();
          menu.addItem((item) => {
            // Three ways a memo is out of reach: it is the one being edited
            // ("Cancel edit" sits one item above), it is pinned (unpin first —
            // pinning is what marks a memo worth keeping), or one of its tags
            // carries a rule that protects it.
            // A scheduled memo counts as claimed too: deleting it would take the
            // reservation with it, before the day it was made for ever arrives.
            const locked =
              this.isEditingTarget(memo) ||
              claimed ||
              this.plugin.isProtectedFromDelete(memo.tags);
            // Armed already when a previous opening took the first press.
            let armed = this.isDeleteArmed(memo);
            item
              .setTitle(t(armed ? "view.postMenu.deleteConfirm" : "view.postMenu.delete"))
              .setIcon("trash-2")
              .setWarning(true);
            if (locked) item.setDisabled(true);

            const itemDom = (item as { dom?: HTMLElement }).dom;
            // Marks the row for the mobile press-state reset: this is the one
            // menu item that outlives its own press, so the stuck touch state
            // has to be neutralised for good, not only while armed.
            itemDom?.classList.add("wr-menu-delete");

            // Menus built from DOM close themselves on a click, so the first
            // press is swallowed here in the capture phase and the row is
            // reworded in place. The second press falls through to onClick.
            itemDom?.addEventListener(
              "click",
              (ev) => {
                if (locked || armed) return;
                ev.preventDefault();
                ev.stopPropagation();
                armed = true;
                this.armDelete(memo, () => {
                  armed = false;
                  item.setTitle(t("view.postMenu.delete"));
                });
                item.setTitle(t("view.postMenu.deleteConfirm"));
              },
              true
            );

            item.onClick(() => {
              // Arriving here unarmed means the handler above never ran: native
              // menus have no row to reword, so the confirm becomes a second
              // opening of the menu instead.
              if (!armed) {
                this.armDelete(memo);
                // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; a failure just leaves the menu closed
                openPostMenu(e);
                return;
              }
              this.clearDeleteArm();
              // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; the card staying put is the failure signal
              this.deletePost(memo, options.filePath);
            });
          });
        }
      }, e);
    };

    menuBtn.addEventListener("click", (e) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; a failure just leaves the menu closed
      openPostMenu(e);
    });

    if (options.pinned) {
      const pinIndicator = card.createSpan({ cls: "wr-pin-indicator" });
      // Solid pin = arrived from a schedule; the two kinds spend separate allowances.
      if (options.fromSchedule) pinIndicator.addClass("wr-pin-indicator-filled");
      setIcon(pinIndicator, "pin");
    } else if (options.waitingSchedule) {
      const scheduleIndicator = card.createSpan({
        cls: "wr-pin-indicator wr-schedule-indicator",
      });
      setIcon(scheduleIndicator, "clock-fading");
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
    this.markOwnWrite();
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

  /**
   * Actions currently off the bar, in the menu's own order rather than the bar's. Where a
   * button sat before it was put away says nothing about where it is easiest to find here.
   */
  private hiddenActions(): ToolbarAction[] {
    const hidden = new Set(
      this.toolbarLayout.filter((slot) => !slot.shown).map((slot) => slot.id)
    );
    return this.toolbarActions.filter((action) => hidden.has(action.id));
  }

  /**
   * Draws the bar from the saved list. While arranging, every action is on the bar so the
   * whole set can be seen at once; the hidden ones just read as dimmed. The overflow button
   * is appended last either way, which is what keeps it in the same corner throughout.
   */
  applyToolbarLayout(): void {
    const toolbar = this.toolbarEl;
    if (!toolbar || !this.formatBtnEl) return;
    // Arranging turned off underfoot: let go of the bar, which draws it again on the way.
    if (this.toolbarEditing && !this.plugin.settings.toolbarEditEnabled) {
      this.setToolbarEditing(false);
      return;
    }
    if (!this.toolbarEditing) {
      this.toolbarLayout = resolveToolbarLayout(this.plugin.settings.toolbarLayout);
    }
    for (const slot of this.toolbarLayout) {
      const btn = this.toolbarBtns.get(slot.id);
      if (!btn) continue;
      if (slot.shown || this.toolbarEditing) toolbar.appendChild(btn);
      else btn.detach();
      btn.toggleClass("wr-toolbar-off", this.toolbarEditing && !slot.shown);
    }
    if (this.toolbarDoneBtnEl) {
      if (this.toolbarEditing) toolbar.appendChild(this.toolbarDoneBtnEl);
      else this.toolbarDoneBtnEl.detach();
    }
    toolbar.appendChild(this.formatBtnEl);
    toolbar.toggleClass("wr-toolbar-editing", this.toolbarEditing);
    this.updateSelectionBtns();
    this.dropPendingModeIfHidden();
  }

  /**
   * A pending mode is only readable while its button is on the bar to light. Putting that
   * button away ends the mode rather than leaving it running out of sight — the marker
   * already written stays in the text, which is what a closing press would have left too.
   */
  private dropPendingModeIfHidden(): void {
    for (const action of this.toolbarActions) {
      if (!action.pendingMode) continue;
      const btn = this.toolbarBtns.get(action.id);
      if (!btn) continue;
      if (!btn.parentElement) {
        if (this.activeFormatMode === action.id) this.activeFormatMode = null;
        btn.removeClass("wr-toolbar-active");
        btn.removeClass("wr-toolbar-ime-muted");
      }
    }
  }

  /** Insertion needs something to wrap, so those buttons stay out of reach without a selection. */
  private updateSelectionBtns(): void {
    const empty = this.textarea
      ? this.textarea.selectionStart === this.textarea.selectionEnd
      : true;
    for (const action of this.toolbarActions) {
      if (!action.needsSelection) continue;
      const btn = this.toolbarBtns.get(action.id);
      if (btn) this.setBtnDisabled(btn, empty);
    }
  }

  private setToolbarEditing(on: boolean): void {
    if (on && (this.editingMemo || !this.plugin.settings.toolbarEditEnabled)) return;
    if (this.toolbarEditing === on) return;
    this.toolbarEditing = on;
    // A disabled button dispatches nothing at all, so it could neither be moved nor
    // switched back on; the state is parked for the duration and handed straight back.
    for (const btn of this.toolbarBtns.values()) {
      if (on) {
        if (btn.disabled) btn.setAttr("data-wr-was-disabled", "1");
        btn.disabled = false;
        btn.removeClass("wr-toolbar-disabled");
      } else if (btn.getAttribute("data-wr-was-disabled")) {
        btn.removeAttribute("data-wr-was-disabled");
        btn.disabled = true;
        btn.addClass("wr-toolbar-disabled");
      }
    }
    this.contentEl.toggleClass("wr-toolbar-arranging", on);
    if (this.textarea) this.textarea.readOnly = on;
    if (this.formatBtnEl) {
      setIcon(this.formatBtnEl, on ? "x" : "ellipsis");
      this.formatBtnEl.setAttr(
        "aria-label",
        on ? t("view.toolbarEdit.cancel") : t("view.toolbarAction.more")
      );
    }
    this.applyToolbarLayout();
  }

  /** Keeps what was arranged. Backing out instead simply leaves the saved layout alone. */
  private commitToolbarLayout(): void {
    this.plugin.settings.toolbarLayout = this.toolbarLayout.map((slot) => ({ ...slot }));
    // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; the bar is already drawn from it
    this.plugin.saveToolbarLayout();
    this.setToolbarEditing(false);
  }

  /**
   * Arranging happens on the bar itself: a press that stays put switches an action on or
   * off, and one that travels carries the button to a new place.
   *
   * A travelling button leaves the row and follows the finger, and an empty place is left
   * standing where it was. That place is what moves as the finger passes over the others —
   * they step aside around it — so where the button came from, where it would land and
   * where it finally settled are all on screen the whole time. Pointer events rather than
   * native drag, which mobile never delivers.
   */
  private setupToolbarArrange(toolbar: HTMLElement): void {
    let held: HTMLElement | null = null;
    let gap: HTMLElement | null = null;
    let moved = false;
    let startX = 0;
    let startY = 0;
    // Where inside the button the finger took hold, so it stays under that same spot.
    let grabX = 0;
    let grabY = 0;

    const lift = (btn: HTMLElement) => {
      const box = btn.getBoundingClientRect();
      gap = createDiv({ cls: "wr-toolbar-gap" });
      gap.setCssStyles({ width: `${box.width}px`, height: `${box.height}px` });
      toolbar.insertBefore(gap, btn);
      btn.addClass("wr-toolbar-dragging");
      // Out of flow, so the row closes up and only the gap holds a place. Its own size has
      // to be restated: nothing is laying it out any more. Deaf to the pointer as well, or
      // it would be the thing found under the finger instead of what it is passing over.
      btn.setCssStyles({
        position: "fixed",
        left: `${box.left}px`,
        top: `${box.top}px`,
        width: `${box.width}px`,
        height: `${box.height}px`,
        pointerEvents: "none",
      });
      // Carried on the document rather than left in the bar: a transformed ancestor — which
      // mobile puts around panes — makes a fixed child measure from that ancestor instead of
      // the screen, and the button would then sit well away from the finger holding it.
      activeDocument.body.appendChild(btn);
    };

    const drop = (btn: HTMLElement) => {
      btn.removeClass("wr-toolbar-dragging");
      btn.setCssStyles({
        position: "",
        left: "",
        top: "",
        width: "",
        height: "",
        pointerEvents: "",
      });
      if (gap) {
        toolbar.insertBefore(btn, gap);
        gap.remove();
        gap = null;
      }
    };

    this.registerDomEvent(toolbar, "pointerdown", (e: PointerEvent) => {
      if (!this.toolbarEditing) return;
      const btn = (e.target as HTMLElement | null)?.closest<HTMLElement>(".wr-toolbar-btn");
      // The two ways out of arranging are not part of what is being arranged.
      if (!btn || btn === this.formatBtnEl || btn === this.toolbarDoneBtnEl) return;
      held = btn;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;
      const box = btn.getBoundingClientRect();
      grabX = e.clientX - box.left;
      grabY = e.clientY - box.top;
      // Captured on the bar, not the button: the button stops taking pointer events the
      // moment it is lifted.
      toolbar.setPointerCapture(e.pointerId);
    });

    this.registerDomEvent(toolbar, "pointermove", (e: PointerEvent) => {
      if (!held) return;
      if (!moved) {
        // Below this the press is still a press: dragging must not swallow a plain tap.
        if (Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY) < 8) return;
        moved = true;
        lift(held);
      }
      held.setCssStyles({ left: `${e.clientX - grabX}px`, top: `${e.clientY - grabY}px` });
      if (!gap) return;
      const under = activeDocument.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const over = under?.closest<HTMLElement>(".wr-toolbar-btn");
      if (!over || over === this.formatBtnEl || over === this.toolbarDoneBtnEl) return;
      if (over.parentElement !== toolbar) return;
      const gapPrecedes =
        (over.compareDocumentPosition(gap) & Node.DOCUMENT_POSITION_PRECEDING) !== 0;
      toolbar.insertBefore(gap, gapPrecedes ? over.nextSibling : over);
    });

    const release = (e: PointerEvent) => {
      if (!held) return;
      const btn = held;
      held = null;
      toolbar.releasePointerCapture?.(e.pointerId);
      if (moved) {
        drop(btn);
        this.readOrderFromBar();
      } else {
        this.toggleToolbarSlot(btn.getAttribute("data-wr-action"));
      }
    };
    this.registerDomEvent(toolbar, "pointerup", release);
    this.registerDomEvent(toolbar, "pointercancel", release);
  }

  private toggleToolbarSlot(id: string | null): void {
    if (!id) return;
    const slot = this.toolbarLayout.find((s) => s.id === id);
    if (!slot) return;
    slot.shown = !slot.shown;
    this.readOrderFromBar();
  }

  /**
   * Takes the bar as the record of what has been arranged so far. Held in memory only:
   * nothing reaches layout.json until the arrangement is confirmed.
   */
  private readOrderFromBar(): void {
    const toolbar = this.toolbarEl;
    if (!toolbar) return;
    const shownById = new Map(this.toolbarLayout.map((s) => [s.id, s.shown]));
    const ordered: ToolbarSlot[] = [];
    for (const el of Array.from(toolbar.children)) {
      const id = el.getAttribute("data-wr-action");
      if (!id || !shownById.has(id)) continue;
      ordered.push({ id, shown: shownById.get(id) === true });
      shownById.delete(id);
    }
    for (const [id, shown] of shownById) ordered.push({ id, shown });
    this.toolbarLayout = ordered;
    this.applyToolbarLayout();
  }

  private updateEmbedBtnActive(embedBtn: HTMLElement): void {
    embedBtn.toggleClass("wr-toolbar-active", isInsideEmbed(this.textarea));
  }

  private toggleInlineWrap(open: string, close: string): void {
    toggleInlineWrap(this.textarea, open, close);
  }

  private wrapSelection(open: string, close: string, spaceAfterClose = false): void {
    wrapSelection(this.textarea, open, close, spaceAfterClose);
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
  openMenu(
    trigger: HTMLElement,
    buildMenu: (m: Menu) => void,
    evt: MouseEvent,
    yOffset = 0,
    onHide?: () => void,
    // Hangs the menu off the right edge of the form the trigger belongs to, rather than off
    // the trigger itself. The button sits wherever the row of actions ends, which is not
    // where the eye expects a menu of its width to stop.
    alignRight = false
  ): void {
    if (this.currentMenu) {
      this.currentMenu.hide();
    }

    const menu = new Menu();
    buildMenu(menu);

    const menuDom = (menu as { dom?: HTMLElement }).dom;
    menuDom?.classList.add("wr-menu");

    trigger.toggleClass("wr-toolbar-active", true);
    this.currentMenu = menu;

    // Set while the menu tracks the form it hangs off, so closing stops the tracking.
    let stopTracking: (() => void) | null = null;
    let stopFitting: (() => void) | null = null;

    menu.onHide(() => {
      stopTracking?.();
      stopTracking = null;
      stopFitting?.();
      stopFitting = null;
      // A menu opened from another menu's item outlives it, and on mobile the old
      // one finishes closing well after. Only the menu still holding the trigger
      // puts its light out; an older one leaves it to whoever took over.
      if (this.currentMenu === menu) {
        trigger.toggleClass("wr-toolbar-active", false);
        this.currentMenu = null;
        onHide?.();
      }
    });

    // Anchor the menu to the button's left edge, opening rightward.
    const rect = trigger.getBoundingClientRect();
    const doc = trigger.ownerDocument ?? activeDocument;
    menu.showAtPosition({ x: rect.left, y: rect.bottom + yOffset }, doc);

    // The phone sheet caps itself; elsewhere a menu taller than what is left below its top
    // edge is capped there, and the list inside scrolls (the CSS opens .menu-scroll).
    let fit: (() => void) | null = null;
    if (menuDom && !Platform.isPhone) {
      const win = doc.defaultView ?? window;
      const fitNow = () => {
        const room = win.innerHeight - menuDom.getBoundingClientRect().top - 8;
        menuDom.setCssStyles({ maxHeight: `${Math.max(0, room)}px` });
      };
      fit = fitNow;
      fitNow();
      win.addEventListener("resize", fitNow);
      // Obsidian scrolls a desktop menu by mouse position; with a real scroll that would
      // fight the wheel. The listener sits on .menu-scroll, so capture stops it upstream.
      const swallow = (e: MouseEvent) => e.stopPropagation();
      menuDom.addEventListener("mousemove", swallow, { capture: true });
      stopFitting = () => {
        win.removeEventListener("resize", fitNow);
        menuDom.removeEventListener("mousemove", swallow, { capture: true });
      };
    }

    if (alignRight && menuDom) {
      const host = trigger.closest(".wr-input-area") ?? trigger;
      // How wide the menu is only becomes known once it is up, so the edges are matched
      // afterwards. Clamped at the window edge, which a wide menu on a narrow pane reaches.
      let lastLeft = Number.NaN;
      let lastTop = Number.NaN;
      let frame = 0;
      // The pane can be dragged wider or narrower with the menu still open, and a menu left
      // behind reads as belonging to nothing. Checked per frame rather than off a resize
      // signal: the pane divider moves the form without resizing anything the menu can
      // observe. Two reads and a comparison, and only a change is written.
      const place = () => {
        const width = menuDom.getBoundingClientRect().width;
        const left = Math.max(0, host.getBoundingClientRect().right - width);
        // Dragging the pane narrower rewraps the toolbar, which moves the button the menu
        // was hung under; the vertical anchor has to follow that as well.
        const top = trigger.getBoundingClientRect().bottom + yOffset;
        if (left !== lastLeft || top !== lastTop) {
          lastLeft = left;
          lastTop = top;
          menuDom.setCssStyles({ left: `${left}px`, top: `${top}px` });
          fit?.();
        }
        frame = window.requestAnimationFrame(place);
      };
      place();
      stopTracking = () => window.cancelAnimationFrame(frame);
    }
  }

}
