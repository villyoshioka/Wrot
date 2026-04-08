# Wrot

[![release](https://img.shields.io/github/release/villyoshioka/Wrot.svg)](https://github.com/villyoshioka/Wrot/releases/latest)
![downloads](https://img.shields.io/github/downloads/villyoshioka/Wrot/total)

[Obsidian](https://obsidian.md/) 用のツイート風デイリーメモプラグイン。カードベースのUIで日々のメモを素早く記録・閲覧できます。

- SNSやチャットツールのようなUI
- 記録先はデイリーノート

> **Note**
> 本プラグインは [Obsidian Memos](https://github.com/Quorafind/Obsidian-Memos) (現: [Thino](https://github.com/Quorafind/Obsidian-Thino)) および [Mobile First Daily Interface (MFDI)](https://github.com/tadashi-aikawa/mobile-first-daily-interface) の影響を強く受けています。そのため、[コミュニティプラグイン](https://help.obsidian.md/Advanced+topics/Community+plugins)には登録しません。

> **Warning**
> このプラグインについて、コードは公開していますが、サポートは行っていません。

> **Important**
> 本プラグインはデイリーノートにメモを保存します。**Obsidianのコアプラグイン「デイリーノート」を有効にしてください。**

## 機能

- **タイムラインビュー** - サイドバーにメモ一覧をカード形式で表示
- **テキスト書式** - 太字、斜体、取り消し線、ハイライト、インラインコード、数式（$...$）
- **リスト** - 箇条書き、番号付きリスト、チェックリスト
- **引用** - ブロック引用（> ）
- **タグ** - #タグ でメモを分類、クリックで検索
- **リンク/埋め込み** - 内部リンク（![[]]）、外部URL、obsidian:// URL
- **URLプレビュー** - OGPカード、埋め込み、画像プレビュー
- **ライブプレビュー対応** - エディタ上でリッチ表示
- **カスタマイズ** - 背景色・文字色の変更、投稿ボタンテキストの変更

## 対応プラットフォーム

[Obsidian](https://obsidian.md/) がサポートする全てのプラットフォームに対応しています。

- Windows (動作未確認)
- macOS
- Linux (動作未確認)
- Android (動作未確認)
- iOS / iPadOS

## インストール

### BRAT経由（推奨）

1. [BRAT](https://github.com/TfTHacker/obsidian42-brat) プラグインをインストール
2. BRATの設定で「Add Beta Plugin」を選択
3. `villyoshioka/Wrot` を入力して追加

### 手動インストール

1. [Releases](https://github.com/villyoshioka/Wrot/releases) から最新リリースの `main.js`、`manifest.json`、`styles.css` をダウンロード
2. Vault の `.obsidian/plugins/wrot/` フォルダに配置
3. Obsidianの設定でプラグインを有効化

## 起動方法

サイドバーの羽アイコンをクリック、またはコマンドパレットから「Open Wrot」を実行してください。

デフォルトでは右サイドバーに開かれます。

## 使い方

1. テキストエリアにメモを入力して投稿ボタンを押す（Ctrl/Cmd+Enter でも投稿可能）
2. メモはデイリーノートに ` ```wr ` コードブロックとして保存されます
3. 日付を切り替えて過去のメモも閲覧できます

## 設定

| 設定項目                | デフォルト          | 説明                                       |
| ----------------------- | ------------------- | ------------------------------------------ |
| ビューの配置            | 右サイドバー        | 左サイドバー / 右サイドバー / メインエリア |
| タイムスタンプ形式      | YYYY/MM/DD HH:mm:ss | moment.js 形式で指定                       |
| 背景色（ライト/ダーク） | #f0efeb / #303030   | ライト・ダークモード別                     |
| 文字色（ライト/ダーク） | #454545 / #dcddde   | ライト・ダークモード別                     |
| 投稿ボタンテキスト      | 投稿                | ボタンの表示テキスト                       |
| URLプレビュー           | ON                  | OGP取得のON/OFF                            |
| チェック済み取り消し線  | OFF                 | チェックボックスON時の取り消し線           |

## FAQ

### 投稿を編集/削除したい場合は？

デイリーノートを直接編集してください。メモは ` ```wr ` コードブロックとして保存されています。

### デイリーノートが作成されない

Obsidianのコアプラグイン「デイリーノート」が有効になっているか確認してください。

## 謝辞

本プラグインは以下のプロジェクトから多大な影響を受けています。開発者の方々に感謝いたします。

- [Obsidian Memos](https://github.com/Quorafind/Obsidian-Memos) (現: [Thino](https://github.com/Quorafind/Obsidian-Thino)) by Quorafind
- [Mobile First Daily Interface (MFDI)](https://github.com/tadashi-aikawa/mobile-first-daily-interface) by tadashi-aikawa
