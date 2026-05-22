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

// RV 専用のジャンプ後処理。LV のように「時刻リストで対象を探しに行く」のではなく、
// MutationObserver で「対象 DOM が現れた事実」をトリガーにして中央寄せ＋点滅する。
// RV では行番号と画面位置の対応関係が壊れているため、時計ベースのポーリングだと
// 「光らない・画面の縁ギリで止まる」揺らぎが構造的に発生していた問題への対策。
function flashJumpTargetReadingView(
  blockId: string,
  app: App,
  resolveRuleAccent?: (ruleClass: string) => string | null,
  targetView?: import("obsidian").MarkdownView | null
): void {
  // 異常系フェイルセーフ。正常系の上限ではなく「来ない場合に永遠に観測し続けない」ための保険。
  const overallTimeoutMs = 10000;
  // ResizeObserver の収束判定。サイズ変化が止まってから一定時間経ったら確定とみなす。
  const resizeSettleMs = 200;
  // 中央寄せ完了から点滅開始までの間（スクロールが視覚的に落ち着くまで）。
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
      clearTimeout(resizeSettleTimeout);
      resizeSettleTimeout = null;
    }
  };

  let interruptListenersAttached = false;
  const removeInterruptListeners = () => {
    if (!interruptListenersAttached) return;
    document.removeEventListener("keydown", cancel, true);
    document.removeEventListener("mousedown", cancel, true);
    document.removeEventListener("wheel", cancel, true);
    document.removeEventListener("touchstart", cancel, true);
    interruptListenersAttached = false;
  };
  const cancel = () => {
    if (canceled) return;
    canceled = true;
    for (const id of pendingTimeouts) clearTimeout(id);
    pendingTimeouts.clear();
    stopMutationWatch();
    stopResizeWatch();
    // 走り出してる点滅クラスも即時除去
    const targets = collectFlashTargets(blockId, app);
    for (const el of targets) {
      el.classList.remove("wr-quote-jump-flash");
      el.style.removeProperty("--wr-flash-color");
    }
    removeInterruptListeners();
  };
  // ユーザー操作による中断リスナーの登録は「中央寄せが始まったあと」まで遅延する。
  // 理由: 対象がまだ DOM に来ていない（仮想スクロールで未マウントなど）状態で
  // タップ余韻の touchstart や iOS の遅延 mousedown を拾うと、観測自体が死んで
  // 「正しい位置には飛ぶのに光らない」症状になる。中央寄せまで来てしまえば
  // ユーザーには「ちゃんと辿り着いた」体感があるので、その後のキャンセルは意味が出る。
  const attachInterruptListenersOnce = () => {
    if (interruptListenersAttached) return;
    interruptListenersAttached = true;
    document.addEventListener("keydown", cancel, true);
    document.addEventListener("mousedown", cancel, true);
    document.addEventListener("wheel", cancel, true);
    document.addEventListener("touchstart", cancel, true);
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

  // 対象が現れた瞬間に呼ばれる確定処理。中央寄せ → 遅延描画の収束を待って点滅。
  const onTargetAppeared = (target: HTMLElement) => {
    if (canceled || centeredOnce) return;
    centeredOnce = true;
    currentTarget = target;
    // ここで初めて中断リスナーを購読開始する。これより前は touchstart 余韻などで
    // 自爆 cancel しないようにするため、何も購読しない。
    attachInterruptListenersOnce();
    // ここでまず一度中央寄せ。OGP/数式の遅延描画は ResizeObserver で追っかける。
    scrollElementIntoCenter(target);
    // サイズ変化を観測。変化が来るたびに収束タイマーをリセット、止まったら最終調整＋点滅。
    let firstObservation = true;
    let flashed_once = false;
    const finalizeIfQuiet = () => {
      if (canceled) return;
      if (currentTarget) scrollElementIntoCenter(currentTarget);
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
        if (resizeSettleTimeout !== null) clearTimeout(resizeSettleTimeout);
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
    // 初回サイズ変化が一切来ない（=既に静止）ケースでも点滅させるため、
    // 短い猶予を置いて点滅をキックする。サイズ変化が先に来たらそちらが先に走る。
    schedule(finalizeIfQuiet, resizeSettleMs);
  };

  // RV パスでは、ジャンプ先 RV の「実際に画面に表示されている」要素を選ぶ。
  // Obsidian は同一ノートの LV コンテナと RV コンテナを両方 DOM に持つことがあり
  // (モード切替時に両方残る)、単純な「アクティブビュー containerEl 配下」絞り込みでは
  // 非表示の LV 側要素を掴んでしまい、スクロールも点滅も画面に出ない症状になる。
  // 判定基準:
  //   1. 祖先に .markdown-reading-view があり、かつ .markdown-source-view が無いこと
  //   2. offsetParent !== null (display:none やそれに準じた非表示状態でないこと)
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
    // 見える RV 側要素が見つからない場合は null を返す。
    // 「LV 側の非表示要素」や「offsetParent が null の要素」を掴んでも
    // 中央寄せ・点滅が画面に出ないため、観測継続（MutationObserver の待機）を選ぶ。
    return null;
  };

  // 既に対象が現れている場合は即時で処理。観測は不要。
  const initialPreferred = pickVisibleReadingViewTarget();
  if (initialPreferred) {
    onTargetAppeared(initialPreferred);
  } else {
    // まだ現れていない → MutationObserver で出現を待ち受ける。
    // 観測範囲は document 全体（RV のコンテナがどこに生えるか保証しにくいため）。
    // 出現判定は wr-block-id-{blockId} クラスを持つ要素の追加で行う。
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
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  // 異常系フェイルセーフ。対象が10秒経っても来なければ観測を畳む。
  // RV の仮想スクロール仕様上、画面外に深く埋もれたブロックは Obsidian 自身がマウントしない
  // ため、ここまで来てしまうケースは Obsidian の構造的制約として受容する（プラグイン側で
  // 強制マウントするとスクロール位置のガタつきが発生し、ジャンプ体感を損なうため）。
  const overallId = window.setTimeout(() => {
    pendingTimeouts.delete(overallId);
    stopMutationWatch();
    stopResizeWatch();
    removeInterruptListeners();
  }, overallTimeoutMs);
  pendingTimeouts.add(overallId);
}

// 元投稿に飛んだ後、対象の投稿ブロック全体を緩く点滅させる
export function flashJumpTarget(
  blockId: string,
  app: App,
  resolveRuleAccent?: (ruleClass: string) => string | null,
  // ジャンプ先のビュー。呼び出し側（クリックハンドラ）で確定したものを渡す。
  // 「アクティブビュー」での判定だと、押した起点が Wrot タイムラインや別ノートだったときに
  // ジャンプ先と無関係なビューを見て LV/RV 判定が揺らぐ。
  targetView?: import("obsidian").MarkdownView | null
): void {
  // RV では「行番号」と画面位置の対応関係が壊れる（画像/数式/OGP で行高が膨らむ）ため、
  // LV と同じ時刻ベースのポーリングでは「光らない・縁ギリで止まる」揺らぎが出る。
  // RV のときだけ「DOM 出現を観測する」方式に分岐させる。LV のパスは触らない。
  const isReadingView = targetView?.getMode?.() === "preview";
  if (isReadingView) {
    flashJumpTargetReadingView(blockId, app, resolveRuleAccent, targetView);
    return;
  }

  // 以下、LV (Live Preview / source mode) 用の既存ロジック。手は入れない。
  // 流れ: 対象要素出現を待つ → 見つかったらスクロール → スクロール完了後に点滅
  // 中断: ユーザー操作があったらスクロールも点滅も両方やめる
  const searchAt = [80, 250, 500, 900, 1500, 2200];
  const scrollSettleDelay = 200;
  const flashDuration = 1600;
  let canceled = false;
  let scrolled = false;
  const pendingTimeouts = new Set<number>();
  const flashed = new WeakSet<HTMLElement>();
  // URL カード (OGP) / 数式 (MathJax) のように遅延描画される子を含む対象は
  // ジャンプ直後の中央寄せ後にサイズが膨らみ目的位置がズレる。
  // 対象要素のサイズ変化を観測して、変化のたびに中央寄せをやり直す。
  let resizeObserver: ResizeObserver | null = null;
  let resizeSettleTimeout: number | null = null;
  const stopResizeWatch = () => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (resizeSettleTimeout !== null) {
      clearTimeout(resizeSettleTimeout);
      resizeSettleTimeout = null;
    }
  };

  const removeInterruptListeners = () => {
    document.removeEventListener("keydown", cancel, true);
    document.removeEventListener("mousedown", cancel, true);
    document.removeEventListener("wheel", cancel, true);
    document.removeEventListener("touchstart", cancel, true);
  };
  const cancel = () => {
    if (canceled) return;
    canceled = true;
    for (const id of pendingTimeouts) clearTimeout(id);
    pendingTimeouts.clear();
    stopResizeWatch();
    // 走り出してる点滅クラスも即時除去
    const targets = collectFlashTargets(blockId, app);
    for (const el of targets) {
      el.classList.remove("wr-quote-jump-flash");
      el.style.removeProperty("--wr-flash-color");
    }
    removeInterruptListeners();
  };
  // スマホでは click を生んだタップの touchend 直後にも touchstart の
  // 余韻イベントが発火することがある（特に iOS）。同じシーケンス内で
  // リスナー登録すると自分のタップで cancel が誘発されてジャンプが空振りする。
  // 次フレームに送ってシーケンスをまたいでから購読開始する。
  requestAnimationFrame(() => {
    if (canceled) return;
    document.addEventListener("keydown", cancel, true);
    document.addEventListener("mousedown", cancel, true);
    document.addEventListener("wheel", cancel, true);
    document.addEventListener("touchstart", cancel, true);
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
      schedule(() => {
        el.classList.remove("wr-quote-jump-flash");
        el.style.removeProperty("--wr-flash-color");
      }, flashDuration);
    }
  };

  // applyScroll / openLinkText のスクロールは「行数換算」のため、画像/数式など
  // 行高が大きく変動するブロックがあると目的位置が大きくズレることがある。
  // 対象要素が DOM に現れたら、ここで実 DOM 座標で改めて中央寄せに微調整する。
  // その後、スクロールが落ち着いてから点滅させる。
  const tryFlash = (): boolean => {
    if (canceled || scrolled) return false;
    const targets = collectFlashTargets(blockId, app);
    if (targets.length === 0) return false;
    scrolled = true;
    // 代表として先頭ターゲットを中央寄せ。同一 blockId の点滅対象は LV/RV/タイムライン
    // を横断しうるが、ジャンプ位置は「アクティブビュー内の対象」基準にしたいので、
    // アクティブビューに含まれる要素を優先的に選ぶ
    const activeContainer = getActiveViewContainer(app);
    const preferred = activeContainer
      ? targets.find((el) => activeContainer.contains(el)) ?? targets[0]
      : targets[0];
    scrollElementIntoCenter(preferred);
    // OGP カードや数式 (MathJax) の遅延描画でサイズが膨らむと、初回中央寄せ後に
    // 目的位置がズレる。ResizeObserver で対象のサイズ変化を観測し、変化のたびに
    // 一定時間後に再度中央寄せをやり直す。一定時間サイズ変化が止まったら監視終了。
    if (typeof ResizeObserver !== "undefined") {
      stopResizeWatch();
      let firstObservation = true;
      resizeObserver = new ResizeObserver(() => {
        // observe() 直後の初回コールバックは現状サイズ通知なので無視する
        if (firstObservation) {
          firstObservation = false;
          return;
        }
        if (canceled) return;
        if (resizeSettleTimeout !== null) {
          clearTimeout(resizeSettleTimeout);
        }
        resizeSettleTimeout = window.setTimeout(() => {
          resizeSettleTimeout = null;
          if (canceled) return;
          scrollElementIntoCenter(preferred);
        }, 80);
      });
      resizeObserver.observe(preferred);
      // 描画安定までの上限。遅延描画が永遠に発火し続ける状況を避けるため
      // searchAt の最後＋少しの猶予で確実に監視を切る
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
  // 最後の試行後、検知リスナーだけクリーンアップ（点滅自体は止めない）
  const cleanupId = window.setTimeout(() => {
    pendingTimeouts.delete(cleanupId);
    removeInterruptListeners();
  }, searchAt[searchAt.length - 1] + scrollSettleDelay + flashDuration + 200);
  pendingTimeouts.add(cleanupId);
}

// 現在アクティブな MarkdownView のコンテナ要素を返す。
// 同じファイルが LV/RV で並行して開かれている場合の、対象要素の絞り込みに使う。
function getActiveViewContainer(app: App): HTMLElement | null {
  const obs = require("obsidian") as typeof import("obsidian");
  const view = app.workspace.getActiveViewOfType(obs.MarkdownView);
  return view?.containerEl ?? null;
}

// 対象要素を「対象が属する単一のスクロールコンテナ内で中央に来る」位置までスクロールする。
// scrollIntoView は要素を含む全スクロール可能祖先を巻き込んでスクロールするため、
// 特に RV では外側コンテナまで動いてビュー全体が先頭に戻ってしまう症状が出る。
// 対象に最も近いスクロール可能祖先を1つだけ特定し、その scrollTop を直接調整する。
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

function scrollElementIntoCenter(el: HTMLElement): void {
  const scroller = findNearestScrollableAncestor(el);
  if (!scroller) {
    // 例外: スクロール可能祖先が見つからないときだけ scrollIntoView にフォールバック
    el.scrollIntoView({ block: "center", behavior: "auto" });
    return;
  }
  const apply = () => {
    const scrollerRect = scroller.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    // 対象要素の中心が scroller の中央に来るように scrollTop を調整
    const offsetWithinScroller = elRect.top - scrollerRect.top + scroller.scrollTop;
    const desiredTop = offsetWithinScroller - (scroller.clientHeight - elRect.height) / 2;
    const maxTop = scroller.scrollHeight - scroller.clientHeight;
    scroller.scrollTop = Math.max(0, Math.min(desiredTop, maxTop));
  };
  apply();
  // モバイル（特に iOS）では1度の代入だと慣性処理に上書きされる場合があるため、
  // 次フレームでもう一度同じ計算で書き直して確実に反映させる
  requestAnimationFrame(apply);
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
  // <a href> だと Obsidian の内部リンク処理が mousedown/mouseup を奪い、
  // クリックイベントが届かないことがある（特に <a> 要素本体をクリックした時）。
  // <div> + role="link" で代替し、自前の click ハンドラに任せる。
  const card = slot.createEl("div", { cls: "wr-quote-card" });
  card.setAttr("role", "link");
  card.setAttr("tabindex", "0");
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

  // メモが非同期で揃う前にユーザーがクリックすると、ハンドラ未登録のまま
  // <a href> のデフォルト遷移が走って中途半端な状態になり、ホバー残り＋
  // 2回押し問題を生む。メモ準備フラグを使った eager ハンドラで先に防ぐ。
  let memoReady: Memo | null = null;
  card.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!memoReady) return;
    const obs = require("obsidian") as typeof import("obsidian");
    const activeView = app.workspace.getActiveViewOfType(obs.MarkdownView);
    const activeFilePath = activeView?.file?.path;
    const isSameFile = !!activeFilePath && activeFilePath === file.path;
    // 同ファイル / 別ファイル / Wrotビュー（タイムライン）からのジャンプを統一処理：
    // 1. 必要なら openLinkText でファイルを開いてビューをアクティブ化
    // 2. アクティブ化された MarkdownView の applyScroll で対象行を中央寄せでスクロール
    //    (openLinkText だけだと「もう開いてる」判定で動かないケースがあるため)
    let targetView: import("obsidian").MarkdownView | null = activeView;
    if (!isSameFile) {
      // 別ファイル or activeView 無し
      const recent = app.workspace.getMostRecentLeaf();
      const useRecent = !activeView && recent && recent.view instanceof obs.MarkdownView;
      if (useRecent && recent) {
        app.workspace.setActiveLeaf(recent, { focus: true });
      }
      // recent も無い場合は新規 leaf
      const openInNew = !activeView && !useRecent;
      await app.workspace.openLinkText(`${fileName}#^${blockId}`, currentFilePath, openInNew);
      targetView = app.workspace.getActiveViewOfType(obs.MarkdownView);
    }
    if (targetView) {
      // applyScroll は指定行を画面上端付近に運ぶ。中央寄せは flashJumpTarget の中で
      // 対象要素の実 DOM 座標を使って改めて行うため、ここではざっくり目的行まで運ぶだけ。
      // 旧実装は viewportH ÷ approxLineHeight ÷ 2 で「画面半分の行数」を引いて中央化していたが、
      // contentEl.clientHeight が「中身全体の高さ」を返すケースがあり halfLines が targetLine を
      // 上回ると scrollLine が 0 に丸められて先頭に飛ぶ症状が出ていた。
      const targetLine = memoReady.lineStart;
      const mode = (targetView as any).currentMode;
      if (mode && typeof mode.applyScroll === "function") {
        mode.applyScroll(targetLine);
      }
    }
    // Obsidian がスクロール+実体化を済ませた後で点滅させる。
    // ジャンプ先のビューを明示的に渡すことで、LV/RV 判定が「アクティブビュー」のブレに左右されないようにする。
    flashJumpTarget(blockId, app, resolveRuleAccent, targetView);
  });

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
    memoReady = memo;
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
