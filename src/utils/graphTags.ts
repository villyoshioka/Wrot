import { CachedMetadata, TFile, TagCache, debounce, normalizePath } from "obsidian";
import { parseMemos } from "./memoParser";
import { extractTagsForHistory } from "./tagSuggest";
import type WrotPlugin from "../main";

// メタデータキャッシュへ実行時にタグを書き足し、Wrotメモのタグを Obsidian 本体へ
// 統合する。ファイル(ノート)には一切書き込まない。
// 純正のグラフビューはこのキャッシュからタグノードを描き、純正検索の tag: 演算子も
// 同じキャッシュを突き合わせるため、注入ひとつで「グラフ表示」と「タグとして検索」の
// 両方が成立する(実機確認済み)。
// 注入エントリの位置情報には、タグが実際に書かれているファイル内の実座標を入れること。
// 幅ゼロのダミー位置だと、検索の判定はマッチを返しても結果表示の段階で実体のない
// マッチとして捨てられ、ヒットなしに見える(実機確認済み)。
// キャッシュの構造(CachedMetadata.tags / Events.trigger)は公開型の範囲で扱うが、
// 「書き足したエントリをグラフや検索が拾う」こと自体は非公式な挙動なので、
// 壊れた場合は「タグが表示されない/検索に載らないだけ」に収まる設計を守ること。
//
// パフォーマンス方針: vault全体を舐めるのは避ける(Thino型の比例コストを持ち込まない)。
// ノート→タグの対応表を tag-integration.json に永続化し、起動時はファイルを読まずに
// 対応表から即注入する。答え合わせは mtime 比較だけで済ませ、実際に本文を
// 読み直すのは「前回から変わったノート」だけに絞る。

// 注入エントリの目印。キャッシュオブジェクトの共有や永続化残留があっても、
// 自分が入れた分だけを冪等に除去できるようにする
interface WrTagCache extends TagCache {
  wrGraph: true;
}

function isWrTag(t: TagCache): boolean {
  return (t as WrTagCache).wrGraph === true;
}

function normalizeTag(tag: string): string {
  return tag.replace(/^#/, "").toLowerCase().trim();
}

// タグ1出現分。tag は #付き・除外フィルタ前の生タグ、位置はファイル内の実座標。
// 同じタグ名でも出現ごとに1件持つ(純正のタグキャッシュと同じ粒度。
// 検索結果のハイライトが出現ごとに出る)
interface TagOccurrence {
  tag: string;
  line: number;
  col: number;
  offset: number;
}

// 対応表の1件。tags は除外フィルタ前の全出現を持ち、
// 「本体統合から除外」の除外は注入時に都度適用する
// (ルール変更時にファイルを読み直さなくて済むようにするため)
interface GraphTagIndexEntry {
  tags: TagOccurrence[];
  mtime: number;
}

// 永続化形式。出現ごとに1レコードを律儀に書くとファイルが肥大するため
// (ヘビーな使い方の長期運用でMB級になる試算)、ディスク上ではタグ名ごとに
// 出現位置 [line, col, offset] の配列へ畳む。実行時は扱いやすい
// TagOccurrence[] に展開し、この変換は loadIndex / saveIndex に閉じ込める
interface PersistedEntry {
  m: number; // mtime
  t: Record<string, [number, number, number][]>; // "#タグ" → [line, col, offset][]
}

function packEntry(entry: GraphTagIndexEntry): PersistedEntry {
  const t: PersistedEntry["t"] = {};
  for (const occ of entry.tags) {
    (t[occ.tag] ??= []).push([occ.line, occ.col, occ.offset]);
  }
  return { m: entry.mtime, t };
}

// 形が合わないエントリ(旧形式含む)は null を返して捨てる。
// 捨てられたノートは reconcile が読み直して作り直すため致命的でない
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
  // ノートパス → タグ対応表(永続化対象)
  private index = new Map<string, GraphTagIndexEntry>();
  // 注入済みノートのパス。unload時のクリーンアップ対象を覚えておく
  private trackedPaths = new Set<string>();
  private requestRefresh: () => void;
  private requestIndexSave: () => void;

  constructor(private plugin: WrotPlugin) {
    this.requestRefresh = debounce(() => this.refresh(), 400, true);
    this.requestIndexSave = debounce(() => void this.saveIndex(), 2000, true);
  }

  // 本体統合(グラフ表示・タグとして検索)のスイッチ。
  // どちらも同じキャッシュ注入ひとつで成立するため、軸は分かれない
  get enabled(): boolean {
    return this.plugin.settings.graphTagsEnabled;
  }

  // 起動フロー:
  // 1) 対応表を読み、ファイルを一切読まずに即注入してグラフ・検索に反映
  // 2) 裏で mtime を突き合わせ、前回から変わったノートだけ本文を読み直して答え合わせ
  async start(): Promise<void> {
    if (!this.enabled) return;
    await this.loadIndex();
    this.injectFromIndex();
    this.refresh();
    await this.reconcile();
  }

  // 統合ON/OFFの変更時に呼ぶ。注入状態を新しい設定へ合わせ直す
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
        // プラグイン停止中に消えたノートの残骸は対応表から落とす
        this.index.delete(path);
        this.requestIndexSave();
        continue;
      }
      const cache = metadataCache.getFileCache(file);
      if (!cache) continue;
      this.applyToCache(path, cache, entry.tags);
    }
  }

  // mtime が対応表と一致するノートはスキップ。読み直すのは変わった分だけなので、
  // 何も変わっていない起動ではファイル読み込みゼロで終わる
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

  // metadataCache "changed" 用。再パース直後の生きたキャッシュと本文が渡ってくるので
  // 追加のファイル読みなしで増分更新できる
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
    // キャッシュはファイルと一緒に消えるので追跡と対応表だけ整理する
    this.trackedPaths.delete(path);
    if (this.index.delete(path)) {
      this.requestIndexSave();
      this.requestRefresh();
    }
  }

  onFileRenamed(newPath: string, oldPath: string): void {
    if (!this.enabled) return;
    // 注入エントリはキャッシュオブジェクトごとファイルに追従するため、キーの付け替えだけでよい
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

  // タグルールの「本体統合から除外」変更時に呼ぶ。
  // 対応表には生タグを持っているので、ファイルを読み直さず注入だけやり直す
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

  // unload時: 注入エントリを全除去して素の状態へ戻す(対応表ファイルは次回起動用に残す)
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

  // 単一ノートのキャッシュへ注入エントリを反映する(冪等: 既存の注入分を外してから入れ直す)。
  // 「本体統合から除外」の除外はここで適用する。
  // 統合が無効のときは注入対象を空にし、既存の注入痕の除去だけが働く
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

  // 対応表を更新し、タグの顔ぶれが前回から変わったかを返す(位置や mtime だけの
  // 更新は false。グラフの再描画はタグの増減時だけで足りる)
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

  // メモ本文からタグを全出現分、位置つきで集める(生タグ・除外フィルタ前)。
  // どのタグを載せるかは表示と同じトークン規則(extractTagsForHistory)に一本化する:
  // 引用カード(> ![[...]])・内部リンク・インラインコード・URL などの内側にある # は
  // 画面上タグとして扱われないため、グラフにも検索にも載せない。
  // 位置はメモ本文の行を直接走査して求める。行頭または空白直後の #トークンだけを
  // 拾うことで、URLフラグメントやリンク内アンカー等への誤ヒットを避ける
  private collectTagEntries(content: string): TagOccurrence[] {
    if (!content.includes("```wr")) return [];
    const lines = content.split("\n");
    // 各行のファイル先頭からのオフセット(+1 は改行文字の分)
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
      // lineStart/lineEnd は開始・終了フェンスの行。本文はその間
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
      // 表示規則ではタグ扱いなのに行走査で位置が取れなかったもの(#a#b の後続など)は、
      // 最初の出現箇所を素朴に探して最低1件は注入する(グラフから欠けさせないため)
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

  // ルールで「本体統合から除外」されたタグの集合。注入対象から外れることで、
  // グラフにも純正のタグ検索にも載らなくなる。
  // 除外はタグルール機能が有効なときだけ効かせる(色ルールと同じ発動条件に揃える)
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

  // このタグがルールで本体統合から除外されているか(タイムラインの検索形式判定にも使う)
  isExcludedTag(tag: string): boolean {
    return this.excludedTagSet().has(normalizeTag(tag));
  }

  // グラフビューへ再描画を促す。"resolved" はリンク解決完了の通知イベントで、
  // グラフはこれを受けてデータを組み直す
  private refresh(): void {
    this.plugin.app.metadataCache.trigger("resolved");
  }

  // タグクリック時に開く検索クエリ。注入済みタグは純正のタグ検索がそのまま拾うため、
  // 素の tag: クエリ1本でよい。本体側のタグ(プロパティ含む)もWrotのメモも同じ
  // タグ検索でヒットし、検索欄にも純正と同じ見た目のクエリが入る。
  // タイムラインのタグクリック(WrotView.openSearch)がここを通して検索体験を揃える
  buildTagSearchQuery(tag: string): string {
    return `tag:#${tag.replace(/^#/, "")}`;
  }

  // ── 対応表の永続化(tags.json と同じ流儀: プラグインフォルダ直下・失敗は無視) ──

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
      // 読めない場合は空から再スタート(reconcileが読み直して作り直すため致命的でない)
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
      // 保存失敗は致命的でないため無視する(次回起動時にreconcileが差分を埋め直す)
    }
  }
}
