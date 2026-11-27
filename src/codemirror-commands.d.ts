// Obsidian ships @codemirror/commands at runtime, so it is not a dependency; only what the composer uses is declared.
declare module "@codemirror/commands" {
  import type { AnnotationType, Extension } from "@codemirror/state";
  import type { Command, KeyBinding } from "@codemirror/view";
  export function history(): Extension;
  export const historyKeymap: readonly KeyBinding[];
  export const standardKeymap: readonly KeyBinding[];
  export const insertNewline: Command;
  export const isolateHistory: AnnotationType<"before" | "after" | "full">;
}
