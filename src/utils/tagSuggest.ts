import { extractNonBlockText } from "./blockSegmenter";

// 候補として保持するタグの上限。超えた分は「長く使われていないもの」から捨てる。
// タグ文字列のみの保持なのでデータ量は小さく、上限は候補の鮮度維持のために設ける。
export const MAX_RECENT_TAGS = 200;

// ドロップダウンに一度に表示する候補の上限（リスト自体はスクロール可能）。
const MAX_VISIBLE_ITEMS = 5;

// 表示側 (urlRenderer の TOKEN_REGEX) と同じ優先順位でトークン分割し、#タグだけを拾う。
// インラインコード・数式・装飾・埋め込み/内部リンク・Markdownリンク・URL の内側にある
// # は表示上タグとして扱われないため、候補の記録でも同様に除外して一貫させる。
// eslint-disable-next-line no-useless-escape -- escape kept for regex readability
const TOKEN_REGEX = /(\$[^$]+\$|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|==[^=]+=+|!\[\[[^\]]+\]\]|\[\[[^\]]+\]\]|\[[^\[\]\n]+\]\((?:https?|obsidian):\/\/[^\s)]+\)|#[^\s#]+|(?:https?|obsidian):\/\/[^\s<>"'\]]+)/g;

// 投稿本文から候補記録用のタグ（先頭 # を除いた文字列）を出現順・重複なしで抽出する。
// コード/数式ブロック内は extractNonBlockText が除外する。
export function extractTagsForHistory(text: string): string[] {
  const source = extractNonBlockText(text);
  const tags: string[] = [];
  for (const part of source.split(TOKEN_REGEX)) {
    if (!part) continue;
    if (/^#[^\s#]+$/.test(part)) {
      const tag = part.slice(1);
      if (!tags.includes(tag)) tags.push(tag);
    }
  }
  return tags;
}

// 今回使われたタグを先頭に移動（新しい順を維持）し、上限で切り詰める。
export function mergeRecentTags(existing: string[], used: string[]): string[] {
  if (used.length === 0) return existing;
  const merged = [...used, ...existing.filter((tag) => !used.includes(tag))];
  return merged.slice(0, MAX_RECENT_TAGS);
}

export interface TagSuggestOptions {
  textarea: HTMLTextAreaElement;
  // ポップオーバーを配置する親要素（ビュー本体 = wr-container）。
  // カレンダーポップオーバーと同じく、コンテナ内座標で位置決め・クランプする。
  container: HTMLElement;
  // 候補（先頭 # なし、新しい順）。呼び出しのたびに最新の設定値を返す。
  getCandidates: () => string[];
  isEnabled: () => boolean;
}

interface ActiveToken {
  // 置換対象の範囲。start は #（全角＃含む）の位置、end はカーソル位置。
  start: number;
  end: number;
  query: string;
}

// 入力エリアのタグ補完コントローラ。
// WrotView から input / selectionchange / compositionend で refresh() を、
// keydown の先頭で handleKeydown() を呼んでもらう前提の受け身設計。
export class TagSuggest {
  private opts: TagSuggestOptions;
  private popover: HTMLDivElement | null = null;
  private itemEls: HTMLElement[] = [];
  private itemTags: string[] = [];
  private selectedIndex = 0;
  private token: ActiveToken | null = null;
  // タップ確定用: pointerdown 時の指の位置。離すまでにほぼ動かなければタップとみなす。
  private tapStart: { id: number; x: number; y: number } | null = null;
  // 候補への pointerdown 〜 pointerup の間だけ true。
  // この間に textarea の blur が来ても閉じない（閉じると確定前に候補が消える）。
  private interacting = false;
  // ポインタ操作で閉じた直後の抑止期限。閉じた後に同じ座標へ届く遅延クリック
  // （ゴーストクリック）が、候補リストの下にあった UI を誤って押すのを防ぐ。
  private suppressUiUntil = 0;
  // IME 変換中かどうか。変換中の value 書き換えは iOS の入力状態を壊すため、
  // confirm() が変換の強制確定を挟む判断に使う。
  private composing = false;
  private onCompositionStart = (): void => {
    this.composing = true;
  };
  private onCompositionEnd = (): void => {
    this.composing = false;
  };

  constructor(opts: TagSuggestOptions) {
    this.opts = opts;
    opts.textarea.addEventListener("compositionstart", this.onCompositionStart);
    opts.textarea.addEventListener("compositionend", this.onCompositionEnd);
  }

  isOpen(): boolean {
    return this.popover !== null;
  }

  // 候補リスト表示中、およびポインタ操作で閉じた直後は true。
  // この間、ツールバー側はクリックを無視する（見た目は変えない）。
  isSuppressingUi(): boolean {
    return this.popover !== null || Date.now() < this.suppressUiUntil;
  }

  // カーソル位置のトークンを見て、ドロップダウンを開く/更新する/閉じる。
  // IME 変換中も呼んでよい。textarea.value には未確定文字も含まれるため、
  // 変換中の文字でもそのまま絞り込みが効く（日本語タグで確定を待たせない）。
  refresh(): void {
    const { textarea: ta, isEnabled, getCandidates } = this.opts;
    if (!isEnabled()) {
      this.close();
      return;
    }
    if (activeDocument.activeElement !== ta || ta.selectionStart !== ta.selectionEnd) {
      this.close();
      return;
    }

    const token = this.detectToken(ta.value, ta.selectionStart);
    if (!token) {
      this.close();
      return;
    }

    const matches = this.filterCandidates(getCandidates(), token.query);
    if (matches.length === 0) {
      this.close();
      return;
    }

    this.token = token;
    this.renderItems(matches);
    this.position();
  }

  // ドロップダウン表示中のキー操作を処理する。消費したら true を返す。
  handleKeydown(e: KeyboardEvent): boolean {
    if (!this.popover) return false;
    // 投稿ショートカットは補完より優先。閉じるだけで消費せず、Scope の送信処理へ流す。
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      this.close();
      return false;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.close();
      return true;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      this.moveSelection(e.key === "ArrowDown" ? 1 : -1);
      return true;
    }
    if ((e.key === "Enter" && !e.shiftKey) || e.key === "Tab") {
      e.preventDefault();
      e.stopPropagation();
      this.confirm(this.selectedIndex);
      return true;
    }
    return false;
  }

  close(): void {
    if (!this.popover) return;
    activeDocument.removeEventListener("pointerdown", this.onOutside, true);
    this.popover.remove();
    this.popover = null;
    this.itemEls = [];
    this.itemTags = [];
    this.selectedIndex = 0;
    this.token = null;
    this.tapStart = null;
    this.interacting = false;
  }

  // textarea が blur したときに WrotView から呼ばれる。
  // 候補タップの途中（pointerdown 後）はフォーカスが一瞬外れることがあるため閉じない。
  // 確定処理側が textarea を再フォーカスして復帰する。
  notifyBlur(): void {
    if (!this.interacting) this.close();
  }

  destroy(): void {
    this.opts.textarea.removeEventListener("compositionstart", this.onCompositionStart);
    this.opts.textarea.removeEventListener("compositionend", this.onCompositionEnd);
    this.close();
  }

  // カーソル直前の「空白区切りの単語」が #（全角＃含む）で始まるときだけ補完対象とする。
  // URL のフラグメント (`https://…/#a`) のような単語途中の # では発火させない。
  // `#a#b` のように # が連続する場合は、最後の # 以降を入力中のタグとみなす。
  private detectToken(value: string, pos: number): ActiveToken | null {
    let wordStart = pos;
    while (wordStart > 0 && !/\s/.test(value[wordStart - 1])) {
      wordStart--;
    }
    const word = value.slice(wordStart, pos);
    if (!word.startsWith("#") && !word.startsWith("＃")) return null;
    const hashIdx = Math.max(word.lastIndexOf("#"), word.lastIndexOf("＃"));
    return {
      start: wordStart + hashIdx,
      end: pos,
      query: word.slice(hashIdx + 1),
    };
  }

  // 前方一致を優先し、続けて部分一致を並べる。比較は大文字小文字を区別しない。
  private filterCandidates(candidates: string[], query: string): string[] {
    if (query === "") return candidates.slice(0, MAX_VISIBLE_ITEMS);
    const q = query.toLowerCase();
    const prefix: string[] = [];
    const partial: string[] = [];
    for (const tag of candidates) {
      const lower = tag.toLowerCase();
      if (lower.startsWith(q)) prefix.push(tag);
      else if (lower.includes(q)) partial.push(tag);
    }
    return [...prefix, ...partial].slice(0, MAX_VISIBLE_ITEMS);
  }

  private renderItems(matches: string[]): void {
    if (!this.popover) {
      this.popover = this.opts.container.createDiv({ cls: "wr-tag-suggest" });
      // ポップオーバー内のクリックを外へ伝播させない（カレンダーポップオーバーと同じ方針）。
      this.popover.addEventListener("click", (e) => e.stopPropagation());
      // iOS はタップ後に互換マウスイベントを遅れて合成し、その既定動作が
      // textarea からフォーカスを奪う（確定処理内の focus() より後に届くため、
      // 戻したフォーカスが横取りされて以降のキー入力が全部効かなくなる）。
      // pointerdown 側の preventDefault では抑止しきれないため mousedown も塞ぐ
      // （ツールバーの各ボタンと同じ対策）。
      this.popover.addEventListener("mousedown", (e) => e.preventDefault());
      activeDocument.addEventListener("pointerdown", this.onOutside, true);
    }
    this.popover.empty();
    this.itemEls = [];
    this.itemTags = matches;
    this.selectedIndex = 0;

    matches.forEach((tag, index) => {
      const item = this.popover!.createDiv({
        cls: "wr-tag-suggest-item",
        text: `#${tag}`,
      });
      // 確定は click ではなく pointerup で行う（iOS WebKit では click が
      // 発火しないことがあり、click 頼みだとモバイルでタップ確定できない）。
      // pointerdown は preventDefault しない: タップのネイティブ処理を丸ごと
      // 抑止すると、iOS がキーボードの入力セッションを切り離すことがあり、
      // フォーカスは textarea に残ったままキー入力だけ届かなくなる（実機で確認）。
      // デスクトップのフォーカス横取りはポップオーバー側の mousedown
      // preventDefault が防ぐ。
      item.addEventListener("pointerdown", (e) => {
        this.tapStart = { id: e.pointerId, x: e.clientX, y: e.clientY };
        this.interacting = true;
      });
      item.addEventListener("pointerup", (e) => {
        const start = this.tapStart;
        this.tapStart = null;
        this.interacting = false;
        if (!start || start.id !== e.pointerId) return;
        // 指がほぼ動いていないときだけタップとみなす（リストのスクロール操作と区別する）。
        if (Math.abs(e.clientX - start.x) > 8 || Math.abs(e.clientY - start.y) > 8) return;
        this.confirm(index);
      });
      // スクロールにジェスチャが移った場合など、確定に至らなかった操作の後始末。
      item.addEventListener("pointercancel", () => {
        this.tapStart = null;
        this.interacting = false;
      });
      this.itemEls.push(item);
    });
    this.applySelection();
  }

  private moveSelection(delta: number): void {
    const count = this.itemEls.length;
    if (count === 0) return;
    this.selectedIndex = (this.selectedIndex + delta + count) % count;
    this.applySelection();
  }

  private applySelection(): void {
    this.itemEls.forEach((el, index) => {
      el.toggleClass("wr-tag-suggest-item-selected", index === this.selectedIndex);
    });
    this.itemEls[this.selectedIndex]?.scrollIntoView({ block: "nearest" });
  }

  // 選択中の候補で入力中のトークンを置き換える。確定後は続けて書けるよう半角スペースを添える。
  private confirm(index: number): void {
    const tag = this.itemTags[index];
    const token = this.token;
    if (tag === undefined || !token) return;
    const ta = this.opts.textarea;
    const insert = `#${tag} `;
    this.suppressUiUntil = Date.now() + 400;
    this.close();
    // iOS のかな入力は打鍵中ずっと変換(composition)が生きており、Backspace も
    // 「変換中文字列を1文字短くする」操作として実行される。変換が生きたまま
    // 文面を書き換えると IME 側の変換セッションだけが実文面と対応の切れた
    // 幽霊状態で残り、以降の単発 Backspace が空振りする(実機で確認)。
    // 変換中の確定は、blur で変換を強制確定させ、その完了(compositionend)を
    // 待ってから置き換えてフォーカスを戻す。強制確定は文面を変えないため
    // token の位置はそのまま有効。
    if (this.composing) {
      let done = false;
      const finish = (): void => {
        if (done) return;
        done = true;
        ta.removeEventListener("compositionend", finish);
        this.applyInsert(ta, token, insert);
      };
      ta.addEventListener("compositionend", finish);
      ta.blur();
      // compositionend が届かない環境向けの保険
      window.setTimeout(finish, 150);
      return;
    }
    this.applyInsert(ta, token, insert);
  }

  // 変換の強制確定後にそのまま focus() し直すと、iOS は古い入力セッションを
  // 使い回してキャレット(カーソルの棒)を描画しない(入力機能は正常)。
  // 不可視のダミー入力欄へ一度フォーカスを移してから戻し、セッションを
  // 作り直させる。編集可能要素どうしの移動なのでキーボードは閉じない想定。
  private rebuildFocus(ta: HTMLTextAreaElement): void {
    const dummy = this.opts.container.createEl("input", {
      cls: "wr-focus-bounce",
      attr: { type: "text" },
    });
    dummy.focus({ preventScroll: true });
    ta.focus({ preventScroll: true });
    dummy.remove();
  }

  // トークンを置き換えて、カーソルを挿入末尾に置く(confirm の実体)。
  // フォーカスが残っているところへ focus() を重ね掛けすると iOS がキーボード
  // セッションを見失う引き金になり得るため、失っていた(=変換の強制確定で
  // blur した)場合のみ、セッションを作り直す形で戻す。
  private applyInsert(ta: HTMLTextAreaElement, token: ActiveToken, insert: string): void {
    ta.value = ta.value.slice(0, token.start) + insert + ta.value.slice(token.end);
    const caret = token.start + insert.length;
    if (activeDocument.activeElement !== ta) {
      this.rebuildFocus(ta);
    }
    ta.setSelectionRange(caret, caret);
    ta.dispatchEvent(new Event("input"));
  }

  private onOutside = (e: PointerEvent): void => {
    const target = e.target as Node | null;
    if (target && (this.popover?.contains(target) || this.opts.textarea.contains(target))) {
      return;
    }
    this.suppressUiUntil = Date.now() + 400;
    this.close();
  };

  // 入力中のトークン先頭（# の位置）の直下にドロップダウンを出す。
  // textarea のカーソル座標は直接取れないため、同じ描画条件を複製したミラー要素に
  // 同じテキストを流し込み、トークン部分を span で包んで位置を計測する。
  private position(): void {
    const { textarea: ta, container } = this.opts;
    const popover = this.popover;
    const token = this.token;
    if (!popover || !token) return;

    const style = activeWindow.getComputedStyle(ta);
    const mirror = container.createDiv({ cls: "wr-tag-suggest-mirror" });
    const copyProps = [
      "boxSizing", "width", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
      "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
      "borderStyle", "fontFamily", "fontSize", "fontWeight", "fontStyle",
      "letterSpacing", "lineHeight", "textTransform", "textIndent", "tabSize",
      "wordSpacing", "overflowWrap", "wordBreak",
    ] as const;
    for (const prop of copyProps) {
      mirror.style[prop] = style[prop];
    }

    // トークンは必ず # を含むため空にならない（空 span は寸法が取れない）。
    mirror.appendText(ta.value.slice(0, token.start));
    const marker = mirror.createSpan({ text: ta.value.slice(token.start, token.end) });

    const mirrorRect = mirror.getBoundingClientRect();
    const markerRects = marker.getClientRects();
    const firstRect = markerRects[0] ?? marker.getBoundingClientRect();
    const lastRect = markerRects[markerRects.length - 1] ?? firstRect;
    const leftOffset = firstRect.left - mirrorRect.left;
    const bottomOffset = lastRect.bottom - mirrorRect.top;
    mirror.remove();

    // ミラー内オフセットを textarea の画面座標へ写し、スクロール分を差し引く。
    const taRect = ta.getBoundingClientRect();
    const caretLeft = taRect.left + leftOffset - ta.scrollLeft;
    const caretBottom = taRect.top + bottomOffset - ta.scrollTop;

    // コンテナ内座標へ変換し、左右はコンテナに収まるようクランプする
    // （カレンダーポップオーバーと同じ余白ルール）。
    const GAP = 2;
    const EDGE = 8;
    const cRect = container.getBoundingClientRect();
    popover.style.maxWidth = `${cRect.width - EDGE * 2}px`;
    const w = popover.offsetWidth;
    const maxLeft = cRect.width - w - EDGE;
    let left = caretLeft - cRect.left;
    if (left > maxLeft) left = maxLeft;
    if (left < EDGE) left = EDGE;
    popover.style.top = `${caretBottom - cRect.top + GAP}px`;
    popover.style.left = `${left}px`;
  }
}
