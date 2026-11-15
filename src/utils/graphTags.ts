import { CachedMetadata, Debouncer, EmbedCache, LinkCache, TFile, TagCache, debounce, normalizePath } from "obsidian";
import { parseMemos } from "./memoParser";
import { extractTagsForHistory } from "./tagSuggest";
import { findBlockRanges } from "./blockSegmenter";
import { inlineTokens, normalizeTag, tagPattern } from "./patterns";
import { parseLinkToken } from "../editor/composerLink";
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
// persisted in integration.json is injected at startup without file reads; only
// mtime-changed notes are re-read to reconcile.
//
// Memo note links ride the same index into cache.links/embeds and are re-resolved, so the graph, backlinks and rename updates count them.

// Marker for injected entries so only our own can be removed idempotently, even with
// shared cache objects or persistence leftovers.
interface WrTagCache extends TagCache {
  wrGraph: true;
}

type WrRefCache = (LinkCache | EmbedCache) & { wrGraph: true };

// Notes re-read during one reconcile pass before the index is written out.
const RECONCILE_SAVE_INTERVAL = 200;

// Notes re-read during one reconcile pass before yielding to the event loop. Reconcile starts
// right after layout, so it has to share the main thread with the first paint.
const RECONCILE_YIELD_INTERVAL = 25;

// Notes injected from the index before yielding.
const INJECT_YIELD_INTERVAL = 100;

function yieldToEventLoop(): Promise<void> {
  return new Promise<void>((resolve) => window.setTimeout(resolve, 0));
}

// Key holding the last completed-scan timestamp in the persisted index. Obsidian forbids "#" in
// note names, so this can never collide with a real path. Readers that predate it unpack the
// number, get null and drop it; the value simply reads as "never scanned" when absent.
const SCANNED_AT_KEY = "#scannedAt";

// Index format. 2 added links; an index without it lacks the links of notes that held no tags,
// and its scan mark would skip those notes for good, so it is dropped and rebuilt once.
// 3 packs links per token; 2 still reads.
const VERSION_KEY = "#v";
const INDEX_VERSION = 3;
const READABLE_VERSIONS = new Set([2, 3]);

function isWrTag(t: TagCache): boolean {
  return (t as WrTagCache).wrGraph === true;
}

function isWrRef(r: LinkCache | EmbedCache): boolean {
  return (r as WrRefCache).wrGraph === true;
}

// One tag occurrence: tag keeps its # and is pre-exclusion; position is the real file
// coordinate. One record per occurrence (native cache granularity; search highlights each).
interface TagOccurrence {
  tag: string;
  line: number;
  col: number;
  offset: number;
}

// One note link in a memo: the whole token as written, at its real file coordinate.
interface LinkOccurrence {
  original: string;
  line: number;
  col: number;
  offset: number;
}

// One index entry. tags holds all occurrences pre-exclusion; the "exclude from
// integration" filter is applied at inject time so rule changes need no file re-read.
interface GraphTagIndexEntry {
  tags: TagOccurrence[];
  links: LinkOccurrence[];
  mtime: number;
}

// Persisted format: occurrences are packed per tag name to keep the file small
// (per-occurrence records could reach MBs long-term). Runtime uses TagOccurrence[];
// the conversion lives only in loadIndex / saveIndex.
interface PersistedEntry {
  m: number; // mtime
  t: Record<string, [number, number, number][]>; // "#tag" → [line, col, offset][]
  l?: Record<string, [number, number, number][]>; // token as written → [line, col, offset][]
}

function isPosition(p: unknown): p is [number, number, number] {
  return Array.isArray(p) && p.length === 3 && p.every((n) => typeof n === "number");
}

function packEntry(entry: GraphTagIndexEntry): PersistedEntry {
  const t: PersistedEntry["t"] = {};
  for (const occ of entry.tags) {
    (t[occ.tag] ??= []).push([occ.line, occ.col, occ.offset]);
  }
  const packed: PersistedEntry = { m: entry.mtime, t };
  if (entry.links.length > 0) {
    const l: NonNullable<PersistedEntry["l"]> = {};
    for (const o of entry.links) {
      (l[o.original] ??= []).push([o.line, o.col, o.offset]);
    }
    packed.l = l;
  }
  return packed;
}

// Malformed entries (incl. old formats) return null and are dropped; reconcile
// re-reads those notes and rebuilds them, so this is non-fatal.
function unpackEntry(v: unknown): GraphTagIndexEntry | null {
  if (typeof v !== "object" || v === null) return null;
  const e = v as { m?: unknown; t?: unknown; l?: unknown };
  if (typeof e.m !== "number" || typeof e.t !== "object" || e.t === null) return null;
  const tags: TagOccurrence[] = [];
  for (const [tag, positions] of Object.entries(e.t)) {
    if (!tag.startsWith("#") || !Array.isArray(positions)) return null;
    for (const p of positions as unknown[]) {
      if (!isPosition(p)) return null;
      tags.push({ tag, line: p[0], col: p[1], offset: p[2] });
    }
  }
  const links: LinkOccurrence[] = [];
  if (Array.isArray(e.l)) {
    for (const p of e.l as unknown[]) {
      if (!Array.isArray(p) || typeof p[0] !== "string" || !isPosition(p.slice(1))) return null;
      links.push({ original: p[0], line: p[1] as number, col: p[2] as number, offset: p[3] as number });
    }
  } else if (e.l !== undefined) {
    if (typeof e.l !== "object" || e.l === null) return null;
    for (const [original, positions] of Object.entries(e.l)) {
      if (!Array.isArray(positions)) return null;
      for (const p of positions as unknown[]) {
        if (!isPosition(p)) return null;
        links.push({ original, line: p[0], col: p[1], offset: p[2] });
      }
    }
    links.sort((a, b) => a.offset - b.offset);
  }
  return { tags, links, mtime: e.m };
}

function toRefCache(o: LinkOccurrence): WrRefCache | null {
  const parsed = parseLinkToken(o.original, 0);
  if (!parsed || parsed.external) return null;
  return {
    link: parsed.target,
    original: o.original,
    displayText: parsed.text,
    position: {
      start: { line: o.line, col: o.col, offset: o.offset },
      end: { line: o.line, col: o.col + o.original.length, offset: o.offset + o.original.length },
    },
    wrGraph: true,
  };
}

export class GraphTagInjector {
  // Note path → tag entry (persisted).
  private index = new Map<string, GraphTagIndexEntry>();
  // Paths with injected entries; the cleanup targets on unload.
  private trackedPaths = new Set<string>();
  // When the last reconcile that ran to completion started. A note with no index entry either
  // carries no memo tags or has never been looked at; this timestamp tells the two apart, so
  // notes untouched since that scan need no re-read. 0 means "never scanned".
  private scannedAt = 0;
  private requestRefresh: Debouncer<[], void>;
  private requestIndexSave: Debouncer<[], void>;
  // Set on unload so the reconcile loop stops re-injecting into a cache that was just cleaned.
  private stopped = false;

  constructor(private plugin: WrotPlugin) {
    this.requestRefresh = debounce(() => this.refresh(), 400, true);
    this.requestIndexSave = debounce(() => void this.saveIndex(), 2000, true);
  }

  // Single switch for graph display and tag: search — one cache injection covers both.
  get enabled(): boolean {
    return this.plugin.settings.graphTagsEnabled;
  }

  // Startup: inject from the persisted index without any file reads, then reconcile
  // in the background (only mtime-changed notes get re-read). Runs whatever the tag switch
  // says: links are always integrated.
  async start(): Promise<void> {
    this.stopped = false;
    await this.loadIndex();
    await this.injectFromIndex();
    if (this.stopped) return;
    this.refresh();
    await this.reconcile();
  }

  // Called on unload, before the cache cleanup. Without this the reconcile loop keeps running
  // after removeAll() and re-injects tags that then survive until Obsidian restarts.
  stop(): void {
    this.stopped = true;
    this.requestRefresh.cancel();
    this.requestIndexSave.cancel();
  }

  // Called when the tag integration toggle changes. The index already holds every tag
  // (the scan runs with the toggle off too, for links), so re-applying is enough.
  async applyEnabled(): Promise<void> {
    this.rebuild();
    return Promise.resolve();
  }

  private async injectFromIndex(): Promise<void> {
    const { vault, metadataCache } = this.plugin.app;
    const excluded = this.excludedTagSet();
    let sinceLastYield = 0;
    for (const [path, entry] of this.index) {
      if (this.stopped) return;
      if (++sinceLastYield >= INJECT_YIELD_INTERVAL) {
        sinceLastYield = 0;
        await yieldToEventLoop();
        if (this.stopped) return;
      }
      const file = vault.getAbstractFileByPath(path);
      if (!(file instanceof TFile)) {
        // Drop leftovers for notes deleted while the plugin was off.
        this.index.delete(path);
        this.requestIndexSave();
        continue;
      }
      const cache = metadataCache.getFileCache(file);
      if (!cache) continue;
      this.applyToCache(path, cache, entry, file, excluded);
    }
  }

  // Notes whose mtime matches the index are skipped; an unchanged startup reads zero files.
  private async reconcile(): Promise<void> {
    const { vault, metadataCache } = this.plugin.app;
    const excluded = this.excludedTagSet();
    // Taken before the walk, not after: a note written while the scan is running keeps an mtime
    // ahead of this, so the next startup still re-reads it.
    const scanStartedAt = Date.now();
    let tagsChanged = false;
    let sinceLastSave = 0;
    let sinceLastYield = 0;
    for (const file of vault.getMarkdownFiles()) {
      if (this.stopped) return;
      const entry = this.index.get(file.path);
      if (entry && entry.mtime === file.stat.mtime) continue;
      // No entry means an earlier scan found no memo tags here — worth re-reading only if the
      // note has been touched since. Without this, notes holding any code fence but no memo are
      // re-read on every single startup, because a tagless note leaves no entry behind.
      if (!entry && file.stat.mtime <= this.scannedAt) continue;
      const cache = metadataCache.getFileCache(file);
      if (!cache) continue;
      const mayHaveFence = cache.sections?.some((s) => s.type === "code") ?? false;
      const hasGhost = (cache.tags?.some(isWrTag) ?? false) || this.hasWrRefs(cache);
      if (!entry && !mayHaveFence && !hasGhost) continue;
      const content = await vault.cachedRead(file);
      if (this.stopped) return;
      const next = this.collectEntry(content, file.stat.mtime);
      if (this.updateIndexEntry(file.path, next)) tagsChanged = true;
      this.applyToCache(file.path, cache, next, file, excluded);
      // The debounced save resets its timer on every note, so a long first scan would persist
      // nothing until it finished. Flush periodically so an interrupted scan keeps its progress.
      sinceLastSave++;
      if (sinceLastSave >= RECONCILE_SAVE_INTERVAL) {
        sinceLastSave = 0;
        await this.saveIndex();
      } else {
        this.requestIndexSave();
      }
      sinceLastYield++;
      if (sinceLastYield >= RECONCILE_YIELD_INTERVAL) {
        sinceLastYield = 0;
        await yieldToEventLoop();
      }
    }
    // Only a pass that walked every note may move the mark; an interrupted one would otherwise
    // let the notes it never reached be skipped forever. The write is left to the debouncer so
    // a startup that changed nothing still keeps its file I/O off the critical path.
    this.scannedAt = scanStartedAt;
    this.requestIndexSave();
    if (tagsChanged) this.requestRefresh();
  }

  // For metadataCache "changed": the fresh cache and content are handed in, so the
  // incremental update needs no extra file read.
  onFileChanged(file: TFile, content: string, cache: CachedMetadata): void {
    const next = this.collectEntry(content, file.stat.mtime);
    const changed = this.updateIndexEntry(file.path, next);
    this.applyToCache(file.path, cache, next, file);
    this.requestIndexSave();
    if (changed) this.requestRefresh();
  }

  onFileDeleted(path: string): void {
    // The cache dies with the file; only tracking and the index need cleanup.
    this.trackedPaths.delete(path);
    if (this.index.delete(path)) {
      this.requestIndexSave();
      this.requestRefresh();
    }
  }

  onFileRenamed(newPath: string, oldPath: string): void {
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
  // so re-inject without re-reading files. Links are left as is.
  rebuild(): void {
    const { vault, metadataCache } = this.plugin.app;
    const excluded = this.excludedTagSet();
    for (const [path, entry] of this.index) {
      const file = vault.getAbstractFileByPath(path);
      if (!(file instanceof TFile)) continue;
      const cache = metadataCache.getFileCache(file);
      if (!cache) continue;
      this.applyToCache(path, cache, entry, file, excluded, false);
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
      if (!cache) continue;
      if (cache.tags) {
        const kept = cache.tags.filter((t) => !isWrTag(t));
        if (kept.length > 0) cache.tags = kept;
        else delete cache.tags;
      }
      if (this.stripRefs(cache)) this.resolve(path);
    }
    this.trackedPaths.clear();
    this.refresh();
  }

  // Apply injected entries to one note's cache (idempotent: previous injections are
  // stripped first). Exclusion rules apply here. When disabled, injects nothing so
  // only leftover removal takes effect.
  // `excludedTags` lets callers that loop over notes build the exclusion set once instead of
  // rebuilding it from settings for every note.
  private applyToCache(
    path: string,
    cache: CachedMetadata,
    entry: GraphTagIndexEntry,
    file: TFile,
    excludedTags?: Set<string>,
    withLinks = true
  ): void {
    const excluded = excludedTags ?? this.excludedTagSet();
    const tags = this.enabled
      ? entry.tags.filter((t) => !excluded.has(normalizeTag(t.tag)))
      : [];
    const kept = (cache.tags ?? []).filter((t) => !isWrTag(t));
    if (tags.length === 0) {
      if (kept.length !== (cache.tags?.length ?? 0)) {
        if (kept.length > 0) cache.tags = kept;
        else delete cache.tags;
      }
    } else {
      const injected: WrTagCache[] = tags.map((t) => ({
        tag: t.tag,
        position: {
          start: { line: t.line, col: t.col, offset: t.offset },
          end: { line: t.line, col: t.col + t.tag.length, offset: t.offset + t.tag.length },
        },
        wrGraph: true,
      }));
      cache.tags = [...kept, ...injected];
    }

    // Offsets read from an older version of the note would send a rename update to the
    // wrong text, so links wait for reconcile (or the next change) to read it afresh.
    if (withLinks) {
      const refs = entry.mtime === file.stat.mtime
        ? entry.links.map(toRefCache).filter((r): r is WrRefCache => r !== null)
        : [];
      const hadRefs = this.stripRefs(cache);
      if (refs.length > 0) {
        const links = refs.filter((r) => !r.original.startsWith("!"));
        const embeds = refs.filter((r) => r.original.startsWith("!"));
        if (links.length > 0) cache.links = [...(cache.links ?? []), ...links];
        if (embeds.length > 0) cache.embeds = [...(cache.embeds ?? []), ...embeds];
      }
      if (hadRefs || refs.length > 0) this.resolve(path);
    }

    if (tags.length > 0 || this.hasWrRefs(cache)) this.trackedPaths.add(path);
    else this.trackedPaths.delete(path);
  }

  private hasWrRefs(cache: CachedMetadata): boolean {
    return (cache.links?.some(isWrRef) ?? false) || (cache.embeds?.some(isWrRef) ?? false);
  }

  // Removes injected links from a cache; true if there were any.
  private stripRefs(cache: CachedMetadata): boolean {
    if (!this.hasWrRefs(cache)) return false;
    const links = (cache.links ?? []).filter((r) => !isWrRef(r));
    const embeds = (cache.embeds ?? []).filter((r) => !isWrRef(r));
    if (links.length > 0) cache.links = links;
    else delete cache.links;
    if (embeds.length > 0) cache.embeds = embeds;
    else delete cache.embeds;
    return true;
  }

  // Obsidian's own resolver (not public API) recounts the links from the cache, injected ones included.
  private resolve(path: string): void {
    const cache = this.plugin.app.metadataCache as unknown as { resolveLinks?: (path: string) => void };
    if (typeof cache.resolveLinks === "function") cache.resolveLinks(path);
  }

  // Update the index and return whether the set of tags or links changed (position/mtime-only
  // updates return false — the graph only needs redrawing when they come or go).
  private updateIndexEntry(path: string, next: GraphTagIndexEntry): boolean {
    const prev = this.index.get(path);
    const names = (e: GraphTagIndexEntry | undefined) =>
      [...(e?.tags ?? []).map((t) => t.tag), ...(e?.links ?? []).map((l) => l.original)].sort().join("\n");
    const changed = names(prev) !== names(next);
    if (next.tags.length === 0 && next.links.length === 0) {
      this.index.delete(path);
    } else {
      this.index.set(path, next);
    }
    return changed;
  }

  private collectEntry(content: string, mtime: number): GraphTagIndexEntry {
    return { tags: this.collectTagEntries(content), links: this.collectLinkEntries(content), mtime };
  }

  // Display token rules: links in inline code, math or a code block are not links.
  private collectLinkEntries(content: string): LinkOccurrence[] {
    if (!content.includes("```wr")) return [];
    const lines = content.split("\n");
    const lineOffsets: number[] = new Array<number>(lines.length);
    let acc = 0;
    for (let i = 0; i < lines.length; i++) {
      lineOffsets[i] = acc;
      acc += lines[i].length + 1;
    }
    const out: LinkOccurrence[] = [];
    for (const memo of parseMemos(content)) {
      const bodyFrom = memo.lineStart + 1;
      const bodyTo = Math.min(memo.lineEnd - 1, lines.length - 1);
      if (bodyTo < bodyFrom) continue;
      const body = lines.slice(bodyFrom, bodyTo + 1);
      const blocked = new Set<number>();
      // A CRLF note leaves "\r" on each line, which would hide a fence from the block parser.
      for (const b of findBlockRanges(body.map((l) => l.replace(/\r$/, "")))) {
        for (let i = b.startLine; i <= b.endLine; i++) blocked.add(i);
      }
      body.forEach((text, i) => {
        if (blocked.has(i) || !text.includes("[[")) return;
        const line = bodyFrom + i;
        for (const { token, index: col } of inlineTokens(text)) {
          const link = parseLinkToken(token, col);
          if (!link || link.external) continue;
          out.push({ original: token, line, col, offset: lineOffsets[line] + col });
        }
      });
    }
    return out;
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
        const re = tagPattern();
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

  // Index persistence: same conventions as tags.json (plugin dir, failures ignored).
  private indexPath(name = "integration.json"): string | null {
    const dir = this.plugin.manifest.dir;
    return dir ? normalizePath(`${dir}/${name}`) : null;
  }

  private async loadIndex(): Promise<void> {
    const path = this.indexPath();
    if (!path) return;
    const { adapter } = this.plugin.app.vault;
    try {
      // Earlier name.
      const legacy = this.indexPath("tag-integration.json");
      if (legacy && !(await adapter.exists(path)) && (await adapter.exists(legacy))) {
        await adapter.rename(legacy, path);
      }
      if (!(await adapter.exists(path))) return;
      const parsed: unknown = JSON.parse(await this.plugin.app.vault.adapter.read(path));
      if (typeof parsed !== "object" || parsed === null) return;
      if (!READABLE_VERSIONS.has((parsed as Record<string, unknown>)[VERSION_KEY] as number)) return;
      for (const [notePath, raw] of Object.entries(parsed)) {
        if (notePath === VERSION_KEY) continue;
        if (notePath === SCANNED_AT_KEY) {
          if (typeof raw === "number") this.scannedAt = raw;
          continue;
        }
        const entry = unpackEntry(raw);
        if (entry) this.index.set(notePath, entry);
      }
    } catch {
      // Unreadable index: restart empty; reconcile re-reads and rebuilds it.
      this.index.clear();
      this.scannedAt = 0;
    }
  }

  private async saveIndex(): Promise<void> {
    const path = this.indexPath();
    if (!path) return;
    try {
      const packed: Record<string, PersistedEntry | number> = { [VERSION_KEY]: INDEX_VERSION };
      if (this.scannedAt > 0) packed[SCANNED_AT_KEY] = this.scannedAt;
      for (const [notePath, entry] of this.index) {
        packed[notePath] = packEntry(entry);
      }
      await this.plugin.app.vault.adapter.write(path, JSON.stringify(packed));
    } catch {
      // Save failures are non-fatal; reconcile fills the gap next startup.
    }
  }
}
