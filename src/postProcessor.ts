import { Plugin, TFile, MarkdownRenderer, renderMath, finishRenderMath } from "obsidian";
import { extractUrls, renderUrlPreviews, isSafeUrl } from "./utils/urlRenderer";
import { toggleCheckbox } from "./utils/memoWriter";
import { segmentBlocks, type Segment } from "./utils/blockSegmenter";
import type WrotPlugin from "./main";

/**
 * Highlights #tags and renders URL previews inside ```wr code blocks in Reading View.
 */
export function registerWrotPostProcessor(plugin: WrotPlugin): void {
  plugin.registerMarkdownPostProcessor((el) => {
    highlightAllWrBlocks(el, plugin);
  });

  plugin.registerEvent(
    plugin.app.workspace.on("active-leaf-change", () => {
      setTimeout(() => {
        document.querySelectorAll(".markdown-reading-view").forEach((view) => {
          highlightAllWrBlocks(view as HTMLElement, plugin);
        });
      }, 100);
    })
  );

  plugin.registerEvent(
    plugin.app.workspace.on("layout-change", () => {
      setTimeout(() => {
        document.querySelectorAll(".markdown-reading-view").forEach((view) => {
          highlightAllWrBlocks(view as HTMLElement, plugin);
        });
      }, 100);
    })
  );
}

function highlightAllWrBlocks(el: HTMLElement, plugin: WrotPlugin): void {
  const codeEls = el.querySelectorAll(
    'code.language-wr, .block-language-wr code, pre > code[class*="language-wr"]'
  );
  codeEls.forEach((code) => {
    const codeEl = code as HTMLElement;

    const text = code.textContent || "";
    if (!text.trim()) return;

    // Always (re-)apply tag color rule class so post-edit/re-layout DOMs stay in sync
    const parentBlock = code.closest(".block-language-wr") || code.closest("pre");
    if (parentBlock instanceof HTMLElement) {
      applyTagRuleClass(parentBlock, codeEl, plugin);
    }

    // Already processed
    const hasProcessedInCode = code.querySelector(".wr-reading-tag, .wr-reading-url, .wr-internal-link, .wr-inline-code");
    const hasProcessedInBlock = parentBlock?.querySelector(".wr-reading-list, .wr-blockquote, .wr-embed-img, .wr-plain-text, .wr-codeblock-display, .wr-math-display");
    if (hasProcessedInCode || hasProcessedInBlock) return;

    processCodeBlock(codeEl, plugin);
  });
}

function applyTagRuleClass(block: HTMLElement, code: HTMLElement, plugin: WrotPlugin): void {
  // Copy buttons / flair elements may live as siblings of the block in the parent container,
  // so collect candidates from both sides and keep their tag-rule class in sync with the block.
  const container = block.parentElement;
  const targets: HTMLElement[] = [block];
  if (container) {
    container.querySelectorAll(".code-block-flair, .copy-code-button").forEach((el) => {
      if (el instanceof HTMLElement) targets.push(el);
    });
  }
  block.querySelectorAll(".code-block-flair, .copy-code-button").forEach((el) => {
    if (el instanceof HTMLElement) targets.push(el);
  });

  for (const t of targets) {
    const existing = Array.from(t.classList);
    for (const cls of existing) {
      if (/^wr-tag-rule-\d+$/.test(cls)) t.classList.remove(cls);
    }
  }

  const rawText = code.getAttribute("data-wr-original") || code.textContent || "";
  const blockTags = rawText.match(/#[^\s#]+/g) || [];
  const rule = plugin.findTagColorRule(blockTags);
  if (!rule) return;
  const idx = plugin.settings.tagColorRules.indexOf(rule);
  if (idx < 0) return;

  const cls = `wr-tag-rule-${idx}`;
  for (const t of targets) t.classList.add(cls);
}

function processCodeBlock(code: HTMLElement, plugin: WrotPlugin): void {
  const block = code.closest(".block-language-wr") || code.closest("pre");
  if (!block) return;

  // Apply background color to code-block-flair (may be sibling of block or inside pre)
  const container = block.parentElement || block;
  container.querySelectorAll(".code-block-flair, .copy-code-button").forEach((el) => {
    (el as HTMLElement).classList.add("wr-flair-bg");
  });
  block.querySelectorAll(".code-block-flair, .copy-code-button").forEach((el) => {
    (el as HTMLElement).classList.add("wr-flair-bg");
  });

  // Override copy-code-button success color
  const copyButtons = [
    ...Array.from(container.querySelectorAll(".copy-code-button")),
    ...Array.from(block.querySelectorAll(".copy-code-button")),
  ];
  const resolveAccentForBlock = (): string => {
    // If this block is currently matched by a tag-color rule, prefer that rule's accent.
    const ruleClass = Array.from(block.classList).find((c) => /^wr-tag-rule-\d+$/.test(c));
    if (ruleClass) {
      const idx = parseInt(ruleClass.slice("wr-tag-rule-".length), 10);
      const rule = plugin.settings.tagColorRules?.[idx];
      if (rule?.accentColor && /^#[0-9a-fA-F]{6}$/.test(rule.accentColor)) {
        return rule.accentColor;
      }
    }
    return getComputedStyle(document.body).getPropertyValue("--text-accent").trim() || "#adc718";
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
      // Apply immediately and after Obsidian swaps the icon
      applySvgColor();
      setTimeout(applySvgColor, 50);
      setTimeout(applySvgColor, 150);
    });
  }

  // Remove any existing media area
  block.querySelector(".wr-media-area")?.remove();

  // Phase 1: Convert list lines to <ul><li>
  convertListLines(code, plugin);

  // Phase 2: Process tags, URLs, and internal links via TreeWalker
  const allUrls: string[] = [];
  const embedImages: HTMLElement[] = [];

  // Walk code element and any list elements added to block
  const walkTargets: HTMLElement[] = [code];
  block.querySelectorAll(".wr-reading-list, .wr-blockquote, .wr-plain-text").forEach((el) => {
    walkTargets.push(el as HTMLElement);
  });

  for (const walkTarget of walkTargets) {
  const walker = document.createTreeWalker(walkTarget, NodeFilter.SHOW_TEXT);

  let textNode: Text | null;
  const nodesToReplace: { node: Text; fragments: DocumentFragment }[] = [];
  while ((textNode = walker.nextNode() as Text | null)) {
    const text = textNode.textContent || "";
    if (!text.includes("#") && !text.match(/(?:https?|obsidian):\/\//) && !text.includes("[[") && !text.includes("`") && !text.includes("*") && !text.includes("~") && !text.includes("=") && !text.includes("$")) continue;

    const frag = document.createDocumentFragment();
    const parts = text.split(/(\$[^$]+\$|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|==[^=]+=+|!\[\[[^\]]+\]\]|\[\[[^\]]+\]\]|\[[^\[\]\n]+\]\((?:https?|obsidian):\/\/[^\s)]+\)|#[^\s#]+|(?:https?|obsidian):\/\/[^\s<>"'\]]+)/g);
    let hasMatch = false;

    const IMAGE_EXT = /\.(png|jpg|jpeg|gif|svg|webp|bmp)$/i;

    for (const part of parts) {
      if (!part) continue;

      const codeMatch = part.match(/^`([^`]+)`$/);
      if (codeMatch) {
        const codeEl = document.createElement("span");
        codeEl.className = "wr-inline-code";
        const tickOpen = document.createElement("span");
        tickOpen.className = "wr-backtick";
        tickOpen.textContent = "`";
        const tickClose = document.createElement("span");
        tickClose.className = "wr-backtick";
        tickClose.textContent = "`";
        codeEl.appendChild(tickOpen);
        codeEl.appendChild(document.createTextNode(codeMatch[1]));
        codeEl.appendChild(tickClose);
        frag.appendChild(codeEl);
        hasMatch = true;
        continue;
      }

      // Format markers: bold, italic, strikethrough, highlight
      const formatPatterns: [RegExp, string, string][] = [
        [/^\*\*(.+)\*\*$/, "strong", "**"],
        [/^\*(.+)\*$/, "em", "*"],
        [/^~~(.+)~~$/, "del", "~~"],
        [/^==(.+)==$/, "mark", "=="],
      ];
      let formatHandled = false;
      for (const [re, tag, marker] of formatPatterns) {
        const m = part.match(re);
        if (m) {
          const el = document.createElement(tag);
          if (tag === "mark") el.className = "wr-highlight";
          const mOpen = document.createElement("span");
          mOpen.className = "wr-backtick";
          mOpen.textContent = marker;
          const mClose = document.createElement("span");
          mClose.className = "wr-backtick";
          mClose.textContent = marker;
          el.appendChild(mOpen);
          el.appendChild(document.createTextNode(m[1]));
          el.appendChild(mClose);
          frag.appendChild(el);
          hasMatch = true;
          formatHandled = true;
          break;
        }
      }
      if (formatHandled) continue;

      const mdLinkMatch = part.match(/^\[([^\[\]\n]+)\]\(((?:https?|obsidian):\/\/[^\s)]+)\)$/);
      if (mdLinkMatch) {
        const label = mdLinkMatch[1];
        const url = mdLinkMatch[2];
        if (isSafeUrl(url)) {
          const span = document.createElement("span");
          span.className = "wr-reading-url";
          span.textContent = label;
          span.addEventListener("pointerup", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isSafeUrl(url)) window.open(url, "_blank");
          });
          frag.appendChild(span);
          if (url.startsWith("http")) allUrls.push(url);
          hasMatch = true;
        } else {
          frag.appendChild(document.createTextNode(part));
        }
        continue;
      }

      const embedMatch = part.match(/^!\[\[(.+)\]\]$/);
      const linkMatch = !embedMatch && part.match(/^\[\[(.+)\]\]$/);

      if (embedMatch) {
        const fileName = embedMatch[1];
        if (IMAGE_EXT.test(fileName)) {
          const file = plugin.app.metadataCache.getFirstLinkpathDest(fileName, "");
          if (file) {
            // Don't put img in frag (inside <code>). Queue for block-level append.
            const img = document.createElement("img");
            img.className = "wr-embed-img";
            img.src = plugin.app.vault.getResourcePath(file);
            img.alt = fileName;
            img.loading = "lazy";
            embedImages.push(img);
            // Remove the text from code
            hasMatch = true;
            continue;
          } else {
            const span = document.createElement("span");
            span.className = "wr-embed-missing";
            span.textContent = `![[${fileName}]]`;
            frag.appendChild(span);
          }
        } else {
          const a = document.createElement("a");
          const resolved = plugin.app.metadataCache.getFirstLinkpathDest(fileName, "") !== null;
          a.className = resolved ? "wr-internal-link" : "wr-internal-link wr-internal-link-unresolved";
          a.textContent = fileName;
          a.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            plugin.app.workspace.openLinkText(fileName, "", false);
          });
          frag.appendChild(a);
        }
        hasMatch = true;
      } else if (linkMatch) {
        const linkName = linkMatch[1];
        const a = document.createElement("a");
        const resolved = plugin.app.metadataCache.getFirstLinkpathDest(linkName, "") !== null;
        a.className = resolved ? "wr-internal-link" : "wr-internal-link wr-internal-link-unresolved";
        a.textContent = linkName;
        a.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          plugin.app.workspace.openLinkText(linkName, "", false);
        });
        frag.appendChild(a);
        hasMatch = true;
      } else if (part.match(/^#[^\s#]+$/)) {
        const span = document.createElement("span");
        span.className = "wr-reading-tag";
        span.textContent = part;
        frag.appendChild(span);
        hasMatch = true;
      } else if (part.match(/^\$([^$]+)\$$/)) {
        const mathContent = part.slice(1, -1);
        const mathEl = document.createElement("span");
        mathEl.className = "wr-math";
        try {
          const { renderMath, finishRenderMath } = require("obsidian");
          const rendered = renderMath(mathContent, false);
          mathEl.appendChild(rendered);
          finishRenderMath();
        } catch {
          mathEl.textContent = part;
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
        } catch { /* fileName stays null */ }
        const lowerName = fileName?.toLowerCase() || "";
        const looksLikeImage = IMAGE_EXT.test(lowerName);
        const resolved = fileName ? plugin.app.metadataCache.getFirstLinkpathDest(fileName, "") : null;
        const isImageEmbed = looksLikeImage && resolved !== null;
        if (!isImageEmbed) {
          const link = document.createElement("a");
          link.className = "wr-internal-link";
          link.textContent = fileName || cleaned;
          link.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isSafeUrl(cleaned)) window.open(cleaned);
          });
          frag.appendChild(link);
          if (trailing) frag.appendChild(document.createTextNode(trailing));
        } else if (trailing) {
          frag.appendChild(document.createTextNode(trailing));
        }
        allUrls.push(cleaned);
        hasMatch = true;
      } else if (part.match(/^https?:\/\//)) {
        const cleaned = part.replace(/[.,;:!?)]+$/, "");
        const trailing = part.slice(cleaned.length);

        const span = document.createElement("span");
        span.className = "wr-reading-url";
        span.textContent = cleaned;
        span.addEventListener("pointerup", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isSafeUrl(cleaned)) window.open(cleaned, "_blank");
        });
        frag.appendChild(span);

        if (trailing) {
          frag.appendChild(document.createTextNode(trailing));
        }

        allUrls.push(cleaned);
        hasMatch = true;
      } else {
        frag.appendChild(document.createTextNode(part));
      }
    }

    if (hasMatch) {
      nodesToReplace.push({ node: textNode, fragments: frag });
    }
  }

  for (const { node, fragments } of nodesToReplace) {
    node.parentNode?.replaceChild(fragments, node);
  }
  } // end for walkTargets

  // Append embedded images to block (outside <code>)
  if (embedImages.length > 0) {
    const imgBlock = code.closest(".block-language-wr") || code.closest("pre");
    if (imgBlock) {
      for (const img of embedImages) {
        imgBlock.appendChild(img);
      }
    }
  }

  // Render rich previews inside the block container (only once)
  if (allUrls.length > 0) {
    // Drop obsidian:// URLs that aren't image embeds — they don't produce
    // OGP cards or any media output, so leaving them in would render an
    // empty wr-media-area block.
    const parsedUrls = extractUrls(allUrls.join(" ")).filter(
      (pu) => pu.type === "image" || !pu.url.startsWith("obsidian://")
    );
    if (parsedUrls.length > 0) {
      const block3 = code.closest(".block-language-wr") || code.closest("pre");
      if (block3 && !block3.querySelector(".wr-media-area")) {
        const mediaEl = document.createElement("div");
        mediaEl.className = "wr-media-area";
        block3.appendChild(mediaEl);
        renderUrlPreviews(mediaEl as any, parsedUrls, plugin.ogpCache, (fileName) => {
          const file = plugin.app.metadataCache.getFirstLinkpathDest(fileName, "");
          return file ? plugin.app.vault.getResourcePath(file) : null;
        });
      }
    }
  }

}

function renderCodeBlockFragment(segment: Extract<Segment, { kind: "codeblock" }>, plugin: WrotPlugin): HTMLElement {
  const blockEl = document.createElement("div");
  blockEl.className = "wr-codeblock-display";
  const fence = "~".repeat(Math.max(3, segment.fenceTildes));
  const source = (segment.lang ? `${fence}${segment.lang}\n` : `${fence}\n`) + segment.code + `\n${fence}`;
  MarkdownRenderer.render(plugin.app, source, blockEl, "", plugin).catch(() => {
    blockEl.empty();
    const pre = blockEl.createEl("pre");
    const codeEl = pre.createEl("code");
    if (segment.lang) codeEl.addClass(`language-${segment.lang}`);
    codeEl.textContent = segment.code;
  });
  return blockEl;
}

function renderMathBlockFragment(segment: Extract<Segment, { kind: "mathblock" }>): HTMLElement {
  const blockEl = document.createElement("div");
  blockEl.className = "wr-math-display";
  try {
    const rendered = renderMath(segment.tex, true);
    blockEl.appendChild(rendered);
    finishRenderMath();
  } catch {
    blockEl.textContent = segment.tex;
  }
  return blockEl;
}

function convertListLines(code: HTMLElement, plugin: WrotPlugin): void {
  const fullText = code.textContent || "";
  const segments = segmentBlocks(fullText);

  const block = code.closest(".block-language-wr") || code.closest("pre");
  if (!block) return;

  // Rebuild: non-list text stays in code, list elements go after code in parent
  code.textContent = "";
  const fragments: (string | HTMLElement)[] = [];
  let currentListEl: HTMLElement | null = null;
  let currentListType: "ul" | "ol" | null = null;
  let plainLines: string[] = [];

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
      fragments.push(renderCodeBlockFragment(segment, plugin));
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
      const quoteMatch = line.match(/^> ?(.*)$/);
    const checkMatch = !quoteMatch && line.match(/^- \[([ x])\] (.*)$/);
    const listMatch = !quoteMatch && !checkMatch && line.match(/^- (.+)$/);
    const olMatch = !quoteMatch && !checkMatch && !listMatch && line.match(/^\d+\.\s?(.+)$/);

    if (quoteMatch) {
      if (currentListEl) {
        fragments.push(currentListEl);
        currentListEl = null;
        currentListType = null;
      }
      // Flush any pending plain text before checking for blockquote continuation
      flushPlain();
      // Check if previous fragment is a blockquote (consecutive > lines)
      const lastFrag = fragments[fragments.length - 1];
      if (lastFrag instanceof HTMLElement && lastFrag.tagName === "BLOCKQUOTE") {
        lastFrag.appendChild(document.createElement("br"));
        lastFrag.appendChild(document.createTextNode(quoteMatch[1]));
      } else {
        const bq = document.createElement("blockquote");
        bq.className = "wr-blockquote";
        bq.appendChild(document.createTextNode(quoteMatch[1]));
        fragments.push(bq);
      }
    } else if (checkMatch || listMatch) {
      if (currentListType !== "ul") {
        if (currentListEl) fragments.push(currentListEl);
        flushPlain();
        currentListEl = document.createElement("ul");
        currentListEl.className = "wr-reading-list";
        currentListType = "ul";
      }
      const li = document.createElement("li");
      if (checkMatch) {
        li.className = "wr-check-item";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        if (checkMatch[1] === "x") cb.checked = true;
        const lineIdx = i;
        cb.addEventListener("click", async () => {
          const file = plugin.app.workspace.getActiveFile();
          if (!file) return;
          const data = await plugin.app.vault.read(file);
          const fileLines = data.split("\n");
          // Match by full block content to avoid duplicates
          const blockContent = fullText.trim();
          for (let f = 0; f < fileLines.length; f++) {
            if (fileLines[f].match(/^```wr\s+/)) {
              // Collect body lines until closing ```
              const bodyLines: string[] = [];
              let k = f + 1;
              while (k < fileLines.length && fileLines[k].trim() !== "```") {
                bodyLines.push(fileLines[k]);
                k++;
              }
              if (bodyLines.join("\n").trim() === blockContent) {
                await toggleCheckbox(plugin.app, file, f + 1 + lineIdx);
                return;
              }
            }
          }
        });
        li.appendChild(cb);
        if (checkMatch[1] === "x" && plugin.settings.checkStrikethrough) {
          const span = document.createElement("span");
          span.className = "wr-check-done";
          span.appendChild(document.createTextNode(checkMatch[2]));
          li.appendChild(span);
        } else {
          li.appendChild(document.createTextNode(checkMatch[2]));
        }
      } else if (listMatch) {
        li.appendChild(document.createTextNode(listMatch[1]));
      }
      currentListEl!.appendChild(li);
    } else if (olMatch) {
      if (currentListType !== "ol") {
        if (currentListEl) fragments.push(currentListEl);
        flushPlain();
        currentListEl = document.createElement("ol");
        currentListEl.className = "wr-reading-list";
        currentListType = "ol";
      }
      const li = document.createElement("li");
      li.appendChild(document.createTextNode(olMatch[1]));
      currentListEl!.appendChild(li);
    } else {
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

  // Save original text for copy button
  code.setAttribute("data-wr-original", fullText);

  // Remove trailing empty strings
  while (fragments.length > 0 && fragments[fragments.length - 1] === "") {
    fragments.pop();
  }

  // Hide code element (keep for copy button), render all fragments in order
  code.classList.add("wr-code-hidden");

  let hasContent = false;
  for (const frag of fragments) {
    if (typeof frag === "string") {
      if (frag.trim() === "" && hasContent) {
        const spacer = document.createElement("div");
        spacer.className = "wr-spacer";
        block.appendChild(spacer);
      } else if (frag.trim() !== "") {
        const div = document.createElement("div");
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
