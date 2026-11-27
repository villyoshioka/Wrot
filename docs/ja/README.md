# Wrot

[English](https://github.com/villyoshioka/Wrot/blob/main/README.md) ・ **日本語**

**ツイート感覚で日々の記録を残せる Obsidian プラグイン。**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](https://opensource.org/licenses/MIT)
[![release](https://img.shields.io/github/v/release/villyoshioka/Wrot)](https://github.com/villyoshioka/Wrot/releases/latest)

![メインエリアに開いた Wrot のタイムライン](https://raw.githubusercontent.com/villyoshioka/Wrot/main/docs/images/timeline-desktop-ja.png)

---

## Wrot とは？

Write（書く）+ Jot（メモする）= **Wrot**。Obsidian 向けのマイクロジャーナリング・プラグインです。

SNS のような気軽さで書き留められますが、投稿が誰かに見られることはなく、勝手に並び替えられることもありません。思い浮かんだアイデアや日々のちょっとしたつぶやきを、気兼ねなく残せます。

投稿はすべてデイリーノートにそのまま入るため、Obsidian の検索やリンク、グラフビューもいつも通り使えます。

<p align="center">
  <img src="https://raw.githubusercontent.com/villyoshioka/Wrot/main/docs/images/posting-mobile.gif" alt="iPhone の Wrot から投稿する様子" width="280">
  <img src="https://raw.githubusercontent.com/villyoshioka/Wrot/main/docs/images/timeline-mobile.png" alt="iPhone での Wrot のタイムライン" width="280">
</p>

---

## 主な機能

- **リッチエディタつきの SNS 風タイムライン**  
  投稿フォームでは Markdown の記号が隠れるため、太字やリストの仕上がりを見ながら書けます（[詳細](https://github.com/villyoshioka/Wrot/blob/main/docs/ja/Ver3.0.0%E4%BB%A5%E9%99%8D%E3%81%AE%E6%8A%95%E7%A8%BF%E3%83%95%E3%82%A9%E3%83%BC%E3%83%A0%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6.md)）。ツールバーから文字装飾、リスト、引用、リンクなどを追加でき、表示するボタンや並び順も変えられます（[詳細](https://github.com/villyoshioka/Wrot/blob/main/docs/ja/%E3%83%84%E3%83%BC%E3%83%AB%E3%83%90%E3%83%BC%E3%81%AE%E4%BD%BF%E3%81%84%E6%96%B9.md)）。
- **ピン留め**  
  重要なメモや直近のタスクをタイムラインのいちばん上に固定できます。日付を指定して、その日に自動でピン留めされるようにもできます。チェックボックスのある投稿は、日付が変わるたびにチェックが外れる毎日のチェックリストとしてもピン留めできます（[詳細](https://github.com/villyoshioka/Wrot/blob/main/docs/ja/%E3%83%94%E3%83%B3%E7%95%99%E3%82%81%E3%81%AE%E4%BD%BF%E3%81%84%E6%96%B9.md)）。
- **Obsidian 本体のタグとの連携**  
  投稿内のタグはノート内のタグと同じように扱われ、検索やグラフビューに表示されます。タグをクリックすると Obsidian の検索が開きます（[詳細](https://github.com/villyoshioka/Wrot/blob/main/docs/ja/%E3%82%BF%E3%82%B0%E3%81%AE%E6%9C%AC%E4%BD%93%E7%B5%B1%E5%90%88%E3%81%AE%E4%BD%BF%E3%81%84%E6%96%B9.md)）。
- **タグの入力補完**  
  入力欄に `#` と打つと、過去に使ったタグが候補に表示されます（[詳細](https://github.com/villyoshioka/Wrot/blob/main/docs/ja/%E3%82%BF%E3%82%B0%E5%85%A5%E5%8A%9B%E8%A3%9C%E5%AE%8C%E3%81%AE%E4%BD%BF%E3%81%84%E6%96%B9.md)）。
- **タグルール（色分け）**  
  タグごとに背景色と文字色を設定でき、話題や気分、優先度でタイムラインを色分けできます（[詳細](https://github.com/villyoshioka/Wrot/blob/main/docs/ja/%E3%82%BF%E3%82%B0%E3%83%AB%E3%83%BC%E3%83%AB%E3%81%AE%E4%BD%BF%E3%81%84%E6%96%B9.md)）。
- **リンクと URL プレビュー**  
  Vault 内のノートや Web ページへのリンクを追加できます。Web ページへのリンクは、タイトルやサムネイル画像つきのカードで表示されます（[詳細](https://github.com/villyoshioka/Wrot/blob/main/docs/ja/%E7%94%BB%E5%83%8F%E3%83%BB%E3%83%AA%E3%83%B3%E3%82%AF%E3%83%BB%E5%9F%8B%E3%82%81%E8%BE%BC%E3%81%BF%E3%81%AE%E4%BD%BF%E3%81%84%E6%96%B9.md)）。
- **テンプレートの見出しの下に投稿**  
  デイリーノートのテンプレートから見出しを選んでおくと、投稿がその見出しの下に追加されます。Templater で作ったテンプレートにも対応しています（[詳細](https://github.com/villyoshioka/Wrot/blob/main/docs/ja/%E3%83%86%E3%83%B3%E3%83%97%E3%83%AC%E3%83%BC%E3%83%88%E3%81%AE%E8%A6%8B%E5%87%BA%E3%81%97%E6%8C%87%E5%AE%9A%E3%81%AE%E4%BD%BF%E3%81%84%E6%96%B9.md)）。
- **画像の添付**  
  クリップボードからの貼り付け、ドラッグ＆ドロップ、ボタンからのファイル選択に対応しています。投稿前にサムネイルで確認・取り消しができます。
- **外観のカスタマイズ**  
  色は Obsidian 本体に合わせて表示され、ライトモードとダークモードでそれぞれ好きな色にもできます。投稿ボタンのアイコンや表示テキストも変えられます。

---

## 投稿の保存先

投稿はすべて、デイリーノート設定で指定されたノート内に ` ```wr ` コードブロックとして保存されます。外部のデータベースは使わず、データはすべて Vault 内のファイルに収まります。

タイムラインから投稿の作成・編集・削除ができるほか、ノートを直接開いて編集することもできます。

デイリーノートの日付フォーマットを週次（例: `GGGG年WW週`）や月次（例: `YYYY年MM月`）に設定すれば、週報や月報のログとしても使えます。

> **注意**: Wrot を使うには、Obsidian のコアプラグインであるデイリーノートを有効にしておく必要があります。

---

## 動作環境

- Obsidian **v1.14.4** 以降
- 対応プラットフォーム
  - macOS
  - iOS / iPadOS
  - Windows（動作未確認）
  - Linux（動作未確認）
  - Android（動作未確認）

---

## 対応言語

Wrot は **11 言語・12 ロケール** に対応しています。Obsidian の言語設定に合わせて切り替わり、未対応の言語では英語で表示されます。

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

1. コミュニティプラグインの一覧からインストールするか、手動でインストールします。
2. リボンアイコンをクリックするか、コマンドパレットから「左サイドバーで開く」「右サイドバーで開く」「メインエリアで開く」のいずれかを実行してタイムラインを表示します。
3. 入力欄に書いて、投稿ボタンか `Ctrl / Cmd + Enter` を押して投稿します。

### インストール方法

**Obsidian コミュニティプラグインから**

1. 「設定 → コミュニティプラグイン → 有効化して閲覧」を開きます。
2. `Wrot` を検索して「インストール」をクリックします。
3. インストールが完了したら「有効化」をクリックします。

**手動インストール**

1. [Releases](https://github.com/villyoshioka/Wrot/releases) から最新の `main.js`、`manifest.json`、`styles.css` をダウンロードします。
2. お使いの Vault にある `.obsidian/plugins/wrot/` フォルダに 3 つのファイルを置きます。フォルダがない場合は先に作成してください。
3. Obsidian の設定から「コミュニティプラグイン」を開き、リロードアイコンを押して Wrot を有効化します。

> **ヒント**: `.obsidian` は隠しフォルダです。見当たらない場合は、macOS では `Cmd + Shift + .` を押し、Windows ではエクスプローラーの「表示」タブで「隠しファイル」にチェックを入れてください。

---

## カスタマイズ

設定画面では、主に次の項目を変えられます。

- ビューの配置場所: 左右のサイドバー、またはメインエリア
- カラーテーマ: ライト／ダークモード別の配色設定
- タグルール: タグごとの背景色・文字色設定
- ピン留め設定: 最大件数の設定（1 / 3 / 5件）、スクロール時の上部固定表示
- ボタン設定: 投稿・更新ボタンのラベル／アイコン変更、投稿メニュー内の削除ボタン表示切り替え
- フォーマット: タイムスタンプの表示形式（例: `YYYY/MM/DD HH:mm:ss`）
- プレビュー機能: OGP カードプレビューの有効化／無効化

![右サイドバーに置いた Wrot のタイムライン](https://raw.githubusercontent.com/villyoshioka/Wrot/main/docs/images/sidebar-desktop-ja.png)

---

## プライバシー

ユーザーの追跡や個人データの収集は一切行いません。処理はすべて手元のデバイスで完結します。

_※ URL プレビューを有効にしている場合だけ、タイトルや画像などのプレビュー情報を取得するためにリンク先のサイトへ接続します。_

---

## ライセンス

[MIT License](https://github.com/villyoshioka/Wrot/blob/main/LICENSE)

フォーク版を公開する場合は、[フォークについて](https://github.com/villyoshioka/Wrot/blob/main/docs/ja/FORKING.md) もご確認ください。

---

## 謝辞

Wrot は以下のプロジェクトに着想を得て制作されました。素晴らしい先例をつくってくださった開発者の皆さまに感謝いたします。

- [Obsidian Memos](https://github.com/Quorafind/Obsidian-Memos)（現: [Thino](https://github.com/Quorafind/Obsidian-Thino)）by [Quorafind](https://github.com/Quorafind)
- [Mobile First Daily Interface (MFDI)](https://github.com/tadashi-aikawa/mobile-first-daily-interface) by [tadashi-aikawa](https://github.com/tadashi-aikawa)

多言語翻訳には [Nani](https://nani.now/ja) を使っています。便利なツールを提供してくださっている [catnose](https://x.com/catnose99) 氏（Kioku LLC）に、心よりお礼申し上げます。

---

## 開発体制

本プラグインは、開発者が設計および品質管理を行いながら、Anthropic 社の Claude を補助的に用いて開発しています。詳細は [AI 利用ポリシー](https://github.com/villyoshioka/Wrot/blob/main/docs/ja/AI_POLICY.md) をご参照ください。

**Author**: Vill Yoshioka ([@villyoshioka](https://github.com/villyoshioka))
