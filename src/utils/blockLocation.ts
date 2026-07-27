import { App, MarkdownPostProcessorContext, TFile } from "obsidian";

/**
 * Resolves where a rendered Wrot block lives in its source file.
 *
 * Reading View gives us `MarkdownPostProcessorContext`, which knows both the source path and
 * the exact line range of the section being rendered. Stamping that onto the block element at
 * render time lets later interactions (checkbox toggles, block-id classes) address the source
 * by line number instead of guessing from body text or DOM order.
 */

export const WR_CODE_SELECTOR =
  'code.language-wr, .block-language-wr code, pre > code[class*="language-wr"]';

/** Selectors that bound one logical render scope: an embed, a hover preview, or a reading view. */
const SCOPE_ROOT_SELECTOR = ".markdown-embed, .hover-popover, .markdown-reading-view";

export interface WrBlockLocation {
  sourcePath: string;
  /** 0-based line of the ```wr fence opening line in the source file. */
  lineStart: number;
}

/** The element Obsidian wraps a fenced block in; class names are applied here. */
export function wrBlockContainer(code: HTMLElement): HTMLElement | null {
  const block = code.closest(".block-language-wr") || code.closest("pre");
  return block instanceof HTMLElement ? block : null;
}

/**
 * The nearest element that bounds a single rendered document. Embeds and hover previews render
 * a different file than their host, so DOM order is only meaningful within one of these.
 */
export function wrScopeRoot(blockEl: HTMLElement): HTMLElement {
  const scope = blockEl.closest(SCOPE_ROOT_SELECTOR);
  return scope instanceof HTMLElement ? scope : blockEl.ownerDocument.body;
}

/**
 * Wrot blocks that belong directly to `scope`, in document order.
 *
 * Blocks nested in an embed or hover preview inside `scope` are excluded: they come from a
 * different file, so counting them would break any position-based mapping.
 */
export function scopedWrBlocks(scope: HTMLElement): HTMLElement[] {
  const blocks: HTMLElement[] = [];
  for (const code of Array.from(scope.querySelectorAll<HTMLElement>(WR_CODE_SELECTOR))) {
    const block = wrBlockContainer(code);
    if (!block) continue;
    if (wrScopeRoot(block) !== scope) continue;
    blocks.push(block);
  }
  return blocks;
}

/** Overwrites the recorded location of a block. Used to repair stamps that went stale. */
export function stampWrBlockLocation(block: HTMLElement, sourcePath: string, lineStart: number): void {
  block.dataset.wrSourcePath = sourcePath;
  block.dataset.wrLineStart = String(lineStart);
}

/**
 * Records source path and fence line for every Wrot block rendered under `el`.
 * Called from the markdown post processor, where the context is still available.
 */
export function stampWrBlockLocations(el: HTMLElement, ctx: MarkdownPostProcessorContext): void {
  const sourcePath = ctx?.sourcePath;
  if (!sourcePath) return;
  const codeEls = Array.from(el.querySelectorAll<HTMLElement>(WR_CODE_SELECTOR));
  if (codeEls.length === 0) return;

  for (const code of codeEls) {
    const block = wrBlockContainer(code);
    if (!block) continue;

    let lineStart: number | null = sectionLineStart(ctx, block);
    // A post processor is normally handed one section at a time, but when `el` wraps the whole
    // render the container lookup misses. Falling back to `el` is only safe if it holds a single
    // block -- otherwise every block would claim the same line.
    if (lineStart === null && codeEls.length === 1) {
      lineStart = sectionLineStart(ctx, el);
    }
    if (lineStart === null) continue;

    block.dataset.wrSourcePath = sourcePath;
    block.dataset.wrLineStart = String(lineStart);
  }
}

function sectionLineStart(ctx: MarkdownPostProcessorContext, el: HTMLElement): number | null {
  try {
    const info = ctx.getSectionInfo(el);
    return info ? info.lineStart : null;
  } catch {
    return null;
  }
}

/** Reads back what `stampWrBlockLocations` recorded, if anything. */
export function readWrBlockLocation(blockEl: HTMLElement): WrBlockLocation | null {
  const sourcePath = blockEl.dataset.wrSourcePath;
  const rawLineStart = blockEl.dataset.wrLineStart;
  if (!sourcePath || rawLineStart === undefined) return null;
  const lineStart = Number.parseInt(rawLineStart, 10);
  if (!Number.isInteger(lineStart) || lineStart < 0) return null;
  return { sourcePath, lineStart };
}

/** Resolves a stamped location to a file, or null if the file is gone. */
export function fileForLocation(app: App, location: WrBlockLocation): TFile | null {
  const file = app.vault.getAbstractFileByPath(location.sourcePath);
  return file instanceof TFile ? file : null;
}

/**
 * Last resort for blocks that were never seen by the post processor: find the leaf whose
 * container holds this block and use the file it displays. Returns null for hover previews and
 * other detached renders, which is the safe answer -- writing to a guessed file is worse than
 * doing nothing.
 */
export function resolveFileFromView(app: App, blockEl: HTMLElement): TFile | null {
  let found: TFile | null = null;
  app.workspace.iterateAllLeaves((leaf) => {
    if (found) return;
    const view = leaf.view as { containerEl?: HTMLElement; file?: unknown };
    const container = view?.containerEl;
    if (!container || !container.contains(blockEl)) return;
    if (view.file instanceof TFile) found = view.file;
  });
  return found;
}
