import { loadMathJax, renderMath, finishRenderMath } from "obsidian";

// MathJax の完全遅延読み込み。
//
// 起動時に読み込むと、ライブラリ本体のスクリプト評価(メインスレッド数十ms級)が
// 起動計測の枠内やレイアウト確定直後の描画に重なってしまう(計測のブレ・ちらつきの原因)。
// そのため数式が実際に描画されるまで一切読み込まず、フォールバック描画が起きた
// 場所から requestMathJax() で初回だけ読み込みを開始する。数式を使わない vault では
// MathJax は永遠に読み込まれない。

// MathJax が実際に描画へ使える状態かどうか。
// Obsidian の loadMathJax() は呼び出した瞬間に設定用スタブを window.MathJax へ
// 置いてからスクリプトを非同期読み込みするため、window.MathJax の存在チェックでは
// 「読み込み完了」を判定できない(スタブ段階でも true になってしまう)。
// renderMath が内部で呼ぶ tex2chtml が生えているかどうかで判定する。
export function isMathJaxReady(): boolean {
  const mj = (window as { MathJax?: { tex2chtml?: unknown } }).MathJax;
  return typeof mj?.tex2chtml === "function";
}

// 読み込み完了時(=フォールバックを描き直すべきタイミング)の通知先。プラグイン本体が登録する
let readyHandler: (() => void) | null = null;
let requested = false;

export function setMathJaxReadyHandler(handler: (() => void) | null): void {
  readyHandler = handler;
}

// 数式のフォールバック描画が起きた場所から呼ぶ。初回だけ読み込みを開始し、
// 完了したらハンドラへ通知する。読み込み済みの状態でフォールバックが起きた場合
// (判定と完了がすれ違った稀なケース)も通知して描き直しの機会を作る
export function requestMathJax(): void {
  if (isMathJaxReady()) {
    readyHandler?.();
    return;
  }
  if (requested) return;
  requested = true;
  void loadMathJax()
    .then(() => readyHandler?.())
    .catch(() => {
      requested = false;
    });
}

// プレーンテキストにフォールバックした数式要素(.wr-math-fallback)だけを、
// その場で数式描画に差し替える。ビュー全体の再描画はしないので他の内容は動かない
export function upgradeMathFallbacks(): void {
  if (!isMathJaxReady()) return;
  const els = Array.from(activeDocument.querySelectorAll<HTMLElement>(".wr-math-fallback"));
  if (els.length === 0) return;
  let patched = false;
  for (const el of els) {
    // インライン(.wr-math)は "$tex$"、ブロック(.wr-math-display)は生のtexが入っている
    const isBlock = el.classList.contains("wr-math-display");
    const raw = el.textContent ?? "";
    const tex = isBlock ? raw : raw.replace(/^\$/, "").replace(/\$$/, "");
    try {
      const rendered = renderMath(tex, isBlock);
      el.empty();
      el.appendChild(rendered);
      el.classList.remove("wr-math-fallback");
      patched = true;
    // eslint-disable-next-line no-empty -- 失敗した要素はフォールバック表示のまま残す
    } catch {}
  }
  if (patched) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- fire-and-forget; failure is non-critical
      finishRenderMath();
    // eslint-disable-next-line no-empty -- intentional no-op
    } catch {}
  }
}
