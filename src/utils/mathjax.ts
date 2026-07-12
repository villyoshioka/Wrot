import { loadMathJax, renderMath, finishRenderMath } from "obsidian";

// Fully lazy MathJax: eager loading costs tens of ms of main-thread script evaluation at
// startup (measurement jitter, flicker). Nothing loads until a formula actually renders,
// so math-free vaults never load MathJax at all.

// Obsidian's loadMathJax() installs a config stub on window.MathJax before the async script
// load, so its mere presence does not mean "loaded". Probe tex2chtml (used by renderMath) instead.
export function isMathJaxReady(): boolean {
  const mj = (window as { MathJax?: { tex2chtml?: unknown } }).MathJax;
  return typeof mj?.tex2chtml === "function";
}

// Notified on load completion (time to re-render fallbacks); registered by the plugin.
let readyHandler: (() => void) | null = null;
let requested = false;

export function setMathJaxReadyHandler(handler: (() => void) | null): void {
  readyHandler = handler;
}

// Called from fallback render sites; starts the load only once. Also notifies when already
// ready (the ready check and load completion can race) so fallbacks get a re-render chance.
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

// Upgrades only .wr-math-fallback elements in place; no full view re-render, so nothing else moves.
export function upgradeMathFallbacks(): void {
  if (!isMathJaxReady()) return;
  const els = Array.from(activeDocument.querySelectorAll<HTMLElement>(".wr-math-fallback"));
  if (els.length === 0) return;
  let patched = false;
  for (const el of els) {
    // Inline (.wr-math) holds "$tex$"; block (.wr-math-display) holds raw tex.
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
