import { loadPrism } from "obsidian";

interface PrismToken {
  type: string;
  alias?: string | string[];
  content: PrismNode;
}
type PrismNode = string | PrismToken | PrismNode[];
interface PrismLike {
  languages: Record<string, unknown>;
  tokenize(text: string, grammar: unknown): PrismNode[];
}

/** One token within a line: offsets into that line and the classes Prism gives it. */
export interface TokenSpan {
  from: number;
  to: number;
  cls: string;
}

// Never loaded up front, only once code with a language is shown raw. Obsidian leaves it on
// window once anything has loaded it, so a note already rendering code finds it there.
let prism: PrismLike | null = null;
let loading = false;
const waiters = new Set<() => void>();

// window.Prism can be a bare placeholder before the real script has run, so only an object
// that can actually tokenize counts as loaded.
function isReady(p: Partial<PrismLike> | null | undefined): p is PrismLike {
  return !!p && typeof p.tokenize === "function" && !!p.languages;
}

function prismOrLoad(onLoad: () => void): PrismLike | null {
  if (!prism) {
    const global = (window as { Prism?: Partial<PrismLike> }).Prism;
    if (isReady(global)) prism = global;
  }
  if (prism) return prism;
  waiters.add(onLoad);
  if (!loading) {
    loading = true;
    loadPrism()
      .then((loaded: Partial<PrismLike>) => {
        if (!isReady(loaded)) {
          loading = false;
          return;
        }
        prism = loaded;
        const pending = [...waiters];
        waiters.clear();
        for (const w of pending) w();
      })
      .catch(() => {
        loading = false;
      });
  }
  return null;
}

/**
 * Prism's tokens for a block of code, split per line. Null while Prism is still loading
 * (onLoad fires once it lands) or when the language is unknown; the code then stays plain.
 */
export function tokenizeLines(code: string, lang: string, onLoad: () => void): TokenSpan[][] | null {
  if (!lang) return null;
  const p = prismOrLoad(onLoad);
  const grammar = p?.languages[lang];
  if (!p || !grammar) return null;
  const lines: TokenSpan[][] = [[]];
  let col = 0;
  const walk = (node: PrismNode, cls: string | null): void => {
    if (typeof node === "string") {
      node.split("\n").forEach((part, i) => {
        if (i > 0) {
          lines.push([]);
          col = 0;
        }
        if (cls && part) lines[lines.length - 1].push({ from: col, to: col + part.length, cls });
        col += part.length;
      });
      return;
    }
    if (Array.isArray(node)) {
      for (const child of node) walk(child, cls);
      return;
    }
    // Nested tokens take the innermost kind, the one that decides the color.
    const alias = node.alias === undefined ? [] : Array.isArray(node.alias) ? node.alias : [node.alias];
    walk(node.content, ["token", node.type, ...alias].join(" "));
  };
  // A grammar that fails must not take the rest of the memo's decorations down with it.
  try {
    walk(p.tokenize(code, grammar), null);
  } catch {
    return null;
  }
  return lines;
}
