import { loadMathJax, renderMath, finishRenderMath } from "obsidian";

// Fully lazy: eager MathJax costs tens of ms at startup, so nothing loads until a formula renders.

// Set once our own loadMathJax() has resolved: Obsidian's word that renderMath is usable,
// whatever engine sits behind it.
let loaded = false;

// loadMathJax() installs a config stub first, so probe tex2chtml (also catches a load started elsewhere).
export function isMathJaxReady(): boolean {
  if (loaded) return true;
  const mj = (window as { MathJax?: { tex2chtml?: unknown } }).MathJax;
  return typeof mj?.tex2chtml === "function";
}

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
    .then(() => {
      loaded = true;
      readyHandler?.();
    })
    .catch(() => {
      requested = false;
    });
}

// Until MathJax is ready, shows the fallback text and marks el for upgradeMathFallbacks.
export function renderMathInto(el: HTMLElement, tex: string, display: boolean, fallback: string, ready = isMathJaxReady()): void {
  try {
    if (!ready) throw new Error("MathJax not loaded yet");
    el.appendChild(renderMath(tex, display));
    void finishRenderMath();
  } catch {
    el.classList.add("wrot-math-fallback");
    el.textContent = fallback;
    requestMathJax();
  }
}

export function upgradeMathFallbacks(): void {
  if (!isMathJaxReady()) return;
  const els = Array.from(activeDocument.querySelectorAll<HTMLElement>(".wrot-math-fallback"));
  if (els.length === 0) return;
  let patched = false;
  for (const el of els) {
    // Inline (.wrot-math) holds "$tex$"; block (.wrot-math-display) holds raw tex.
    const isBlock = el.classList.contains("wrot-math-display");
    const raw = el.textContent ?? "";
    const tex = isBlock ? raw : raw.replace(/^\$/, "").replace(/\$$/, "");
    try {
      const rendered = renderMath(tex, isBlock);
      el.empty();
      el.appendChild(rendered);
      el.classList.remove("wrot-math-fallback");
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
