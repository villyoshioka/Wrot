// 日本語訳（原本）。他言語ファイルはこのキー構造を `satisfies` で型一致させる。
const ja = {
  // ─── settings: section ─────────────────────────────────────────────
  "settings.section.basic": "基本設定",
  "settings.section.display": "表示設定",
  "settings.section.tagrules": "タグ別ルール設定",

  // ─── settings: 表示位置 ────────────────────────────────────────────
  "settings.item.viewPlacement.name": "表示位置",
  "settings.item.viewPlacement.desc": "Wrotパネルの表示位置を選びます。",
  "settings.option.viewPlacement.left": "左サイドバー",
  "settings.option.viewPlacement.right": "右サイドバー",
  "settings.option.viewPlacement.main": "メインエリア",

  // ─── settings: フォントサイズ追従 ───────────────────────────────────
  "settings.item.followFontSize.name": "Obsidianのフォントサイズに追従",
  "settings.item.followFontSize.desc": "Obsidianの外観設定にWrotの文字サイズを合わせます。",

  // ─── settings: ヘッダー日付表示形式 ─────────────────────────────────
  "settings.item.headerDateFormat.name": "ヘッダー日付表示形式",
  "settings.item.headerDateFormat.desc":
    "日付ナビに表示する日付のフォーマットを指定します。（YYYY, MM, DD などが使えます）空欄で初期値に戻ります。",

  // ─── settings: タイムスタンプ表示形式 ───────────────────────────────
  "settings.item.timestampFormat.name": "タイムスタンプ表示形式",
  "settings.item.timestampFormat.desc":
    "投稿の日時フォーマットを指定します。（YYYY, MM, DD, HH, mm, ss が使えます）",

  // ─── settings: 背景色・文字色 ──────────────────────────────────────
  "settings.item.bgColorLight.name": "背景色（ライトモード）",
  "settings.item.bgColorLight.desc": "ライトテーマでの投稿・投稿フォームの背景色を設定します。",
  "settings.item.textColorLight.name": "文字色（ライトモード）",
  "settings.item.textColorLight.desc": "ライトテーマでのテキスト・アイコンの色を設定します。",
  "settings.item.bgColorDark.name": "背景色（ダークモード）",
  "settings.item.bgColorDark.desc": "ダークテーマでの投稿・投稿フォームの背景色を設定します。",
  "settings.item.textColorDark.name": "文字色（ダークモード）",
  "settings.item.textColorDark.desc": "ダークテーマでのテキスト・アイコンの色を設定します。",

  // ─── settings: 投稿ボタン ──────────────────────────────────────────
  "settings.item.submitLabel.name": "投稿ボタンのテキスト",
  "settings.item.submitLabel.desc": "投稿ボタンに表示するテキストを変更できます。",
  "settings.item.submitIcon.name": "投稿ボタンのアイコン",
  // 「投稿ボタンのアイコンを変更できます。アイコン名は [こちら](Lucide) からコピーしてください。空欄にするとアイコンを非表示にできます。」
  // を {linkOpen}/{linkClose} プレースホルダで分割し、リンク部分だけアンカー要素で挟む
  "settings.item.submitIcon.desc": "投稿ボタンのアイコンを変更できます。アイコン名は {linkOpen}こちら{linkClose} からコピーしてください。空欄にするとアイコンを非表示にできます。",
  "settings.item.inputPlaceholder.name": "投稿フォームの空欄メッセージ",
  "settings.item.inputPlaceholder.desc":
    "投稿フォームが空の時に表示されるテキストを変更できます。空欄にすると非表示になります。",

  // ─── settings: ピン留めの上限 ──────────────────────────────────────
  "settings.item.pinLimit.name": "ピン留めの上限",
  "settings.item.pinLimit.desc": "タイムラインに固定できるメモの最大件数を設定します。",
  "settings.option.pinLimit.1": "1 件",
  "settings.option.pinLimit.3": "3 件",
  "settings.option.pinLimit.5": "5 件",

  // ─── settings: URLプレビュー ────────────────────────────────────────
  "settings.item.ogp.name": "URLプレビュー",
  "settings.item.ogp.desc":
    "メモ内のURLからOGP情報を自動取得して表示します。オフにすると外部通信を行いません。",

  // ─── settings: チェック済みの取り消し線 ────────────────────────────
  "settings.item.checkStrikethrough.name": "チェック済みの取り消し線",
  "settings.item.checkStrikethrough.desc": "チェックボックスがONの項目に取り消し線を表示します。",

  // ─── settings: カレンダーボタン ─────────────────────────────────────
  "settings.item.calendarDayShape.name": "日付ボタンの形",
  "settings.item.calendarDayShape.desc": "カレンダーの日付ボタンの形を選びます。",
  "settings.option.calendarDayShape.circle": "円形",
  "settings.option.calendarDayShape.rounded": "角丸",
  "settings.option.calendarDayShape.square": "正方形",

  "settings.item.showCalendarButton.name":"カレンダーボタンを表示",
  "settings.item.showCalendarButton.desc":
    "日付ナビにカレンダーボタンを表示します。タップで任意の日付へジャンプできます。",

  // ─── settings: タグ別に色を変える ───────────────────────────────────
  "settings.item.tagColorRules.name": "タグ別に色を変える",
  "settings.item.tagColorRules.desc":
    "指定タグを含む投稿の背景色と文字色を変更します。複数ルールに該当する場合は本文で先に出たタグが優先されます。",

  // ─── settings: タグルール内 ─────────────────────────────────────────
  "settings.tagRule.label": "ルール {n}",
  "settings.tagRule.tag.name": "タグ",
  "settings.tagRule.tag.desc": "色を変えたいタグ名を入力します。（# は省略できます）",
  "settings.tagRule.tag.placeholder": "タグ名",
  "settings.tagRule.bg.name": "背景色",
  "settings.tagRule.bg.desc": "このタグを含む投稿の背景色を設定します。",
  "settings.tagRule.fg.name": "文字色",
  "settings.tagRule.fg.desc":
    "このタグを含む投稿の本文文字色を設定します。（タグ・リンク・URLはアクセントカラー側で設定します）",
  "settings.tagRule.accent.name": "アクセントカラー",
  "settings.tagRule.accent.desc":
    "タグ・リンク・URL・コピー完了アイコンなどアクセントカラーが使われる要素の色を設定します。未設定時はテーマのアクセントカラーを使います。",
  "settings.tagRule.sub.name": "サブカラー",
  "settings.tagRule.sub.desc":
    "タイムスタンプ・アイコン・リストマーカー・引用線・チェックボックスなどサブ要素の色をまとめて設定します。未設定時は背景色と文字色から自動算出します。",
  "settings.tagRule.scope.buttons.name": "タイムスタンプ・メニュー・ピンにサブカラーを適用",
  "settings.tagRule.scope.buttons.desc": "オフのときは自動設定された色になります。",
  "settings.tagRule.scope.quote.name": "引用にサブカラーを適用",
  "settings.tagRule.scope.quote.desc": "オフのときは自動設定された色になります。",
  "settings.tagRule.scope.list.name": "リスト・チェックボックスにサブカラーを適用",
  "settings.tagRule.scope.list.desc": "オフのときは自動設定された色になります。",
  "settings.tagRule.scope.ogp.name": "OGPカードにサブカラーを適用",
  "settings.tagRule.scope.ogp.desc": "オフのときは自動設定された色になります。",
  "settings.tagRule.button.add": "ルールを追加",

  // ─── settings: ツールチップ ─────────────────────────────────────────
  "settings.tooltip.resetDefault": "初期値に戻す",
  "settings.tooltip.deleteRule": "このルールを削除",
  "settings.tooltip.lock": "ロックする",
  "settings.tooltip.unlock": "編集するにはロックを解除",

  // ─── view: 書式メニュー（書いてる途中のテキストに対する書式操作） ──
  "view.formatMenu.code": "コード",
  "view.formatMenu.math": "数式",
  "view.formatMenu.quote": "引用",
  "view.formatMenu.link": "リンク",
  "view.formatMenu.strikethrough": "取り消し線",
  "view.formatMenu.highlight": "ハイライト",
  "view.formatMenu.settings": "設定",

  // ─── view: 投稿の3点メニュー ───────────────────────────────────────
  "view.postMenu.copy": "コピー",
  // 書式メニュー側「引用」と区別するため「投稿を引用」にリネーム
  "view.postMenu.quotePost": "投稿を引用",
  "view.postMenu.unpin": "ピンを外す",
  "view.postMenu.pin": "ピン留め",
  "view.postMenu.pinLimitHint": "ピン留めは{limit}件までです。",

  // ─── view: 日付ナビ ────────────────────────────────────────────────
  "view.dateNav.today": "今日",
  // 日付ラベル末尾に付く「（今日）」。括弧ごとロケール側で自由に変えられるようにキー化
  "view.dateNav.todaySuffix": "（今日）",

  // ─── view: 空状態・通知 ────────────────────────────────────────────
  "view.empty.noMemos": "メモはありません",
  "view.notice.saveFailed": "メモの保存に失敗しました: {error}",
  "view.notice.searchPluginNotFound": "検索プラグインが見つかりません",

  // ─── view: その他 UI ──────────────────────────────────────────────
  "view.image.removeAria": "画像を削除",

  // ─── settings: 投稿アイコン Lucide リンク URL (ロケール側で切替可) ──
  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  // ─── カレンダー: 月年ラベルの表示形式 ──────────────────────────────
  // カレンダーポップオーバー最上部の「2026年5月」相当のラベル。moment の
  // format トークンで記述し、ロケールごとに自然な月年の並びにする。
  // 「年」「月」は角括弧でリテラル扱いにして moment のトークン誤解釈を防ぐ。
  "calendar.monthYearFormat": "YYYY[年]M[月]",

  // ─── 言語依存のデフォルト設定値 ────────────────────────────────────
  // DEFAULT_SETTINGS の代わりに、新規インストール時にこれらを採用する
  "defaults.headerDateFormat": "YYYY年MM月DD日",
  "defaults.submitLabel": "投稿",
  "defaults.inputPlaceholder": "あなたが書くのを待っています...",
};

// 他言語ファイルから使う型。キー構造だけ ja に揃え、値は string であれば何でも良い。
// `Record<keyof typeof ja, string>` にすることで「キーの過不足」はビルド時に弾きつつ、
// 値は各言語の翻訳文を自由に入れられる。
export type Translations = Record<keyof typeof ja, string>;
export default ja;
