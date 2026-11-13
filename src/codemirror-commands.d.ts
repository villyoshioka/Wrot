// Obsidian supplies @codemirror/commands at runtime (it is external in the build), but the
// package is not a dependency here: its version has to be whatever Obsidian ships. Only the
// pieces the composer uses are declared.
declare module "@codemirror/commands" {
  import type { AnnotationType, Extension } from "@codemirror/state";
  import type { Command, KeyBinding } from "@codemirror/view";
  export function history(): Extension;
  export const historyKeymap: readonly KeyBinding[];
  export const standardKeymap: readonly KeyBinding[];
  export const insertNewline: Command;
  export const isolateHistory: AnnotationType<"before" | "after" | "full">;
}
