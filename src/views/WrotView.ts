import { ItemView, WorkspaceLeaf, Notice, TFile, EventRef, debounce, setIcon, Menu, MenuItem, Platform, Scope, MarkdownRenderer } from "obsidian";
import { VIEW_TYPE_WROT } from "../constants";
import { blockTimeOf, parseMemos, Memo } from "../utils/memoParser";
import { appendMemo, deleteMemo, hasCheckbox, setMemoCheckbox, updateMemo, withChecks } from "../utils/memoWriter";
import { getOrCreateDailyNote, getDailyNoteFile, dailyNotePathFor, dailyNoteTemplateFile } from "../utils/dailyNote";
import { headingLocator, waitForTemplater } from "../utils/postHeading";
import { segmentBlocks, toTildeFences } from "../utils/blockSegmenter";
import { QUOTE_LINK_RE, renderTextWithTagsAndUrls, renderUrlPreviews } from "../utils/urlRenderer";
import { invalidateMemoCache, renderQuoteCard } from "../utils/quoteCard";
import { ensureBlockIdOnFence } from "../utils/memoWriter";
import { isImageFile, saveImageToVault, buildEmbedLink, shrinkImage } from "../utils/imageAttachment";
import { openCalendarPopover, CalendarPopoverHandle } from "../utils/calendarPopover";
import { openLinkPopover, LinkPopoverHandle } from "../utils/linkPopover";
import { buildDateDrum } from "../utils/dateDrum";
import { InlineSuggest, extractTagsForHistory, rebuildFocus, tagSource } from "../utils/tagSuggest";
import { padLineTimes, timeSource } from "../editor/composerTime";
import { ComposerField } from "../editor/composerField";
import { findLinkAt, isLinkableText, linkMarkdown } from "../editor/composerLink";
import { HIGHLIGHT_EMOJI, TAG_SOURCE, ruleClassOf } from "../utils/patterns";
import { hexRgba } from "../utils/color";
import {
  closeInlineMarker,
  effectBlocked,
  continueCodeIndentOnEnter,
  continueListOnEnter,
  continueQuoteOnEnter,
  insertAtLineStart,
  insertCodeIndent,
  insertFenceBlock,
  insideDecoration,
  isInsideMarker,
  lineMarkerState,
  shiftListIndent,
  spaceAfter,
  spaceBefore,
  syncListFormatting,
  toggleBlockPrefix,
  wrapSelection,
  highlightAtSelection,
  removeHighlight,
  wrapHighlight,
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
  { id: "list", icon: "list", labelKey: "view.toolbarAction.list" },
  { id: "check", icon: "list-checks", labelKey: "view.toolbarAction.check" },
  { id: "ol", icon: "list-ordered", labelKey: "view.toolbarAction.ol" },
  { id: "code", icon: "code", labelKey: "view.formatMenu.code" },
  { id: "math", icon: "sigma", labelKey: "view.formatMenu.math" },
  { id: "quote", icon: "quote", labelKey: "view.formatMenu.quote" },
  { id: "bold", icon: "bold", labelKey: "view.toolbarAction.bold", pendingMode: true },
  { id: "italic", icon: "italic", labelKey: "view.toolbarAction.italic", pendingMode: true },
  // Needs a selection to link, or the caret on a link to edit; its own terms, see linkTarget.
  { id: "link", icon: "link", labelKey: "view.formatMenu.link" },
  { id: "strikethrough", icon: "strikethrough", labelKey: "view.formatMenu.strikethrough", needsSelection: true },
  { id: "highlight", icon: "highlighter", labelKey: "view.formatMenu.highlight", needsSelection: true },
  { id: "schedule", icon: "clock-fading", labelKey: "view.postMenu.schedulePin" },
];

const EFFECT_KIND: Record<string, "code" | "math" | "decoration"> = {
  bold: "decoration",
  italic: "decoration",
  strikethrough: "decoration",
  highlight: "decoration",
  link: "decoration",
  code: "code",
  math: "math",
};

/** One entry of the toolbar's action list, wherever that entry currently sits. */
interface ToolbarAction {
  id: string;
  label: string;
  icon: string;
  run: () => void;
  needsSelection?: boolean;
  checked?: () => boolean;
  disabled?: () => boolean;
  title?: () => string;
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

const TRAILING_QUOTE_RE = /^(?:([\s\S]*?)\n)?[ \t]*(\[\[[^[\]\n]+#\^wr-\d{17}\]\])\s*$/;

function splitTrailingQuote(text: string): { text: string; quote: string | null } {
  const m = text.match(TRAILING_QUOTE_RE);
  if (!m) return { text, quote: null };
  return { text: (m[1] ?? "").replace(/\s+$/, ""), quote: m[2] };
}

function joinQuote(text: string, quote: string | null): string {
  if (!quote) return text;
  const body = text.replace(/\s+$/, "");
  return body ? `${body}\n${quote}` : quote;
}

export class WrotView extends ItemView {
  plugin: WrotPlugin;
  private currentDate: ReturnType<typeof moment>;
  private anchoredToToday: boolean = true;
  private lastRenderedDay: string | null = null;
  private listContainer!: HTMLElement;
  private pinnedContainer: HTMLElement | null = null;
  private dateLabel!: HTMLElement;
  private dateNavEl!: HTMLElement;
  private calendarBtnEl: HTMLElement | null = null;
  private calendarPopover: CalendarPopoverHandle | null = null;
  private schedulePopover: CalendarPopoverHandle | null = null;
  private datePopover: CalendarPopoverHandle | null = null;
  private dateTargetHeld: (() => boolean) | null = null;
  private linkPopover: LinkPopoverHandle | null = null;
  private schedulePickerAnchor: HTMLElement | null = null;
  private schedulingTime: string | null = null;
  private armedSchedule: string | null = null;
  private armedRepeat = false;
  private scheduleArmBtn: HTMLButtonElement | null = null;
  private suggest: InlineSuggest | null = null;
  composer!: ComposerField;
  submitLabelEl!: HTMLElement;
  submitIconEl!: HTMLElement;
  private requestRefresh = debounce(() => void this.refresh(), REFRESH_COALESCE_MS, true);
  private ignoreNextModify = false;
  private ownWriteAt = 0;
  private ignoreModifyUntil = 0;
  private activeFormatMode: "bold" | "italic" | null = null;
  // Calling focus() from a format-button click fires a focus event whose validation would
  // instantly clear the just-set pending format mode; skip exactly one focus validation.
  private skipNextFocusValidation = false;
  // iOS WebKit drops taps on the buttons mid-IME, so the lock is released from input/blur heuristics instead.
  private imeLocked = false;
  private imeComposing = false;
  private imeValueAtStart = "";
  private imeSuppressUntil = 0;
  private armedShown = false;
  private refreshing = false;
  private refreshQueued = false;
  private toolbarResizeObserver: ResizeObserver | null = null;
  private scheduleDraftSave = debounce(() => void this.persistDraft(), DRAFT_IDLE_MS, true);
  private currentMenu: Menu | null = null;
  private pendingImage: File | null = null;
  private pendingImageUrl: string | null = null;
  private pendingShrink: Promise<File> | null = null;
  private thumbnailContainer: HTMLElement | null = null;
  private pendingQuote: string | null = null;
  private quoteContainer: HTMLElement | null = null;
  private imageAddBtn: HTMLButtonElement | null = null;
  private submitBtnEl: HTMLButtonElement | null = null;
  private cancelBtnEl: HTMLButtonElement | null = null;
  private toolbarDoneBtnEl: HTMLButtonElement | null = null;
  private toolbarEl: HTMLElement | null = null;
  private formatBtnEl: HTMLButtonElement | null = null;
  private toolbarBtns: Map<string, HTMLButtonElement> = new Map();
  private toolbarActions: ToolbarAction[] = [];
  private toolbarLayout: ToolbarSlot[] = [];
  private toolbarEditing = false;
  // filePath pins the write target across date navigation and for pinned memos living in another note.
  private editingMemo: { time: string; filePath: string } | null = null;
  private deleteArmedTime: string | null = null;
  private deleteArmTimer: number | null = null;
  // The image is kept as a File: its object URL is revoked with the thumbnail and regenerated on restore.
  private savedDraft: {
    text: string;
    image: File | null;
    quote: string | null;
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
    container.addClass("wrot-container");

    // currentColor can't carry a gradient; userSpaceOnUse because a per-path bbox is empty on vertical strokes.
    const gradient = container
      .createSvg("svg", { cls: "wrot-gradient-defs", attr: { "aria-hidden": "true" } })
      .createSvg("defs")
      .createSvg("linearGradient", {
        attr: { id: "wrot-accent-gradient", gradientUnits: "userSpaceOnUse", x1: "0", y1: "0", x2: "24", y2: "0" },
      });
    for (let band = 0; band < 4; band++) {
      for (const offset of [band / 4, (band + 1) / 4]) {
        gradient.createSvg("stop", { cls: `wrot-grad-band-${band}`, attr: { offset: String(offset) } });
      }
    }

    this.buildDateNav(container);
    this.buildInputArea(container);
    this.listContainer = container.createDiv({ cls: "wrot-list" });

    this.scope!.register(["Mod"], "Enter", (evt) => {
      if (this.composer?.hasFocus) {
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
    this.scheduleDraftSave.cancel();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
    this.persistDraft();
    this.suggest?.destroy();
    this.suggest = null;
    // Before the composer goes: closing hands focus back to it otherwise.
    this.linkPopover?.close(true);
    this.composer?.destroy();
    this.closeCalendarPopover();
    this.datePopover?.close();
    this.requestRefresh.cancel();
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
    this.registerEvent(this.app.vault.on("modify", (file) => {
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
    }));
    // vault "delete" fires before metadataCache updates, so watch metadataCache "deleted" instead.
    this.registerEvent(this.app.metadataCache.on("deleted", (file) => {
      if (!(file instanceof TFile)) return;
      if (!this.affectsCurrentView(file)) return;
      this.requestRefresh();
    }));
    this.registerEvent(this.app.vault.on("create", (file) => {
      if (!(file instanceof TFile)) return;
      if (!this.affectsCurrentView(file)) return;
      this.requestRefresh();
    }));
    // On mobile, a note rewritten by sync does not always raise "modify"; the undocumented
    // "raw" signal still fires. Desktop gets "modify" reliably and would refresh twice.
    if (Platform.isMobile) {
      const vault = this.app.vault as unknown as {
        on(name: "raw", cb: (path: string) => void): EventRef;
      };
      this.registerEvent(vault.on("raw", (path) => {
        // "modify" may have consumed the flag already; the time window covers the rest.
        if (this.ignoreNextModify || Date.now() < this.ignoreModifyUntil) return;
        if (Date.now() - this.ownWriteAt < OWN_WRITE_WINDOW_MS) return;
        if (path !== dailyNotePathFor(this.currentDate) && !this.holdsPinnedMemo(path)) return;
        this.requestRefresh();
      }));
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
    return [...pins, ...scheduledPins];
  }

  private markOwnWrite(): void {
    this.ignoreNextModify = true;
    this.ownWriteAt = Date.now();
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
    this.composer?.focus();
  }

  // While editing, the composer holds the post and the real draft sits in savedDraft.
  private async persistDraft(): Promise<void> {
    if (!this.composer || this.editingMemo) return;
    await this.plugin.saveDraft(this.draftText());
  }

  // Kept in 2.x's layout (quote as text at the end) so a device still on 2.x reads the same draft.
  private draftText(): string {
    return joinQuote(this.composer.value, this.pendingQuote);
  }

  private loadDraftText(draft: string): void {
    const { text, quote } = splitTrailingQuote(draft);
    this.composer.value = text;
    this.setPendingQuote(quote);
  }

  // Text typed here but not yet written wins over whatever arrived on disk.
  private async syncDraftFromDisk(afterCompose = false): Promise<void> {
    if (!this.composer || this.editingMemo) return;
    const local = this.draftText();
    const known = this.plugin.draft;
    // Own writes echo back as a change signal too; nothing below runs for those.
    if (!afterCompose && !(await this.plugin.reloadDraft())) return;
    if (this.editingMemo) return;
    // Replacing the value mid-composition strands the IME: blur to force-commit, wait for
    // compositionend, then come back with afterCompose set (same dance as tag completion).
    if (this.imeComposing && !afterCompose) {
      const ta = this.composer;
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
    this.loadDraftText(this.plugin.draft);
    if (afterCompose && !this.composer.hasFocus) {
      rebuildFocus(this.composer, this.contentEl);
    }
    this.composer.dispatchEvent(new Event("input"));
  }

  restoreDraft(): void {
    const draft = this.plugin.draft;
    if (!draft || !this.composer || this.composer.value || this.pendingQuote || this.editingMemo) return;
    this.loadDraftText(draft);
    this.composer.dispatchEvent(new Event("input"));
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
    const nav = container.createDiv({ cls: "wrot-date-nav" });
    this.dateNavEl = nav;

    const prevBtn = nav.createEl("button", { cls: "wrot-nav-btn" });
    setIcon(prevBtn, "chevron-left");
    prevBtn.addEventListener("click", () => {
      this.currentDate = this.currentDate.clone().subtract(1, "day");
      this.anchoredToToday = false;
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
      this.refresh();
    });

    this.dateLabel = nav.createSpan({ cls: "wrot-date-label" });
    this.dateLabel.addEventListener("click", () => void (async () => {
      this.dateLabel.classList.add("wrot-date-label-active");
      window.setTimeout(() => this.dateLabel.classList.remove("wrot-date-label-active"), 300);
      const file = getDailyNoteFile(this.app, this.currentDate)
        ?? await getOrCreateDailyNote(this.app, this.currentDate);
      await this.openOrFocusFile(file);
    })());

    const nextBtn = nav.createEl("button", { cls: "wrot-nav-btn" });
    setIcon(nextBtn, "chevron-right");
    nextBtn.addEventListener("click", () => {
      this.currentDate = this.currentDate.clone().add(1, "day");
      this.anchoredToToday = false;
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
      this.refresh();
    });

    const todayBtn = nav.createEl("button", { cls: "wrot-today-btn", text: t("view.dateNav.today") });
    todayBtn.addEventListener("click", () => {
      this.currentDate = moment();
      this.anchoredToToday = true;
      // Synchronously inside the click: iOS raises the keyboard only within the user gesture.
      this.focusInput();
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
      this.refresh();
    });

    this.updateCalendarButton();
  }

  updateCalendarButton(): void {
    if (!this.dateNavEl) return;
    if (!this.plugin.settings.showCalendarButton) {
      this.closeCalendarPopover();
      this.calendarBtnEl?.remove();
      this.calendarBtnEl = null;
      return;
    }
    if (this.calendarBtnEl) return;
    const calendarBtn = this.dateNavEl.createEl("button", { cls: "wrot-nav-btn wrot-calendar-btn" });
    setIcon(calendarBtn, "calendar-1");
    calendarBtn.setAttr("aria-label", t("view.dateNav.today"));
    calendarBtn.addEventListener("click", () => {
      if (this.calendarPopover) {
        this.closeCalendarPopover();
        return;
      }
      calendarBtn.toggleClass("wrot-toolbar-active", true);
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
          calendarBtn.toggleClass("wrot-toolbar-active", false);
        },
      });
    });
    this.calendarBtnEl = calendarBtn;
  }

  private closeCalendarPopover(): void {
    this.calendarPopover?.close();
    this.calendarPopover = null;
  }

  private openDatePicker(from: number, to: number): void {
    this.datePopover?.close();
    const typed = this.composer.value.slice(from, to);
    const pick = (date: ReturnType<typeof moment>) => {
      if (this.composer.value.slice(from, to) !== typed) return;
      rebuildFocus(this.composer, this.contentEl);
      this.composer.completeShortcut(from, to, `${date.format(this.plugin.settings.headerDateFormat)} `);
    };
    if (Platform.isMobile) {
      const trigger = this.contentEl.querySelector<HTMLElement>(".wrot-input-area");
      if (!trigger) return;
      this.openDrumMenu(trigger, {
        earliest: moment("1900-01-01", "YYYY-MM-DD"),
        start: moment().startOf("day"),
        icon: "calendar",
        onPick: pick,
      });
      return;
    }
    this.dateTargetHeld = () =>
      this.composer.value.slice(from, to) === typed &&
      this.composer.selectionStart === to &&
      this.composer.selectionEnd === to;
    this.datePopover = openCalendarPopover({
      anchor: () => this.composer.coordsAt(from, 1) ?? { left: 0, bottom: 0 },
      container: this.contentEl,
      initialDate: moment(),
      onSelect: pick,
      onClose: () => {
        this.datePopover = null;
        this.dateTargetHeld = null;
      },
    });
  }

  // Label and icon are resolved together so empty settings never yield a blank button.
  refreshSubmitButton(): void {
    if (!this.submitBtnEl) return;
    const { submitLabel, submitIcon, updateLabel, updateIcon } = this.plugin.settings;
    const editing = this.editingMemo !== null;
    const icon = editing ? updateIcon || submitIcon : submitIcon;
    const label = editing
      ? updateLabel || (icon ? "" : t("defaults.updateLabel"))
      : submitLabel || (icon ? "" : t("defaults.submitLabel"));
    this.submitLabelEl.textContent = label ? `${label} ` : "";
    this.submitBtnEl.toggleClass("wrot-submit-icon-only", !label);
    this.submitBtnEl.toggleClass("wrot-submit-editing", editing);
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
    if (editing) this.armedRepeat = false;
  }

  private buildInputArea(container: HTMLElement): void {
    const inputArea = container.createDiv({ cls: "wrot-input-area" });

    const header = inputArea.createDiv({ cls: "wrot-input-header" });
    const cancelBtn = header.createEl("button", { cls: "wrot-toolbar-btn wrot-cancel-btn" });
    setIcon(cancelBtn, "x");
    cancelBtn.setAttr("aria-label", t("view.postMenu.cancelEdit"));
    this.cancelBtnEl = cancelBtn;
    cancelBtn.addEventListener("click", () => this.exitEditMode());
    const submitBtn = header.createEl("button", {
      cls: "wrot-submit-btn",
    });
    this.submitLabelEl = submitBtn.createSpan();
    this.submitIconEl = submitBtn.createSpan({ cls: "wrot-submit-icon" });
    this.submitBtnEl = submitBtn;
    this.refreshSubmitButton();
    submitBtn.addEventListener("click", () => void this.submitMemo());

    const dates = {
      pick: (from: number, to: number) => this.openDatePicker(from, to),
      today: () => moment().format(this.plugin.settings.headerDateFormat),
    };
    this.composer = new ComposerField(
      inputArea,
      this.plugin.settings.inputPlaceholder,
      this.plugin.settings.checkStrikethrough,
      () => this.obsidianConfig("autoPairBrackets") !== false,
      dates
    );

    this.suggest = new InlineSuggest({
      field: this.composer,
      container,
      sources: [
        tagSource(() => this.plugin.recentTags, () => this.plugin.settings.tagSuggestEnabled),
        timeSource(dates),
      ],
    });

    this.composer.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.isComposing) return;
      // Suggest dropdown handles navigation keys first; Mod+Enter only closes it
      // without being consumed, so it falls through to the submit handling below.
      if (this.suggest?.handleKeydown(e)) return;
      if (e.key === "Escape" && this.editingMemo) {
        e.preventDefault();
        this.exitEditMode();
        return;
      }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        if (
          continueCodeIndentOnEnter(this.composer) ||
          this.composer.expandShortcut() ||
          this.composer.commitTypedLine() ||
          continueListOnEnter(this.composer, this.plugin.settings.headerDateFormat) ||
          continueQuoteOnEnter(this.composer)
        ) e.preventDefault();
      }
      if (e.key === "Backspace" && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
        const markerEnd = this.composer.listMarkerAtCaret();
        if (markerEnd !== null) {
          if (shiftListIndent(this.composer, true)) e.preventDefault();
          else if (this.composer.selectionStart < markerEnd) this.composer.setSelectionRange(markerEnd, markerEnd);
        }
      }
      if (e.key === "Tab") {
        if (!e.shiftKey && insertCodeIndent(this.composer, this.indentUnit())) e.preventDefault();
        else if (shiftListIndent(this.composer, e.shiftKey)) e.preventDefault();
      }
    });

    this.thumbnailContainer = inputArea.createDiv({ cls: "wrot-thumbnail-container" });
    this.thumbnailContainer.hide();
    this.quoteContainer = inputArea.createDiv({ cls: "wrot-pending-quote-container" });
    this.quoteContainer.hide();

    this.composer.addEventListener("paste", (e: ClipboardEvent) => {
      const files = e.clipboardData?.files;
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!isImageFile(file)) return;
      e.preventDefault();
      if (this.toolbarEditing) return;
      this.setPendingImage(file);
    });

    this.composer.addEventListener("dragover", (e: DragEvent) => {
      if (e.dataTransfer?.types.includes("Files")) {
        e.preventDefault();
      }
    });

    this.composer.addEventListener("drop", (e: DragEvent) => {
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!isImageFile(file)) return;
      e.preventDefault();
      if (this.toolbarEditing) return;
      this.setPendingImage(file);
    });

    const toolbar = inputArea.createDiv({ cls: "wrot-input-toolbar" });
    this.toolbarEl = toolbar;
    this.toolbarBtns.clear();

    // The suggest dropdown can overlap the toolbar; while it is shown (and during the
    // ghost-click window right after a tap-commit) toolbar buttons must not react.
    const toolbarSuppressed = () => this.suggest?.isSuppressingUi() ?? false;

    // Buttons are born detached: applyToolbarLayout is the only thing that puts one on
    // the bar, so an action that lives in the overflow menu simply never gets appended.
    for (const spec of TOOLBAR_ACTION_SPECS) {
      const btn = createEl("button", { cls: "wrot-toolbar-btn" });
      setIcon(btn, spec.icon);
      btn.setAttr("aria-label", t(spec.labelKey));
      btn.setAttr("data-wrot-action", spec.id);
      btn.addEventListener("mousedown", (e) => e.preventDefault());
      // Rewriting mid-composition kills the iOS caret: force-commit, then replay. Must register first to stop the action; image skips it since its picker needs the original tap.
      if (spec.id !== "image" && spec.id !== "schedule") {
        let replaying = false;
        btn.addEventListener("click", (e) => {
          if (!this.imeComposing || replaying || toolbarSuppressed()) return;
          e.stopImmediatePropagation();
          const ta = this.composer;
          let done = false;
          const finish = (): void => {
            if (done) return;
            done = true;
            ta.removeEventListener("compositionend", finish);
            // The fallback path never saw compositionend, but the blur ended it all the same.
            this.imeComposing = false;
            if (!ta.hasFocus) rebuildFocus(ta, this.contentEl);
            replaying = true;
            btn.click();
            replaying = false;
          };
          ta.addEventListener("compositionend", finish);
          ta.blur();
          window.setTimeout(finish, 150);
        });
      }
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

    const linkBtn = btnFor("link");
    const boldBtn = btnFor("bold");
    const italicBtn = btnFor("italic");
    const listBtn = btnFor("list");
    const checkBtn = btnFor("check");
    const olBtn = btnFor("ol");

    linkBtn.addEventListener("click", () => {
      if (toolbarSuppressed()) return;
      this.openLinkEditor();
    });
    const highlightBtn = btnFor("highlight");
    highlightBtn.addEventListener("click", () => {
      if (toolbarSuppressed()) return;
      const ta = this.composer;
      if (ta.selectionStart === ta.selectionEnd || this.effectBlockedFor("highlight")) return;
      const existing = highlightAtSelection(ta);
      if (existing) {
        removeHighlight(ta, existing);
        return;
      }
      const anchor = highlightBtn.parentElement ? highlightBtn : this.formatBtnEl ?? highlightBtn;
      this.openComposerMenu(anchor, (menu) => {
        menu.addItem((item) =>
          item.setTitle(t("view.highlight.default")).setIcon("highlighter").onClick(() => wrapHighlight(ta, ""))
        );
        for (const [color, emoji] of HIGHLIGHT_EMOJI) {
          menu.addItem((item) => {
            item.setTitle(t(`view.highlight.${color}` as Parameters<typeof t>[0])).onClick(() => wrapHighlight(ta, emoji));
            // Not in the public typings: the icon slot Obsidian's own menu puts its swatch in.
            (item as unknown as { iconEl?: HTMLElement }).iconEl?.createDiv({
              cls: "highlight-swatch",
              attr: { "data-highlight": color },
            });
          });
        }
      });
    });
    const updateFormatBtns = () => {
      const insideBold = isInsideMarker(this.composer, "**");
      const insideItalic = isInsideMarker(this.composer, "*");
      const boldActive = this.activeFormatMode === "bold" || insideBold;
      const italicActive = this.activeFormatMode === "italic" || insideItalic;
      boldBtn.toggleClass("wrot-toolbar-active", boldActive);
      italicBtn.toggleClass("wrot-toolbar-active", italicActive);
      boldBtn.toggleClass("wrot-toolbar-disabled", this.activeFormatMode === "italic" || this.effectBlockedFor("bold"));
      italicBtn.toggleClass("wrot-toolbar-disabled", this.activeFormatMode === "bold" || this.effectBlockedFor("italic"));
      boldBtn.toggleClass("wrot-toolbar-ime-muted", this.imeLocked && boldActive);
      italicBtn.toggleClass("wrot-toolbar-ime-muted", this.imeLocked && italicActive);
      if (this.activeFormatMode === null && this.armedShown) {
        this.armedShown = false;
        this.composer.setArmedFormat(null);
      }
    };
    const validateActiveFormatMode = () => {
      if (this.activeFormatMode === null) return;
      if (this.armedShown && this.composer.armedOpener() === null) {
        this.activeFormatMode = null;
        updateFormatBtns();
        return;
      }
      const ta = this.composer;
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
      if (this.imeLocked && (this.activeFormatMode === "bold" || isInsideMarker(this.composer, "**"))) return;
      if (this.activeFormatMode === "italic" || this.effectBlockedFor("bold")) return;
      const ta = this.composer;
      if (ta.selectionStart !== ta.selectionEnd) {
        wrapSelection(this.composer, "**", "**", true);
        updateFormatBtns();
        return;
      }
      if (this.activeFormatMode === "bold") {
        const pos = ta.selectionStart;
        if (pos >= 2 && ta.value.slice(pos - 2, pos) === "**") {
          ta.value = ta.value.slice(0, pos - 2) + ta.value.slice(pos);
          ta.selectionStart = ta.selectionEnd = pos - 2;
        } else {
          closeInlineMarker(ta, "**", ta.armedOpener()?.pos);
        }
        this.activeFormatMode = null;
      } else {
        const pos = ta.selectionStart;
        ta.value = ta.value.slice(0, pos) + "**" + ta.value.slice(pos);
        ta.selectionStart = ta.selectionEnd = pos + 2;
        this.activeFormatMode = "bold";
        this.armedShown = true;
        ta.setArmedFormat(pos, "**");
        this.skipNextFocusValidation = true;
      }
      ta.focus();
      ta.dispatchEvent(new Event("input"));
      updateFormatBtns();
    });
    italicBtn.addEventListener("click", () => {
      if (toolbarSuppressed()) return;
      // During IME, block only when active (condition must match updateFormatBtns).
      if (this.imeLocked && (this.activeFormatMode === "italic" || isInsideMarker(this.composer, "*"))) return;
      if (this.activeFormatMode === "bold" || this.effectBlockedFor("italic")) return;
      const ta = this.composer;
      if (ta.selectionStart !== ta.selectionEnd) {
        wrapSelection(this.composer, "*", "*", true);
        updateFormatBtns();
        return;
      }
      if (this.activeFormatMode === "italic") {
        const pos = ta.selectionStart;
        if (pos >= 1 && ta.value.slice(pos - 1, pos) === "*") {
          ta.value = ta.value.slice(0, pos - 1) + ta.value.slice(pos);
          ta.selectionStart = ta.selectionEnd = pos - 1;
        } else {
          closeInlineMarker(ta, "*", ta.armedOpener()?.pos);
        }
        this.activeFormatMode = null;
      } else {
        const pos = ta.selectionStart;
        ta.value = ta.value.slice(0, pos) + "*" + ta.value.slice(pos);
        ta.selectionStart = ta.selectionEnd = pos + 1;
        this.activeFormatMode = "italic";
        this.armedShown = true;
        ta.setArmedFormat(pos, "*");
        this.skipNextFocusValidation = true;
      }
      ta.focus();
      ta.dispatchEvent(new Event("input"));
      updateFormatBtns();
    });
    listBtn.addEventListener("click", () => {
      if (toolbarSuppressed()) return;
      insertAtLineStart(this.composer, "- ");
      this.updateToolbarActive(listBtn, checkBtn, olBtn);
    });
    checkBtn.addEventListener("click", () => {
      if (toolbarSuppressed()) return;
      insertAtLineStart(this.composer, "- [ ] ");
      this.updateToolbarActive(listBtn, checkBtn, olBtn);
    });
    olBtn.addEventListener("click", () => {
      if (toolbarSuppressed()) return;
      insertAtLineStart(this.composer, "1. ");
      this.updateToolbarActive(listBtn, checkBtn, olBtn);
    });
    const scheduleBtn = btnFor("schedule");
    this.scheduleArmBtn = scheduleBtn;
    scheduleBtn.addEventListener("click", () => {
      if (toolbarSuppressed()) return;
      if (this.editingMemo) return;
      // Off the bar the button is detached and has no box, so the picker anchors to the overflow button.
      const anchor = scheduleBtn.parentElement ? scheduleBtn : this.formatBtnEl ?? scheduleBtn;
      // The popover ignores presses on its own anchor, so a re-press to close it lands here.
      if (this.schedulePickerAnchor === anchor) {
        this.schedulePopover?.close();
        return;
      }
      if (this.armedSchedule) {
        this.setArmedSchedule(null);
        return;
      }
      this.openSchedulePicker(anchor, null, (from) => this.setArmedSchedule(from));
    });

    const runCode = () => {
      const ta = this.composer;
      if (ta.selectionStart !== ta.selectionEnd) wrapSelection(this.composer, "`", "`", true);
      else insertFenceBlock(this.composer, "~~~\n\n~~~");
    };
    const runMath = () => {
      const ta = this.composer;
      if (ta.selectionStart !== ta.selectionEnd) wrapSelection(this.composer, "$", "$", true);
      else insertFenceBlock(this.composer, "$$\n\n$$");
    };
    const menuBornRuns: Record<string, () => void> = {
      code: runCode,
      math: runMath,
      quote: () => toggleBlockPrefix(this.composer, "> "),
      strikethrough: () => wrapSelection(this.composer, "~~", "~~", true),
    };
    for (const spec of TOOLBAR_ACTION_SPECS) {
      const run = menuBornRuns[spec.id];
      if (!run) continue;
      btnFor(spec.id).addEventListener("click", () => {
        if (toolbarSuppressed()) return;
        const ta = this.composer;
        if (spec.needsSelection && ta.selectionStart === ta.selectionEnd) return;
        if (this.effectBlockedFor(spec.id)) return;
        run();
      });
    }

    this.toolbarActions = TOOLBAR_ACTION_SPECS.map((spec) => ({
      id: spec.id,
      icon: spec.icon,
      label: t(spec.labelKey),
      needsSelection: spec.needsSelection,
      pendingMode: spec.pendingMode,
      run: () => this.toolbarBtns.get(spec.id)?.click(),
    }));
    const highlightLabel = (): string =>
      highlightAtSelection(this.composer) ? t("view.highlight.remove") : t("view.formatMenu.highlight");
    const highlightAction = this.toolbarActions.find((a) => a.id === "highlight");
    if (highlightAction) highlightAction.title = highlightLabel;
    for (const action of this.toolbarActions) {
      if (EFFECT_KIND[action.id]) action.disabled = () => this.effectBlockedFor(action.id);
    }
    const linkAction = this.toolbarActions.find((a) => a.id === "link");
    if (linkAction) linkAction.disabled = () => !this.linkTarget();
    const scheduleAction = this.toolbarActions.find((a) => a.id === "schedule");
    if (scheduleAction) {
      scheduleAction.checked = () => this.armedSchedule !== null;
      scheduleAction.disabled = () =>
        this.editingMemo !== null ||
        (this.armedSchedule === null &&
          this.scheduledClaimCount() >= this.plugin.settings.pinLimit);
    }

    const toolbarDoneBtn = createEl("button", {
      cls: "wrot-toolbar-btn wrot-toolbar-commit-btn",
    });
    setIcon(toolbarDoneBtn, "check");
    toolbarDoneBtn.setAttr("aria-label", t("view.toolbarEdit.done"));
    toolbarDoneBtn.addEventListener("mousedown", (e) => e.preventDefault());
    this.toolbarDoneBtnEl = toolbarDoneBtn;

    const formatBtn = toolbar.createEl("button", { cls: "wrot-toolbar-btn wrot-format-btn" });
    setIcon(formatBtn, "ellipsis");
    formatBtn.setAttr("aria-label", t("view.toolbarAction.more"));
    this.formatBtnEl = formatBtn;
    formatBtn.addEventListener("mousedown", (e) => e.preventDefault());
    formatBtn.addEventListener("click", () => {
      if (toolbarSuppressed()) return;
      const ta = this.composer;
      const hasSelection = ta.selectionStart !== ta.selectionEnd;
      this.openComposerMenu(formatBtn, (menu) => {
        let rendered = 0;
        for (const action of this.hiddenActions()) {
          rendered++;
          menu.addItem((item) => {
            item.setTitle(action.title?.() ?? action.label).setIcon(action.icon).onClick(() => action.run());
            if (action.checked?.()) item.setChecked(true);
            const wrapOnly = action.needsSelection || action.pendingMode;
            if ((wrapOnly && !hasSelection) || action.disabled?.()) item.setDisabled(true);
          });
        }
        // Not a toolbar action: it only means something while the post holds a checkbox.
        // Disabled rather than hidden when full or editing, like the schedule action beside it.
        if (hasCheckbox(ta.value)) {
          rendered++;
          menu.addItem((item) => {
            const blocked =
              this.editingMemo !== null ||
              (!this.armedRepeat && this.pinClaimCount() >= this.plugin.settings.pinLimit);
            item.setTitle(t("view.postMenu.repeatPin")).setIcon("repeat").onClick(() => {
              if (blocked) return;
              this.armedRepeat = !this.armedRepeat;
              if (this.armedRepeat) this.setArmedSchedule(null);
            });
            if (this.armedRepeat) item.setChecked(true);
            if (blocked) item.setDisabled(true);
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
          item.setTitle(t("view.formatMenu.settings")).setIcon("settings").onClick(() => this.plugin.openSettings());
        });
      }, -4, true);
    });

    // Capture phase: while arranging, presses are swallowed before the actions' own handlers see them.
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
      this.updateLinkBtn(linkBtn);
      highlightBtn.setAttr("aria-label", highlightLabel());
      updateFormatBtns();
      this.updateSelectionBtns();
      this.updateSubmitBtnState();
    };
    this.composer.onSelectionChange(() => {
      if (this.composer.hasFocus) {
        if (this.dateTargetHeld && !this.dateTargetHeld()) this.datePopover?.close();
        updateActive();
        this.suggest?.refresh();
      }
    });
    // selectionchange does not fire on focus gain, so sync explicitly.
    this.composer.addEventListener("focus", () => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
      this.catchUpToToday();
      if (this.skipNextFocusValidation) {
        this.skipNextFocusValidation = false;
        this.updateToolbarActive(listBtn, checkBtn, olBtn);
        this.updateLinkBtn(linkBtn);
        updateFormatBtns();
        this.updateSelectionBtns();
        this.updateSubmitBtnState();
        return;
      }
      updateActive();
    });
    // Catches IME commits and pastes; updateActive is idempotent, double firing is fine.
    this.composer.addEventListener("input", updateActive);
    // Lock on compositionstart. Unlock only once a post-IME input shows the value grew:
    // compositionend can be spuriously triggered by button taps, so only a real commit counts.
    this.composer.addEventListener("compositionstart", () => {
      this.imeLocked = true;
      this.imeComposing = true;
      this.imeValueAtStart = this.composer.value;
      updateFormatBtns();
    });
    this.composer.addEventListener("compositionend", () => {
      this.imeComposing = false;
      // On desktop the post-commit input may not arrive, so unlock here if the value grew.
      // Forced commits right after blur are already suppressed via imeSuppressUntil.
      if (!this.imeLocked) return;
      // A tap inside the field also commits by blurring, but the editor takes focus straight
      // back; nothing outside received the tap, so there is no stray press to guard against.
      if (Date.now() < this.imeSuppressUntil && !this.composer.hasFocus) return;
      if (this.composer.value.length > this.imeValueAtStart.length) {
        this.imeLocked = false;
        updateFormatBtns();
      }
    });
    // On iOS, tapping outside mid-IME forces a commit as blur -> input(shrink) ->
    // input(restore) -> compositionend; treat input right after blur as forced and keep the lock.
    this.composer.addEventListener("blur", () => {
      if (this.imeLocked) this.imeSuppressUntil = Date.now() + 400;
    });
    this.composer.addEventListener("input", () => {
      if (!this.imeLocked) return;
      if (Date.now() < this.imeSuppressUntil) return;
      const len = this.composer.value.length;
      const baseLen = this.imeValueAtStart.length;
      if (this.imeComposing) {
        if (len <= baseLen) {
          this.imeLocked = false;
          updateFormatBtns();
        }
        return;
      }
      if (len > baseLen) {
        this.imeLocked = false;
        updateFormatBtns();
      }
    });

    // Skipped mid-composition: rewriting the value would drop the IME's pending text.
    this.composer.addEventListener("input", (e) => {
      if (e.isComposing) return;
      syncListFormatting(this.composer);
    });

    // Refresh on both input and compositionend so uncommitted IME text also filters candidates.
    this.composer.addEventListener("input", () => this.scheduleDraftSave());
    this.composer.addEventListener("input", () => this.suggest?.refresh());
    this.composer.addEventListener("compositionend", () => this.suggest?.refresh());
    this.composer.addEventListener("blur", () => this.suggest?.notifyBlur());

    // Wrap detection via offsetTop, which padding changes don't affect, so the
    // ResizeObserver cannot loop.
    const updateToolbarWrapped = () => {
      const buttons = toolbar.querySelectorAll<HTMLElement>(".wrot-toolbar-btn");
      if (buttons.length < 2) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      const wrapped = last.offsetTop > first.offsetTop;
      toolbar.toggleClass("wrot-toolbar-wrapped", wrapped);
      // Visual-only offset: removing the margin itself would change the wrap it depends on and oscillate.
      const prev = buttons[buttons.length - 2];
      last.toggleClass("wrot-toolbar-row-start", last.offsetTop > prev.offsetTop);
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
      this.composer?.getBoundingClientRect();
    });

    this.restoreDraft();
  }

  private openImagePicker(): void {
    if (this.pendingImage) return;
    const input = createEl("input");
    input.type = "file";
    input.accept = "image/png, image/gif, image/jpeg";
    input.multiple = false;
    input.hide();
    activeDocument.body.appendChild(input);

    this.imageAddBtn?.toggleClass("wrot-toolbar-active", true);
    const deactivate = () => {
      this.imageAddBtn?.toggleClass("wrot-toolbar-active", false);
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
    this.pendingShrink = this.plugin.settings.shrinkImages ? shrinkImage(file) : null;
    this.pendingImageUrl = URL.createObjectURL(file);
    this.renderThumbnail();
    this.updateImageAddBtnState();
    this.updateSubmitBtnState();
  }

  private async pendingImageForSave(): Promise<File | null> {
    const original = this.pendingImage;
    const shrink = this.pendingShrink;
    if (!original) return null;
    return shrink ? await shrink : original;
  }

  private clearPendingImage(): void {
    if (this.pendingImageUrl) {
      URL.revokeObjectURL(this.pendingImageUrl);
      this.pendingImageUrl = null;
    }
    this.pendingImage = null;
    this.pendingShrink = null;
    if (this.thumbnailContainer) {
      this.thumbnailContainer.empty();
      this.thumbnailContainer.hide();
    }
    this.updateImageAddBtnState();
    this.updateSubmitBtnState();
  }

  private renderThumbnail(): void {
    if (!this.thumbnailContainer || !this.pendingImageUrl) return;
    this.thumbnailContainer.empty();
    this.thumbnailContainer.show();
    const wrap = this.thumbnailContainer.createDiv({ cls: "wrot-thumbnail" });
    const img = wrap.createEl("img", { cls: "wrot-thumbnail-img" });
    img.src = this.pendingImageUrl;
    const removeBtn = wrap.createEl("button", { cls: "wrot-thumbnail-remove" });
    setIcon(removeBtn, "x");
    removeBtn.setAttr("aria-label", t("view.image.removeAria"));
    removeBtn.addEventListener("mousedown", (e) => e.preventDefault());
    removeBtn.addEventListener("click", () => this.clearPendingImage());
  }

  private setPendingQuote(marker: string | null): void {
    this.pendingQuote = marker;
    this.renderPendingQuote();
    this.updateSubmitBtnState();
  }

  private renderPendingQuote(): void {
    const container = this.quoteContainer;
    if (!container) return;
    container.empty();
    const link = this.pendingQuote?.slice(2, -2).match(QUOTE_LINK_RE);
    if (!link) {
      container.hide();
      return;
    }
    container.show();
    const wrap = container.createDiv({ cls: "wrot-pending-quote" });
    const slot = wrap.createDiv({ cls: "wrot-quote-card-slot" });
    renderQuoteCard(slot, link[1], link[2], this.app, "", {
      timestampFormat: this.plugin.settings.timestampFormat,
      resolveRuleClass: (content) => this.plugin.getTagRuleClassForContent(content),
      checkStrikethrough: this.plugin.settings.checkStrikethrough,
    });
    const card = slot.querySelector<HTMLElement>(".wrot-quote-card");
    card?.removeAttribute("role");
    card?.removeAttribute("tabindex");
    const removeBtn = wrap.createEl("button", { cls: "wrot-thumbnail-remove" });
    setIcon(removeBtn, "x");
    removeBtn.setAttr("aria-label", t("view.quote.removeAria"));
    removeBtn.addEventListener("mousedown", (e) => e.preventDefault());
    removeBtn.addEventListener("click", () => {
      this.setPendingQuote(null);
      this.scheduleDraftSave();
    });
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
      if (disabled) btn.setAttr("data-wrot-was-disabled", "1");
      else btn.removeAttribute("data-wrot-was-disabled");
      return;
    }
    btn.toggleClass("wrot-toolbar-disabled", disabled);
    btn.disabled = disabled;
  }

  private updateSubmitBtnState(): void {
    if (!this.submitBtnEl) return;
    const hasContent = this.hasTypedText() || this.pendingImage !== null || this.pendingQuote !== null;
    this.submitBtnEl.toggleClass("wrot-submit-active", hasContent);
  }

  private closeArmedOpener(text: string): string {
    const armed = this.composer.armedOpener();
    if (!armed) return text;
    const start = armed.pos + armed.marker.length;
    const lineEnd = text.indexOf("\n", start) === -1 ? text.length : text.indexOf("\n", start);
    const body = text.slice(start, lineEnd);
    const core = body.trim();
    const before = text.slice(0, armed.pos);
    const after = text.slice(lineEnd);
    if (!core) return before + body + after;
    // A delimiter only counts with no space on its inner side, so wrap the trimmed text.
    const lead = body.slice(0, body.length - body.trimStart().length);
    const trail = body.slice(body.trimEnd().length);
    const gap = !lead && before !== "" && !/\s/.test(before.slice(-1)) ? " " : "";
    return before + gap + lead + armed.marker + core + armed.marker + trail + after;
  }

  // A bold/italic switched on with nothing typed yet leaves only its opener in the field,
  // which visual mode does not even show; that is not something to post.
  private hasTypedText(): boolean {
    const text = this.composer.value.trim();
    if (!text) return false;
    const opener = this.activeFormatMode === "bold" ? "**" : this.activeFormatMode === "italic" ? "*" : null;
    return text !== opener;
  }

  private isEditingTarget(memo: Memo): boolean {
    return this.editingMemo?.time === memo.time;
  }

  private enterEditMode(memo: Memo, filePath: string): void {
    this.savedDraft = {
      text: this.composer.value,
      image: this.pendingImage,
      quote: this.pendingQuote,
      selStart: this.composer.selectionStart,
      selEnd: this.composer.selectionEnd,
    };
    this.clearPendingImage();
    const { text: body, quote } = splitTrailingQuote(memo.content);
    this.setPendingQuote(quote);
    this.editingMemo = { time: memo.time, filePath };
    this.activeFormatMode = null;
    // The caret lands at the end of the recalled text. If that end is a tag, pad
    // it with the same trailing space the tag completion inserts — otherwise the
    // caret would sit inside the tag and pop the suggest dropdown right away.
    // A trailing space is trimmed away on submit, so the content stays intact.
    const content = new RegExp(`${TAG_SOURCE}$`).test(body) ? `${body} ` : body;
    this.composer.value = content;
    // Order matters: gaining focus momentarily resets the selection to 0 — the
    // first line — and the toolbar state computed at that instant would stick
    // (e.g. a lit list button on a list-starting memo). Place the caret after
    // focus(), then fire input so every dependent state (toolbar highlights,
    // submit button) is recomputed synchronously with the final caret.
    this.composer.focus();
    this.composer.selectionStart = this.composer.selectionEnd = this.composer.value.length;
    this.composer.dispatchEvent(new Event("input"));
    this.refreshSubmitButton();
    this.applyEditModeClasses();
  }

  private exitEditMode(): void {
    if (!this.editingMemo) return;
    this.editingMemo = null;
    this.activeFormatMode = null;
    const draft = this.savedDraft;
    this.composer.value = draft?.text ?? "";
    this.clearPendingImage();
    if (draft?.image) this.setPendingImage(draft.image);
    this.setPendingQuote(draft?.quote ?? null);
    this.savedDraft = null;
    // Same order as enterEditMode: focus first (gaining focus transiently
    // resets the selection), then restore the draft's caret, then fire input
    // so all dependent state is recomputed with the final caret.
    this.composer.focus();
    const len = this.composer.value.length;
    this.composer.setSelectionRange(
      Math.min(draft?.selStart ?? len, len),
      Math.min(draft?.selEnd ?? len, len)
    );
    this.composer.dispatchEvent(new Event("input"));
    this.refreshSubmitButton();
    this.applyEditModeClasses();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; a missed clear is picked up on the next render
    this.catchUpToToday();
  }

  // Mirrors renderMemoCard's classes for mode changes that happen without a re-render.
  private applyEditModeClasses(): void {
    const editing = this.editingMemo;
    const targetClass = editing
      ? `wrot-block-id-wr-${blockTimeOf(editing.time)}`
      : null;
    this.contentEl.querySelectorAll<HTMLElement>(".wrot-card").forEach((card) => {
      const isTarget = targetClass !== null && card.classList.contains(targetClass);
      card.classList.toggle("wrot-card-editing", isTarget);
      card.classList.toggle("wrot-card-menu-locked", editing !== null && !isTarget);
      this.setEditingAccentVars(card, isTarget);
    });
  }

  // Inline vars override the stylesheet's theme-accent defaults; removing them restores the fallback.
  private setEditingAccentVars(card: HTMLElement, editing: boolean): void {
    const ruleClass = ruleClassOf(card);
    const accent = editing && ruleClass ? this.plugin.getRuleAccentColor(ruleClass) : null;
    if (accent) {
      card.style.setProperty("--wrot-editing-ring-color", hexRgba(accent, 0.45));
      card.style.setProperty("--wrot-editing-tint-color", hexRgba(accent, 0.07));
      card.style.setProperty("--wrot-editing-accent", accent);
    } else {
      card.style.removeProperty("--wrot-editing-ring-color");
      card.style.removeProperty("--wrot-editing-tint-color");
      card.style.removeProperty("--wrot-editing-accent");
    }
  }

  // Obsidian's own editor settings; getConfig is not in the public typings.
  private obsidianConfig(key: string): unknown {
    return (this.app.vault as unknown as { getConfig(key: string): unknown }).getConfig(key);
  }

  private indentUnit(): string {
    if (this.obsidianConfig("useTab") !== false) return "\t";
    const size = this.obsidianConfig("tabSize");
    return " ".repeat(typeof size === "number" && size > 0 ? size : 4);
  }

  private attachmentFolder(): string | undefined {
    const { useCustomAttachmentFolder, attachmentFolder } = this.plugin.settings;
    return useCustomAttachmentFolder ? attachmentFolder : undefined;
  }

  // The opening fence line is left untouched: quotes and pins resolve through its timestamp and block ID.
  private async applyEdit(rawText: string): Promise<void> {
    const target = this.editingMemo;
    if (!target) return;
    const file = this.app.vault.getAbstractFileByPath(target.filePath);
    if (!(file instanceof TFile)) {
      this.exitEditMode();
      return;
    }
    try {
      let bodyText = joinQuote(rawText, this.pendingQuote);
      const image = await this.pendingImageForSave();
      if (image) {
        const savedFile = await saveImageToVault(
          this.app,
          image,
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
          await this.plugin.rememberTags(usedTags);
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
    const typed = this.hasTypedText();
    if (!typed && !this.pendingImage && !this.pendingQuote) return;
    const text = this.activeFormatMode ? this.closeArmedOpener(this.composer.value) : this.composer.value;
    this.activeFormatMode = null;
    const rawText = typed ? padLineTimes(toTildeFences(text.trim().replace(/＃/g, "#"))) : "";

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
      const settings = this.plugin.settings;
      const templateGone = settings.postHeading !== "" && !dailyNoteTemplateFile(this.app);
      if (templateGone) {
        settings.postHeading = "";
        await this.plugin.saveSettings();
        new Notice(t("view.notice.postHeadingNoTemplate"));
      }

      const existed = getDailyNoteFile(this.app, this.currentDate) !== null;
      const file = await getOrCreateDailyNote(
        this.app,
        this.currentDate,
        templateGone
      );
      if (!existed) await waitForTemplater(this.app, file);

      let bodyText = joinQuote(rawText, this.pendingQuote);
      const image = await this.pendingImageForSave();
      if (image) {
        const savedFile = await saveImageToVault(
          this.app,
          image,
          file,
          this.attachmentFolder()
        );
        const embed = buildEmbedLink(savedFile);
        bodyText = insertEmbedAboveBottomBlock(bodyText, embed);
      }

      this.markOwnWrite();
      const locate = headingLocator(settings.postHeading, this.currentDate);
      let headingFound = true;
      const postedTime = await appendMemo(this.app, file, bodyText, locate ? (lines) => {
        const at = locate(lines);
        headingFound = at !== null;
        return at;
      } : undefined);
      if (!headingFound && !settings.postHeadingNoticed) {
        new Notice(t("view.notice.postHeadingMissing"));
        settings.postHeadingNoticed = true;
        await this.plugin.saveSettings();
      }

      // No limit check: the armed day already holds its place (scheduledClaimCount).
      if (this.armedSchedule) {
        settings.scheduledPins = [
          { timestamp: postedTime, file: file.path, from: this.armedSchedule },
          ...settings.scheduledPins,
        ];
        await this.plugin.savePins();
        this.setArmedSchedule(null);
      }
      // Dropped without pinning if the checkboxes were taken out before posting.
      if (this.armedRepeat) {
        this.armedRepeat = false;
        if (hasCheckbox(bodyText)) {
          settings.pins = [
            { timestamp: postedTime, file: file.path, repeat: true, resetOn: moment().format("YYYY-MM-DD") },
            ...settings.pins,
          ];
          await this.plugin.savePins();
        }
      }

      // Record used tags only after a successful post. rawText already has fullwidth #
      // normalized; extraction matches the display-side tag rules.
      if (this.plugin.settings.tagSuggestEnabled) {
        const usedTags = extractTagsForHistory(rawText);
        if (usedTags.length > 0) {
          await this.plugin.rememberTags(usedTags);
        }
      }

      this.composer.value = "";
        this.activeFormatMode = null;
      this.clearPendingImage();
      this.setPendingQuote(null);
      this.composer.dispatchEvent(new Event("input"));
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

      await this.resetRepeatPins();
      const { pins, scheduledPins } = this.plugin.settings;
      const arrived: ScheduledPinEntry[] = [];
      const notYet: ScheduledPinEntry[] = [];
      for (const entry of scheduledPins) {
        if (this.isScheduleDue(entry)) arrived.push(entry);
        else notYet.push(entry);
      }
      const byHand = await this.resolvePinEntries(pins);
      const bySchedule = await this.resolvePinEntries(arrived);
      // Waiting pins are read only to learn whether their memo still exists.
      const byWait = await this.resolvePinEntries(notYet);
      // A recurring pin is today's checklist, so other days leave it in its own slot.
      const shownByHand = isToday
        ? byHand.resolved
        : byHand.resolved.filter((p) => !this.isRepeatPinned(p.memo, p.filePath));
      const pinnedResolved = [
        ...shownByHand.map((p) => ({ ...p, fromSchedule: false })),
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
        settings.scheduledPins = settings.scheduledPins.filter((p) => !stale.has(p));
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

      // Posts under a heading and at the note's end can mix, so order by time; unparsable ones keep their slot.
      const parsed = parseMemos(content);
      const timeOf = (memo: Memo): number => Date.parse(memo.time);
      const timed = parsed.filter((m) => !isNaN(timeOf(m))).sort((a, b) => timeOf(b) - timeOf(a));
      let next = 0;
      const memos = parsed.map((m) => (isNaN(timeOf(m)) ? m : timed[next++]));

      let rendered = 0;
      for (const memo of memos) {
        const key = pinKey(file.path, memo.time);
        if (pinnedKeys.has(key)) continue;
        // Pinned memos above are deliberately exempt: pinning names a single memo,
        // which outranks a rule that hides a whole tag.
        if (this.plugin.matchesRuleFlag(memo.tags, (rule) => rule.hideFromTimeline === true)) continue;
        this.renderMemoCard(memo, {
          pinned: false,
          filePath: file.path,
          waitingSchedule: waiting.has(key),
        });
        rendered++;
      }

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

  // Never drops typed text: the edit buffer stays and the stashed draft is appended after it.
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
    const typed = this.composer.value;
    const draft = this.savedDraft?.text ?? "";
    const draftImage = this.savedDraft?.image ?? null;
    const draftQuote = this.savedDraft?.quote ?? null;
    this.editingMemo = null;
    this.savedDraft = null;
    this.composer.value = typed && draft ? `${typed}\n\n${draft}` : typed || draft;
    if (draftImage && !this.pendingImage) this.setPendingImage(draftImage);
    if (draftQuote && !this.pendingQuote) this.setPendingQuote(draftQuote);
    this.composer.dispatchEvent(new Event("input"));
    this.refreshSubmitButton();
    this.applyEditModeClasses();
  }

  private renderEmptyState(): void {
    this.listContainer.createDiv({
      cls: "wrot-empty",
      text: t("view.empty.noMemos"),
    });
  }

  private clearPinnedContainer(): void {
    this.pinnedContainer?.remove();
    this.pinnedContainer = null;
  }

  private ensurePinnedContainer(): HTMLElement {
    if (this.pinnedContainer) return this.pinnedContainer;
    const container = createDiv({ cls: "wrot-pinned-section" });
    if (this.plugin.settings.pinFixed) {
      container.addClass("wrot-pinned-fixed");
      this.listContainer.insertAdjacentElement("beforebegin", container);
    } else {
      this.listContainer.prepend(container);
    }
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

  private isRepeatPinned(memo: Memo, filePath: string): boolean {
    return this.plugin.settings.pins.some((p) => p.repeat && matchesPin(p, memo, filePath));
  }

  /** Pins taken, counting the place a repeat armed on the post being written holds. */
  private pinClaimCount(): number {
    return this.plugin.settings.pins.length + (this.armedRepeat ? 1 : 0);
  }

  /** Starts each repeating pin's day afresh on the first render of that day. The note is not touched. */
  private async resetRepeatPins(): Promise<void> {
    const today = moment().format("YYYY-MM-DD");
    const due = () => this.plugin.settings.pins.filter((p) => p.repeat && p.resetOn !== today);
    if (due().length === 0) return;
    // Another device may have cleared today already; its record, once synced, stops a second clear.
    await this.plugin.reloadPins();
    const pending = due();
    if (pending.length === 0) return;
    for (const pin of pending) {
      pin.resetOn = today;
      pin.renewed = true;
      delete pin.checks;
    }
    await this.plugin.savePins();
  }

  /** The scheduled pin on this memo, whether its day has come or not. */
  private findScheduledPin(memo: Memo, filePath: string): ScheduledPinEntry | undefined {
    return this.plugin.settings.scheduledPins.find((p) => matchesPin(p, memo, filePath));
  }

  /**
   * How much of the scheduled allowance is spoken for. A day armed on the post being
   * written holds a place of its own: it is claimed the moment it is armed, so the
   * post it was armed for cannot find the allowance gone by the time it is written.
   */
  private scheduledClaimCount(): number {
    return this.plugin.settings.scheduledPins.length + (this.armedSchedule ? 1 : 0);
  }

  /** Whether a scheduled pin's day has arrived. Compared by day, never by clock time. */
  private isScheduleDue(entry: ScheduledPinEntry): boolean {
    return moment(entry.from, "YYYY-MM-DD").isSameOrBefore(moment(), "day");
  }

  // Same verdict as refresh: a pin whose note is missing or not yet re-read after sync stays.
  private async cleanupOrphanPins(): Promise<boolean> {
    const settings = this.plugin.settings;
    const stale = new Set<PinEntry>([
      ...(await this.resolvePinEntries(settings.pins)).stale,
      ...(await this.resolvePinEntries(settings.scheduledPins)).stale,
    ]);
    if (stale.size === 0) return false;
    settings.pins = settings.pins.filter((p) => !stale.has(p));
    settings.scheduledPins = settings.scheduledPins.filter((p) => !stale.has(p));
    await this.plugin.savePins();
    return true;
  }

  private async addPin(memo: Memo, filePath: string, repeat = false): Promise<void> {
    await this.cleanupOrphanPins();
    const limit = this.plugin.settings.pinLimit;
    if (this.pinClaimCount() >= limit) return;
    if (this.isPinned(memo, filePath) || this.findScheduledPin(memo, filePath)) return;
    this.plugin.settings.pins = [
      repeat
        ? { timestamp: memo.time, file: filePath, repeat, resetOn: moment().format("YYYY-MM-DD") }
        : { timestamp: memo.time, file: filePath },
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
      ...settings.scheduledPins,
    ];
    await this.plugin.savePins();
    await this.refresh();
  }

  private async removePin(memo: Memo, filePath: string): Promise<void> {
    const settings = this.plugin.settings;
    const before = settings.pins.length + settings.scheduledPins.length;
    settings.pins = settings.pins.filter((p) => !matchesPin(p, memo, filePath));
    settings.scheduledPins = settings.scheduledPins.filter(
      (p) => !matchesPin(p, memo, filePath)
    );
    if (settings.pins.length + settings.scheduledPins.length !== before) {
      await this.plugin.savePins();
    }
    await this.cleanupOrphanPins();
    await this.refresh();
  }

  // Outlives its menu so a native menu can carry the first press into a reopening; expires on its own.
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
          const before = settings.pins.length + settings.scheduledPins.length;
          settings.pins = settings.pins.filter((p) => !matchesPin(p, memo, file.path));
          settings.scheduledPins = settings.scheduledPins.filter(
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
    memo: Memo | null,
    onPick: (from: string) => void
  ): void {
    const earliest = moment().add(1, "day").startOf("day");
    if (memo) this.beginScheduling(memo);
    // Closing puts the trigger's light out, which for the toolbar button is the light
    // that says a day is armed. Restore it once the picker is gone.
    const afterClose = () => {
      this.endScheduling();
      this.setArmedSchedule(this.armedSchedule);
    };
    if (!Platform.isMobile) {
      this.schedulePopover?.close();
      // Relit after a tick: the closing card menu's hide handler clears the lit state after this runs.
      window.setTimeout(() => trigger.toggleClass("wrot-toolbar-active", true), 0);
      // The popover is positioned once, so the list is scrolled to fit it and then held still while it is open.
      const fitIntoView = () => {
        const popover = this.schedulePopover;
        if (!popover) return;
        const overflow =
          popover.el.getBoundingClientRect().bottom -
          this.contentEl.getBoundingClientRect().bottom +
          8;
        if (overflow > 0) {
          // The last card has no scroll room below, so a measured floor (--wrot-list-floor, set as a property) is added.
          this.listContainer.setCssProps({ "--wrot-list-floor": `${overflow}px` });
          this.listContainer.scrollTop += overflow;
          popover.reposition();
        }
        // Held by refusing the scroll outright rather than by putting it back: undoing
        // each frame fights the momentum and the list shudders.
        this.listContainer.addClass("wrot-list-held");
      };
      this.schedulePickerAnchor = trigger;
      const form = trigger.closest<HTMLElement>(".wrot-input-area") ?? undefined;
      this.schedulePopover = openCalendarPopover({
        anchor: trigger,
        alignTo: form,
        container: this.contentEl,
        initialDate: earliest,
        minDate: earliest,
        onSelect: (date) => onPick(date.format("YYYY-MM-DD")),
        onClose: () => {
          this.listContainer.removeClass("wrot-list-held");
          this.listContainer.setCssProps({ "--wrot-list-floor": "0px" });
          this.schedulePopover = null;
          this.schedulePickerAnchor = null;
          trigger.toggleClass("wrot-toolbar-active", false);
          afterClose();
        },
      });
      // The handle has to exist before the fit can measure it, and the popover needs
      // a frame on screen before its box is worth measuring.
      window.requestAnimationFrame(fitIntoView);
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
    this.openDrumMenu(trigger, {
      earliest,
      icon: "clock-fading",
      onPick: (date) => onPick(date.format("YYYY-MM-DD")),
      afterClose,
    });
  }

  private openDrumMenu(
    trigger: HTMLElement,
    opts: {
      earliest: ReturnType<typeof moment>;
      start?: ReturnType<typeof moment>;
      icon: string;
      onPick: (date: ReturnType<typeof moment>) => void;
      afterClose?: () => void;
    }
  ): void {
    this.openMenu(
      trigger,
      (menu) => {
        let chosen = (opts.start ?? opts.earliest).clone();
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
          itemDom.className = "wrot-menu-drum";
          // Capture: the item's own click listener sits on this same element, past a bubbling stop.
          itemDom.addEventListener("click", (e) => e.stopPropagation(), { capture: true });
          buildDateDrum(itemDom, {
            earliest: opts.earliest,
            start: opts.start,
            lastYear: WrotView.SCHEDULE_LAST_YEAR,
            onChange: (date) => {
              chosen = date;
              renderChosen();
            },
          });
        });

        menu.addItem((item) => {
          confirmItem = item;
          (item as { dom?: HTMLElement }).dom?.classList.add("wrot-menu-schedule-confirm");
          item.setIcon(opts.icon).onClick(() => opts.onPick(chosen));
          renderChosen();
        });
      },
      0,
      opts.afterClose,
      Platform.isTablet && trigger.closest(".wrot-input-area") !== null
    );
  }

  private setArmedSchedule(from: string | null): void {
    this.armedSchedule = from;
    if (from !== null) this.armedRepeat = false;
    if (!this.scheduleArmBtn) return;
    this.scheduleArmBtn.toggleClass("wrot-toolbar-active", from !== null);
    // An armed day keeps the button enabled even when full, so it can still be taken off.
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
      ? `wrot-block-id-wr-${blockTimeOf(time)}`
      : null;
    this.contentEl.querySelectorAll<HTMLElement>(".wrot-card").forEach((card) => {
      const isTarget = targetClass !== null && card.classList.contains(targetClass);
      card.classList.toggle("wrot-card-menu-locked", time !== null && !isTarget);
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
    const card = host.createDiv({ cls: "wrot-card" });
    if (options.pinned) card.classList.add("wrot-card-pinned");
    card.classList.add(`wrot-block-id-wr-${blockTimeOf(memo.time)}`);
    // State-driven so the classes survive any full re-render during an edit.
    if (this.isEditingTarget(memo)) card.classList.add("wrot-card-editing");
    else if (this.editingMemo) card.classList.add("wrot-card-menu-locked");
    const ruleClass = this.plugin.ruleClassFor(memo.tags);
    if (ruleClass) card.classList.add(ruleClass);
    // After the rule class: the accent vars are resolved from it.
    if (this.isEditingTarget(memo)) this.setEditingAccentVars(card, true);

    const contentEl = card.createDiv({ cls: "wrot-content" });
    const resolveImagePath = (fileName: string): string | null => {
      const file = this.app.metadataCache.getFirstLinkpathDest(fileName, "");
      return file ? this.app.vault.getResourcePath(file) : null;
    };
    const currentFile = getDailyNoteFile(this.app, this.currentDate);
    const currentFilePath = currentFile?.path || "";
    const checksLocked = !options.pinned && this.plugin.isRepeatLocked(options.filePath, memo.time);
    if (checksLocked) card.classList.add("wrot-checks-locked");
    // Today's pinned card of a recurring post from another day keeps its checks in the pin.
    const detachedPin = () =>
      this.plugin.settings.pins.find((p) => p.repeat && matchesPin(p, memo, options.filePath));
    const detached = !!options.pinned && this.plugin.isRepeatLocked(options.filePath, memo.time);
    const shownContent = detached ? withChecks(memo.content, detachedPin()?.checks ?? []) : memo.content;
    const urls = renderTextWithTagsAndUrls(contentEl, shownContent, {
      onTagClick: (tag) => this.plugin.openTagSearch(tag),
      onCheckToggle: checksLocked ? undefined : async (lineIndex, checked) => {
        if (detached) {
          const pin = detachedPin();
          if (!pin) return;
          const rest = (pin.checks ?? []).filter((i) => i !== lineIndex);
          pin.checks = checked ? [...rest, lineIndex] : rest;
          await this.plugin.savePins();
          return;
        }
        // Pins live in other days' notes.
        const file = this.app.vault.getFileByPath(options.filePath);
        if (!file) return;
        // Suppress the burst of modify events so full re-renders don't flicker the cards.
        this.ignoreModifyUntil = Date.now() + 500;
        const written = await setMemoCheckbox(this.app, file, memo.time, lineIndex, checked);
        // Re-arm after the write: a slow write can land modify past the first window and jank.
        // The strikethrough was already applied via class toggle, so no re-render is needed.
        this.ignoreModifyUntil = Date.now() + 500;
        if (!written) {
          this.ignoreModifyUntil = 0;
          this.requestRefresh();
        }
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
      vaultName: this.app.vault.getName(),
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
    });

    // Trailing media area for OGP/Twitter URL cards; inserted just before the
    // quote-card slot so quotes stay at the bottom.
    const previewUrls = urls.filter(
      (pu) => pu.type === "image" || !pu.url.startsWith("obsidian://")
    );
    if (previewUrls.length > 0) {
      const mediaEl = createDiv();
      mediaEl.className = "wrot-media-area";
      const quoteSlot = contentEl.querySelector(".wrot-quote-card-slot");
      if (quoteSlot && quoteSlot.parentNode) {
        quoteSlot.parentNode.insertBefore(mediaEl, quoteSlot);
      } else {
        card.appendChild(mediaEl);
      }
      renderUrlPreviews(mediaEl, previewUrls, this.plugin.ogpCache, resolveImagePath);
    }

    // The pin indicator lives outside the footer so it can't shift the menu button's
    // position or hit area.
    const footer = card.createDiv({ cls: "wrot-card-footer" });

    // Once a recurring pin has been cleared, it stands for a new day's checklist: show that day's start.
    const repeatPin = options.pinned
      ? this.plugin.settings.pins.find((p) => p.repeat && p.renewed && matchesPin(p, memo, options.filePath))
      : undefined;
    const shownTime = repeatPin?.resetOn ? moment(repeatPin.resetOn, "YYYY-MM-DD") : moment(memo.time);
    const fmt = this.plugin.settings.timestampFormat || "YYYY/MM/DD HH:mm:ss";
    footer.createSpan({ cls: "wrot-timestamp", text: shownTime.format(fmt) });

    const menuBtn = footer.createSpan({ cls: "wrot-menu-btn" });
    setIcon(menuBtn, "ellipsis");
    const openPostMenu = async (e: MouseEvent): Promise<void> => {
      if (this.editingMemo && !this.isEditingTarget(memo)) return;
      if (this.schedulingTime && this.schedulingTime !== memo.time) return;
      // Drop orphaned pins before evaluating the pin limit.
      await this.cleanupOrphanPins();
      const pinned = this.isPinned(memo, options.filePath);
      const scheduled = this.findScheduledPin(memo, options.filePath);
      const onBoard = pinned || (scheduled !== undefined && this.isScheduleDue(scheduled));
      const pinLimit = this.plugin.settings.pinLimit;
      const claimed = pinned || scheduled !== undefined;
      const limitReached = !claimed && this.pinClaimCount() >= pinLimit;
      const scheduleLimitReached = !claimed && this.scheduledClaimCount() >= pinLimit;
      this.openMenu(menuBtn, (menu) => {
        menu.addItem((item) =>
          item.setTitle(t("view.postMenu.copy")).setIcon("copy").onClick(async () => {
            await navigator.clipboard.writeText(memo.content);
          })
        );
        const addBlockCopy = (title: string, icon: string, texts: string[]): void => {
          const blocks = texts.filter((s) => s.trim() !== "");
          if (blocks.length === 0) return;
          menu.addItem((item) =>
            item.setTitle(title).setIcon(icon).onClick(async () => {
              if (blocks.length === 1) {
                await navigator.clipboard.writeText(blocks[0]);
                return;
              }
              this.openMenu(menuBtn, (picker) => {
                for (const text of blocks) {
                  const label = createFragment((f) =>
                    f.createSpan({ cls: "wrot-block-pick", text: text.split("\n").find((l) => l.trim() !== "")?.trim() })
                  );
                  picker.addItem((pick) =>
                    pick.setTitle(label).onClick(async () => {
                      await navigator.clipboard.writeText(text);
                    })
                  );
                }
              });
            })
          );
        };
        const segments = segmentBlocks(memo.content);
        addBlockCopy(t("view.postMenu.copyMath"), "sigma", segments.flatMap((s) => (s.kind === "mathblock" ? [s.tex] : [])));
        addBlockCopy(t("view.postMenu.copyCode"), "code", segments.flatMap((s) => (s.kind === "codeblock" ? [s.code] : [])));
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
        menu.addSeparator();
        const addLimitHint = () => {
          menu.addItem((item) => {
            item.setTitle(t("view.postMenu.pinLimitHint", { limit: pinLimit })).setDisabled(true);
            const itemDom = (item as { dom?: HTMLElement }).dom;
            itemDom?.classList.add("wrot-menu-hint", "is-label");
          });
        };
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
                this.openSchedulePicker(menuBtn, memo, (from) => {
                  // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure leaves the memo unscheduled
                  this.addScheduledPin(memo, options.filePath, from);
                });
              });
            if (scheduleLimitReached || editingThis) item.setDisabled(true);
          });
          if (scheduleLimitReached && !editingThis) addLimitHint();
          // Left out rather than disabled: it shares the pin limit, whose hint is shown above.
          if (!limitReached && !editingThis && hasCheckbox(memo.content)) {
            menu.addItem((item) => {
              item.setTitle(t("view.postMenu.repeatPin")).setIcon("repeat").onClick(async () => {
                await this.addPin(memo, options.filePath, true);
              });
            });
          }
        }
        if (this.plugin.settings.showPostDelete) {
          menu.addSeparator();
          menu.addItem((item) => {
            const locked =
              this.isEditingTarget(memo) ||
              claimed ||
              this.plugin.matchesRuleFlag(memo.tags, (rule) => rule.protectFromDelete === true);
            // Armed already when a previous opening took the first press.
            let armed = this.isDeleteArmed(memo);
            item
              .setTitle(t(armed ? "view.postMenu.deleteConfirm" : "view.postMenu.delete"))
              .setIcon("trash-2")
              .setWarning(true);
            if (locked) item.setDisabled(true);

            const itemDom = (item as { dom?: HTMLElement }).dom;
            // Read by the CSS mobile press-state reset: this row outlives its press, so its stuck touch state is always neutralised.
            itemDom?.classList.add("wrot-menu-delete");

            // DOM menus close on click: the first press is swallowed in capture and the row reworded; the second reaches onClick.
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
              // Unarmed here means a native menu (no row to reword), so the confirm is a second opening.
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
      });
    };

    menuBtn.addEventListener("click", (e) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; a failure just leaves the menu closed
      openPostMenu(e);
    });

    if (options.pinned) {
      const pinIndicator = card.createSpan({ cls: "wrot-pin-indicator" });
      // Solid pin = arrived from a schedule; the two kinds spend separate allowances.
      if (options.fromSchedule) pinIndicator.addClass("wrot-pin-indicator-filled");
      setIcon(pinIndicator, this.isRepeatPinned(memo, options.filePath) ? "repeat" : "pin");
    } else if (options.waitingSchedule) {
      const scheduleIndicator = card.createSpan({
        cls: "wrot-pin-indicator wrot-schedule-indicator",
      });
      setIcon(scheduleIndicator, "clock-fading");
    } else if (this.isRepeatPinned(memo, options.filePath)) {
      setIcon(card.createSpan({ cls: "wrot-pin-indicator" }), "repeat");
    }
  }

  private async insertQuoteToForm(memo: Memo, srcFilePath: string): Promise<void> {
    const blockId = `wr-${blockTimeOf(memo.time)}`;
    const srcFile = this.app.vault.getAbstractFileByPath(srcFilePath);
    if (!(srcFile instanceof TFile)) return;
    this.markOwnWrite();
    await ensureBlockIdOnFence(this.app, srcFile, memo.time, blockId);
    this.setPendingQuote(`[[${srcFile.basename}#^${blockId}]]`);
    this.composer.focus();
    this.composer.dispatchEvent(new Event("input"));
  }

  private updateToolbarActive(listBtn: HTMLElement, checkBtn: HTMLElement, olBtn: HTMLElement): void {
    const { isList, isCheck, isOl } = lineMarkerState(this.composer);
    listBtn.toggleClass("wrot-toolbar-active", isList);
    checkBtn.toggleClass("wrot-toolbar-active", isCheck);
    olBtn.toggleClass("wrot-toolbar-active", isOl);
  }

  /**
   * Actions currently off the bar, in the menu's own order rather than the bar's. Where a
   * button sat before it was put away says nothing about where it is easiest to find here.
   */
  private hiddenActions(): ToolbarAction[] {
    const hidden = new Set(
      this.toolbarLayout.filter((slot) => slot.state === "menu").map((slot) => slot.id)
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
      if (slot.state === "bar" || this.toolbarEditing) toolbar.appendChild(btn);
      else btn.detach();
      btn.toggleClass("wrot-toolbar-off", this.toolbarEditing && slot.state !== "bar");
      btn.toggleClass("wrot-toolbar-disabled-slot", this.toolbarEditing && slot.state === "off");
    }
    if (this.toolbarDoneBtnEl) {
      if (this.toolbarEditing) toolbar.appendChild(this.toolbarDoneBtnEl);
      else this.toolbarDoneBtnEl.detach();
    }
    toolbar.appendChild(this.formatBtnEl);
    toolbar.toggleClass("wrot-toolbar-editing", this.toolbarEditing);
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
        btn.removeClass("wrot-toolbar-active");
        btn.removeClass("wrot-toolbar-ime-muted");
      }
    }
  }

  /** Insertion needs something to wrap, so those buttons stay out of reach without a selection. */
  private updateSelectionBtns(): void {
    const empty = this.composer
      ? this.composer.selectionStart === this.composer.selectionEnd
      : true;
    for (const action of this.toolbarActions) {
      // Bold and italic keep their own state (updateFormatBtns), the link button its own.
      const blockable = action.id === "code" || action.id === "math";
      if (!action.needsSelection && !blockable) continue;
      const btn = this.toolbarBtns.get(action.id);
      if (btn) this.setBtnDisabled(btn, (!!action.needsSelection && empty) || this.effectBlockedFor(action.id));
    }
  }

  /** Whether the action would put code or math together with another effect (effectBlocked). */
  private effectBlockedFor(id: string): boolean {
    const kind = EFFECT_KIND[id];
    return !!kind && !!this.composer && effectBlocked(this.composer, kind);
  }

  private setToolbarEditing(on: boolean): void {
    if (on && (this.editingMemo || !this.plugin.settings.toolbarEditEnabled)) return;
    if (this.toolbarEditing === on) return;
    this.toolbarEditing = on;
    for (const btn of this.toolbarBtns.values()) {
      if (on) {
        if (btn.disabled) btn.setAttr("data-wrot-was-disabled", "1");
        btn.disabled = false;
        btn.removeClass("wrot-toolbar-disabled");
      } else if (btn.getAttribute("data-wrot-was-disabled")) {
        btn.removeAttribute("data-wrot-was-disabled");
        btn.disabled = true;
        btn.addClass("wrot-toolbar-disabled");
      }
    }
    this.contentEl.toggleClass("wrot-toolbar-arranging", on);
    if (this.composer) this.composer.readOnly = on;
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
    let grabX = 0;
    let grabY = 0;

    const lift = (btn: HTMLElement) => {
      const box = btn.getBoundingClientRect();
      gap = createDiv({ cls: "wrot-toolbar-gap" });
      gap.setCssStyles({ width: `${box.width}px`, height: `${box.height}px` });
      toolbar.insertBefore(gap, btn);
      btn.addClass("wrot-toolbar-dragging");
      // Size restated (nothing lays it out now) and pointer-transparent so hit-testing finds what it passes over.
      btn.setCssStyles({
        left: `${box.left}px`,
        top: `${box.top}px`,
        width: `${box.width}px`,
        height: `${box.height}px`,
      });
      // On the body: mobile wraps panes in a transformed ancestor, which would make position:fixed measure from it.
      activeDocument.body.appendChild(btn);
    };

    const drop = (btn: HTMLElement) => {
      btn.removeClass("wrot-toolbar-dragging");
      btn.setCssStyles({
        left: "",
        top: "",
        width: "",
        height: "",
      });
      if (gap) {
        toolbar.insertBefore(btn, gap);
        gap.remove();
        gap = null;
      }
    };

    this.registerDomEvent(toolbar, "pointerdown", (e: PointerEvent) => {
      if (!this.toolbarEditing) return;
      const btn = (e.target as HTMLElement | null)?.closest<HTMLElement>(".wrot-toolbar-btn");
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
      const over = under?.closest<HTMLElement>(".wrot-toolbar-btn");
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
        this.toggleToolbarSlot(btn.getAttribute("data-wrot-action"));
      }
    };
    this.registerDomEvent(toolbar, "pointerup", release);
    this.registerDomEvent(toolbar, "pointercancel", release);
  }

  private toggleToolbarSlot(id: string | null): void {
    if (!id) return;
    const slot = this.toolbarLayout.find((s) => s.id === id);
    if (!slot) return;
    slot.state = slot.state === "bar" ? "menu" : slot.state === "menu" ? "off" : "bar";
    this.readOrderFromBar();
  }

  /**
   * Takes the bar as the record of what has been arranged so far. Held in memory only:
   * nothing reaches layout.json until the arrangement is confirmed.
   */
  private readOrderFromBar(): void {
    const toolbar = this.toolbarEl;
    if (!toolbar) return;
    const slotById = new Map(this.toolbarLayout.map((s) => [s.id, s]));
    const ordered: ToolbarSlot[] = [];
    for (const el of Array.from(toolbar.children)) {
      const id = el.getAttribute("data-wrot-action");
      const slot = id ? slotById.get(id) : undefined;
      if (!id || !slot) continue;
      ordered.push({ ...slot });
      slotById.delete(id);
    }
    for (const slot of slotById.values()) ordered.push({ ...slot });
    this.toolbarLayout = ordered;
    this.applyToolbarLayout();
  }

  /**
   * What the link button would act on: the link under the caret or selection (to edit), or
   * the selected text (to link). Null when there is neither.
   */
  private linkTarget(): { edit: ReturnType<typeof findLinkAt>; from: number; to: number } | null {
    const ta = this.composer;
    if (!ta) return null;
    const from = ta.selectionStart;
    const to = ta.selectionEnd;
    if (effectBlocked(ta, "decoration")) return null;
    const edit = findLinkAt(ta.value, from, to);
    if (edit) return { edit, from: edit.from, to: edit.to };
    if (from === to || !isLinkableText(ta.value.slice(from, to))) return null;
    return { edit: null, from, to };
  }

  private updateLinkBtn(linkBtn: HTMLButtonElement): void {
    const target = this.linkTarget();
    linkBtn.toggleClass("wrot-toolbar-active", !!target?.edit);
    this.setBtnDisabled(linkBtn, !target);
  }

  /** The link button: asks where the selected text (or the link at the caret) should point. */
  private openLinkEditor(): void {
    const target = this.linkTarget();
    const anchor = this.toolbarEl?.closest<HTMLElement>(".wrot-input-area");
    if (!target || !anchor) return;
    this.linkPopover?.close();
    const ta = this.composer;
    const { edit, from, to } = target;
    const text = edit ? edit.text : ta.value.slice(from, to);
    const write = (insert: string): void => {
      ta.view.dispatch({ changes: { from, to, insert }, selection: { anchor: from + insert.length } });
      ta.focus();
      ta.dispatchEvent(new Event("input"));
    };
    const writeNew = (link: string): void => {
      const val = ta.value;
      if (insideDecoration(val, from, to)) return write(link);
      const lead = spaceBefore(val.slice(from - 1, from));
      write(lead + link + spaceAfter(val.slice(to, to + 1)));
    };
    const holder = {};
    ta.holdRange({ from, to }, holder);
    this.linkPopover = openLinkPopover({
      app: this.app,
      anchor,
      container: this.contentEl,
      initial: edit?.target,
      editing: !!edit,
      onSubmit: (dest) => (edit ? write : writeNew)(linkMarkdown(text, dest)),
      onUnlink: () => write(text),
      onClose: (outside) => {
        this.linkPopover = null;
        ta.holdRange(null, holder);
        if (!outside && !ta.hasFocus) ta.focus();
      },
    });
  }

  /**
   * A menu acting on the form's selection. On mobile the menu takes the focus and the
   * selection stops being drawn (it is still there), so it is painted held until the menu
   * closes. Held after opening: opening hides any earlier menu, whose close would clear it.
   * On mobile a menu also finishes closing after its item has run, so a hold taken by what
   * the item opened (the link window) must survive that close: clearing is per holder.
   */
  private openComposerMenu(
    trigger: HTMLElement,
    buildMenu: (m: Menu) => void,
    yOffset = 0,
    alignRight = false
  ): void {
    const ta = this.composer;
    const holder = {};
    this.openMenu(trigger, buildMenu, yOffset, () => ta.holdRange(null, holder), alignRight);
    if (Platform.isMobile && ta.selectionStart !== ta.selectionEnd) {
      ta.holdRange({ from: ta.selectionStart, to: ta.selectionEnd }, holder);
    }
  }

  // yOffset: positive = down.
  openMenu(
    trigger: HTMLElement,
    buildMenu: (m: Menu) => void,
    yOffset = 0,
    onHide?: () => void,
    alignRight = false
  ): void {
    if (this.currentMenu) {
      this.currentMenu.hide();
    }

    const menu = new Menu();
    buildMenu(menu);

    const menuDom = (menu as { dom?: HTMLElement }).dom;
    menuDom?.classList.add("wrot-menu");

    trigger.toggleClass("wrot-toolbar-active", true);
    this.currentMenu = menu;

    let stopTracking: (() => void) | null = null;
    let stopFitting: (() => void) | null = null;

    menu.onHide(() => {
      stopTracking?.();
      stopTracking = null;
      stopFitting?.();
      stopFitting = null;
      // On mobile an older menu finishes closing late; only the current menu clears the trigger's light.
      if (this.currentMenu === menu) {
        trigger.toggleClass("wrot-toolbar-active", false);
        this.currentMenu = null;
        onHide?.();
      }
    });

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
      const host = trigger.closest(".wrot-input-area") ?? trigger;
      // How wide the menu is only becomes known once it is up, so the edges are matched
      // afterwards. Clamped at the window edge, which a wide menu on a narrow pane reaches.
      let lastLeft = Number.NaN;
      let lastTop = Number.NaN;
      let frame = 0;
      // Polled per frame: dragging the pane divider moves the form without any resize signal to observe.
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
