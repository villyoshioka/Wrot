import { App, TFile, setIcon } from "obsidian";
import { t } from "../i18n";

interface LinkPopoverOptions {
  app: App;
  anchor: HTMLElement;
  // Parent that hosts the popover (the view body), so it never spills out of the pane.
  container: HTMLElement;
  // The current destination when an existing link is being edited; editing also offers unlink.
  initial?: string;
  editing: boolean;
  onSubmit: (target: string) => void;
  onUnlink: () => void;
  // Called on every close; `outside` when a press elsewhere closed it, which has a place of
  // its own to put focus.
  onClose: (outside: boolean) => void;
}

export interface LinkPopoverHandle {
  close: (outside?: boolean) => void;
}

const MAX_SUGGESTIONS = 6;
const SCHEME_RE = /^(?:https?|obsidian):\/\//i;

/**
 * Notes whose name holds the query: names that start with it first, then the most recently
 * changed. Reads only the vault's file list, which Obsidian keeps in memory, and only when
 * asked — nothing here runs at startup or touches a note's contents.
 */
function suggestNotes(app: App, query: string): TFile[] {
  const q = query.trim().toLowerCase();
  if (!q || SCHEME_RE.test(q)) return [];
  const hits: { file: TFile; prefix: boolean }[] = [];
  for (const file of app.vault.getMarkdownFiles()) {
    const name = file.basename.toLowerCase();
    const at = name.indexOf(q);
    if (at >= 0) hits.push({ file, prefix: at === 0 });
  }
  hits.sort((a, b) => Number(b.prefix) - Number(a.prefix) || b.file.stat.mtime - a.file.stat.mtime);
  return hits.slice(0, MAX_SUGGESTIONS).map((h) => h.file);
}

/** The small window the link button opens: where the selected text should point. */
export function openLinkPopover(opts: LinkPopoverOptions): LinkPopoverHandle {
  const { app, anchor, container, initial, editing, onSubmit, onUnlink, onClose } = opts;

  const popover = container.createDiv({ cls: "wrot-link-popover" });
  const row = popover.createDiv({ cls: "wrot-link-popover-row" });
  const input = row.createEl("input", {
    cls: "wrot-link-popover-input",
    attr: { type: "text", placeholder: t("view.linkPopover.placeholder"), spellcheck: "false", autocapitalize: "off" },
  });
  if (initial) input.value = initial;
  if (editing) {
    const unlink = row.createEl("button", { cls: "wrot-link-popover-unlink" });
    setIcon(unlink, "unlink");
    unlink.setAttr("aria-label", t("view.linkPopover.unlink"));
    unlink.addEventListener("click", () => {
      onUnlink();
      close();
    });
  }
  const list = popover.createDiv({ cls: "wrot-link-popover-suggest" });

  let files: TFile[] = [];
  let selected = -1;

  const submit = (target: string): void => {
    if (!target.trim()) return;
    onSubmit(target);
    close();
  };
  const pick = (file: TFile): void => submit(app.metadataCache.fileToLinktext(file, "", true));

  const renderList = (): void => {
    list.empty();
    files.forEach((file, i) => {
      const item = list.createDiv({ cls: "wrot-link-popover-item" });
      if (i === selected) item.addClass("wrot-link-popover-item-selected");
      item.createSpan({ cls: "wrot-link-popover-item-name", text: file.basename });
      const folder = file.parent && !file.parent.isRoot() ? file.parent.path : "";
      if (folder) item.createSpan({ cls: "wrot-link-popover-item-folder", text: folder });
      // Keep focus in the field: a tap that moved it would drop the mobile keyboard.
      item.addEventListener("pointerdown", (e) => e.preventDefault());
      item.addEventListener("click", () => pick(file));
    });
  };

  input.addEventListener("input", () => {
    files = suggestNotes(app, input.value);
    selected = -1;
    renderList();
  });
  // Enter that confirms an IME conversion is not a submit. WebKit fires that keydown just
  // after compositionend with isComposing already false, so the flag drops a tick late.
  let composing = false;
  input.addEventListener("compositionstart", () => (composing = true));
  input.addEventListener("compositionend", () => window.setTimeout(() => (composing = false), 0));
  input.addEventListener("keydown", (e) => {
    if (e.isComposing || composing) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (files.length === 0) return;
      e.preventDefault();
      // Steps through the notes and back to the typed text (-1) at either end.
      selected += e.key === "ArrowDown" ? 1 : -1;
      if (selected >= files.length) selected = -1;
      else if (selected < -1) selected = files.length - 1;
      renderList();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const file = files[selected];
      if (file) pick(file);
      else submit(input.value);
    }
  });

  const GAP = 4;
  const EDGE = 8;
  const position = (): void => {
    const a = anchor.getBoundingClientRect();
    const c = container.getBoundingClientRect();
    popover.style.maxWidth = `${c.width - EDGE * 2}px`;
    const w = popover.offsetWidth;
    const left = Math.max(EDGE, Math.min(a.right - c.left - w, c.width - w - EDGE));
    popover.style.top = `${a.bottom - c.top + GAP}px`;
    popover.style.left = `${left}px`;
  };

  let closed = false;
  // The form can move under the popover (the pane resized or its divider dragged) without
  // anything the popover could observe, so it follows the form's edge each frame while open.
  let lastRight = Number.NaN;
  let lastBottom = Number.NaN;
  const track = (): void => {
    if (closed) return;
    const a = anchor.getBoundingClientRect();
    if (a.right !== lastRight || a.bottom !== lastBottom) {
      lastRight = a.right;
      lastBottom = a.bottom;
      position();
    }
    window.requestAnimationFrame(track);
  };

  const onOutside = (e: PointerEvent): void => {
    const target = e.target as Node | null;
    if (target && popover.contains(target)) return;
    close(true);
  };
  const onKeydown = (e: KeyboardEvent): void => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    close();
  };

  const close = (outside = false): void => {
    if (closed) return;
    closed = true;
    activeDocument.removeEventListener("pointerdown", onOutside, true);
    activeDocument.removeEventListener("keydown", onKeydown, true);
    popover.remove();
    onClose(outside);
  };

  renderList();
  track();
  activeDocument.addEventListener("pointerdown", onOutside, true);
  activeDocument.addEventListener("keydown", onKeydown, true);
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);

  return { close };
}
