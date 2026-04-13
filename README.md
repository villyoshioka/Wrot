# Wrot

**Obsidian で、つぶやくように日々を記録するプラグイン。**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![release](https://img.shields.io/github/release/villyoshioka/Wrot.svg)](https://github.com/villyoshioka/Wrot/releases/latest)
[![downloads](https://img.shields.io/github/downloads/villyoshioka/Wrot/total.svg)](https://github.com/villyoshioka/Wrot/releases)

> **注意**: **このプラグインについて、コードは公開していますが、サポートは行っていません。**

---

## Wrot って？

Write + Jot = **Wrot**。「書く」と「さっとメモする」を合わせた、Obsidian 用の小さなつぶやきプラグインです。  
SNS のような気軽さで書けて、誰にも見られず、勝手に整理もされない。愚痴も独り言もメモも、自由に置いておけるあなただけの空間です。  
書いたものはそのままデイリーノートに残るので、Obsidian の検索・リンク・振り返りとも自然に噛み合い、Obsidian そのものが少し手に馴染むようになります。

---

## Wrot ができること

- **リッチな UI** — ツールバー付きの投稿エディタで書式・リスト・リンク・タグ補完まで。投稿はまるで SNS のタイムラインのように並び、書くのも読み返すのも気持ちよく。
- **タグで絞り込める** — `#タグ` をクリックすると、そのタグを含むメモを Obsidian の検索からそのまま辿れます。
- **リンクと URL プレビュー** — 内部リンク（![[]]）や外部URLはもちろん、OGPカードや画像プレビューでリンク先の中身がひと目でわかります。
- **自分好みに** — 背景色・文字色、投稿ボタンのテキストやアイコンまで、自分だけのメモ空間に仕立てられます。

---

## メモの保存先は？

メモはすべて、あなたのデイリーノートの中に ` ```wr ` コードブロックとして保存されます。特別なデータベースや外部サービスは使いません。あなたの Vault の中だけで完結します。

編集したいときや削除したいときは、デイリーノートを直接開くだけ。データはいつでもあなたの手の中にあります。

> **注意事項**: Wrot を使うには、Obsidian のコアプラグイン「デイリーノート」を有効にしてください。

---

## 対応プラットフォーム

[Obsidian](https://obsidian.md/) がサポートするすべてのプラットフォームに対応しています。

- macOS
- iOS / iPadOS
- Windows（動作未確認）
- Linux（動作未確認）
- Android（動作未確認）

---

## 使いかたの 3 ステップ

1. **プラグインを入れる** — まず [BRAT](https://github.com/TfTHacker/obsidian42-brat) をコミュニティプラグインからインストール。次に BRAT の設定で「Add Beta Plugin」を選び、`villyoshioka/Wrot` を追加するだけ。もちろん[手動インストール](#手動インストール)もできます。
2. **サイドバーを開く** — 羽アイコンをクリック、またはコマンドパレットから「Open Wrot」。タイムラインが現れます。
3. **つぶやく** — テキストを入力して投稿ボタン（または Ctrl/Cmd+Enter）。それだけで、今日のメモが残ります。

### 手動インストール

1. [Releases](https://github.com/villyoshioka/Wrot/releases) から最新リリースの `main.js`、`manifest.json`、`styles.css` をダウンロード
2. Vault の `.obsidian/plugins/wrot/` フォルダに配置
3. Obsidian の設定でプラグインを有効化

---

## 設定

Wrot は細かく調整できます。ここでは大まかな方向性だけ:

- **ビューの配置** — 左/右サイドバー、またはメインエリア
- **見た目** — ライト/ダーク別の背景色・文字色
- **投稿ボタン** — テキストとアイコンをカスタマイズ
- **タイムスタンプ形式** — 表示フォーマットを指定(例: `YYYY/MM/DD HH:mm:ss`)
- **URL プレビュー** — リンク先のカード表示の ON/OFF
- **その他** — 入力欄が空のときのメッセージ、チェック済み項目の取り消し線など

詳細は Obsidian の設定画面から確認してください。

---

## プライバシーについて

Wrot はあなたの手元だけで動きます。あなたのデータを勝手に集めたり、こっそり追跡したりすることは一切ありません。

※ URL プレビューを有効にしている場合のみ、リンク先のカード表示のためにそのリンク先へアクセスします。

---

## ライセンスについて

Wrot は [MIT ライセンス](LICENSE) で公開されています。

---

## 謝辞

Wrot は、以下のプロジェクトからインスピレーションを受けて生まれました。開発者の皆さんに深く感謝いたします。

- [Obsidian Memos](https://github.com/Quorafind/Obsidian-Memos)（現: [Thino](https://github.com/Quorafind/Obsidian-Thino)）by Quorafind
- [Mobile First Daily Interface (MFDI)](https://github.com/tadashi-aikawa/mobile-first-daily-interface) by tadashi-aikawa

これらのプロジェクトへの敬意と、似た役割のプラグインが競合しないよう、Wrot はコミュニティプラグインには登録していません。

---

## 開発について

このプラグインは、開発者が設計と品質を見ながら、AI（Anthropic 社の Claude）の手も借りて開発しています。詳細は [AI 利用ポリシー](AI_POLICY.md) にまとめています。

**開発**: Vill Yoshioka([@villyoshioka](https://github.com/villyoshioka))
