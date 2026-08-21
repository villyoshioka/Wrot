// Japanese translations (source of truth). Other locale files match this key structure via `satisfies`.
const ja = {
  "settings.section.basic": "基本設定",
  "settings.section.advanced": "詳細設定",
  "settings.section.tagrules": "タグ別ルール設定",

  "settings.item.viewPlacement.name": "表示位置",
  "settings.item.viewPlacement.desc": "閉じて開き直すと反映されます。",
  "settings.option.viewPlacement.left": "左サイドバー",
  "settings.option.viewPlacement.right": "右サイドバー",
  "settings.option.viewPlacement.main": "メインエリア",

  "settings.item.followFontSize.name": "Obsidianのフォントサイズに追従",
  "settings.item.followFontSize.desc":
    "オンにすると、Obsidianの外観設定の文字サイズに合わせます。",

  "settings.item.headerDateFormat.name": "ヘッダー日付表示形式",
  "settings.item.headerDateFormat.desc": "YYYY, MM, DD などが使えます。\n空欄で初期値に戻ります。",

  "settings.item.timestampFormat.name": "タイムスタンプ表示形式",
  "settings.item.timestampFormat.desc": "YYYY, MM, DD, HH, mm, ss が使えます。",

  "settings.item.bgColorLight.name": "背景色（ライトモード）",
  "settings.item.bgColorLight.desc": "投稿と投稿フォームに使われます。",
  "settings.item.textColorLight.name": "文字色（ライトモード）",
  "settings.item.textColorLight.desc": "テキストとアイコンに使われます。",
  "settings.item.bgColorDark.name": "背景色（ダークモード）",
  "settings.item.bgColorDark.desc": "投稿と投稿フォームに使われます。",
  "settings.item.textColorDark.name": "文字色（ダークモード）",
  "settings.item.textColorDark.desc": "テキストとアイコンに使われます。",

  "settings.item.submitLabel.name": "投稿ボタンのテキスト",
  "settings.item.submitLabel.desc": "空欄にするとアイコンのみになります（アイコン設定時のみ）。",
  "settings.item.submitIcon.name": "投稿ボタンのアイコン",
  // {linkOpen}/{linkClose} placeholders mark the part wrapped in an anchor element.
  "settings.item.submitIcon.desc": "アイコン名は {linkOpen}こちら{linkClose} からコピーできます。\n空欄にすると非表示になります。",
  "settings.item.updateLabel.name": "更新ボタンのテキスト",
  "settings.item.updateLabel.desc": "投稿の編集中に使われます。\n空欄にするとアイコンのみになります（アイコン設定時のみ）。",
  "settings.item.updateIcon.name": "更新ボタンのアイコン",
  "settings.item.updateIcon.desc": "アイコン名は {linkOpen}こちら{linkClose} からコピーできます。\n空欄にすると投稿ボタンと同じになります。",
  "settings.item.inputPlaceholder.name": "投稿フォームの空欄メッセージ",
  "settings.item.inputPlaceholder.desc": "空欄にすると非表示になります。",

  "settings.item.tagSuggest.name": "タグ入力補完",
  "settings.item.tagSuggest.desc":
    "# に続けて入力すると候補が表示されます。\nオフにすると覚えた候補も消えます。",

  "settings.item.pinLimit.name": "ピン留めの上限",
  "settings.item.pinLimit.desc": "上限を下げると、超えた分のピンは外れます。",
  "settings.option.pinLimit.1": "1 件",
  "settings.option.pinLimit.3": "3 件",
  "settings.option.pinLimit.5": "5 件",

  "settings.item.ogp.name": "URLプレビュー",
  "settings.item.ogp.desc": "URLからプレビュー情報を取得します。\nオフにすると外部通信を行いません。",

  "settings.item.checkStrikethrough.name": "チェック済みの取り消し線",
  "settings.item.checkStrikethrough.desc": "オフのときは文字のまま残ります。",

  "settings.item.calendarDayShape.name": "日付ボタンの形",
  "settings.item.calendarDayShape.desc": "カレンダーの日付に使われます。",
  "settings.option.calendarDayShape.circle": "円形",
  "settings.option.calendarDayShape.rounded": "角丸",
  "settings.option.calendarDayShape.square": "正方形",

  "settings.item.showCalendarButton.name":"カレンダーボタンを表示",
  "settings.item.showCalendarButton.desc":
    "オンにすると、日付ナビから任意の日付へジャンプできます。",

  "settings.item.showPostDelete.name": "削除ボタンを表示",
  "settings.item.showPostDelete.desc":
    "オンにすると、投稿のメニューに削除ボタンが追加されます。\n削除した投稿は元に戻せません。添付した画像は削除されません。",

  "settings.item.useCustomAttachmentFolder.name": "画像の保存先を指定",
  "settings.item.useCustomAttachmentFolder.desc": "Wrotから追加した画像だけが対象です。",

  "settings.item.attachmentFolder.name": "保存先フォルダ",
  "settings.item.attachmentFolder.desc": "指定したフォルダがない場合はObsidianの設定に従います。",
  "settings.item.attachmentFolder.placeholder": "フォルダを選択",

  "settings.item.tagColorRules.name": "タグ別ルールを使う",
  "settings.item.tagColorRules.desc":
    "タグごとに投稿の色や本体統合の扱いなどを変えられます。\n色は本文で先に出たタグが優先されます。",

  "settings.tagRule.label": "ルール {n}",
  "settings.tagRule.tag.name": "タグ",
  "settings.tagRule.tag.desc": "# は省略できます。",
  "settings.tagRule.tag.placeholder": "タグ名",
  "settings.tagRule.bg.name": "背景色",
  "settings.tagRule.bg.desc": "投稿の背景に使われます。",
  "settings.tagRule.fg.name": "文字色",
  "settings.tagRule.fg.desc": "タグ・リンク・URLはアクセントカラー側で設定します。",
  "settings.tagRule.accent.name": "アクセントカラー",
  "settings.tagRule.accent.desc": "未設定時はテーマのアクセントカラーになります。",
  "settings.tagRule.sub.name": "サブカラー",
  "settings.tagRule.sub.desc": "タイムスタンプ・リストマーカーなどの色です。\n未設定時は自動算出します。",
  "settings.tagRule.scope.buttons.name": "タイムスタンプ・メニュー・ピンにサブカラーを適用",
  "settings.tagRule.scope.buttons.desc": "オフのときは自動設定された色になります。",
  "settings.tagRule.scope.quote.name": "引用にサブカラーを適用",
  "settings.tagRule.scope.quote.desc": "オフのときは自動設定された色になります。",
  "settings.tagRule.scope.list.name": "リスト・チェックボックスにサブカラーを適用",
  "settings.tagRule.scope.list.desc": "オフのときは自動設定された色になります。",
  "settings.tagRule.scope.ogp.name": "OGPカードにサブカラーを適用",
  "settings.tagRule.scope.ogp.desc": "オフのときは自動設定された色になります。",
  "settings.item.graphTags.name": "タグの本体統合",
  "settings.item.graphTags.desc": "グラフビューやタグ検索（tag:）の対象になります。\nオフのときはWrotの中だけのものになります。",
  "settings.tagRule.noIntegration.name": "本体統合から除外",
  "settings.tagRule.noIntegration.desc": "オンにすると、このタグはWrotの中だけのものになります。",
  "settings.tagRule.hideTimeline.name": "タイムラインに非表示",
  "settings.tagRule.hideTimeline.desc":
    "オンにすると、このタグを含む投稿がタイムラインに出なくなります。\nデイリーノートには残ります。",
  "settings.tagRule.protectDelete.name": "削除ボタンを無効にする",
  "settings.tagRule.protectDelete.desc":
    "オンにすると、このタグを含む投稿は削除できなくなります。",
  "settings.tagRule.button.add": "ルールを追加",

  "view.formatMenu.code": "コード",
  "view.formatMenu.math": "数式",
  "view.formatMenu.quote": "引用",
  "view.formatMenu.link": "リンク",
  "view.formatMenu.strikethrough": "取り消し線",
  "view.formatMenu.highlight": "ハイライト",
  "view.formatMenu.settings": "設定",

  "view.postMenu.copy": "コピー",
  "view.postMenu.quotePost": "投稿を引用",
  "view.postMenu.edit": "編集",
  "view.postMenu.cancelEdit": "編集をキャンセル",
  "view.postMenu.unpin": "ピンを外す",
  "view.postMenu.pin": "ピン留め",
  "view.postMenu.pinLimitHint": "ピン留めは{limit}件までです。",
  "view.postMenu.delete": "削除",
  // Shown on the same row after the first press, in place of the label above.
  "view.postMenu.deleteConfirm": "もう一度押すと削除",

  "view.dateNav.today": "今日",
  // Suffix appended to the date label; keyed so each locale can restyle it, brackets included.
  "view.dateNav.todaySuffix": "（今日）",

  "view.empty.noMemos": "表示できるメモはありません",
  "view.notice.saveFailed": "メモの保存に失敗しました: {error}",
  "view.notice.searchPluginNotFound": "検索プラグインが見つかりません",

  "view.image.removeAria": "画像を削除",

  // Placeholder body of a quote card whose original post is gone.
  "quote.card.notFound": "(元投稿が見つかりません)",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  // Month/year label atop the calendar popover, as moment format tokens.
  // Literal chars (年/月) must be bracketed so moment does not parse them as tokens.
  "calendar.monthYearFormat": "YYYY[年]M[月]",

  // Locale-dependent defaults adopted on fresh install instead of DEFAULT_SETTINGS.
  "defaults.headerDateFormat": "YYYY年MM月DD日",
  "defaults.submitLabel": "投稿",
  "defaults.updateLabel": "更新",
  "defaults.inputPlaceholder": "あなたが書くのを待っています...",
};

// Type for other locale files: enforces the exact key set at build time
// while leaving the values free-form.
export type Translations = Record<keyof typeof ja, string>;
export default ja;
