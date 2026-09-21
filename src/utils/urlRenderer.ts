import { renderMath, finishRenderMath } from "obsidian";
import type { OGPData, OGPCache } from "./ogpCache";
import { segmentBlocks } from "./blockSegmenter";
import { isMathJaxReady, requestMathJax } from "./mathjax";
import { IMAGE_EXT_RE, inlineTokenPattern } from "./patterns";
import {
  ListDepthTracker,
  NestedListStack,
  parseListLine,
  tagFor,
  type ListLine,
  type ListTag,
} from "./listParser";

const URL_REGEX = /(?:https?|obsidian):\/\/[^\s<>"'\]]+/g;

const TWITTER_REGEX =
  /^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/;

export interface ParsedUrl {
  url: string;
  type: "image" | "twitter" | "generic";
}

// eslint-disable-next-line no-useless-escape -- escape kept for regex readability
export const QUOTE_LINK_RE = /^([^\[\]\n#]+)#\^(wr-\d{17})$/;

const HTTP_ONLY = ["https:", "http:"];

export function isSafeUrl(url: string, protocols = [...HTTP_ONLY, "obsidian:"]): boolean {
  try {
    return protocols.includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

export function cleanUrl(raw: string): string {
  // Trailing punctuation, ASCII or full-width, is not considered part of the URL.
  return raw.replace(/[.,;:!?)。、！？）」』】]+$/, "");
}

function classifyUrl(url: string): ParsedUrl["type"] {
  if (TWITTER_REGEX.test(url)) return "twitter";

  try {
    const parsed = new URL(url);
    if (parsed.protocol === "obsidian:") {
      const filePath = parsed.searchParams.get("file");
      if (filePath && IMAGE_EXT_RE.test(decodeURIComponent(filePath))) return "image";
      return "generic";
    }
    if (IMAGE_EXT_RE.test(parsed.pathname)) return "image";
  // eslint-disable-next-line no-empty -- intentional no-op
  } catch {}

  return "generic";
}

/**
 * The `file` parameter of an obsidian:// link: the vault-relative path (what to resolve, so a
 * wrong folder does not match a same-named file elsewhere) and its last segment (what to show).
 */
export function extractObsidianFile(url: string): { path: string; name: string } | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "obsidian:") return null;
    const filePath = parsed.searchParams.get("file");
    if (!filePath) return null;
    const path = decodeURIComponent(filePath);
    return { path, name: path.split("/").pop() || path };
  } catch {
    return null;
  }
}

/**
 * True when an obsidian:// link names a vault other than `vaultName`. A file missing here may
 * well exist there, so such links are never shown as unresolved.
 */
export function isOtherVault(url: string, vaultName: string | undefined): boolean {
  try {
    const vault = new URL(url).searchParams.get("vault");
    return vault !== null && vault !== vaultName;
  } catch {
    return false;
  }
}

export function extractUrls(text: string): ParsedUrl[] {
  const urls: ParsedUrl[] = [];
  const seen = new Set<string>();

  for (const m of text.matchAll(URL_REGEX)) {
    const url = cleanUrl(m[0]);
    if (seen.has(url)) continue;
    seen.add(url);
    urls.push({ url, type: classifyUrl(url) });
  }

  return urls;
}


interface RenderTextCallbacks {
  onTagClick?: (tag: string) => void;
  onCheckToggle?: (lineIndex: number, checked: boolean) => void;
  onInternalLinkClick?: (linkName: string) => void;
  resolveImagePath?: (fileName: string) => string | null;
  resolveLinkTarget?: (linkName: string) => boolean;
  // Current vault name, for telling a missing file from a link into another vault.
  vaultName?: string;
  checkStrikethrough?: boolean;
  renderCodeBlock?: (code: string, lang: string, container: HTMLElement, fenceTildes: number) => void;
  renderMathBlock?: (tex: string, container: HTMLElement) => void;
  // Called when a quote-card marker [[fileName#^wr-T]] is found; the caller renders the card into slot.
  renderQuoteCard?: (slot: HTMLElement, fileName: string, blockId: string) => void;
}

export function renderTextWithTagsAndUrls(
  container: HTMLElement,
  text: string,
  callbacks: RenderTextCallbacks
): ParsedUrl[] {
  const urls: ParsedUrl[] = [];
  const seen = new Set<string>();

  const segments = segmentBlocks(text);

  for (const segment of segments) {
    if (segment.kind === "codeblock") {
      const blockEl = container.createDiv({ cls: "wr-codeblock-display" });
      if (callbacks.renderCodeBlock) {
        callbacks.renderCodeBlock(segment.code, segment.lang, blockEl, segment.fenceTildes);
      } else {
        const pre = blockEl.createEl("pre");
        const codeEl = pre.createEl("code");
        if (segment.lang) codeEl.addClass(`language-${segment.lang}`);
        codeEl.textContent = segment.code;
      }
      continue;
    }

    if (segment.kind === "mathblock") {
      const blockEl = container.createDiv({ cls: "wr-math-display" });
      if (callbacks.renderMathBlock) {
        callbacks.renderMathBlock(segment.tex, blockEl);
      } else {
        try {
          // MathJax loads lazily. If not ready, fall through to the fallback;
          // wr-math-fallback marks the element for re-render once onMathJaxReady fires.
          if (!isMathJaxReady()) throw new Error("MathJax not loaded yet");
          const rendered = renderMath(segment.tex, true);
          blockEl.appendChild(rendered);
          void finishRenderMath();
        } catch {
          blockEl.classList.add("wr-math-fallback");
          blockEl.textContent = segment.tex;
          requestMathJax();
        }
      }
      continue;
    }

    renderTextSegment(container, segment.text, segment.startLine, callbacks, urls, seen);
  }

  return urls;
}

function renderTextSegment(
  container: HTMLElement,
  text: string,
  lineOffset: number,
  callbacks: RenderTextCallbacks,
  urls: ParsedUrl[],
  seen: Set<string>
): void {
  const lines = text.split("\n");

  const makeList = (tag: ListTag) =>
    createEl(tag, { cls: tag === "ul" ? "wr-bullet-list" : "wr-ordered-list" });
  const makeItem = () => createEl("li");

  const listStack = new NestedListStack(makeList, makeItem);
  const listDepth = new ListDepthTracker();
  let quoteStack: HTMLElement[] = [];
  const quoteListStack = new NestedListStack(makeList, makeItem);
  const quoteListDepthTracker = new ListDepthTracker();
  let quoteListTarget: HTMLElement | null = null;
  let quoteListDepth: number = 0;

  const resetList = () => {
    listStack.clear();
    listDepth.reset();
  };

  const resetQuoteList = () => {
    quoteListStack.clear();
    quoteListDepthTracker.reset();
    quoteListTarget = null;
  };

  const buildListItem = (info: ListLine, lineIndex: number): HTMLElement => {
    const li = createEl("li");
    if (info.kind !== "check") {
      renderInlineTokens(li, info.content, callbacks, urls, seen);
      return li;
    }
    li.addClass("wr-check-item");
    const checkbox = li.createEl("input", { attr: { type: "checkbox" } });
    if (info.checked) checkbox.checked = true;
    // Always wrap the text in a span: modify-driven re-render is suppressed to prevent
    // card flicker, so strikethrough is toggled instantly via this span's class instead.
    const textContainer = li.createSpan(
      info.checked && callbacks.checkStrikethrough ? { cls: "wr-check-done" } : {}
    );
    if (callbacks.onCheckToggle) {
      const cb = callbacks.onCheckToggle;
      checkbox.addEventListener("click", () => {
        cb(lineIndex, checkbox.checked);
        if (callbacks.checkStrikethrough) {
          textContainer.classList.toggle("wr-check-done", checkbox.checked);
        }
      });
    } else {
      checkbox.disabled = true;
    }
    renderInlineTokens(textContainer, info.content, callbacks, urls, seen);
    return li;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const quoteMatch = line.match(/^((?:>\s?)+)(.*)$/);
    const listInfo = !quoteMatch ? parseListLine(line) : null;

    if (quoteMatch) {
      resetList();
      const depth = (quoteMatch[1].match(/>/g) || []).length;
      const body = quoteMatch[2];
      while (quoteStack.length > depth) {
        quoteStack.pop();
      }
      while (quoteStack.length < depth) {
        const parent = quoteStack.length > 0 ? quoteStack[quoteStack.length - 1] : container;
        const bq = parent.createEl("blockquote", { cls: "wr-blockquote" });
        quoteStack.push(bq);
      }
      const target = quoteStack[quoteStack.length - 1];
      const innerInfo = parseListLine(body);
      if (innerInfo) {
        // A list only continues while it stays in the same blockquote at the same depth.
        if (quoteListTarget !== target || quoteListDepth !== depth) {
          resetQuoteList();
          quoteListTarget = target;
          quoteListDepth = depth;
        }
        const itemDepth = quoteListDepthTracker.place(innerInfo).depth;
        const previousRoot = quoteListStack.root;
        const list = quoteListStack.listFor(itemDepth, tagFor(innerInfo.kind));
        if (quoteListStack.root !== previousRoot) target.appendChild(quoteListStack.root!);
        list.appendChild(buildListItem(innerInfo, lineOffset + i));
      } else {
        resetQuoteList();
        // Skip <br> after a nested blockquote/list box: the block already breaks the line,
        // so adding one creates an extra blank line. Break only between text lines.
        const last = target.lastChild;
        const lastTag =
          last && last.nodeType === Node.ELEMENT_NODE ? (last as Element).tagName : "";
        if (
          target.childNodes.length > 0 &&
          lastTag !== "BLOCKQUOTE" &&
          lastTag !== "UL" &&
          lastTag !== "OL"
        ) {
          target.createEl("br");
        }
        renderInlineTokens(target, body, callbacks, urls, seen);
      }
    } else if (listInfo) {
      quoteStack = [];
      resetQuoteList();
      const itemDepth = listDepth.place(listInfo).depth;
      const previousRoot = listStack.root;
      const list = listStack.listFor(itemDepth, tagFor(listInfo.kind));
      if (listStack.root !== previousRoot) container.appendChild(listStack.root!);
      list.appendChild(buildListItem(listInfo, lineOffset + i));
    } else {
      const prevWasBlock = !listStack.isEmpty || quoteStack.length > 0;
      resetList();
      quoteStack = [];
      resetQuoteList();
      if (i > 0 && !prevWasBlock) container.appendText("\n");
      renderInlineTokens(container, line, callbacks, urls, seen);
    }
  }
}


function renderInlineTokens(
  container: HTMLElement,
  text: string,
  callbacks: RenderTextCallbacks,
  urls: ParsedUrl[],
  seen: Set<string>
): void {
  const parts = text.split(inlineTokenPattern());

  for (const part of parts) {
    if (!part) continue;

    const codeMatch = part.match(/^`([^`]+)`$/);
    if (codeMatch) {
      container.createEl("code", { cls: "wr-inline-code", text: codeMatch[1] });
      continue;
    }
    const boldMatch = part.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) {
      container.createEl("strong", { text: boldMatch[1] });
      continue;
    }
    const italicMatch = part.match(/^\*(.+)\*$/);
    if (italicMatch) {
      container.createEl("em", { text: italicMatch[1] });
      continue;
    }
    const strikeMatch = part.match(/^~~(.+)~~$/);
    if (strikeMatch) {
      container.createEl("del", { text: strikeMatch[1] });
      continue;
    }
    const highlightMatch = part.match(/^==(.+)==$/);
    if (highlightMatch) {
      container.createEl("mark", { cls: "wr-highlight", text: highlightMatch[1] });
      continue;
    }

    // eslint-disable-next-line no-useless-escape -- escape kept for regex readability
    const mdLinkMatch = part.match(/^\[([^\[\]\n]+)\]\(((?:https?|obsidian):\/\/[^\s)]+)\)$/);
    if (mdLinkMatch) {
      const label = mdLinkMatch[1];
      const url = mdLinkMatch[2];
      if (isSafeUrl(url)) {
        const link = container.createEl("a", {
          cls: "wr-url",
          text: label,
          href: url,
        });
        link.setAttr("target", "_blank");
        link.setAttr("rel", "noopener");
        link.addEventListener("click", (e) => {
          e.preventDefault();
          window.open(url, "_blank");
        });
        if (!seen.has(url)) {
          seen.add(url);
          urls.push({ url, type: classifyUrl(url) });
        }
      } else {
        container.appendText(part);
      }
      continue;
    }

    const embedMatch = part.match(/^!\[\[(.+)\]\]$/);
    const linkMatch = !embedMatch && part.match(/^\[\[(.+)\]\]$/);

    if (embedMatch) {
      const fileName = embedMatch[1];
      if (IMAGE_EXT_RE.test(fileName) && callbacks.resolveImagePath) {
        const src = callbacks.resolveImagePath(fileName);
        if (src) {
          container.createEl("img", {
            cls: "wr-embed-img",
            attr: { src, alt: fileName, loading: "lazy" },
          });
        } else {
          container.createSpan({ cls: "wr-embed-missing", text: `![[${fileName}]]` });
        }
      } else {
        const resolved = callbacks.resolveLinkTarget ? callbacks.resolveLinkTarget(fileName) : true;
        const cls = resolved ? "wr-internal-link" : "wr-internal-link wr-internal-link-unresolved";
        const linkEl = container.createEl("a", { cls, text: fileName });
        if (callbacks.onInternalLinkClick) {
          const cb = callbacks.onInternalLinkClick;
          linkEl.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            cb(fileName);
          });
        }
      }
    } else if (linkMatch) {
      const linkName = linkMatch[1];
      const quoteMatch = linkName.match(QUOTE_LINK_RE);
      if (quoteMatch && callbacks.renderQuoteCard) {
        const slot = container.createSpan({ cls: "wr-quote-card-slot" });
        callbacks.renderQuoteCard(slot, quoteMatch[1], quoteMatch[2]);
      } else {
        const resolved = callbacks.resolveLinkTarget ? callbacks.resolveLinkTarget(linkName) : true;
        const cls = resolved ? "wr-internal-link" : "wr-internal-link wr-internal-link-unresolved";
        const linkEl = container.createEl("a", { cls, text: linkName });
        if (callbacks.onInternalLinkClick) {
          const cb = callbacks.onInternalLinkClick;
          linkEl.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            cb(linkName);
          });
        }
      }
    } else if (part.match(/^#[^\s#]+$/)) {
      const tagEl = container.createSpan({
        cls: "wr-tag",
        text: part,
      });
      if (callbacks.onTagClick) {
        const cb = callbacks.onTagClick;
        tagEl.addEventListener("click", (e) => {
          e.stopPropagation();
          // Remove the class and force a reflow so the flash animation restarts on every click.
          tagEl.classList.remove("wr-tag-flash");
          void tagEl.offsetWidth;
          tagEl.classList.add("wr-tag-flash");
          cb(part);
        });
      }
    } else if (part.match(/^\$([^$]+)\$$/)) {
      const mathContent = part.slice(1, -1);
      const mathEl = container.createSpan({ cls: "wr-math" });
      try {
        // MathJax loads lazily. If not ready, fall through to the fallback;
        // wr-math-fallback marks the element for re-render once onMathJaxReady fires.
        if (!isMathJaxReady()) throw new Error("MathJax not loaded yet");
        const rendered = renderMath(mathContent, false);
        mathEl.appendChild(rendered);
        void finishRenderMath();
      } catch {
        mathEl.classList.add("wr-math-fallback");
        mathEl.textContent = part;
        requestMathJax();
      }
    } else if (part.match(/^obsidian:\/\//)) {
      const url = cleanUrl(part);
      const trailing = part.slice(url.length);
      const file = extractObsidianFile(url);
      const urlType = classifyUrl(url);
      const looksLikeImage = urlType === "image";
      const resolved = !!file && (looksLikeImage
        ? !!callbacks.resolveImagePath?.(file.path)
        : !!callbacks.resolveLinkTarget?.(file.path));
      const isImageEmbed = looksLikeImage && resolved;
      const unresolved = !!file && !resolved && !isOtherVault(url, callbacks.vaultName);
      if (!isImageEmbed) {
        const displayName = file?.name || url;
        const cls = unresolved
          ? "wr-internal-link wr-internal-link-unresolved"
          : "wr-internal-link";
        const link = container.createEl("a", {
          cls,
          text: displayName,
        });
        link.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isSafeUrl(url)) window.open(url);
        });
        if (trailing) container.appendText(trailing);
      } else if (trailing) {
        container.appendText(trailing);
      }
      if (!seen.has(url)) {
        seen.add(url);
        urls.push({ url, type: urlType });
      }
    } else if (part.match(/^https?:\/\//)) {
      const url = cleanUrl(part);
      const trailing = part.slice(url.length);

      if (isSafeUrl(url)) {
        const link = container.createEl("a", {
          cls: "wr-url",
          text: url,
          href: url,
        });
        link.setAttr("target", "_blank");
        link.setAttr("rel", "noopener");
        link.addEventListener("click", (e) => {
          e.preventDefault();
          window.open(url, "_blank");
        });

        if (trailing) container.appendText(trailing);

        if (!seen.has(url)) {
          seen.add(url);
          urls.push({ url, type: classifyUrl(url) });
        }
      } else {
        container.appendText(part);
      }
    } else {
      container.appendText(part);
    }
  }
}

function makeClickableLink(element: HTMLElement, url: string): void {
  element.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSafeUrl(url)) window.open(url, "_blank");
  });
}

export function renderImagePreview(
  container: HTMLElement,
  url: string,
  resolveImagePath?: (fileName: string) => string | null
): void {
  const wrapper = createEl("a", { cls: "wr-media-link" });
  wrapper.href = url;
  wrapper.target = "_blank";
  wrapper.rel = "noopener";
  makeClickableLink(wrapper, url);

  const img = createEl("img", { cls: "wr-inline-img" });
  if (isSafeUrl(url, HTTP_ONLY)) {
    img.src = url;
  } else if (url.startsWith("obsidian://") && resolveImagePath) {
    const file = extractObsidianFile(url);
    const resolved = file ? resolveImagePath(file.path) : null;
    if (resolved) img.src = resolved;
  }
  img.loading = "lazy";
  wrapper.appendChild(img);
  container.appendChild(wrapper);
  // :has() workaround: add a state class to the container so CSS can use a plain selector.
  container.classList.add("wr-has-link");
}

export function renderOGPCard(
  container: HTMLElement,
  data: OGPData
): void {
  const card = createEl("a", { cls: "wr-ogp-card" });
  card.href = data.url;
  card.target = "_blank";
  card.rel = "noopener";
  makeClickableLink(card, data.url);

  if (data.image && isSafeUrl(data.image, HTTP_ONLY)) {
    const thumb = createEl("img", { cls: "wr-ogp-thumb" });
    thumb.src = data.image;
    thumb.loading = "lazy";
    card.appendChild(thumb);
  }

  const body = createDiv({ cls: "wr-ogp-body" });
  if (data.title) body.appendChild(createDiv({ cls: "wr-ogp-title", text: data.title }));
  if (data.description) body.appendChild(createDiv({ cls: "wr-ogp-desc", text: data.description }));
  const siteName = data.siteName || extractDomain(data.url);
  body.appendChild(createDiv({ cls: "wr-ogp-site", text: siteName }));
  card.appendChild(body);
  container.appendChild(card);
}

export function renderTwitterCard(
  container: HTMLElement,
  data: OGPData
): void {
  const card = createEl("a", { cls: "wr-ogp-card wr-twitter-card" });
  card.href = data.url;
  card.target = "_blank";
  card.rel = "noopener";
  makeClickableLink(card, data.url);

  if (data.image && isSafeUrl(data.image, HTTP_ONLY)) {
    const thumb = createEl("img", { cls: "wr-ogp-thumb" });
    thumb.src = data.image;
    thumb.loading = "lazy";
    card.appendChild(thumb);
  }

  const body = createDiv({ cls: "wr-ogp-body" });
  if (data.title) body.appendChild(createDiv({ cls: "wr-ogp-title", text: data.title }));
  if (data.description) body.appendChild(createDiv({ cls: "wr-ogp-desc", text: data.description }));
  body.appendChild(createDiv({ cls: "wr-ogp-site", text: "X (Twitter)" }));
  card.appendChild(body);
  container.appendChild(card);
}

export function renderUrlPreviews(
  container: HTMLElement,
  urls: ParsedUrl[],
  ogpCache: OGPCache,
  resolveImagePath?: (fileName: string) => string | null
): void {
  for (const pu of urls) {
    if (pu.type === "image") {
      renderImagePreview(container, pu.url, resolveImagePath);
    } else if (pu.url.startsWith("obsidian://")) {
      continue;
    } else {
      const render = (host: HTMLElement, data: OGPData): void => {
        if (pu.type === "twitter") {
          renderTwitterCard(host, data);
        } else {
          renderOGPCard(host, data);
        }
      };

      const cached = ogpCache.get(pu.url);
      if (cached) {
        if (!cached.title && !cached.description) continue;
        const host = createDiv({ cls: "wr-ogp-loading" });
        host.textContent = "";
        container.appendChild(host);
        render(host, cached);
        continue;
      }
      // Already known to be unresolvable, or previews are off: no card, no loading flash.
      if (ogpCache.isResolved(pu.url) || !ogpCache.canFetch(pu.url)) continue;

      const placeholder = createDiv({ cls: "wr-ogp-loading" });
      container.appendChild(placeholder);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
      ogpCache.fetchOGP(pu.url).then((data) => {
        placeholder.textContent = "";
        if (!data || (!data.title && !data.description)) {
          placeholder.remove();
          return;
        }
        render(placeholder, data);
      });
    }
  }
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
