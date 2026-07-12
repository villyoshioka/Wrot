import { App, TFile, Platform, setIcon } from "obsidian";
import { parseMemos, type Memo } from "./memoParser";
import { renderTextWithTagsAndUrls } from "./urlRenderer";

declare const moment: typeof import("moment");

// LRU cache (Map insertion order) of parseMemos results per file.
const MEMO_CACHE = new Map<string, Memo[]>();
const MEMO_CACHE_MAX = 8;

function getCachedMemos(filePath: string): Memo[] | undefined {
  return MEMO_CACHE.get(filePath);
}

function setCachedMemos(filePath: string, memos: Memo[]): void {
  if (MEMO_CACHE.has(filePath)) MEMO_CACHE.delete(filePath);
  MEMO_CACHE.set(filePath, memos);
  while (MEMO_CACHE.size > MEMO_CACHE_MAX) {
    const iter = MEMO_CACHE.keys().next();
    if (iter.done) break;
    MEMO_CACHE.delete(iter.value);
  }
}

export function invalidateMemoCache(filePath: string): void {
  MEMO_CACHE.delete(filePath);
}

// Card DOM -> source memo, read by click handlers for the jump target. A WeakMap
// (not a closure) lets in-place updates swap the memo without rebuilding the card.
const CARD_MEMO = new WeakMap<HTMLElement, Memo>();

// Refresh quote cards referencing the changed file (data-quote-file holds a link path, matched by basename).
// In-place update avoids the placeholder flicker of a rebuild; rebuild only on unexpected structure.
export function refreshQuoteCardsForFile(
  app: App,
  file: TFile,
  resolveRuleClass?: (content: string) => string | null,
  resolveRuleAccent?: (ruleClass: string) => string | null
): void {
  const baseName = file.basename;
  const cards = activeDocument.querySelectorAll<HTMLElement>(
    `.wr-quote-card[data-quote-file="${CSS.escape(baseName)}"]`
  );
  cards.forEach((card) => {
    const slot = card.parentElement;
    if (!slot) return;
    const fileName = card.dataset.quoteFile;
    const blockId = card.dataset.quoteBlock;
    const currentFilePath = card.dataset.quoteContext ?? "";
    const timestampFormat = card.dataset.quoteTsFormat;
    if (!fileName || !blockId) return;
    const checkStrikethrough = card.dataset.quoteStrike === "1";
    if (
      updateQuoteCardInPlace(card, app, {
        fileName,
        blockId,
        currentFilePath,
        timestampFormat,
        resolveRuleClass,
        checkStrikethrough,
      })
    ) {
      return;
    }
    card.remove();
    renderQuoteCard(slot, fileName, blockId, app, currentFilePath, {
      timestampFormat,
      resolveRuleClass,
      resolveRuleAccent,
      checkStrikethrough,
    });
  });
}

// Swaps only body/timestamp while keeping frame, handlers, and data attrs, so the rebuild
// path's "…" placeholder flicker never shows. Returns false when the card structure cannot
// be updated in place (caller rebuilds).
function updateQuoteCardInPlace(
  card: HTMLElement,
  app: App,
  opts: {
    fileName: string;
    blockId: string;
    currentFilePath: string;
    timestampFormat?: string;
    resolveRuleClass?: (content: string) => string | null;
    checkStrikethrough?: boolean;
  }
): boolean {
  const bodyEl = card.querySelector<HTMLElement>(".wr-quote-card-body");
  const metaEl = card.querySelector<HTMLElement>(".wr-quote-card-meta");
  if (!bodyEl || !metaEl) return false;

  const file = app.metadataCache.getFirstLinkpathDest(opts.fileName, opts.currentFilePath);
  if (!(file instanceof TFile)) {
    CARD_MEMO.delete(card);
    markDead(card, bodyEl, metaEl);
    return true;
  }

  const apply = (memos: Memo[]) => {
    const found = memos.find((m) => memoMatchesBlockId(m, opts.blockId));
    if (!found) {
      CARD_MEMO.delete(card);
      markDead(card, bodyEl, metaEl);
      return;
    }
    card.classList.remove("wr-quote-card-dead");
    fillCardBody(card, bodyEl, metaEl, found, app, opts.timestampFormat, opts.checkStrikethrough);
    Array.from(card.classList)
      .filter((c) => /^wr-tag-rule-\d+$/.test(c))
      .forEach((c) => card.classList.remove(c));
    if (opts.resolveRuleClass) {
      const cls = opts.resolveRuleClass(found.content);
      if (cls) card.classList.add(cls);
    }
    // The click handler reads CARD_MEMO, so refresh the jump target too.
    CARD_MEMO.set(card, found);
  };

  const cached = getCachedMemos(file.path);
  if (cached) {
    apply(cached);
    return true;
  }
  app.vault.cachedRead(file).then((content) => {
    const memos = parseMemos(content);
    setCachedMemos(file.path, memos);
    apply(memos);
  }).catch(() => {
    CARD_MEMO.delete(card);
    markDead(card, bodyEl, metaEl);
  });
  return true;
}

function memoMatchesBlockId(memo: Memo, blockId: string): boolean {
  if (!blockId.startsWith("wr-")) return false;
  const T = blockId.slice(3);
  const memoT = memo.time.replace(/[-:.TZ+]/g, "").slice(0, 17);
  return memoT === T;
}

const DEFAULT_TIMESTAMP_FORMAT = "YYYY/MM/DD HH:mm";

function formatMemoTimestamp(time: string, format?: string): string {
  return moment(time).format(format || DEFAULT_TIMESTAMP_FORMAT);
}

// Nested quote markers are flattened to "QT:" instead of expanded, preventing recursive nesting.
// eslint-disable-next-line no-useless-escape -- escape kept for regex readability
const NESTED_QUOTE_RE_INLINE = /[\s]*\[\[[^\[\]]+#\^wr-\d{17}\]\][\s]*/g;

const NESTED_QUOTE_PLACEHOLDER = "QT:";
const NESTED_QUOTE_DISPLAY = "QT: ...";

function sanitizeNestedQuotes(text: string): string {
  return text.replace(NESTED_QUOTE_RE_INLINE, ` ${NESTED_QUOTE_PLACEHOLDER}`);
}

// Image/math/code blocks would crowd the preview; replaced with icon+label summaries.
// eslint-disable-next-line no-useless-escape -- escape kept for regex readability
const IMAGE_EMBED_RE = /!\[\[[^\[\]]+\.(?:png|jpe?g|gif|webp|svg|bmp)\]\]/gi;
const IMAGE_EMBED_PLACEHOLDER = "@@WR_IMAGE_EMBED@@";

function sanitizeImageEmbeds(text: string): string {
  return text.replace(IMAGE_EMBED_RE, IMAGE_EMBED_PLACEHOLDER);
}

const MATH_BLOCK_RE = /\$\$[\s\S]+?\$\$/g;
const MATH_BLOCK_PLACEHOLDER = "@@WR_MATH_BLOCK@@";

function sanitizeMathBlocks(text: string): string {
  return text.replace(MATH_BLOCK_RE, MATH_BLOCK_PLACEHOLDER);
}

const CODE_BLOCK_RE = /(?:```|~~~)[\s\S]+?(?:```|~~~)/g;
const CODE_BLOCK_PLACEHOLDER = "@@WR_CODE_BLOCK@@";

function sanitizeCodeBlocks(text: string): string {
  return text.replace(CODE_BLOCK_RE, CODE_BLOCK_PLACEHOLDER);
}

function decorateImageEmbedMarkers(root: HTMLElement): void {
  const walker = activeDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) {
    if ((n as Text).data.includes(IMAGE_EMBED_PLACEHOLDER)) {
      textNodes.push(n as Text);
    }
  }
  for (const tn of textNodes) {
    const parent = tn.parentNode;
    if (!parent) continue;
    const parts = tn.data.split(IMAGE_EMBED_PLACEHOLDER);
    const frag = createFragment();
    parts.forEach((part, i) => {
      if (part) frag.appendChild(activeDocument.createTextNode(part));
      if (i < parts.length - 1) {
        const span = createSpan();
        span.className = "wr-quote-image-marker";
        const iconEl = createSpan();
        iconEl.className = "wr-quote-image-marker-icon";
        setIcon(iconEl, "image");
        span.appendChild(iconEl);
        span.appendChild(activeDocument.createTextNode(" image"));
        frag.appendChild(span);
      }
    });
    parent.replaceChild(frag, tn);
  }
}

function decorateMathBlockMarkers(root: HTMLElement): void {
  const walker = activeDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) {
    if ((n as Text).data.includes(MATH_BLOCK_PLACEHOLDER)) {
      textNodes.push(n as Text);
    }
  }
  for (const tn of textNodes) {
    const parent = tn.parentNode;
    if (!parent) continue;
    const parts = tn.data.split(MATH_BLOCK_PLACEHOLDER);
    const frag = createFragment();
    parts.forEach((part, i) => {
      if (part) frag.appendChild(activeDocument.createTextNode(part));
      if (i < parts.length - 1) {
        const span = createSpan();
        span.className = "wr-quote-math-marker";
        const iconEl = createSpan();
        iconEl.className = "wr-quote-math-marker-icon";
        setIcon(iconEl, "sigma");
        span.appendChild(iconEl);
        span.appendChild(activeDocument.createTextNode(" math"));
        frag.appendChild(span);
      }
    });
    parent.replaceChild(frag, tn);
  }
}

function decorateCodeBlockMarkers(root: HTMLElement): void {
  const walker = activeDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) {
    if ((n as Text).data.includes(CODE_BLOCK_PLACEHOLDER)) {
      textNodes.push(n as Text);
    }
  }
  for (const tn of textNodes) {
    const parent = tn.parentNode;
    if (!parent) continue;
    const parts = tn.data.split(CODE_BLOCK_PLACEHOLDER);
    const frag = createFragment();
    parts.forEach((part, i) => {
      if (part) frag.appendChild(activeDocument.createTextNode(part));
      if (i < parts.length - 1) {
        const span = createSpan();
        span.className = "wr-quote-code-marker";
        const iconEl = createSpan();
        iconEl.className = "wr-quote-code-marker-icon";
        setIcon(iconEl, "code");
        span.appendChild(iconEl);
        span.appendChild(activeDocument.createTextNode(" code"));
        frag.appendChild(span);
      }
    });
    parent.replaceChild(frag, tn);
  }
}

function decorateNestedQuoteMarkers(root: HTMLElement): void {
  const walker = activeDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) {
    if ((n as Text).data.includes(NESTED_QUOTE_PLACEHOLDER)) {
      textNodes.push(n as Text);
    }
  }
  for (const tn of textNodes) {
    const parent = tn.parentNode;
    if (!parent) continue;
    const parts = tn.data.split(NESTED_QUOTE_PLACEHOLDER);
    const frag = createFragment();
    parts.forEach((part, i) => {
      if (part) frag.appendChild(activeDocument.createTextNode(part));
      if (i < parts.length - 1) {
        const span = createSpan();
        span.className = "wr-nested-quote-marker";
        span.textContent = NESTED_QUOTE_DISPLAY;
        frag.appendChild(span);
      }
    });
    parent.replaceChild(frag, tn);
  }
}

const PREVIEW_MAX_LINES = 3;
const PREVIEW_MAX_CHARS_PER_LINE = 200;

// One block element per line (flat structure) keeps the max-height 3-line clipping stable.
function renderPreviewLines(
  bodyEl: HTMLElement,
  content: string,
  app: App,
  checkStrikethrough?: boolean
): void {
  const sanitized = sanitizeCodeBlocks(
    sanitizeMathBlocks(
      sanitizeImageEmbeds(sanitizeNestedQuotes(content))
    )
  );
  const lines = sanitized
    .split("\n")
    .filter((l) => l.trim().length > 0)
    .slice(0, PREVIEW_MAX_LINES);

  const inlineCallbacks = {
    resolveImagePath: (fileName: string) => {
      const file = app.metadataCache.getFirstLinkpathDest(fileName, "");
      return file ? app.vault.getResourcePath(file) : null;
    },
    resolveLinkTarget: (linkName: string) => {
      return app.metadataCache.getFirstLinkpathDest(linkName, "") !== null;
    },
  };

  for (const rawLine of lines) {
    const line = rawLine.length > PREVIEW_MAX_CHARS_PER_LINE
      ? rawLine.slice(0, PREVIEW_MAX_CHARS_PER_LINE) + "…"
      : rawLine;

    const lineEl = bodyEl.createDiv({ cls: "wr-quote-card-line" });

    const checkMatch = line.match(/^- \[([ x])\] (.*)$/);
    const listMatch = !checkMatch && line.match(/^- (.+)$/);
    const olMatch = !checkMatch && !listMatch && line.match(/^(\d+)\.\s?(.+)$/);

    if (checkMatch) {
      const slot = lineEl.createSpan({ cls: "wr-quote-card-marker-slot wr-quote-card-marker-check" });
      slot.createSpan({
        cls: checkMatch[1] === "x"
          ? "wr-quote-card-check wr-quote-card-check-done"
          : "wr-quote-card-check",
      });
      const textSpan = lineEl.createSpan({
        cls: checkMatch[1] === "x" && checkStrikethrough
          ? "wr-quote-card-line-text wr-check-done"
          : "wr-quote-card-line-text",
      });
      renderTextWithTagsAndUrls(textSpan, checkMatch[2], inlineCallbacks);
    } else if (listMatch) {
      const slot = lineEl.createSpan({ cls: "wr-quote-card-marker-slot wr-quote-card-marker-bullet" });
      slot.textContent = "・";
      const textSpan = lineEl.createSpan({ cls: "wr-quote-card-line-text" });
      renderTextWithTagsAndUrls(textSpan, listMatch[1], inlineCallbacks);
    } else if (olMatch) {
      const slot = lineEl.createSpan({ cls: "wr-quote-card-marker-slot wr-quote-card-marker-ol" });
      slot.textContent = `${olMatch[1]}.`;
      const textSpan = lineEl.createSpan({ cls: "wr-quote-card-line-text" });
      renderTextWithTagsAndUrls(textSpan, olMatch[2], inlineCallbacks);
    } else {
      const textSpan = lineEl.createSpan({ cls: "wr-quote-card-line-text" });
      renderTextWithTagsAndUrls(textSpan, line, inlineCallbacks);
    }
  }

  decorateNestedQuoteMarkers(bodyEl);
  decorateImageEmbedMarkers(bodyEl);
  decorateMathBlockMarkers(bodyEl);
  decorateCodeBlockMarkers(bodyEl);
}

function fillCardBody(
  card: HTMLElement,
  bodyEl: HTMLElement,
  metaEl: HTMLElement,
  memo: Memo,
  app: App,
  timestampFormat?: string,
  checkStrikethrough?: boolean
): void {
  bodyEl.empty();
  renderPreviewLines(bodyEl, memo.content, app, checkStrikethrough);
  metaEl.textContent = formatMemoTimestamp(memo.time, timestampFormat);
}

function markDead(card: HTMLElement, bodyEl: HTMLElement, metaEl: HTMLElement): void {
  card.classList.add("wr-quote-card-dead");
  bodyEl.textContent = "(元投稿が見つかりません)";
  metaEl.textContent = "";
}

// RV-only jump handling: waits for the target DOM via MutationObserver instead of time-based
// polling. In RV, line numbers don't map to screen positions, so polling could miss the flash or stop at the viewport edge.
function flashJumpTargetReadingView(
  blockId: string,
  app: App,
  resolveRuleAccent?: (ruleClass: string) => string | null,
  targetView?: import("obsidian").MarkdownView | null,
  // See flashJumpTarget: flash in place without moving the view.
  skipScroll?: boolean
): void {
  // Failsafe only, not a normal-path limit: stops observing forever if the target never appears.
  const overallTimeoutMs = 10000;
  // Size changes must stay quiet for this long to count as settled.
  const resizeSettleMs = 200;
  // Gap between centering and flash so the scroll visually settles.
  const scrollSettleDelay = 120;
  const flashDuration = 1600;

  let canceled = false;
  let centeredOnce = false;
  const pendingTimeouts = new Set<number>();
  const flashed = new WeakSet<HTMLElement>();
  let mutationObserver: MutationObserver | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let resizeSettleTimeout: number | null = null;
  let currentTarget: HTMLElement | null = null;

  const stopMutationWatch = () => {
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
  };
  const stopResizeWatch = () => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (resizeSettleTimeout !== null) {
      window.clearTimeout(resizeSettleTimeout);
      resizeSettleTimeout = null;
    }
  };

  let interruptListenersAttached = false;
  const removeInterruptListeners = () => {
    if (!interruptListenersAttached) return;
    activeDocument.removeEventListener("keydown", cancel, true);
    activeDocument.removeEventListener("mousedown", cancel, true);
    activeDocument.removeEventListener("wheel", cancel, true);
    activeDocument.removeEventListener("touchstart", cancel, true);
    interruptListenersAttached = false;
  };
  const cancel = () => {
    if (canceled) return;
    canceled = true;
    for (const id of pendingTimeouts) window.clearTimeout(id);
    pendingTimeouts.clear();
    stopMutationWatch();
    stopResizeWatch();
    const targets = collectFlashTargets(blockId, app);
    for (const el of targets) {
      el.classList.remove("wr-quote-jump-flash");
      el.style.removeProperty("--wr-flash-color");
    }
    removeInterruptListeners();
  };
  // Attach interrupt listeners only after centering starts: while the target is still unmounted
  // (virtual scroll), a lingering touchstart or iOS delayed mousedown would cancel the watch and the jump would land without flashing.
  const attachInterruptListenersOnce = () => {
    if (interruptListenersAttached) return;
    interruptListenersAttached = true;
    activeDocument.addEventListener("keydown", cancel, true);
    activeDocument.addEventListener("mousedown", cancel, true);
    activeDocument.addEventListener("wheel", cancel, true);
    activeDocument.addEventListener("touchstart", cancel, true);
  };

  const schedule = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      pendingTimeouts.delete(id);
      if (canceled) return;
      fn();
    }, ms);
    pendingTimeouts.add(id);
  };

  const flashAll = () => {
    if (canceled) return;
    const targets = collectFlashTargets(blockId, app);
    for (const el of targets) {
      if (flashed.has(el)) continue;
      flashed.add(el);
      el.classList.remove("wr-quote-jump-flash");
      void el.offsetWidth;
      const ruleClass = Array.from(el.classList).find((c) => /^wr-tag-rule-\d+$/.test(c));
      const accent = ruleClass && resolveRuleAccent ? resolveRuleAccent(ruleClass) : null;
      if (accent) {
        const r = parseInt(accent.slice(1, 3), 16);
        const g = parseInt(accent.slice(3, 5), 16);
        const b = parseInt(accent.slice(5, 7), 16);
        el.style.setProperty("--wr-flash-color", `rgba(${r}, ${g}, ${b}, 0.22)`);
      } else {
        el.style.removeProperty("--wr-flash-color");
      }
      el.classList.add("wr-quote-jump-flash");
      schedule(() => {
        el.classList.remove("wr-quote-jump-flash");
        el.style.removeProperty("--wr-flash-color");
      }, flashDuration);
    }
  };

  // Runs once the target appears: center, let late renders (OGP/MathJax) settle, then flash.
  const onTargetAppeared = (target: HTMLElement) => {
    if (canceled || centeredOnce) return;
    centeredOnce = true;
    currentTarget = target;
    attachInterruptListenersOnce();
    if (!skipScroll) scrollElementIntoCenter(target);
    let firstObservation = true;
    let flashed_once = false;
    const finalizeIfQuiet = () => {
      if (canceled) return;
      if (currentTarget && !skipScroll) scrollElementIntoCenter(currentTarget);
      if (!flashed_once) {
        flashed_once = true;
        schedule(flashAll, scrollSettleDelay);
      }
    };
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        if (firstObservation) {
          firstObservation = false;
          return;
        }
        if (canceled) return;
        if (resizeSettleTimeout !== null) window.clearTimeout(resizeSettleTimeout);
        resizeSettleTimeout = window.setTimeout(() => {
          resizeSettleTimeout = null;
          if (canceled) return;
          if (currentTarget) scrollElementIntoCenter(currentTarget);
          if (!flashed_once) {
            flashed_once = true;
            schedule(flashAll, scrollSettleDelay);
          }
        }, resizeSettleMs);
      });
      resizeObserver.observe(target);
    }
    // Kick the flash even if no resize ever fires (layout already settled).
    schedule(finalizeIfQuiet, resizeSettleMs);
  };

  // Obsidian can keep both LV and RV containers of the same note in the DOM; grabbing the hidden
  // LV-side match makes scroll/flash invisible. Require a visible element (offsetParent !== null) under .markdown-reading-view with no .markdown-source-view ancestor.
  const pickVisibleReadingViewTarget = (): HTMLElement | null => {
    const all = collectFlashTargets(blockId, app);
    if (all.length === 0) return null;
    const visibleRV = all.filter((el) => {
      if (el.offsetParent === null) return false;
      let cur: HTMLElement | null = el;
      let foundRV = false;
      let foundLV = false;
      while (cur) {
        if (cur.classList.contains("markdown-reading-view")) foundRV = true;
        if (cur.classList.contains("markdown-source-view")) foundLV = true;
        cur = cur.parentElement;
      }
      return foundRV && !foundLV;
    });
    if (visibleRV.length > 0) return visibleRV[0];
    // No visible RV match: return null and keep observing rather than grab a hidden element.
    return null;
  };

  const initialPreferred = pickVisibleReadingViewTarget();
  if (initialPreferred) {
    onTargetAppeared(initialPreferred);
  } else {
    // Not mounted yet: observe the whole document, since where the RV container mounts is not guaranteed.
    const pickPreferred = pickVisibleReadingViewTarget;
    mutationObserver = new MutationObserver(() => {
      if (canceled || centeredOnce) {
        stopMutationWatch();
        return;
      }
      const preferred = pickPreferred();
      if (preferred) {
        stopMutationWatch();
        onTargetAppeared(preferred);
      }
    });
    mutationObserver.observe(activeDocument.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  // Failsafe: RV virtual scrolling never mounts deeply off-screen blocks, so this can fire
  // legitimately. Accepted as an Obsidian constraint — forcing a mount would jitter the scroll.
  const overallId = window.setTimeout(() => {
    pendingTimeouts.delete(overallId);
    stopMutationWatch();
    stopResizeWatch();
    removeInterruptListeners();
  }, overallTimeoutMs);
  pendingTimeouts.add(overallId);
}

export function flashJumpTarget(
  blockId: string,
  app: App,
  resolveRuleAccent?: (ruleClass: string) => string | null,
  // Resolved by the caller: deriving it from the active view misclassifies LV/RV
  // when the jump starts from the Wrot timeline or another note.
  targetView?: import("obsidian").MarkdownView | null,
  // Target was already fully on screen at click time: flash in place, never scroll.
  skipScroll?: boolean
): void {
  // In RV, images/math/OGP inflate line heights and break the line-to-position mapping,
  // so time-based polling misses; branch to the DOM-observation approach instead.
  const isReadingView = targetView?.getMode?.() === "preview";
  if (isReadingView) {
    flashJumpTargetReadingView(blockId, app, resolveRuleAccent, targetView, skipScroll);
    return;
  }

  // LV path: poll for the target, center it, then flash; any user input cancels both.
  const searchAt = [80, 250, 500, 900, 1500, 2200];
  const scrollSettleDelay = 200;
  const flashDuration = 1600;
  let canceled = false;
  let scrolled = false;
  const pendingTimeouts = new Set<number>();
  const flashed = new WeakSet<HTMLElement>();
  // OGP cards and MathJax render late and inflate the target after centering;
  // observe size changes and re-center each time.
  let resizeObserver: ResizeObserver | null = null;
  let resizeSettleTimeout: number | null = null;
  const stopResizeWatch = () => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (resizeSettleTimeout !== null) {
      window.clearTimeout(resizeSettleTimeout);
      resizeSettleTimeout = null;
    }
  };

  const removeInterruptListeners = () => {
    activeDocument.removeEventListener("keydown", cancel, true);
    activeDocument.removeEventListener("mousedown", cancel, true);
    activeDocument.removeEventListener("wheel", cancel, true);
    activeDocument.removeEventListener("touchstart", cancel, true);
  };
  const cancel = () => {
    if (canceled) return;
    canceled = true;
    for (const id of pendingTimeouts) window.clearTimeout(id);
    pendingTimeouts.clear();
    stopResizeWatch();
    const targets = collectFlashTargets(blockId, app);
    for (const el of targets) {
      el.classList.remove("wr-quote-jump-flash");
      el.style.removeProperty("--wr-flash-color");
    }
    removeInterruptListeners();
  };
  // On mobile (esp. iOS) a lingering touchstart can fire right after the tap that produced
  // the click; subscribing in the same event sequence would self-cancel the jump, so defer to the next frame.
  window.requestAnimationFrame(() => {
    if (canceled) return;
    activeDocument.addEventListener("keydown", cancel, true);
    activeDocument.addEventListener("mousedown", cancel, true);
    activeDocument.addEventListener("wheel", cancel, true);
    activeDocument.addEventListener("touchstart", cancel, true);
  });

  const schedule = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      pendingTimeouts.delete(id);
      if (canceled) return;
      fn();
    }, ms);
    pendingTimeouts.add(id);
  };

  const flashAll = () => {
    if (canceled) return;
    const targets = collectFlashTargets(blockId, app);
    for (const el of targets) {
      if (flashed.has(el)) continue;
      flashed.add(el);
      el.classList.remove("wr-quote-jump-flash");
      void el.offsetWidth;
      const ruleClass = Array.from(el.classList).find((c) => /^wr-tag-rule-\d+$/.test(c));
      const accent = ruleClass && resolveRuleAccent ? resolveRuleAccent(ruleClass) : null;
      if (accent) {
        const r = parseInt(accent.slice(1, 3), 16);
        const g = parseInt(accent.slice(3, 5), 16);
        const b = parseInt(accent.slice(5, 7), 16);
        el.style.setProperty("--wr-flash-color", `rgba(${r}, ${g}, ${b}, 0.22)`);
      } else {
        el.style.removeProperty("--wr-flash-color");
      }
      el.classList.add("wr-quote-jump-flash");
      schedule(() => {
        el.classList.remove("wr-quote-jump-flash");
        el.style.removeProperty("--wr-flash-color");
      }, flashDuration);
    }
  };

  // applyScroll/openLinkText scroll by line count, which drifts badly when images/math inflate
  // line heights; once the target is in the DOM, re-center using real DOM coordinates.
  const tryFlash = (): boolean => {
    if (canceled || scrolled) return false;
    const targets = collectFlashTargets(blockId, app);
    if (targets.length === 0) return false;
    scrolled = true;
    if (skipScroll) {
      schedule(flashAll, scrollSettleDelay);
      return true;
    }
    // Targets may span LV/RV/timeline; center on the one inside the active view when possible.
    const activeContainer = getActiveViewContainer(app);
    const preferred = activeContainer
      ? targets.find((el) => activeContainer.contains(el)) ?? targets[0]
      : targets[0];
    scrollElementIntoCenter(preferred);
    if (typeof ResizeObserver !== "undefined") {
      stopResizeWatch();
      let firstObservation = true;
      resizeObserver = new ResizeObserver(() => {
        // ResizeObserver fires once on observe() with the current size; skip it.
        if (firstObservation) {
          firstObservation = false;
          return;
        }
        if (canceled) return;
        if (resizeSettleTimeout !== null) {
          window.clearTimeout(resizeSettleTimeout);
        }
        resizeSettleTimeout = window.setTimeout(() => {
          resizeSettleTimeout = null;
          if (canceled) return;
          scrollElementIntoCenter(preferred);
        }, 80);
      });
      resizeObserver.observe(preferred);
      // Hard stop so endless late renders cannot keep the observer alive.
      const stopId = window.setTimeout(() => {
        pendingTimeouts.delete(stopId);
        stopResizeWatch();
      }, searchAt[searchAt.length - 1] + 800);
      pendingTimeouts.add(stopId);
    }
    schedule(flashAll, scrollSettleDelay);
    return true;
  };

  for (const ms of searchAt) {
    schedule(() => {
      if (scrolled) return;
      tryFlash();
    }, ms);
  }
  // After the last attempt, remove only the interrupt listeners; an in-flight flash keeps running.
  const cleanupId = window.setTimeout(() => {
    pendingTimeouts.delete(cleanupId);
    removeInterruptListeners();
  }, searchAt[searchAt.length - 1] + scrollSettleDelay + flashDuration + 200);
  pendingTimeouts.add(cleanupId);
}

// Used to disambiguate targets when the same file is open in both LV and RV.
function getActiveViewContainer(app: App): HTMLElement | null {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef -- internal Obsidian/CodeMirror API or intentional pattern
  const obs = require("obsidian") as typeof import("obsidian");
  const view = app.workspace.getActiveViewOfType(obs.MarkdownView);
  return view?.containerEl ?? null;
}

// scrollIntoView scrolls every scrollable ancestor; in RV that can drag the outer container
// and reset the whole view to the top. Adjust only the nearest scrollable ancestor's scrollTop.
function findNearestScrollableAncestor(el: HTMLElement): HTMLElement | null {
  let cur: HTMLElement | null = el.parentElement;
  while (cur) {
    const style = getComputedStyle(cur);
    const overflowY = style.overflowY;
    const scrollable =
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      cur.scrollHeight > cur.clientHeight;
    if (scrollable) return cur;
    cur = cur.parentElement;
  }
  return null;
}

// Jumps to a target already fully on screen must not move the view (flash only).
function isFullyVisibleInScroller(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.height === 0) return false;
  const scroller = findNearestScrollableAncestor(el);
  if (!scroller) {
    const viewportH = window.innerHeight || activeDocument.documentElement.clientHeight;
    return rect.top >= 0 && rect.bottom <= viewportH;
  }
  const scrollerRect = scroller.getBoundingClientRect();
  return rect.top >= scrollerRect.top && rect.bottom <= scrollerRect.bottom;
}

function scrollElementIntoCenter(el: HTMLElement): void {
  const scroller = findNearestScrollableAncestor(el);
  if (!scroller) {
    el.scrollIntoView({ block: "center", behavior: "auto" });
    return;
  }
  const apply = () => {
    const scrollerRect = scroller.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const offsetWithinScroller = elRect.top - scrollerRect.top + scroller.scrollTop;
    const desiredTop = offsetWithinScroller - (scroller.clientHeight - elRect.height) / 2;
    const maxTop = scroller.scrollHeight - scroller.clientHeight;
    scroller.scrollTop = Math.max(0, Math.min(desiredTop, maxTop));
  };
  apply();
  // On mobile (esp. iOS) a single scrollTop write can be overridden by momentum
  // scrolling; re-apply on the next frame.
  window.requestAnimationFrame(apply);
}

// Collect block-id matches across LV/RV/timeline; on mobile, timeline cards in a transient drawer are excluded.
function collectFlashTargets(blockId: string, app: App): HTMLElement[] {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- assertion needed for cross-version Obsidian typings
  const all = Array.from(
    activeDocument.querySelectorAll(`.wr-block-id-${blockId}`)
  ) as HTMLElement[];

  if (!Platform.isMobile) return all;

  if (Platform.isPhone) {
    return all.filter((el) => !el.classList.contains("wr-card"));
  }

  // Tablets: include timeline cards only when the Wrot view is in a pinned sidebar
  // (.workspace-drawer.is-pinned); an unpinned (transient) drawer is excluded.
  const wrCardEls = all.filter((el) => el.classList.contains("wr-card"));
  const isUnpinnedDrawer = wrCardEls.some((el) => {
    const drawer = el.closest(".workspace-drawer");
    return drawer !== null && !drawer.classList.contains("is-pinned");
  });
  if (isUnpinnedDrawer) {
    return all.filter((el) => !el.classList.contains("wr-card"));
  }
  return all;
}

export function renderQuoteCard(
  slot: HTMLElement,
  fileName: string,
  blockId: string,
  app: App,
  currentFilePath: string,
  options?: {
    localMemos?: Memo[];
    timestampFormat?: string;
    // Colors the card by the source post's tag rule, independent of the quoting post's rule.
    resolveRuleClass?: (content: string) => string | null;
    // Rule class -> accent hex; used for the post-jump flash color.
    resolveRuleAccent?: (ruleClass: string) => string | null;
    // Strike through checked items (pass the same value as the main list setting).
    checkStrikethrough?: boolean;
  }
): void {
  const localMemos = options?.localMemos;
  const timestampFormat = options?.timestampFormat;
  const resolveRuleClass = options?.resolveRuleClass;
  const resolveRuleAccent = options?.resolveRuleAccent;
  const checkStrikethrough = options?.checkStrikethrough ?? false;
  // An <a href> lets Obsidian's internal link handling swallow mousedown/mouseup so the
  // click may never arrive; use <div role="link"> with our own click handler instead.
  const card = slot.createDiv({ cls: "wr-quote-card" });
  card.setAttr("role", "link");
  card.setAttr("tabindex", "0");
  card.dataset.quoteFile = fileName;
  card.dataset.quoteBlock = blockId;
  card.dataset.quoteContext = currentFilePath;
  if (timestampFormat) card.dataset.quoteTsFormat = timestampFormat;
  // Stored in dataset so refreshQuoteCardsForFile can carry the setting over.
  if (checkStrikethrough) card.dataset.quoteStrike = "1";
  const bodyEl = card.createDiv({ cls: "wr-quote-card-body", text: "…" });
  const metaEl = card.createDiv({ cls: "wr-quote-card-meta" });

  const file = app.metadataCache.getFirstLinkpathDest(fileName, currentFilePath);
  if (!(file instanceof TFile)) {
    markDead(card, bodyEl, metaEl);
    return;
  }

  // Register the handler eagerly: a click before the memo loads would otherwise fall through to
  // default navigation, leaving stuck hover and a double-press bug. CARD_MEMO gates readiness.
  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- async handler intentionally used as a callback
  card.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const memoReady = CARD_MEMO.get(card);
    if (!memoReady) return;
    // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef -- internal Obsidian/CodeMirror API or intentional pattern
    const obs = require("obsidian") as typeof import("obsidian");
    const activeView = app.workspace.getActiveViewOfType(obs.MarkdownView);
    const activeFilePath = activeView?.file?.path;
    const isSameFile = !!activeFilePath && activeFilePath === file.path;
    // Unified jump for same-file / cross-file / timeline origins: open via openLinkText if
    // needed, then applyScroll — openLinkText alone can no-op when the file is already open.
    let targetView: import("obsidian").MarkdownView | null = activeView;
    if (!isSameFile) {
      const recent = app.workspace.getMostRecentLeaf();
      const useRecent = !activeView && recent && recent.view instanceof obs.MarkdownView;
      if (useRecent && recent) {
        app.workspace.setActiveLeaf(recent, { focus: true });
      }
      const openInNew = !activeView && !useRecent;
      await app.workspace.openLinkText(`${fileName}#^${blockId}`, currentFilePath, openInNew);
      targetView = app.workspace.getActiveViewOfType(obs.MarkdownView);
    }
    // Decide before any scrolling whether the target is already fully on screen;
    // if so, skip both the line-based scroll and the later centering (no view hop).
    let alreadyVisible = false;
    if (targetView) {
      const container = targetView.containerEl;
      const mounted = collectFlashTargets(blockId, app).find(
        (el) => el.offsetParent !== null && container.contains(el)
      );
      alreadyVisible = !!mounted && isFullyVisibleInScroller(mounted);
      if (!alreadyVisible) {
        // applyScroll only lands the line near the top; flashJumpTarget re-centers later
        // using real DOM coordinates.
        const targetLine = memoReady.lineStart;
        const mode = (targetView as { currentMode?: { applyScroll?: (line: number) => void } }).currentMode;
        if (mode && typeof mode.applyScroll === "function") {
          mode.applyScroll(targetLine);
        }
      }
    }
    flashJumpTarget(blockId, app, resolveRuleAccent, targetView, alreadyVisible);
  });

  const setupClick = (memo: Memo) => {
    fillCardBody(card, bodyEl, metaEl, memo, app, timestampFormat, checkStrikethrough);
    if (resolveRuleClass) {
      Array.from(card.classList)
        .filter((c) => /^wr-tag-rule-\d+$/.test(c))
        .forEach((c) => card.classList.remove(c));
      const cls = resolveRuleClass(memo.content);
      if (cls) card.classList.add(cls);
    }
    CARD_MEMO.set(card, memo);
  };

  if (localMemos) {
    const found = localMemos.find((m) => memoMatchesBlockId(m, blockId));
    if (found) {
      setupClick(found);
      return;
    }
    markDead(card, bodyEl, metaEl);
    return;
  }

  const cached = getCachedMemos(file.path);
  if (cached) {
    const found = cached.find((m) => memoMatchesBlockId(m, blockId));
    if (found) {
      setupClick(found);
      return;
    }
    markDead(card, bodyEl, metaEl);
    return;
  }

  app.vault.cachedRead(file).then((content) => {
    const memos = parseMemos(content);
    setCachedMemos(file.path, memos);
    const found = memos.find((m) => memoMatchesBlockId(m, blockId));
    if (found) {
      setupClick(found);
    } else {
      markDead(card, bodyEl, metaEl);
    }
  }).catch(() => {
    markDead(card, bodyEl, metaEl);
  });
}
