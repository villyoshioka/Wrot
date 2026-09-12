# Wrot

[English](https://github.com/villyoshioka/Wrot/blob/main/README.md) ・ **日本語**

**Obsidian で、つぶやくように日々を記録するプラグイン。**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](https://opensource.org/licenses/MIT)
[![release](https://img.shields.io/github/v/release/villyoshioka/Wrot)](https://github.com/villyoshioka/Wrot/releases/latest)

---

## Wrot とは？

Write + Jot = **Wrot**。「書く」と「さっとメモする」を組み合わせた、Obsidian 用のマイクロジャーナリング・プラグインです。

SNS のような気軽さで書けて、誰にも見られず、勝手に整理もされない。思考の断片や日々のつぶやきを気兼ねなく残せる、あなただけの空間をつくります。
投稿内容はそのままデイリーノートへ保存されるため、Obsidian 本来の検索性やリンク構造、振り返りのワークフローを損なうことなくシームレスに活用できます。

---

## 主な機能

- **SNS ライクな使い心地とリッチなエディタ**
  タイムライン形式で素早く振り返りが可能。ツールバー付きのエディタを備え、書式設定・リスト・引用・内部リンクなどを手軽に扱えます。ツールバーのボタン表示や並び順は自由にカスタマイズ可能です（[詳細](https://github.com/villyoshioka/Wrot/blob/main/docs/ja/%E3%83%84%E3%83%BC%E3%83%AB%E3%83%90%E3%83%BC%E3%81%AE%E4%BD%BF%E3%81%84%E6%96%B9.md)）。
- **埋もれさせないピン留め機能**
  重要なメモや直近のタスクをタイムライン上部に固定表示。日付を指定して、その日が来たら自動でピン留めする予約にも対応しています（[詳細](https://github.com/villyoshioka/Wrot/blob/main/docs/ja/%E3%83%94%E3%83%B3%E7%95%99%E3%82%81%E3%81%AE%E4%BD%BF%E3%81%84%E6%96%B9.md)）。
- **Obsidian 本体のタグシステムと完全連携**
  メモ内のタグは通常のタグと同様にグラフビューへ反映され、タグ検索の対象になります。クリックひとつで Obsidian 本体の検索から辿ることも可能です（[詳細](https://github.com/villyoshioka/Wrot/blob/main/docs/ja/%E3%82%BF%E3%82%B0%E3%81%AE%E6%9C%AC%E4%BD%93%E7%B5%B1%E5%90%88%E3%81%AE%E4%BD%BF%E3%81%84%E6%96%B9.md)）。
- **タグの入力補完**
  投稿フォームで `#` を入力すると、過去に使用したタグが自動で候補表示され、入力の手間を減らせます（[詳細](https://github.com/villyoshioka/Wrot/blob/main/docs/ja/%E3%82%BF%E3%82%B0%E5%85%A5%E5%8A%9B%E8%A3%9C%E5%AE%8C%E3%81%AE%E4%BD%BF%E3%81%84%E6%96%B9.md)）。
- **タグルール（自動カラー分け）**
  特定のタグに対して背景色・文字色を指定可能。トピックや気分、重要度に応じてタイムラインを視覚的に整理できます（[詳細](https://github.com/villyoshioka/Wrot/blob/main/docs/ja/%E3%82%BF%E3%82%B0%E3%83%AB%E3%83%BC%E3%83%AB%E3%81%AE%E4%BD%BF%E3%81%84%E6%96%B9.md)）。
- **リンクと URL プレビュー**
  内部リンク（`![[]]`）や外部 URL の OGP カード表示に対応し、参照先を直感的に把握できます（[詳細](https://github.com/villyoshioka/Wrot/blob/main/docs/ja/%E7%94%BB%E5%83%8F%E3%83%BB%E3%83%AA%E3%83%B3%E3%82%AF%E3%83%BB%E5%9F%8B%E3%82%81%E8%BE%BC%E3%81%BF%E3%81%AE%E4%BD%BF%E3%81%84%E6%96%B9.md)）。
- **スムーズな画像添付**
  クリップボードからの貼り付け、ドラッグ＆ドロップ、ボタンからの選択に対応。投稿前にサムネイルでプレビュー・削除の確認ができます。
- **自由度の高い外観カスタマイズ**
  テーマに合わせたカラーリングの変更、投稿ボタンのアイコンやテキストの変更など、好みに合わせた調整が可能です。

---

## メモの保存仕様

メモはすべて、Obsidian の「デイリーノート」設定で指定されたノート内に ` ```wr ` コードブロックとして記録されます。独自の外部データベースは使用せず、データは Vault 内のローカルファイルとして完結します。

タイムライン上から直接作成・編集・削除ができるほか、Markdown ファイルを直接開いて編集することも可能です。

デイリーノートの日付フォーマットを週次（例: `GGGG年WW週`）や月次（例: `YYYY年MM月`）に設定することで、ウィークリー / マンスリーログとしての運用にも対応します。

> **注意**: Wrot を使用するには、Obsidian コアプラグインの「デイリーノート」を有効化しておく必要があります。

---

## 動作要件

- Obsidian **v1.13.0** 以降
- 対応プラットフォーム:
  - macOS
  - iOS / iPadOS
  - Windows（動作未確認）
  - Linux（動作未確認）
  - Android（動作未確認）

---

## 対応言語

Wrot は **11 言語 12 ロケール** に対応しています。Obsidian の言語設定に自動で追従し、未対応言語の場合は英語で表示されます。

| 言語         | ロケール | 言語         | ロケール |
| :----------- | :------- | :----------- | :------- |
| 日本語       | `ja`     | フランス語   | `fr`     |
| 英語（US）   | `en`     | ドイツ語     | `de`     |
| 英語（UK）   | `en-GB`  | イタリア語   | `it`     |
| 韓国語       | `ko`     | ロシア語     | `ru`     |
| スペイン語   | `es`     | 繁体字中国語 | `zh-TW`  |
| ポルトガル語 | `pt`     | 簡体字中国語 | `zh-CN`  |

---

## クイックスタート

1. **プラグインのインストール** — コミュニティプラグインまたは手動で導入します。
2. **サイドバーを開く** — リボンアイコンをクリックするか、コマンドパレットから「Open」を実行してタイムラインを表示します。
3. **つぶやく** — 入力欄にテキストを書き、投稿ボタン（または `Ctrl / Cmd + Enter`）を押すだけで記録が完了します。

### インストール手順

**Obsidian コミュニティプラグインから**

1. 「設定 → コミュニティプラグイン → 有効化して閲覧」を開きます。
2. `Wrot` を検索して「インストール」をクリックします。
3. インストール完了後、「有効化」します。

**手動インストール**

1. [Releases](https://github.com/villyoshioka/Wrot/releases) から最新の `main.js`、`manifest.json`、`styles.css` をダウンロードします。
2. お使いの Vault の `.obsidian/plugins/wrot/` ディレクトリに 3 つのファイルを配置します（フォルダが存在しない場合は新規作成してください）。
3. Obsidian の設定から「コミュニティプラグイン」を開き、リロードアイコンを押して Wrot を有効化します。

> **ヒント**: `.obsidian` は隠しフォルダです。表示されない場合は、macOS では `Cmd + Shift + .`、Windows ではエクスプローラーの「表示 → 隠しファイル」にチェックを入れてください。

---

## カスタマイズ項目

設定画面から以下の項目などを柔軟に変更できます。

- **ビューの配置場所**: 左右のサイドバー、またはメインエリア
- **カラーテーマ**: ライト／ダークモード別の配色設定
- **タグルール**: タグごとの背景色・文字色設定
- **ピン留め設定**: 最大件数の設定（1 / 3 / 5件）、スクロール時の上部固定表示
- **ボタン設定**: 投稿・更新ボタンのラベル／アイコン変更、投稿メニュー内の削除ボタン表示切り替え
- **フォーマット**: タイムスタンプの表示形式（例: `YYYY/MM/DD HH:mm:ss`）
- **プレビュー機能**: OGP カードプレビューの有効化／無効化

---

## プライバシー

データ収集やトラッキングは一切行われません。すべてのデータ処理はローカル環境で完結します。

_※ URL プレビュー機能を有効にしている場合のみ、OGP 情報を取得するために該当リンク先サーバーへアクセスが発生します。_

---

## ライセンス

[MIT License](https://github.com/villyoshioka/Wrot/blob/main/LICENSE)

---

## 謝辞

Wrot は、以下のプロジェクトに着想を得て開発されました。素晴らしい先行実装に感謝いたします。

- [Obsidian Memos](https://github.com/Quorafind/Obsidian-Memos)（現: [Thino](https://github.com/Quorafind/Obsidian-Thino)）by [Quorafind](https://github.com/Quorafind)
- [Mobile First Daily Interface (MFDI)](https://github.com/tadashi-aikawa/mobile-first-daily-interface) by [tadashi-aikawa](https://github.com/tadashi-aikawa)

多言語対応の翻訳には [Nani](https://nani.now/ja) を活用しています。有用なツールを提供してくださっている [catnose](https://x.com/catnose99) 氏（Kioku LLC）に感謝申し上げます。

---

## 開発体制

本プラグインは、開発者が設計および品質管理を行いながら、Anthropic 社の Claude を補助的に用いて開発しています。詳細は [AI 利用ポリシー](https://github.com/villyoshioka/Wrot/blob/main/docs/ja/AI_POLICY.md) をご参照ください。

**Author**: Vill Yoshioka ([@villyoshioka](https://github.com/villyoshioka))
