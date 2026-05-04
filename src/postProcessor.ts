import { Plugin, TFile, MarkdownRenderer, renderMath, finishRenderMath } from "obsidian";
import { extractUrls, renderUrlPreviews, isSafeUrl } from "./utils/urlRenderer";
import { toggleCheckbox } from "./utils/memoWriter";
import { segmentBlocks, type Segment } from "./utils/blockSegmenter";
import type WrotPlugin from "./main";

// リーディングビュー用のpost processor。タグ強調表示とURLプレビュー描画を行う
export function registerWrotPostProcessor(plugin: WrotPlugin): void {
  plugin.registerMarkdownPostProcessor((el) => {
    highlightAllWrBlocks(el, plugin);
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
}

function highlightAllWrBlocks(el: HTMLElement, plugin: WrotPlugin): void {
  const codeEls = el.querySelectorAll(
    'code.language-wr, .block-language-wr code, pre > code[class*="language-wr"]'
  );
  codeEls.forEach((code) => {
    const codeEl = code as HTMLElement;

    const text = code.textContent || "";
    if (!text.trim()) return;

    // 編集や再レイアウト後もタグルールclassをDOMと同期させる
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

function applyTagRuleClass(block: HTMLElement, code: HTMLElement, plugin: WrotPlugin): void {
  // コピー/フレア要素はブロック内外どちらにも存在し得るため両側から収集する
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

  // フレア要素は兄弟もしくは内側に存在するため両方カバーする
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
    // タグルールが当たっていればそのアクセントを優先
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
      // 即時実行＋Obsidianがアイコン差し替えた後にも再適用
      applySvgColor();
      setTimeout(applySvgColor, 50);
      setTimeout(applySvgColor, 150);
    });
  }

  block.querySelector(".wr-media-area")?.remove();

  convertListLines(code, plugin);

  const allUrls: string[] = [];
  const embedImages: HTMLElement[] = [];

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
            // <code>外に出すためフラグメントには入れず別配列に貯める
            const img = document.createElement("img");
            img.className = "wr-embed-img";
            img.src = plugin.app.vault.getResourcePath(file);
            img.alt = fileName;
            img.loading = "lazy";
            embedImages.push(img);
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
  }

  // 埋め込み画像は<code>外に追加する
  if (embedImages.length > 0) {
    const imgBlock = code.closest(".block-language-wr") || code.closest("pre");
    if (imgBlock) {
      for (const img of embedImages) {
        imgBlock.appendChild(img);
      }
    }
  }

  if (allUrls.length > 0) {
    // 画像以外のobsidian:// URLは空のメディアブロックを生まないよう除外
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

  // 再構築: 非リストはcode内、リストは親側に配置する
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
      flushPlain();
      // 直前がblockquoteなら同一blockquoteに連結する
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
