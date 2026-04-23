import type { OGPData, OGPCache } from "./ogpCache";
import { segmentBlocks } from "./blockSegmenter";

// --- Constants ---

const IMAGE_EXTENSIONS = [
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp",
];

const URL_REGEX = /(?:https?|obsidian):\/\/[^\s<>"'\]]+/g;

const TWITTER_REGEX =
  /^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/;

// --- Types ---

export interface ParsedUrl {
  url: string;
  type: "image" | "twitter" | "generic";
}

// --- Security ---

export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["https:", "http:", "obsidian:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function isSafeImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["https:", "http:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// --- URL Detection ---

function cleanUrl(raw: string): string {
  // Strip trailing punctuation that's likely not part of the URL
  return raw.replace(/[.,;:!?)]+$/, "");
}

function classifyUrl(url: string): ParsedUrl["type"] {
  if (TWITTER_REGEX.test(url)) return "twitter";

  try {
    const pathname = new URL(url).pathname.toLowerCase();
    if (IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
      return "image";
    }
  } catch {
    // invalid URL, treat as generic
  }

  return "generic";
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

// --- Text Rendering ---

/**
 * Render memo text with both #tag spans and URL links.
 * Returns the list of parsed URLs for rich preview rendering.
 */
export function renderTextWithTagsAndUrls(
  container: HTMLElement,
  text: string,
  callbacks: {
    onTagClick?: (tag: string) => void;
    onCheckToggle?: (lineIndex: number, checked: boolean) => void;
    onInternalLinkClick?: (linkName: string) => void;
    resolveImagePath?: (fileName: string) => string | null;
    resolveLinkTarget?: (linkName: string) => boolean;
    checkStrikethrough?: boolean;
    renderCodeBlock?: (code: string, lang: string, container: HTMLElement, fenceTildes: number) => void;
    renderMathBlock?: (tex: string, container: HTMLElement) => void;
  }
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
          const { renderMath, finishRenderMath } = require("obsidian");
          const rendered = renderMath(segment.tex, true);
          blockEl.appendChild(rendered);
          finishRenderMath();
        } catch {
          blockEl.textContent = segment.tex;
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
  callbacks: {
    onTagClick?: (tag: string) => void;
    onCheckToggle?: (lineIndex: number, checked: boolean) => void;
    onInternalLinkClick?: (linkName: string) => void;
    resolveImagePath?: (fileName: string) => string | null;
    resolveLinkTarget?: (linkName: string) => boolean;
    checkStrikethrough?: boolean;
  },
  urls: ParsedUrl[],
  seen: Set<string>
): void {
  const lines = text.split("\n");

  let currentList: HTMLElement | null = null;
  let currentListType: "ul" | "ol" | null = null;
  let currentBlockquote: HTMLElement | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const quoteMatch = line.match(/^> ?(.*)$/);
    const checkMatch = !quoteMatch && line.match(/^- \[([ x])\] (.*)$/);
    const listMatch = !quoteMatch && !checkMatch && line.match(/^- (.+)$/);
    const olMatch = !quoteMatch && !checkMatch && !listMatch && line.match(/^\d+\.\s?(.+)$/);

    if (quoteMatch) {
      currentList = null;
      currentListType = null;
      if (!currentBlockquote) {
        currentBlockquote = container.createEl("blockquote", { cls: "wr-blockquote" });
      } else {
        currentBlockquote.createEl("br");
      }
      renderInlineTokens(currentBlockquote, quoteMatch[1], callbacks, urls, seen);
    } else if (checkMatch || listMatch) {
      currentBlockquote = null;
      if (currentListType !== "ul") {
        currentList = container.createEl("ul", { cls: "wr-bullet-list" });
        currentListType = "ul";
      }
      const li = currentList!.createEl("li");

      if (checkMatch) {
        li.addClass("wr-check-item");
        const checkbox = li.createEl("input", { attr: { type: "checkbox" } });
        if (checkMatch[1] === "x") checkbox.checked = true;
        if (callbacks.onCheckToggle) {
          const lineIdx = lineOffset + i;
          const cb = callbacks.onCheckToggle;
          checkbox.addEventListener("click", () => {
            cb(lineIdx, checkbox.checked);
          });
        } else {
          checkbox.disabled = true;
        }
        const textContainer = checkMatch[1] === "x" && callbacks.checkStrikethrough
          ? li.createEl("span", { cls: "wr-check-done" })
          : li;
        renderInlineTokens(textContainer, checkMatch[2], callbacks, urls, seen);
      } else if (listMatch) {
        renderInlineTokens(li, listMatch[1], callbacks, urls, seen);
      }
    } else if (olMatch) {
      currentBlockquote = null;
      if (currentListType !== "ol") {
        currentList = container.createEl("ol", { cls: "wr-ordered-list" });
        currentListType = "ol";
      }
      const li = currentList!.createEl("li");
      renderInlineTokens(li, olMatch[1], callbacks, urls, seen);
    } else {
      const prevWasBlock = currentList !== null || currentBlockquote !== null;
      currentList = null;
      currentListType = null;
      currentBlockquote = null;
      if (i > 0 && !prevWasBlock) container.appendText("\n");
      renderInlineTokens(container, line, callbacks, urls, seen);
    }
  }
}

const IMAGE_EXT_RE = /\.(png|jpg|jpeg|gif|svg|webp|bmp)$/i;

function renderInlineTokens(
  container: HTMLElement,
  text: string,
  callbacks: {
    onTagClick?: (tag: string) => void;
    onInternalLinkClick?: (linkName: string) => void;
    resolveImagePath?: (fileName: string) => string | null;
    resolveLinkTarget?: (linkName: string) => boolean;
  },
  urls: ParsedUrl[],
  seen: Set<string>
): void {
  const TOKEN_REGEX = /(\$[^$]+\$|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|==[^=]+=+|!\[\[[^\]]+\]\]|\[\[[^\]]+\]\]|\[[^\[\]\n]+\]\((?:https?|obsidian):\/\/[^\s)]+\)|#[^\s#]+|(?:https?|obsidian):\/\/[^\s<>"'\]]+)/g;
  const parts = text.split(TOKEN_REGEX);

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
          if (isSafeUrl(url)) window.open(url, "_blank");
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
      // Embed: ![[file]]
      const fileName = embedMatch[1];
      if (IMAGE_EXT_RE.test(fileName) && callbacks.resolveImagePath) {
        const src = callbacks.resolveImagePath(fileName);
        if (src) {
          const img = container.createEl("img", {
            cls: "wr-embed-img",
            attr: { src, alt: fileName, loading: "lazy" },
          });
        } else {
          container.createEl("span", { cls: "wr-embed-missing", text: `![[${fileName}]]` });
        }
      } else {
        // Non-image embed: show as link
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
      // Internal link: [[note]]
      const linkName = linkMatch[1];
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
    } else if (part.match(/^#[^\s#]+$/)) {
      const tagEl = container.createEl("span", {
        cls: "wr-tag",
        text: part,
      });
      if (callbacks.onTagClick) {
        const cb = callbacks.onTagClick;
        tagEl.addEventListener("click", (e) => {
          e.stopPropagation();
          cb(part);
        });
      }
    } else if (part.match(/^\$([^$]+)\$$/)) {
      const mathContent = part.slice(1, -1);
      const mathEl = container.createEl("span", { cls: "wr-math" });
      try {
        const { renderMath, finishRenderMath } = require("obsidian");
        const rendered = renderMath(mathContent, false);
        mathEl.appendChild(rendered);
        finishRenderMath();
      } catch {
        mathEl.textContent = part;
      }
    } else if (part.match(/^obsidian:\/\//)) {
      const url = cleanUrl(part);
      const trailing = part.slice(url.length);
      // Extract file name from obsidian:// URL
      let displayName = url;
      try {
        const params = new URL(url).searchParams;
        const filePath = params.get("file");
        if (filePath) {
          const decoded = decodeURIComponent(filePath);
          displayName = decoded.split("/").pop() || decoded;
        }
      } catch { /* use full URL */ }
      const link = container.createEl("a", {
        cls: "wr-internal-link",
        text: displayName,
      });
      link.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSafeUrl(url)) window.open(url);
      });
      if (trailing) container.appendText(trailing);
    } else if (part.match(/^https?:\/\//)) {
      const url = cleanUrl(part);
      const trailing = part.slice(url.length);

      const link = container.createEl("a", {
        cls: "wr-url",
        text: url,
        href: url,
      });
      link.setAttr("target", "_blank");
      link.setAttr("rel", "noopener");
      link.addEventListener("click", (e) => {
        e.preventDefault();
        if (isSafeUrl(url)) window.open(url, "_blank");
      });

      if (trailing) container.appendText(trailing);

      if (!seen.has(url)) {
        seen.add(url);
        urls.push({ url, type: classifyUrl(url) });
      }
    } else {
      container.appendText(part);
    }
  }
}

// --- Rich Preview Rendering ---
// Uses vanilla DOM API only (no Obsidian HTMLElement extensions)
// so these work in both Obsidian views and CodeMirror widgets.

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
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
  url: string
): void {
  const wrapper = el("a", "wr-media-link");
  wrapper.href = url;
  wrapper.target = "_blank";
  wrapper.rel = "noopener";
  makeClickableLink(wrapper, url);

  const img = el("img", "wr-inline-img");
  if (isSafeImageUrl(url)) img.src = url;
  img.loading = "lazy";
  wrapper.appendChild(img);
  container.appendChild(wrapper);
}

export function renderOGPCard(
  container: HTMLElement,
  data: OGPData
): void {
  const card = el("a", "wr-ogp-card");
  card.href = data.url;
  card.target = "_blank";
  card.rel = "noopener";
  makeClickableLink(card, data.url);

  if (data.image && isSafeImageUrl(data.image)) {
    const thumb = el("img", "wr-ogp-thumb");
    thumb.src = data.image;
    thumb.loading = "lazy";
    card.appendChild(thumb);
  }

  const body = el("div", "wr-ogp-body");
  if (data.title) body.appendChild(el("div", "wr-ogp-title", data.title));
  if (data.description) body.appendChild(el("div", "wr-ogp-desc", data.description));
  const siteName = data.siteName || extractDomain(data.url);
  body.appendChild(el("div", "wr-ogp-site", siteName));
  card.appendChild(body);
  container.appendChild(card);
}

export function renderTwitterCard(
  container: HTMLElement,
  data: OGPData
): void {
  const card = el("a", "wr-ogp-card wr-twitter-card");
  card.href = data.url;
  card.target = "_blank";
  card.rel = "noopener";
  makeClickableLink(card, data.url);

  if (data.image && isSafeImageUrl(data.image)) {
    const thumb = el("img", "wr-ogp-thumb");
    thumb.src = data.image;
    thumb.loading = "lazy";
    card.appendChild(thumb);
  }

  const body = el("div", "wr-ogp-body");
  if (data.title) body.appendChild(el("div", "wr-ogp-title", data.title));
  if (data.description) body.appendChild(el("div", "wr-ogp-desc", data.description));
  body.appendChild(el("div", "wr-ogp-site", "X (Twitter)"));
  card.appendChild(body);
  container.appendChild(card);
}

/**
 * Render all rich previews for a list of URLs into a container.
 * Images render immediately; OGP/Twitter cards load asynchronously.
 */
export function renderUrlPreviews(
  container: HTMLElement,
  urls: ParsedUrl[],
  ogpCache: OGPCache
): void {
  for (const pu of urls) {
    if (pu.type === "image") {
      renderImagePreview(container, pu.url);
    } else {
      const placeholder = el("div", "wr-ogp-loading");
      container.appendChild(placeholder);
      ogpCache.fetchOGP(pu.url).then((data) => {
        placeholder.textContent = "";
        if (!data || (!data.title && !data.description)) {
          placeholder.remove();
          return;
        }
        if (pu.type === "twitter") {
          renderTwitterCard(placeholder, data);
        } else {
          renderOGPCard(placeholder, data);
        }
      });
    }
  }
}

// --- Helpers ---

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
