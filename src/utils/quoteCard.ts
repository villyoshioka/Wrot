import { App, TFile, Platform, setIcon } from "obsidian";
import { parseMemos, type Memo } from "./memoParser";
import { renderTextWithTagsAndUrls } from "./urlRenderer";

declare const moment: typeof import("moment");

// 同一ファイルの parseMemos 結果をモジュール内 LRU でキャッシュ（最大8ファイル）
const MEMO_CACHE = new Map<string, Memo[]>();
const MEMO_CACHE_MAX = 8;

function getCachedMemos(filePath: string): Memo[] | undefined {
  return MEMO_CACHE.get(filePath);
}

function setCachedMemos(filePath: string, memos: Memo[]): void {
  if (MEMO_CACHE.has(filePath)) MEMO_CACHE.delete(filePath);
  MEMO_CACHE.set(filePath, memos);
  while (MEMO_CACHE.size > MEMO_CACHE_MAX) {
    const oldest = MEMO_CACHE.keys().next().value;
    if (oldest === undefined) break;
    MEMO_CACHE.delete(oldest);
  }
}

export function invalidateMemoCache(filePath: string): void {
  MEMO_CACHE.delete(filePath);
}

// ファイル変更時に「そのファイルを参照してる引用カード」を全部再描画する。
// RV/LV/Wrotタイムライン どこにあっても data-quote-file/data-quote-block で特定できる。
// fileName はリンクパス表記 (例: "2026年05月08日") なので、変更されたファイルのベース名と照合する
export function refreshQuoteCardsForFile(
  app: App,
  file: TFile,
  resolveRuleClass?: (content: string) => string | null,
  resolveRuleAccent?: (ruleClass: string) => string | null
): void {
  const baseName = file.basename;
  const cards = document.querySelectorAll<HTMLElement>(
    `a.wr-quote-card[data-quote-file="${CSS.escape(baseName)}"]`
  );
  cards.forEach((card) => {
    const slot = card.parentElement;
    if (!slot) return;
    const fileName = card.dataset.quoteFile;
    const blockId = card.dataset.quoteBlock;
    const currentFilePath = card.dataset.quoteContext ?? "";
    const timestampFormat = card.dataset.quoteTsFormat;
    if (!fileName || !blockId) return;
    card.remove();
    renderQuoteCard(slot, fileName, blockId, app, currentFilePath, {
      timestampFormat,
      resolveRuleClass,
      resolveRuleAccent,
    });
  });
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

// 入れ子引用マーカーは再帰展開せず "QT:" 化 (マトリョーシカ防止)
const NESTED_QUOTE_RE_INLINE = /[\s]*\[\[[^\[\]]+#\^wr-\d{17}\]\][\s]*/g;

const NESTED_QUOTE_PLACEHOLDER = "QT:";
const NESTED_QUOTE_DISPLAY = "QT: ...";

function sanitizeNestedQuotes(text: string): string {
  return text.replace(NESTED_QUOTE_RE_INLINE, ` ${NESTED_QUOTE_PLACEHOLDER}`);
}

// プレビュー幅を圧迫する 画像/数式/コード ブロックは アイコン+ラベル のサマリに置換
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
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
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
    const frag = document.createDocumentFragment();
    parts.forEach((part, i) => {
      if (part) frag.appendChild(document.createTextNode(part));
      if (i < parts.length - 1) {
        const span = document.createElement("span");
        span.className = "wr-quote-image-marker";
        const iconEl = document.createElement("span");
        iconEl.className = "wr-quote-image-marker-icon";
        setIcon(iconEl, "image");
        span.appendChild(iconEl);
        span.appendChild(document.createTextNode(" image"));
        frag.appendChild(span);
      }
    });
    parent.replaceChild(frag, tn);
  }
}

function decorateMathBlockMarkers(root: HTMLElement): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
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
    const frag = document.createDocumentFragment();
    parts.forEach((part, i) => {
      if (part) frag.appendChild(document.createTextNode(part));
      if (i < parts.length - 1) {
        const span = document.createElement("span");
        span.className = "wr-quote-math-marker";
        const iconEl = document.createElement("span");
        iconEl.className = "wr-quote-math-marker-icon";
        setIcon(iconEl, "sigma");
        span.appendChild(iconEl);
        span.appendChild(document.createTextNode(" math"));
        frag.appendChild(span);
      }
    });
    parent.replaceChild(frag, tn);
  }
}

function decorateCodeBlockMarkers(root: HTMLElement): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
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
    const frag = document.createDocumentFragment();
    parts.forEach((part, i) => {
      if (part) frag.appendChild(document.createTextNode(part));
      if (i < parts.length - 1) {
        const span = document.createElement("span");
        span.className = "wr-quote-code-marker";
        const iconEl = document.createElement("span");
        iconEl.className = "wr-quote-code-marker-icon";
        setIcon(iconEl, "code");
        span.appendChild(iconEl);
        span.appendChild(document.createTextNode(" code"));
        frag.appendChild(span);
      }
    });
    parent.replaceChild(frag, tn);
  }
}

function decorateNestedQuoteMarkers(root: HTMLElement): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
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
    const frag = document.createDocumentFragment();
    parts.forEach((part, i) => {
      if (part) frag.appendChild(document.createTextNode(part));
      if (i < parts.length - 1) {
        const span = document.createElement("span");
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

// 1行=1ブロック要素のフラット構造で描画。 max-height による 3行クリップを安定させるため
function renderPreviewLines(
  bodyEl: HTMLElement,
  content: string,
  app: App
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
      const textSpan = lineEl.createSpan({ cls: "wr-quote-card-line-text" });
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
  timestampFormat?: string
): void {
  bodyEl.empty();
  renderPreviewLines(bodyEl, memo.content, app);
  metaEl.textContent = formatMemoTimestamp(memo.time, timestampFormat);
}

function markDead(card: HTMLElement, bodyEl: HTMLElement, metaEl: HTMLElement): void {
  card.classList.add("wr-quote-card-dead");
  bodyEl.textContent = "(元投稿が見つかりません)";
  metaEl.textContent = "";
}

// 元投稿に飛んだ後、対象の投稿ブロック全体を緩く点滅させる
export function flashJumpTarget(
  blockId: string,
  app: App,
  resolveRuleAccent?: (ruleClass: string) => string | null
): void {
  // openLinkText の遷移完了は別ファイル open でも遅いため、複数回試行
  const tryAt = [80, 250, 500, 900];
  let applied = false;
  for (const ms of tryAt) {
    setTimeout(() => {
      if (applied) return;
      const targets = collectFlashTargets(blockId, app);
      if (targets.length === 0) return;
      applied = true;
      // Wrot タイムライン外の要素 (Markdown ビュー側) を中央へスクロール
      const docTarget = targets.find((el) => !el.classList.contains("wr-card"));
      if (docTarget) {
        docTarget.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      for (const el of targets) {
        el.classList.remove("wr-quote-jump-flash");
        void el.offsetWidth;
        // 元投稿のタグルールに accent があれば そのカラーで光らせる
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
        setTimeout(() => {
          el.classList.remove("wr-quote-jump-flash");
          el.style.removeProperty("--wr-flash-color");
        }, 1600);
      }
    }, ms);
  }
}

// LV/RV/タイムライン全てから wr-block-id-{blockId} 付き要素を収集。
// モバイルでタイムラインが一時表示ドロワーの時だけ除外
function collectFlashTargets(blockId: string, app: App): HTMLElement[] {
  const all = Array.from(
    document.querySelectorAll(`.wr-block-id-${blockId}`)
  ) as HTMLElement[];

  if (!Platform.isMobile) return all;

  // モバイル: スマホは Wrot タイムラインのカードを除外
  if (Platform.isPhone) {
    return all.filter((el) => !el.classList.contains("wr-card"));
  }

  // タブレット: Wrot ビューがサイドバー固定モード（is-pinned）かどうかをDOM祖先で判定。
  // 固定モード: .workspace-drawer.is-pinned の中にいる → 点灯OK
  // 一時ドロワー: .workspace-drawer の中だが is-pinned が無い → 点灯NG
  const wrCardEls = all.filter((el) => el.classList.contains("wr-card"));
  const isUnpinnedDrawer = wrCardEls.some((el) => {
    const drawer = el.closest(".workspace-drawer");
    return drawer !== null && !drawer.classList.contains("is-pinned");
  });
  if (isUnpinnedDrawer) {
    // 一時ドロワーモード時は Wrot タイムラインのカードを除外
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
    // 元投稿のタグからタグルールクラスを判定する関数。
    // 引用カードを「引用元のルール」で独立して染めるために、 memo 取得後に呼び出す。
    resolveRuleClass?: (content: string) => string | null;
    // ルールクラス → アクセント色 (hex) を返す関数。 ジャンプ後の点滅色に使う
    resolveRuleAccent?: (ruleClass: string) => string | null;
  }
): void {
  const localMemos = options?.localMemos;
  const timestampFormat = options?.timestampFormat;
  const resolveRuleClass = options?.resolveRuleClass;
  const resolveRuleAccent = options?.resolveRuleAccent;
  const card = slot.createEl("a", { cls: "wr-quote-card" });
  card.setAttr("href", `${fileName}#^${blockId}`);
  card.dataset.quoteFile = fileName;
  card.dataset.quoteBlock = blockId;
  card.dataset.quoteContext = currentFilePath;
  if (timestampFormat) card.dataset.quoteTsFormat = timestampFormat;
  const bodyEl = card.createDiv({ cls: "wr-quote-card-body", text: "…" });
  const metaEl = card.createDiv({ cls: "wr-quote-card-meta" });

  const file = app.metadataCache.getFirstLinkpathDest(fileName, currentFilePath);
  if (!(file instanceof TFile)) {
    markDead(card, bodyEl, metaEl);
    return;
  }

  const setupClick = (memo: Memo) => {
    fillCardBody(card, bodyEl, metaEl, memo, app, timestampFormat);
    // 引用元のタグルールクラスを引用カード自身に当てる (引用先の親投稿のルールとは独立)
    if (resolveRuleClass) {
      // 既存のルールクラスは念のため削除
      Array.from(card.classList)
        .filter((c) => /^wr-tag-rule-\d+$/.test(c))
        .forEach((c) => card.classList.remove(c));
      const cls = resolveRuleClass(memo.content);
      if (cls) card.classList.add(cls);
    }
    card.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const obs = require("obsidian") as typeof import("obsidian");
      const activeView = app.workspace.getActiveViewOfType(obs.MarkdownView);
      if (activeView) {
        // 現在の leaf が Markdown ビューならそのままそこで開く（RV/LV の状態維持）
        await app.workspace.openLinkText(`${fileName}#^${blockId}`, currentFilePath, false);
      } else {
        // Wrot ビューなどから来た場合、最後に使った Markdown leaf を再利用してビュー状態を維持する
        const recent = app.workspace.getMostRecentLeaf();
        if (recent && recent.view instanceof obs.MarkdownView) {
          app.workspace.setActiveLeaf(recent, { focus: true });
          await app.workspace.openLinkText(`${fileName}#^${blockId}`, currentFilePath, false);
        } else {
          // 過去の Markdown leaf も無いなら新規で開く
          await app.workspace.openLinkText(`${fileName}#^${blockId}`, currentFilePath, true);
        }
      }
      // 飛んだ後、対象のフェンス行を見つけて点滅させる
      flashJumpTarget(blockId, app, resolveRuleAccent);
    });
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
