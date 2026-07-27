import {
  TFile,
  MarkdownRenderer,
  MarkdownRenderChild,
  renderMath,
  finishRenderMath,
  Component,
} from "obsidian";
import { extractUrls, renderUrlPreviews, isSafeUrl, QUOTE_LINK_RE } from "./utils/urlRenderer";
import { renderQuoteCard, invalidateMemoCache, refreshQuoteCardsForFile } from "./utils/quoteCard";
import { toggleCheckbox } from "./utils/memoWriter";
import { segmentBlocks, type Segment } from "./utils/blockSegmenter";
import { isMathJaxReady, requestMathJax } from "./utils/mathjax";
import {
  WR_CODE_SELECTOR,
  fileForLocation,
  readWrBlockLocation,
  resolveFileFromView,
  scopedWrBlocks,
  stampWrBlockLocation,
  stampWrBlockLocations,
  wrBlockContainer,
  wrScopeRoot,
} from "./utils/blockLocation";
import { parseMemos, type Memo } from "./utils/memoParser";
import type WrotPlugin from "./main";
import { IMAGE_EXT_RE, QUOTE_MARKER_RE, inlineTokenPattern, matchTags } from "./utils/patterns";

// Lets Obsidian finish its own render before we re-derive from the DOM.
const REHIGHLIGHT_DELAY_MS = 100;
// Quiet period after the last mutation before the recycling watch is dropped, and the hard cap.
const RECYCLE_WATCH_MS = 1000;
const RECYCLE_WATCH_MAX_MS = 5000;

export function registerWrotPostProcessor(plugin: WrotPlugin): void {
  plugin.registerMarkdownPostProcessor((el, ctx) => {
    if (el.querySelector(WR_CODE_SELECTOR) === null) return;
    // Record where each block came from before rendering: the context is the only place
    // that knows the source path and the fence's line number.
    stampWrBlockLocations(el, ctx);
    // Nested renderers (a fenced mermaid/dataview block inside a memo) need a parent that is
    // actually loaded, and one whose lifetime follows this section.
    const child = new MarkdownRenderChild(el);
    ctx.addChild(child);
    highlightAllWrBlocks(el, plugin, child);
    void applyBlockIdClasses(el, plugin, ctx?.sourcePath);
  });

  plugin.registerEvent(
    plugin.app.workspace.on("active-leaf-change", () => {
      rehighlightAllReadingViews(plugin);
    })
  );

  plugin.registerEvent(
    plugin.app.workspace.on("layout-change", () => {
      rehighlightAllReadingViews(plugin);
    })
  );

  plugin.registerEvent(
    plugin.app.vault.on("modify", (file) => {
      if (!(file instanceof TFile)) return;
      invalidateMemoCache(file.path);
      void repairReadingViewsFor(plugin, file);
      refreshQuoteCardsForFile(
        plugin.app,
        file,
        (content) => plugin.getTagRuleClassForContent(content),
        (ruleClass) => plugin.getRuleAccentColor(ruleClass)
      );
    })
  );
  plugin.registerEvent(
    plugin.app.vault.on("delete", (file) => {
      if (!(file instanceof TFile)) return;
      invalidateMemoCache(file.path);
      refreshQuoteCardsForFile(
        plugin.app,
        file,
        (content) => plugin.getTagRuleClassForContent(content),
        (ruleClass) => plugin.getRuleAccentColor(ruleClass)
      );
    })
  );
}

function highlightAllWrBlocks(el: HTMLElement, plugin: WrotPlugin, parent: Component): void {
  const codeEls = el.querySelectorAll(WR_CODE_SELECTOR);
  codeEls.forEach((code) => {
    const codeEl = code as HTMLElement;

    const text = code.textContent || "";
    if (!text.trim()) return;

    const parentBlock = code.closest(".block-language-wr") || code.closest("pre");
    if (parentBlock instanceof HTMLElement) {
      applyTagRuleClass(parentBlock, codeEl, plugin);
    }

    const hasProcessedInCode = code.querySelector(".wr-reading-tag, .wr-reading-url, .wr-internal-link, .wr-inline-code");
    const hasProcessedInBlock = parentBlock?.querySelector(".wr-reading-list, .wr-blockquote, .wr-embed-img, .wr-plain-text, .wr-codeblock-display, .wr-math-display");
    if (hasProcessedInCode || hasProcessedInBlock) return;

    processCodeBlock(codeEl, plugin, parent);
  });
}

// Reading View can move an already rendered section onto another memo's position when their text
// matches, carrying a stale line stamp, block id and checkbox state with it. What each position
// should hold is captured up front, then re-applied whenever the view mutates.
interface WrViewSnapshot {
  sourcePath: string;
  memos: Memo[];
  states: boolean[][];
}

function snapshotOf(file: TFile, memos: Memo[]): WrViewSnapshot {
  return { sourcePath: file.path, memos, states: memos.map((m) => checkboxStatesOf(m)) };
}

function checkboxStatesOf(memo: Memo): boolean[] {
  return memo.content
    .split("\n")
    .map((line) => /^(?:>\s?)*- \[([ x])\] /.exec(line))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => m[1] === "x");
}

// Position only means anything while every memo of the file is mounted.
function applySnapshot(scope: HTMLElement, snap: WrViewSnapshot): void {
  const blocks = scopedWrBlocks(scope);
  if (blocks.length !== snap.memos.length) return;
  blocks.forEach((block, i) => {
    stampWrBlockLocation(block, snap.sourcePath, snap.memos[i].lineStart);
    applyBlockIdClass(block, snap.memos[i]);
    const states = snap.states[i];
    const boxes = Array.from(block.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
    if (boxes.length !== states.length) return;
    boxes.forEach((box, k) => {
      if (box.checked !== states[k]) box.checked = states[k];
    });
  });
}

// Repairing from the mutation record lands in the same frame, so the stale state never paints.
// Only childList is observed; the repair touches attributes and properties, so it cannot
// re-trigger itself. The watch extends while the render keeps arriving in bursts.
function watchRecycling(scope: HTMLElement, snap: WrViewSnapshot): void {
  applySnapshot(scope, snap);

  const deadline = Date.now() + RECYCLE_WATCH_MAX_MS;
  let idleTimer = 0;
  const observer = new MutationObserver(() => {
    applySnapshot(scope, snap);
    window.clearTimeout(idleTimer);
    if (Date.now() >= deadline) {
      observer.disconnect();
      return;
    }
    idleTimer = window.setTimeout(() => observer.disconnect(), RECYCLE_WATCH_MS);
  });
  observer.observe(scope, { childList: true, subtree: true });
  idleTimer = window.setTimeout(() => observer.disconnect(), RECYCLE_WATCH_MS);
}

// Backstop for edits made anywhere else; the checkbox path arms its own watch without waiting
// on a read, because a read costs the frame the repair needs to land in.
async function repairReadingViewsFor(plugin: WrotPlugin, file: TFile): Promise<void> {
  if (readingViewScopesFor(plugin, file).length === 0) return;
  let snap: WrViewSnapshot;
  try {
    snap = snapshotOf(file, sortedMemosOf(await plugin.app.vault.read(file)));
  } catch {
    return;
  }
  for (const scope of readingViewScopesFor(plugin, file)) watchRecycling(scope, snap);
}

function readingViewScopesFor(plugin: WrotPlugin, file: TFile): HTMLElement[] {
  const scopes: HTMLElement[] = [];
  plugin.app.workspace.iterateAllLeaves((leaf) => {
    const view = leaf.view as { containerEl?: HTMLElement; file?: unknown };
    if (!(view.file instanceof TFile) || view.file.path !== file.path) return;
    view.containerEl?.querySelectorAll<HTMLElement>(".markdown-reading-view").forEach((rv) => {
      scopes.push(rv);
    });
  });
  return scopes;
}

function rehighlightAllReadingViews(plugin: WrotPlugin): void {
  window.setTimeout(() => {
    activeDocument.querySelectorAll(".markdown-reading-view").forEach((view) => {
      highlightAllWrBlocks(view as HTMLElement, plugin, plugin);
    });
  }, REHIGHLIGHT_DELAY_MS);
}

async function applyBlockIdClasses(el: HTMLElement, plugin: WrotPlugin, sourcePath?: string): Promise<void> {
  const codeEls = Array.from(el.querySelectorAll<HTMLElement>(WR_CODE_SELECTOR));
  if (codeEls.length === 0) return;
  if (!sourcePath) return;
  const file = plugin.app.vault.getAbstractFileByPath(sourcePath);
  if (!(file instanceof TFile)) return;
  let memos: Memo[];
  try {
    memos = sortedMemosOf(await plugin.app.vault.cachedRead(file));
  } catch {
    return;
  }
  const memoByLineStart = new Map(memos.map((memo) => [memo.lineStart, memo]));

  for (const code of codeEls) {
    const block = wrBlockContainer(code);
    if (!block) continue;

    // Preferred: the stamped fence line identifies the memo outright.
    const location = readWrBlockLocation(block);
    let memo = location ? memoByLineStart.get(location.lineStart) : undefined;

    // Fallback for blocks the context never covered: pair fences with memos by order, scoped to
    // the surrounding embed / hover preview / reading view. Scoping matters because a single
    // document can hold several rendered files at once, and a document-wide pairing would drift.
    if (!memo) {
      const scoped = scopedWrBlocks(wrScopeRoot(block));
      const index = scoped.indexOf(block);
      if (index >= 0) memo = memos[index];
    }
    if (!memo) continue;

    applyBlockIdClass(block, memo);
  }
}

function blockIdOf(memo: Memo): string {
  return `wr-block-id-wr-${memo.time.replace(/[-:.TZ+]/g, "").slice(0, 17)}`;
}

function applyBlockIdClass(block: HTMLElement, memo: Memo): void {
  const cls = blockIdOf(memo);
  if (block.classList.contains(cls)) return;
  // A previously assigned id may have come from a stale pairing; replace rather than keep,
  // otherwise a wrong id sticks for the lifetime of the element.
  for (const existing of Array.from(block.classList)) {
    if (existing.startsWith("wr-block-id-wr-")) block.classList.remove(existing);
  }
  block.classList.add(cls);
}

function applyTagRuleClass(block: HTMLElement, code: HTMLElement, plugin: WrotPlugin): void {
  const container = block.parentElement;
  const targets: HTMLElement[] = [block];
  if (container) {
    container.querySelectorAll(".code-block-flair, .copy-code-button").forEach((el) => {
      if (el.instanceOf(HTMLElement)) targets.push(el);
    });
  }
  block.querySelectorAll(".code-block-flair, .copy-code-button").forEach((el) => {
    if (el.instanceOf(HTMLElement)) targets.push(el);
  });

  for (const t of targets) {
    const existing = Array.from(t.classList);
    for (const cls of existing) {
      if (/^wr-tag-rule-\d+$/.test(cls)) t.classList.remove(cls);
    }
  }

  const rawText = code.getAttribute("data-wr-original") || code.textContent || "";
  const blockTags = matchTags(rawText);
  const rule = plugin.findTagColorRule(blockTags);
  if (!rule) return;
  const idx = plugin.settings.tagColorRules.indexOf(rule);
  if (idx < 0) return;

  const cls = `wr-tag-rule-${idx}`;
  for (const t of targets) t.classList.add(cls);
}

function processCodeBlock(code: HTMLElement, plugin: WrotPlugin, parent: Component): void {
  const block = code.closest(".block-language-wr") || code.closest("pre");
  if (!block) return;

  const container = block.parentElement || block;
  container.querySelectorAll(".code-block-flair, .copy-code-button").forEach((el) => {
    (el as HTMLElement).classList.add("wr-flair-bg");
  });
  block.querySelectorAll(".code-block-flair, .copy-code-button").forEach((el) => {
    (el as HTMLElement).classList.add("wr-flair-bg");
  });

  const copyButtons = [
    ...Array.from(container.querySelectorAll(".copy-code-button")),
    ...Array.from(block.querySelectorAll(".copy-code-button")),
  ];
  const resolveAccentForBlock = (): string => {
    const ruleClass = Array.from(block.classList).find((c) => /^wr-tag-rule-\d+$/.test(c));
    if (ruleClass) {
      const idx = parseInt(ruleClass.slice("wr-tag-rule-".length), 10);
      const rule = plugin.settings.tagColorRules?.[idx];
      if (rule?.accentColor && /^#[0-9a-fA-F]{6}$/.test(rule.accentColor)) {
        return rule.accentColor;
      }
    }
    return getComputedStyle(activeDocument.body).getPropertyValue("--text-accent").trim() || "#adc718";
  };
  for (const btn of copyButtons) {
    btn.addEventListener("click", () => {
      const successColor = resolveAccentForBlock();
      const applySvgColor = () => {
        btn.querySelectorAll("svg, svg *").forEach((svg) => {
          svg.setAttribute("stroke", successColor);
          svg.setAttribute("color", successColor);
        });
      };
      // Obsidian swaps the icon after click; re-apply a few times to cover that.
      applySvgColor();
      window.setTimeout(applySvgColor, 50);
      window.setTimeout(applySvgColor, 150);
    });
  }

  block.querySelectorAll(".wr-media-area").forEach((el) => el.remove());

  const resolveImagePath = (fileName: string): string | null => {
    const file = plugin.app.metadataCache.getFirstLinkpathDest(fileName, "");
    return file ? plugin.app.vault.getResourcePath(file) : null;
  };

  // Posts containing a quote-card marker [[X#^wr-T]] render images inline instead of
  // collecting them at the tail, so images stay at their written position above the card.
  const blockFullText = code.textContent || "";
   
  const hasQuoteMarker = QUOTE_MARKER_RE.test(blockFullText);

  convertListLines(code, plugin, parent);

  const tailUrls: string[] = [];
  const tailEmbedImages: HTMLElement[] = [];

  const walkTargets: HTMLElement[] = [code];
  block.querySelectorAll(".wr-reading-list, .wr-blockquote, .wr-plain-text").forEach((el) => {
    walkTargets.push(el as HTMLElement);
  });

  for (const walkTarget of walkTargets) {
  const walker = activeDocument.createTreeWalker(walkTarget, NodeFilter.SHOW_TEXT);

  let textNode: Text | null;
  const nodesToReplace: { node: Text; fragments: DocumentFragment }[] = [];
  while ((textNode = walker.nextNode() as Text | null)) {
    const text = textNode.textContent || "";
    if (!text.includes("#") && !text.match(/(?:https?|obsidian):\/\//) && !text.includes("[[") && !text.includes("`") && !text.includes("*") && !text.includes("~") && !text.includes("=") && !text.includes("$")) continue;

    const frag = createFragment();
    const parts = text.split(inlineTokenPattern());
    let hasMatch = false;


    for (const part of parts) {
      if (!part) continue;

      const codeMatch = part.match(/^`([^`]+)`$/);
      if (codeMatch) {
        const codeEl = createSpan();
        codeEl.className = "wr-inline-code";
        const tickOpen = createSpan();
        tickOpen.className = "wr-backtick";
        tickOpen.textContent = "`";
        const tickClose = createSpan();
        tickClose.className = "wr-backtick";
        tickClose.textContent = "`";
        codeEl.appendChild(tickOpen);
        codeEl.appendChild(activeDocument.createTextNode(codeMatch[1]));
        codeEl.appendChild(tickClose);
        frag.appendChild(codeEl);
        hasMatch = true;
        continue;
      }

      const formatPatterns: [RegExp, keyof HTMLElementTagNameMap, string][] = [
        [/^\*\*(.+)\*\*$/, "strong", "**"],
        [/^\*(.+)\*$/, "em", "*"],
        [/^~~(.+)~~$/, "del", "~~"],
        [/^==(.+)==$/, "mark", "=="],
      ];
      let formatHandled = false;
      for (const [re, tag, marker] of formatPatterns) {
        const m = part.match(re);
        if (m) {
          const el = createEl(tag);
          if (tag === "mark") el.className = "wr-highlight";
          const mOpen = createSpan();
          mOpen.className = "wr-backtick";
          mOpen.textContent = marker;
          const mClose = createSpan();
          mClose.className = "wr-backtick";
          mClose.textContent = marker;
          el.appendChild(mOpen);
          el.appendChild(activeDocument.createTextNode(m[1]));
          el.appendChild(mClose);
          frag.appendChild(el);
          hasMatch = true;
          formatHandled = true;
          break;
        }
      }
      if (formatHandled) continue;

      // eslint-disable-next-line no-useless-escape -- escape kept for regex readability
      const mdLinkMatch = part.match(/^\[([^\[\]\n]+)\]\(((?:https?|obsidian):\/\/[^\s)]+)\)$/);
      if (mdLinkMatch) {
        const label = mdLinkMatch[1];
        const url = mdLinkMatch[2];
        if (isSafeUrl(url)) {
          const span = createSpan();
          span.className = "wr-reading-url";
          span.textContent = label;
          span.addEventListener("pointerup", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isSafeUrl(url)) window.open(url, "_blank");
          });
          frag.appendChild(span);
          if (url.startsWith("http")) tailUrls.push(url);
          hasMatch = true;
        } else {
          frag.appendChild(activeDocument.createTextNode(part));
        }
        continue;
      }

      const embedMatch = part.match(/^!\[\[(.+)\]\]$/);
      const linkMatch = !embedMatch && part.match(/^\[\[(.+)\]\]$/);

      if (embedMatch) {
        const fileName = embedMatch[1];
        if (IMAGE_EXT_RE.test(fileName)) {
          const file = plugin.app.metadataCache.getFirstLinkpathDest(fileName, "");
          if (file) {
            const img = createEl("img");
            img.className = hasQuoteMarker ? "wr-embed-img wr-rv-inline-img" : "wr-embed-img";
            img.src = plugin.app.vault.getResourcePath(file);
            img.alt = fileName;
            img.loading = "lazy";
            if (hasQuoteMarker) {
              frag.appendChild(img);
            } else {
              tailEmbedImages.push(img);
            }
            hasMatch = true;
            continue;
          } else {
            const span = createSpan();
            span.className = "wr-embed-missing";
            span.textContent = `![[${fileName}]]`;
            frag.appendChild(span);
          }
          hasMatch = true;
          continue;
        } else {
          const a = createEl("a");
          const resolved = plugin.app.metadataCache.getFirstLinkpathDest(fileName, "") !== null;
          a.className = resolved ? "wr-internal-link" : "wr-internal-link wr-internal-link-unresolved";
          a.textContent = fileName;
          a.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
            plugin.app.workspace.openLinkText(fileName, "", false);
          });
          frag.appendChild(a);
        }
        hasMatch = true;
      } else if (linkMatch) {
        const linkName = linkMatch[1];
        const quoteMatch = linkName.match(QUOTE_LINK_RE);
        if (quoteMatch) {
          const slot = createSpan();
          slot.className = "wr-quote-card-slot";
          renderQuoteCard(slot, quoteMatch[1], quoteMatch[2], plugin.app, "", {
            timestampFormat: plugin.settings.timestampFormat,
            resolveRuleClass: (content) => plugin.getTagRuleClassForContent(content),
            resolveRuleAccent: (ruleClass) => plugin.getRuleAccentColor(ruleClass),
            checkStrikethrough: plugin.settings.checkStrikethrough,
          });
          frag.appendChild(slot);
        } else {
          const a = createEl("a");
          const resolved = plugin.app.metadataCache.getFirstLinkpathDest(linkName, "") !== null;
          a.className = resolved ? "wr-internal-link" : "wr-internal-link wr-internal-link-unresolved";
          a.textContent = linkName;
          a.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
            plugin.app.workspace.openLinkText(linkName, "", false);
          });
          frag.appendChild(a);
        }
        hasMatch = true;
      } else if (part.match(/^#[^\s#]+$/)) {
        const span = createSpan();
        span.className = "wr-reading-tag";
        span.textContent = part;
        // Click opens global tag search; stopPropagation avoids interfering with
        // checkboxes etc. inside the same pre.
        span.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          // Remove the class and force a reflow so the flash restarts on rapid clicks.
          span.classList.remove("wr-tag-flash");
          void span.offsetWidth;
          span.classList.add("wr-tag-flash");
          plugin.openTagSearch(part);
        });
        frag.appendChild(span);
        hasMatch = true;
      } else if (part.match(/^\$([^$]+)\$$/)) {
        const mathContent = part.slice(1, -1);
        const mathEl = createSpan();
        mathEl.className = "wr-math";
        try {
          // MathJax loads lazily (see utils/mathjax.ts). If not ready, fall through to the
          // fallback; wr-math-fallback marks the element for in-place replacement once loaded.
          if (!isMathJaxReady()) throw new Error("MathJax not loaded yet");
          // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment, no-undef -- internal Obsidian/CodeMirror API or intentional pattern
          const { renderMath, finishRenderMath } = require("obsidian");
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- internal Obsidian/CodeMirror API or intentional pattern
          const rendered = renderMath(mathContent, false);
          mathEl.appendChild(rendered);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- call into untyped Obsidian/CodeMirror internal API
          finishRenderMath();
        } catch {
          mathEl.classList.add("wr-math-fallback");
          mathEl.textContent = part;
          requestMathJax();
        }
        frag.appendChild(mathEl);
        hasMatch = true;
      } else if (part.match(/^obsidian:\/\//)) {
        const cleaned = part.replace(/[.,;:!?)]+$/, "");
        const trailing = part.slice(cleaned.length);
        let fileName: string | null = null;
        try {
          const params = new URL(cleaned).searchParams;
          const filePath = params.get("file");
          if (filePath) {
            const decoded = decodeURIComponent(filePath);
            fileName = decoded.split("/").pop() || decoded;
          }
        // eslint-disable-next-line no-empty -- intentional no-op
        } catch {}
        const lowerName = fileName?.toLowerCase() || "";
        const looksLikeImage = IMAGE_EXT_RE.test(lowerName);
        const resolved = fileName ? plugin.app.metadataCache.getFirstLinkpathDest(fileName, "") : null;
        const isImageEmbed = looksLikeImage && resolved !== null;
        const isUnresolvedImage = looksLikeImage && resolved === null;
        if (!isImageEmbed) {
          const link = createEl("a");
          link.className = isUnresolvedImage
            ? "wr-internal-link wr-internal-link-unresolved"
            : "wr-internal-link";
          link.textContent = fileName || cleaned;
          link.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isSafeUrl(cleaned)) window.open(cleaned);
          });
          frag.appendChild(link);
          if (trailing) frag.appendChild(activeDocument.createTextNode(trailing));
        } else if (trailing) {
          frag.appendChild(activeDocument.createTextNode(trailing));
        }
        tailUrls.push(cleaned);
        hasMatch = true;
      } else if (part.match(/^https?:\/\//)) {
        const cleaned = part.replace(/[.,;:!?)]+$/, "");
        const trailing = part.slice(cleaned.length);

        const span = createSpan();
        span.className = "wr-reading-url";
        span.textContent = cleaned;
        span.addEventListener("pointerup", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isSafeUrl(cleaned)) window.open(cleaned, "_blank");
        });
        frag.appendChild(span);

        if (trailing) {
          frag.appendChild(activeDocument.createTextNode(trailing));
        }

        tailUrls.push(cleaned);
        hasMatch = true;
      } else {
        frag.appendChild(activeDocument.createTextNode(part));
      }
    }

    if (hasMatch) {
      nodesToReplace.push({ node: textNode, fragments: frag });
    }
  }

  for (const { node, fragments } of nodesToReplace) {
    node.parentNode?.replaceChild(fragments, node);
  }
  }

  // Keep the quote card at the bottom: insert tail media just before the quote-card slot.
  const blockEl = code.closest(".block-language-wr") || code.closest("pre");
  if (blockEl) {
    const quoteSlot = hasQuoteMarker
      ? blockEl.querySelector(".wr-quote-card-slot")
      : null;
    const insertMediaNode = (node: Node): void => {
      if (quoteSlot && quoteSlot.parentNode) {
        quoteSlot.parentNode.insertBefore(node, quoteSlot);
      } else {
        blockEl.appendChild(node);
      }
    };
    if (tailEmbedImages.length > 0) {
      for (const img of tailEmbedImages) {
        insertMediaNode(img);
      }
    }
    if (tailUrls.length > 0) {
      const parsedUrls = extractUrls(tailUrls.join(" ")).filter(
        (pu) => pu.type === "image" || !pu.url.startsWith("obsidian://")
      );
      if (parsedUrls.length > 0 && !blockEl.querySelector(".wr-media-area")) {
        const mediaEl = createDiv();
        mediaEl.className = "wr-media-area";
        insertMediaNode(mediaEl);
        renderUrlPreviews(mediaEl, parsedUrls, plugin.ogpCache, resolveImagePath);
      }
    }
    // :has() workaround: mark blocks with a quote card or an image/media tail with a
    // state class; styles.css tightens padding-bottom via this class.
    const lastChild = blockEl.lastElementChild;
    const hasRichTail =
      !!blockEl.querySelector(".wr-quote-card-slot") ||
      !!lastChild?.classList.contains("wr-embed-img") ||
      !!lastChild?.classList.contains("wr-media-area");
    blockEl.classList.toggle("wr-rv-rich-tail", hasRichTail);
  }
}

function renderCodeBlockFragment(
  segment: Extract<Segment, { kind: "codeblock" }>,
  plugin: WrotPlugin,
  parent: Component
): HTMLElement {
  const blockEl = createDiv();
  blockEl.className = "wr-codeblock-display";
  const fence = "~".repeat(Math.max(3, segment.fenceTildes));
  const source = (segment.lang ? `${fence}${segment.lang}\n` : `${fence}\n`) + segment.code + `\n${fence}`;
  // The parent must already be loaded: a freshly constructed Component never loads its
  // children, so processors registered by other plugins (mermaid, dataview, ...) never run.
  MarkdownRenderer.render(plugin.app, source, blockEl, "", parent).catch(() => {
    blockEl.empty();
    const pre = blockEl.createEl("pre");
    const codeEl = pre.createEl("code");
    if (segment.lang) codeEl.addClass(`language-${segment.lang}`);
    codeEl.textContent = segment.code;
  });
  return blockEl;
}

function renderMathBlockFragment(segment: Extract<Segment, { kind: "mathblock" }>): HTMLElement {
  const blockEl = createDiv();
  blockEl.className = "wr-math-display";
  try {
    // MathJax loads lazily (see utils/mathjax.ts). If not ready, fall through to the
    // fallback; wr-math-fallback marks the element for in-place replacement once loaded.
    if (!isMathJaxReady()) throw new Error("MathJax not loaded yet");
    const rendered = renderMath(segment.tex, true);
    blockEl.appendChild(rendered);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
    finishRenderMath();
  } catch {
    blockEl.classList.add("wr-math-fallback");
    blockEl.textContent = segment.tex;
    requestMathJax();
  }
  return blockEl;
}

/**
 * Wires a rendered checkbox back to the line it came from.
 *
 * `bodyLineIndex` is the 0-based line within the fence body, so the target line is the fence
 * line plus one plus that offset.
 */
function attachCheckboxToggle(
  cb: HTMLInputElement,
  plugin: WrotPlugin,
  block: HTMLElement,
  bodyLineIndex: number,
  blockBodyText: string
): void {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- async handler intentionally used as a callback
  cb.addEventListener("click", async () => {
    await toggleCheckboxForBlock(plugin, cb, block, bodyLineIndex, blockBodyText);
  });
}

async function toggleCheckboxForBlock(
  plugin: WrotPlugin,
  cb: HTMLInputElement,
  block: HTMLElement,
  bodyLineIndex: number,
  blockBodyText: string
): Promise<void> {
  const app = plugin.app;
  const location = readWrBlockLocation(block);
  const file = location ? fileForLocation(app, location) : resolveFileFromView(app, block);
  if (!file) return;

  const memos = sortedMemosOf(await app.vault.read(file));

  // The render-time stamp may have been moved onto another memo by section recycling, so derive
  // from where the element sits now.
  const scope = wrScopeRoot(block);
  const blocks = scopedWrBlocks(scope);
  const mounted = blocks.length === memos.length;
  const blockIdx = mounted ? blocks.indexOf(block) : -1;
  let lineStart = blockIdx >= 0 ? memos[blockIdx].lineStart : location?.lineStart ?? null;

  if (lineStart === null) {
    // Never stamped and position is not trustworthy: last resort is a body-text search.
    // Duplicate bodies are ambiguous here, which is exactly why it is the last resort.
    lineStart = findFenceLineByBody(memos, blockBodyText);
  }
  if (lineStart === null) return;

  await toggleCheckbox(app, file, lineStart + 1 + bodyLineIndex);

  if (blockIdx < 0) return;
  // What the view should show is known without reading the file back: the click flipped exactly
  // one box. Arming the watch synchronously keeps the repair inside the render's own frame.
  const snap = snapshotOf(file, memos);
  const boxIdx = Array.from(
    block.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
  ).indexOf(cb);
  const states = snap.states[blockIdx];
  if (boxIdx >= 0 && boxIdx < states.length) states[boxIdx] = !states[boxIdx];
  watchRecycling(scope, snap);
}

function sortedMemosOf(content: string): Memo[] {
  return parseMemos(content).sort((a, b) => a.lineStart - b.lineStart);
}

function findFenceLineByBody(memos: Memo[], blockBodyText: string): number | null {
  const wanted = blockBodyText.trim();
  const memo = memos.find((m) => m.content === wanted);
  return memo ? memo.lineStart : null;
}

function convertListLines(
  code: HTMLElement,
  plugin: WrotPlugin,
  parent: Component
): void {
  const fullText = code.textContent || "";
  const segments = segmentBlocks(fullText);

  const block = wrBlockContainer(code);
  if (!block) return;

  // Rebuild: non-list content stays inside code; lists are placed on the parent block.
  code.textContent = "";
  const fragments: (string | HTMLElement)[] = [];
  let currentListEl: HTMLElement | null = null;
  let currentListType: "ul" | "ol" | null = null;
  let plainLines: string[] = [];
  let quoteStack: HTMLElement[] = [];
  let quoteListEl: HTMLElement | null = null;
  let quoteListType: "ul" | "ol" | null = null;
  let quoteListDepth: number = 0;

  const flushPlain = () => {
    if (plainLines.length > 0) {
      fragments.push(plainLines.join("\n"));
      plainLines = [];
    }
  };

  const flushList = () => {
    if (currentListEl) {
      fragments.push(currentListEl);
      currentListEl = null;
      currentListType = null;
    }
  };

  for (const segment of segments) {
    if (segment.kind === "codeblock") {
      flushList();
      flushPlain();
      fragments.push(renderCodeBlockFragment(segment, plugin, parent));
      continue;
    }
    if (segment.kind === "mathblock") {
      flushList();
      flushPlain();
      fragments.push(renderMathBlockFragment(segment));
      continue;
    }

    const lines = segment.text.split("\n");
    const lineOffset = segment.startLine;
    for (let li2 = 0; li2 < lines.length; li2++) {
      const i = lineOffset + li2;
      const line = lines[li2];
      const quoteMatch = line.match(/^((?:>\s?)+)(.*)$/);
    const checkMatch = !quoteMatch && line.match(/^- \[([ x])\] (.*)$/);
    const listMatch = !quoteMatch && !checkMatch && line.match(/^- (.+)$/);
    const olMatch = !quoteMatch && !checkMatch && !listMatch && line.match(/^\d+\.\s?(.+)$/);

    if (quoteMatch) {
      if (currentListEl) {
        fragments.push(currentListEl);
        currentListEl = null;
        currentListType = null;
      }
      flushPlain();
      const depth = (quoteMatch[1].match(/>/g) || []).length;
      const body = quoteMatch[2];
      const lastFrag = fragments[fragments.length - 1];
      const continuingQuote = quoteStack.length > 0 && lastFrag instanceof HTMLElement && lastFrag === quoteStack[0];
      if (!continuingQuote) {
        const root = createEl("blockquote");
        root.className = "wr-blockquote";
        fragments.push(root);
        quoteStack = [root];
      }
      while (quoteStack.length > depth) {
        quoteStack.pop();
      }
      while (quoteStack.length < depth) {
        const parent = quoteStack[quoteStack.length - 1];
        const bq = createEl("blockquote");
        bq.className = "wr-blockquote";
        parent.appendChild(bq);
        quoteStack.push(bq);
      }
      const target = quoteStack[quoteStack.length - 1];
      const innerCheck = body.match(/^- \[([ x])\] (.*)$/);
      const innerList = !innerCheck && body.match(/^- (.+)$/);
      const innerOl = !innerCheck && !innerList && body.match(/^\d+\.\s?(.+)$/);
      if (innerCheck || innerList) {
        if (quoteListEl === null || quoteListType !== "ul" || quoteListDepth !== depth || quoteListEl.parentElement !== target) {
          quoteListEl = createEl("ul");
          quoteListEl.className = "wr-reading-list";
          target.appendChild(quoteListEl);
          quoteListType = "ul";
          quoteListDepth = depth;
        }
        const li = createEl("li");
        if (innerCheck) {
          li.className = "wr-check-item";
          const cb = createEl("input");
          cb.type = "checkbox";
          if (innerCheck[1] === "x") cb.checked = true;
          attachCheckboxToggle(cb, plugin, block, i, fullText);
          li.appendChild(cb);
          if (innerCheck[1] === "x" && plugin.settings.checkStrikethrough) {
            const span = createSpan();
            span.className = "wr-check-done";
            span.appendChild(activeDocument.createTextNode(innerCheck[2]));
            li.appendChild(span);
          } else {
            li.appendChild(activeDocument.createTextNode(innerCheck[2]));
          }
        } else if (innerList) {
          li.appendChild(activeDocument.createTextNode(innerList[1]));
        }
        quoteListEl.appendChild(li);
      } else if (innerOl) {
        if (quoteListEl === null || quoteListType !== "ol" || quoteListDepth !== depth || quoteListEl.parentElement !== target) {
          quoteListEl = createEl("ol");
          quoteListEl.className = "wr-reading-list";
          target.appendChild(quoteListEl);
          quoteListType = "ol";
          quoteListDepth = depth;
        }
        const li = createEl("li");
        li.appendChild(activeDocument.createTextNode(innerOl[1]));
        quoteListEl.appendChild(li);
      } else {
        quoteListEl = null;
        quoteListType = null;
        if (target.childNodes.length > 0 && target.lastChild?.nodeName !== "OL" && target.lastChild?.nodeName !== "UL" && target.lastChild?.nodeName !== "BLOCKQUOTE") {
          target.appendChild(createEl("br"));
        }
        target.appendChild(activeDocument.createTextNode(body));
      }
    } else if (checkMatch || listMatch) {
      quoteStack = [];
      quoteListEl = null;
      quoteListType = null;
      if (currentListType !== "ul") {
        if (currentListEl) fragments.push(currentListEl);
        flushPlain();
        currentListEl = createEl("ul");
        currentListEl.className = "wr-reading-list";
        currentListType = "ul";
      }
      const li = createEl("li");
      if (checkMatch) {
        li.className = "wr-check-item";
        const cb = createEl("input");
        cb.type = "checkbox";
        if (checkMatch[1] === "x") cb.checked = true;
        attachCheckboxToggle(cb, plugin, block, i, fullText);
        li.appendChild(cb);
        if (checkMatch[1] === "x" && plugin.settings.checkStrikethrough) {
          const span = createSpan();
          span.className = "wr-check-done";
          span.appendChild(activeDocument.createTextNode(checkMatch[2]));
          li.appendChild(span);
        } else {
          li.appendChild(activeDocument.createTextNode(checkMatch[2]));
        }
      } else if (listMatch) {
        li.appendChild(activeDocument.createTextNode(listMatch[1]));
      }
      currentListEl!.appendChild(li);
    } else if (olMatch) {
      quoteStack = [];
      quoteListEl = null;
      quoteListType = null;
      if (currentListType !== "ol") {
        if (currentListEl) fragments.push(currentListEl);
        flushPlain();
        currentListEl = createEl("ol");
        currentListEl.className = "wr-reading-list";
        currentListType = "ol";
      }
      const li = createEl("li");
      li.appendChild(activeDocument.createTextNode(olMatch[1]));
      currentListEl!.appendChild(li);
    } else {
      quoteStack = [];
      quoteListEl = null;
      quoteListType = null;
      if (currentListEl) {
        fragments.push(currentListEl);
        currentListEl = null;
        currentListType = null;
      }
      plainLines.push(line);
    }
  }
  }
  if (currentListEl) fragments.push(currentListEl);
  flushPlain();

  // Preserve the original text for the copy button.
  code.setAttribute("data-wr-original", fullText);

  while (fragments.length > 0 && fragments[fragments.length - 1] === "") {
    fragments.pop();
  }

  // Keep code hidden rather than removed so the copy button still works.
  code.classList.add("wr-code-hidden");

  let hasContent = false;
  for (const frag of fragments) {
    if (typeof frag === "string") {
      if (frag.trim() === "" && hasContent) {
        const spacer = createDiv();
        spacer.className = "wr-spacer";
        block.appendChild(spacer);
      } else if (frag.trim() !== "") {
        const div = createDiv();
        div.className = "wr-plain-text";
        div.textContent = frag;
        block.appendChild(div);
        hasContent = true;
      }
    } else {
      block.appendChild(frag);
      hasContent = true;
    }
  }

}
