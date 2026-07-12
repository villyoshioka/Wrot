import { CachedMetadata, TFile, TagCache, debounce, normalizePath } from "obsidian";
import { parseMemos } from "./memoParser";
import { extractTagsForHistory } from "./tagSuggest";
import type WrotPlugin from "../main";

// Injects tags into the metadata cache at runtime (never writes to note files) so the
// native graph view and native tag: search both pick up Wrot memo tags from one
// injection (verified in app).
// Injected positions must be the tag's real file coordinates: zero-width dummies match
// in search but are discarded when results render, showing no hits (verified in app).
// The cache shape (CachedMetadata.tags / Events.trigger) is public API, but graph/search
// picking up injected entries is unofficial behavior — keep the failure mode limited to
// "tags just don't show / aren't searchable".
// Perf: never scan the whole vault (no Thino-style proportional cost). A note→tags index
// persisted in tag-integration.json is injected at startup without file reads; only
// mtime-changed notes are re-read to reconcile.

// Marker for injected entries so only our own can be removed idempotently, even with
// shared cache objects or persistence leftovers.
interface WrTagCache extends TagCache {
  wrGraph: true;
}

function isWrTag(t: TagCache): boolean {
  return (t as WrTagCache).wrGraph === true;
}

function normalizeTag(tag: string): string {
  return tag.replace(/^#/, "").toLowerCase().trim();
}

// One tag occurrence: tag keeps its # and is pre-exclusion; position is the real file
// coordinate. One record per occurrence (native cache granularity; search highlights each).
interface TagOccurrence {
  tag: string;
  line: number;
  col: number;
  offset: number;
}

// One index entry. tags holds all occurrences pre-exclusion; the "exclude from
// integration" filter is applied at inject time so rule changes need no file re-read.
interface GraphTagIndexEntry {
  tags: TagOccurrence[];
  mtime: number;
}

// Persisted format: occurrences are packed per tag name to keep the file small
// (per-occurrence records could reach MBs long-term). Runtime uses TagOccurrence[];
// the conversion lives only in loadIndex / saveIndex.
interface PersistedEntry {
  m: number; // mtime
  t: Record<string, [number, number, number][]>; // "#tag" → [line, col, offset][]
}

function packEntry(entry: GraphTagIndexEntry): PersistedEntry {
  const t: PersistedEntry["t"] = {};
  for (const occ of entry.tags) {
    (t[occ.tag] ??= []).push([occ.line, occ.col, occ.offset]);
  }
  return { m: entry.mtime, t };
}

// Malformed entries (incl. old formats) return null and are dropped; reconcile
// re-reads those notes and rebuilds them, so this is non-fatal.
function unpackEntry(v: unknown): GraphTagIndexEntry | null {
  if (typeof v !== "object" || v === null) return null;
  const e = v as { m?: unknown; t?: unknown };
  if (typeof e.m !== "number" || typeof e.t !== "object" || e.t === null) return null;
  const tags: TagOccurrence[] = [];
  for (const [tag, positions] of Object.entries(e.t)) {
    if (!tag.startsWith("#") || !Array.isArray(positions)) return null;
    for (const p of positions) {
      if (!Array.isArray(p) || p.length !== 3 || p.some((n) => typeof n !== "number")) {
        return null;
      }
      tags.push({ tag, line: p[0] as number, col: p[1] as number, offset: p[2] as number });
    }
  }
  return { tags, mtime: e.m };
}

export class GraphTagInjector {
  // Note path → tag entry (persisted).
  private index = new Map<string, GraphTagIndexEntry>();
  // Paths with injected entries; the cleanup targets on unload.
  private trackedPaths = new Set<string>();
  private requestRefresh: () => void;
  private requestIndexSave: () => void;

  constructor(private plugin: WrotPlugin) {
    this.requestRefresh = debounce(() => this.refresh(), 400, true);
    this.requestIndexSave = debounce(() => void this.saveIndex(), 2000, true);
  }

  // Single switch for graph display and tag: search — one cache injection covers both.
  get enabled(): boolean {
    return this.plugin.settings.graphTagsEnabled;
  }

  // Startup: inject from the persisted index without any file reads, then reconcile
  // in the background (only mtime-changed notes get re-read).
  async start(): Promise<void> {
    if (!this.enabled) return;
    await this.loadIndex();
    this.injectFromIndex();
    this.refresh();
    await this.reconcile();
  }

  // Called when the integration toggle changes; realigns injection state.
  async applyEnabled(): Promise<void> {
    if (!this.enabled) {
      this.removeAll();
      return;
    }
    if (this.index.size === 0) {
      await this.start();
    } else {
      this.rebuild();
    }
  }

  private injectFromIndex(): void {
    const { vault, metadataCache } = this.plugin.app;
    for (const [path, entry] of this.index) {
      const file = vault.getAbstractFileByPath(path);
      if (!(file instanceof TFile)) {
        // Drop leftovers for notes deleted while the plugin was off.
        this.index.delete(path);
        this.requestIndexSave();
        continue;
      }
      const cache = metadataCache.getFileCache(file);
      if (!cache) continue;
      this.applyToCache(path, cache, entry.tags);
    }
  }

  // Notes whose mtime matches the index are skipped; an unchanged startup reads zero files.
  private async reconcile(): Promise<void> {
    const { vault, metadataCache } = this.plugin.app;
    let tagsChanged = false;
    for (const file of vault.getMarkdownFiles()) {
      const entry = this.index.get(file.path);
      if (entry && entry.mtime === file.stat.mtime) continue;
      const cache = metadataCache.getFileCache(file);
      if (!cache) continue;
      const mayHaveFence = cache.sections?.some((s) => s.type === "code") ?? false;
      const hasGhost = cache.tags?.some(isWrTag) ?? false;
      if (!entry && !mayHaveFence && !hasGhost) continue;
      const content = await vault.cachedRead(file);
      const tags = this.collectTagEntries(content);
      if (this.updateIndexEntry(file.path, tags, file.stat.mtime)) tagsChanged = true;
      this.applyToCache(file.path, cache, tags);
      this.requestIndexSave();
    }
    if (tagsChanged) this.requestRefresh();
  }

  // For metadataCache "changed": the fresh cache and content are handed in, so the
  // incremental update needs no extra file read.
  onFileChanged(file: TFile, content: string, cache: CachedMetadata): void {
    if (!this.enabled) return;
    const tags = this.collectTagEntries(content);
    const changed = this.updateIndexEntry(file.path, tags, file.stat.mtime);
    this.applyToCache(file.path, cache, tags);
    this.requestIndexSave();
    if (changed) this.requestRefresh();
  }

  onFileDeleted(path: string): void {
    if (!this.enabled) return;
    // The cache dies with the file; only tracking and the index need cleanup.
    this.trackedPaths.delete(path);
    if (this.index.delete(path)) {
      this.requestIndexSave();
      this.requestRefresh();
    }
  }

  onFileRenamed(newPath: string, oldPath: string): void {
    if (!this.enabled) return;
    // Injected entries follow the cache object across the rename; only keys need re-mapping.
    if (this.trackedPaths.delete(oldPath)) {
      this.trackedPaths.add(newPath);
    }
    const entry = this.index.get(oldPath);
    if (entry) {
      this.index.delete(oldPath);
      this.index.set(newPath, entry);
      this.requestIndexSave();
    }
  }

  // Called when "exclude from integration" rules change. The index holds raw tags,
  // so re-inject without re-reading files.
  rebuild(): void {
    if (!this.enabled) return;
    const { vault, metadataCache } = this.plugin.app;
    for (const [path, entry] of this.index) {
      const file = vault.getAbstractFileByPath(path);
      if (!(file instanceof TFile)) continue;
      const cache = metadataCache.getFileCache(file);
      if (!cache) continue;
      this.applyToCache(path, cache, entry.tags);
    }
    this.requestRefresh();
  }

  // Unload: strip all injected entries (the index file stays for next startup).
  removeAll(): void {
    const { vault, metadataCache } = this.plugin.app;
    for (const path of this.trackedPaths) {
      const file = vault.getAbstractFileByPath(path);
      if (!(file instanceof TFile)) continue;
      const cache = metadataCache.getFileCache(file);
      if (!cache?.tags) continue;
      const kept = cache.tags.filter((t) => !isWrTag(t));
      if (kept.length > 0) cache.tags = kept;
      else delete cache.tags;
    }
    this.trackedPaths.clear();
    this.refresh();
  }

  // Apply injected entries to one note's cache (idempotent: previous injections are
  // stripped first). Exclusion rules apply here. When disabled, injects nothing so
  // only leftover removal takes effect.
  private applyToCache(path: string, cache: CachedMetadata, occurrences: TagOccurrence[]): void {
    const excluded = this.excludedTagSet();
    const tags = this.enabled
      ? occurrences.filter((t) => !excluded.has(normalizeTag(t.tag)))
      : [];
    const kept = (cache.tags ?? []).filter((t) => !isWrTag(t));
    if (tags.length === 0) {
      if (kept.length !== (cache.tags?.length ?? 0)) {
        if (kept.length > 0) cache.tags = kept;
        else delete cache.tags;
      }
      this.trackedPaths.delete(path);
      return;
    }
    const injected: WrTagCache[] = tags.map((t) => ({
      tag: t.tag,
      position: {
        start: { line: t.line, col: t.col, offset: t.offset },
        end: { line: t.line, col: t.col + t.tag.length, offset: t.offset + t.tag.length },
      },
      wrGraph: true,
    }));
    cache.tags = [...kept, ...injected];
    this.trackedPaths.add(path);
  }

  // Update the index and return whether the set of tag names changed (position/mtime-only
  // updates return false — the graph only needs redrawing when tags come or go).
  private updateIndexEntry(path: string, tags: TagOccurrence[], mtime: number): boolean {
    const prev = this.index.get(path);
    const names = (list: TagOccurrence[]) => list.map((t) => t.tag).sort().join("\n");
    const changed = names(prev?.tags ?? []) !== names(tags);
    if (tags.length === 0) {
      this.index.delete(path);
    } else {
      this.index.set(path, { tags, mtime });
    }
    return changed;
  }

  // Collect every tag occurrence with positions (raw, pre-exclusion). What counts as a
  // tag follows the display token rules (extractTagsForHistory): # inside quote cards,
  // links, inline code, URLs, etc. is not a tag on screen, so not in graph/search either.
  // Positions come from a line scan; only # at line start or after whitespace counts,
  // avoiding URL fragments and in-link anchors.
  private collectTagEntries(content: string): TagOccurrence[] {
    if (!content.includes("```wr")) return [];
    const lines = content.split("\n");
    // Offset of each line from file start (+1 for the newline).
    const lineOffsets: number[] = new Array<number>(lines.length);
    let acc = 0;
    for (let i = 0; i < lines.length; i++) {
      lineOffsets[i] = acc;
      acc += lines[i].length + 1;
    }
    const out: TagOccurrence[] = [];
    for (const memo of parseMemos(content)) {
      const names = new Set(extractTagsForHistory(memo.content));
      if (names.size === 0) continue;
      const found = new Set<string>();
      // lineStart/lineEnd are the fence lines; the body sits between them.
      const bodyFrom = memo.lineStart + 1;
      const bodyTo = Math.min(memo.lineEnd - 1, lines.length - 1);
      for (let line = bodyFrom; line <= bodyTo; line++) {
        const text = lines[line];
        const re = /#[^\s#]+/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(text)) !== null) {
          if (m.index > 0 && !/\s/.test(text[m.index - 1])) continue;
          const name = m[0].slice(1);
          if (!names.has(name)) continue;
          found.add(name);
          out.push({
            tag: m[0],
            line,
            col: m.index,
            offset: lineOffsets[line] + m.index,
          });
        }
      }
      // Tags valid by display rules but missed by the line scan (e.g. the tail of #a#b)
      // get at least one occurrence injected so they don't vanish from the graph.
      for (const name of names) {
        if (found.has(name)) continue;
        for (let line = bodyFrom; line <= bodyTo; line++) {
          const idx = lines[line].indexOf(`#${name}`);
          if (idx < 0) continue;
          out.push({ tag: `#${name}`, line, col: idx, offset: lineOffsets[line] + idx });
          break;
        }
      }
    }
    return out;
  }

  // Tags excluded from integration by rules (kept off the graph and native tag search).
  // Only active while tag rules are enabled — same gate as color rules.
  private excludedTagSet(): Set<string> {
    const excluded = new Set<string>();
    if (!this.plugin.settings.tagColorRulesEnabled) return excluded;
    for (const rule of this.plugin.settings.tagColorRules ?? []) {
      if (!rule.noIntegration) continue;
      const norm = normalizeTag(rule.tag);
      if (norm) excluded.add(norm);
    }
    return excluded;
  }

  // Whether a rule excludes this tag from integration (also drives the timeline's search form).
  isExcludedTag(tag: string): boolean {
    return this.excludedTagSet().has(normalizeTag(tag));
  }

  // Nudge the graph view to redraw: "resolved" is the link-resolution-complete event
  // the graph rebuilds its data on.
  private refresh(): void {
    this.plugin.app.metadataCache.trigger("resolved");
  }

  // Search query for tag clicks. Injected tags are matched by native tag search, so a
  // plain tag: query hits native tags (incl. properties) and Wrot memos alike, and
  // looks native in the search bar. Timeline tag clicks (WrotView.openSearch) route here.
  buildTagSearchQuery(tag: string): string {
    return `tag:#${tag.replace(/^#/, "")}`;
  }

  // ── Index persistence (same conventions as tags.json: plugin dir, failures ignored) ──

  private indexPath(): string | null {
    const dir = this.plugin.manifest.dir;
    return dir ? normalizePath(`${dir}/tag-integration.json`) : null;
  }

  private async loadIndex(): Promise<void> {
    const path = this.indexPath();
    if (!path) return;
    try {
      if (!(await this.plugin.app.vault.adapter.exists(path))) return;
      const parsed: unknown = JSON.parse(await this.plugin.app.vault.adapter.read(path));
      if (typeof parsed !== "object" || parsed === null) return;
      for (const [notePath, raw] of Object.entries(parsed)) {
        const entry = unpackEntry(raw);
        if (entry) this.index.set(notePath, entry);
      }
    } catch {
      // Unreadable index: restart empty; reconcile re-reads and rebuilds it.
      this.index.clear();
    }
  }

  private async saveIndex(): Promise<void> {
    const path = this.indexPath();
    if (!path) return;
    try {
      const packed: Record<string, PersistedEntry> = {};
      for (const [notePath, entry] of this.index) {
        packed[notePath] = packEntry(entry);
      }
      await this.plugin.app.vault.adapter.write(path, JSON.stringify(packed));
    } catch {
      // Save failures are non-fatal; reconcile fills the gap next startup.
    }
  }
}
