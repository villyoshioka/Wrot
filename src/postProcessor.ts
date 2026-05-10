import { TFile, MarkdownRenderer, renderMath, finishRenderMath } from "obsidian";
import { extractUrls, renderUrlPreviews, isSafeUrl, QUOTE_LINK_RE } from "./utils/urlRenderer";
import { renderQuoteCard, invalidateMemoCache, refreshQuoteCardsForFile } from "./utils/quoteCard";
import { toggleCheckbox } from "./utils/memoWriter";
import { segmentBlocks, type Segment } from "./utils/blockSegmenter";
import type WrotPlugin from "./main";

export function registerWrotPostProcessor(plugin: WrotPlugin): void {
  plugin.registerMarkdownPostProcessor((el, ctx) => {
    highlightAllWrBlocks(el, plugin);
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

  // 元投稿が変更されたら memo キャッシュを無効化し、参照カードを document 全体で再描画
  plugin.registerEvent(
    plugin.app.vault.on("modify", (file) => {
      if (!(file instanceof TFile)) return;
      invalidateMemoCache(file.path);
      refreshQuoteCardsForFile(plugin.app, file, (content) => plugin.getTagRuleClassForContent(content));
    })
  );
  plugin.registerEvent(
    plugin.app.vault.on("delete", (file) => {
      if (!(file instanceof TFile)) return;
      invalidateMemoCache(file.path);
      refreshQuoteCardsForFile(plugin.app, file, (content) => plugin.getTagRuleClassForContent(content));
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

    const parentBlock = code.closest(".block-language-wr") || code.closest("pre");
    if (parentBlock instanceof HTMLElement) {
      applyTagRuleClass(parentBlock, codeEl, plugin);
    }

    const hasProcessedInCode = code.querySelector(".wr-reading-tag, .wr-reading-url, .wr-internal-link, .wr-inline-code");
    const hasProcessedInBlock = parentBlock?.querySelector(".wr-reading-list, .wr-blockquote, .wr-embed-img, .wr-plain-text, .wr-codeblock-display, .wr-math-display");
    if (hasProcessedInCode || hasProcessedInBlock) return;

    processCodeBlock(codeEl, plugin);
  });
}

function rehighlightAllReadingViews(plugin: WrotPlugin): void {
  setTimeout(() => {
    document.querySelectorAll(".markdown-reading-view").forEach((view) => {
      highlightAllWrBlocks(view as HTMLElement, plugin);
    });
  }, 100);
}

async function applyBlockIdClasses(el: HTMLElement, plugin: WrotPlugin, sourcePath?: string): Promise<void> {
  const codeEls = el.querySelectorAll(
    'code.language-wr, .block-language-wr code, pre > code[class*="language-wr"]'
  );
  if (codeEls.length === 0) return;
  if (!sourcePath) return;
  const file = plugin.app.vault.getAbstractFileByPath(sourcePath);
  if (!(file instanceof TFile)) return;
  let memos: import("./utils/memoParser").Memo[];
  try {
    const content = await plugin.app.vault.cachedRead(file);
    const { parseMemos } = await import("./utils/memoParser");
    memos = parseMemos(content);
  } catch {
    return;
  }
  codeEls.forEach((code) => {
    const codeEl = code as HTMLElement;
    const block = codeEl.closest(".block-language-wr") || codeEl.closest("pre");
    if (!(block instanceof HTMLElement)) return;
    if (Array.from(block.classList).some((c) => c.startsWith("wr-block-id-wr-"))) return;
    const codeText = (codeEl.getAttribute("data-wr-original") || codeEl.textContent || "").trim();
    if (!codeText) return;
    const memo = memos.find((m) => m.content.trim() === codeText);
    if (!memo) return;
    const T = memo.time.replace(/[-:.TZ+]/g, "").slice(0, 17);
    block.classList.add(`wr-block-id-wr-${T}`);
  });
}

function applyTagRuleClass(block: HTMLElement, code: HTMLElement, plugin: WrotPlugin): void {
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
      // Obsidianがアイコン差し替えた後にも再適用するため複数回呼ぶ
      applySvgColor();
      setTimeout(applySvgColor, 50);
      setTimeout(applySvgColor, 150);
    });
  }

  block.querySelectorAll(".wr-media-area").forEach((el) => el.remove());

  const resolveImagePath = (fileName: string): string | null => {
    const file = plugin.app.metadataCache.getFirstLinkpathDest(fileName, "");
    return file ? plugin.app.vault.getResourcePath(file) : null;
  };

  // 引用カードマーカー [[X#^wr-T]] が含まれてる投稿は画像をインライン描画（末尾集約しない）。
  // これにより画像は元投稿の書かれた位置（=引用カードの上）に表示される
  const blockFullText = code.textContent || "";
  const hasQuoteMarker = /\[\[[^\[\]]+#\^wr-\d{17}\]\]/.test(blockFullText);

  convertListLines(code, plugin);

  const tailUrls: string[] = [];
  const tailEmbedImages: HTMLElement[] = [];

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
          if (url.startsWith("http")) tailUrls.push(url);
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
            const img = document.createElement("img");
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
            const span = document.createElement("span");
            span.className = "wr-embed-missing";
            span.textContent = `![[${fileName}]]`;
            frag.appendChild(span);
          }
          hasMatch = true;
          continue;
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
        const quoteMatch = linkName.match(QUOTE_LINK_RE);
        if (quoteMatch) {
          const slot = document.createElement("span");
          slot.className = "wr-quote-card-slot";
          renderQuoteCard(slot, quoteMatch[1], quoteMatch[2], plugin.app, "", {
            timestampFormat: plugin.settings.timestampFormat,
            resolveRuleClass: (content) => plugin.getTagRuleClassForContent(content),
            resolveRuleAccent: (ruleClass) => plugin.getRuleAccentColor(ruleClass),
          });
          frag.appendChild(slot);
        } else {
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
        }
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
        } catch {}
        const lowerName = fileName?.toLowerCase() || "";
        const looksLikeImage = IMAGE_EXT.test(lowerName);
        const resolved = fileName ? plugin.app.metadataCache.getFirstLinkpathDest(fileName, "") : null;
        const isImageEmbed = looksLikeImage && resolved !== null;
        const isUnresolvedImage = looksLikeImage && resolved === null;
        if (!isImageEmbed) {
          const link = document.createElement("a");
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
          if (trailing) frag.appendChild(document.createTextNode(trailing));
        } else if (trailing) {
          frag.appendChild(document.createTextNode(trailing));
        }
        tailUrls.push(cleaned);
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

        tailUrls.push(cleaned);
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
  }

  // 引用マーカーがある投稿では「引用は底」原則を維持するため、
  // 末尾メディアを引用カード slot の直前に挿入する
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
        const mediaEl = document.createElement("div");
        mediaEl.className = "wr-media-area";
        insertMediaNode(mediaEl);
        renderUrlPreviews(mediaEl as any, parsedUrls, plugin.ogpCache, resolveImagePath);
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

function convertListLines(
  code: HTMLElement,
  plugin: WrotPlugin
): void {
  const fullText = code.textContent || "";
  const segments = segmentBlocks(fullText);

  const block = code.closest(".block-language-wr") || code.closest("pre");
  if (!block) return;

  // 再構築: 非リストはcode内、リストは親側に配置する
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
        const root = document.createElement("blockquote");
        root.className = "wr-blockquote";
        fragments.push(root);
        quoteStack = [root];
      }
      while (quoteStack.length > depth) {
        quoteStack.pop();
      }
      while (quoteStack.length < depth) {
        const parent = quoteStack[quoteStack.length - 1];
        const bq = document.createElement("blockquote");
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
          quoteListEl = document.createElement("ul");
          quoteListEl.className = "wr-reading-list";
          target.appendChild(quoteListEl);
          quoteListType = "ul";
          quoteListDepth = depth;
        }
        const li = document.createElement("li");
        if (innerCheck) {
          li.className = "wr-check-item";
          const cb = document.createElement("input");
          cb.type = "checkbox";
          if (innerCheck[1] === "x") cb.checked = true;
          const innerLineIdx = i;
          cb.addEventListener("click", async () => {
            const file = plugin.app.workspace.getActiveFile();
            if (!file) return;
            const data = await plugin.app.vault.read(file);
            const fileLines = data.split("\n");
            const blockContent = fullText.trim();
            for (let f = 0; f < fileLines.length; f++) {
              if (fileLines[f].match(/^```wr\s+/)) {
                const bodyLines: string[] = [];
                let k = f + 1;
                while (k < fileLines.length && fileLines[k].trim() !== "```") {
                  bodyLines.push(fileLines[k]);
                  k++;
                }
                if (bodyLines.join("\n").trim() === blockContent) {
                  await toggleCheckbox(plugin.app, file, f + 1 + innerLineIdx);
                  return;
                }
              }
            }
          });
          li.appendChild(cb);
          if (innerCheck[1] === "x" && plugin.settings.checkStrikethrough) {
            const span = document.createElement("span");
            span.className = "wr-check-done";
            span.appendChild(document.createTextNode(innerCheck[2]));
            li.appendChild(span);
          } else {
            li.appendChild(document.createTextNode(innerCheck[2]));
          }
        } else if (innerList) {
          li.appendChild(document.createTextNode(innerList[1]));
        }
        quoteListEl.appendChild(li);
      } else if (innerOl) {
        if (quoteListEl === null || quoteListType !== "ol" || quoteListDepth !== depth || quoteListEl.parentElement !== target) {
          quoteListEl = document.createElement("ol");
          quoteListEl.className = "wr-reading-list";
          target.appendChild(quoteListEl);
          quoteListType = "ol";
          quoteListDepth = depth;
        }
        const li = document.createElement("li");
        li.appendChild(document.createTextNode(innerOl[1]));
        quoteListEl.appendChild(li);
      } else {
        quoteListEl = null;
        quoteListType = null;
        if (target.childNodes.length > 0 && target.lastChild?.nodeName !== "OL" && target.lastChild?.nodeName !== "UL" && target.lastChild?.nodeName !== "BLOCKQUOTE") {
          target.appendChild(document.createElement("br"));
        }
        target.appendChild(document.createTextNode(body));
      }
    } else if (checkMatch || listMatch) {
      quoteStack = [];
      quoteListEl = null;
      quoteListType = null;
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
          // 重複避けにブロック全文で一致判定する
          const blockContent = fullText.trim();
          for (let f = 0; f < fileLines.length; f++) {
            if (fileLines[f].match(/^```wr\s+/)) {
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
      quoteStack = [];
      quoteListEl = null;
      quoteListType = null;
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

  // コピーボタン用に元テキストを保持
  code.setAttribute("data-wr-original", fullText);

  while (fragments.length > 0 && fragments[fragments.length - 1] === "") {
    fragments.pop();
  }

  // コピーボタンの動作を残すためcodeは非表示にして保持
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
