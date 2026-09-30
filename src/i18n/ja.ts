// Japanese translations (source of truth). Other locale files match this key structure via `satisfies`.
const ja = {
  "settings.section.basic": "基本設定",
  "settings.section.advanced": "詳細設定",
  "settings.section.tagrules": "タグ別ルール設定",

  "settings.item.viewPlacement.name": "表示位置",
  "settings.item.viewPlacement.desc": "Wrotを表示する場所を指定します。",
  "settings.option.viewPlacement.left": "左サイドバー",
  "settings.option.viewPlacement.right": "右サイドバー",
  "settings.option.viewPlacement.main": "メインエリア",
  "settings.item.openOnStartup.name": "起動時に開く",
  "settings.item.openOnStartup.desc": "Obsidianの起動時に、Wrotを手前に表示します。",

  "settings.item.followFontSize.name": "Obsidianのフォントサイズに追従",
  "settings.item.followFontSize.desc":
    "オンにすると、Obsidianの外観設定で指定した文字サイズに合わせます。",

  "settings.item.headerDateFormat.name": "ヘッダー日付表示形式",
  "settings.item.headerDateFormat.desc": "YYYY, MM, DD などが使用できます。\n空欄にすると初期値に戻ります。",

  "settings.item.timestampFormat.name": "タイムスタンプ表示形式",
  "settings.item.timestampFormat.desc": "YYYY, MM, DD, HH, mm, ss が使用できます。",

  "settings.item.bgColorLight.name": "背景色（ライトモード）",
  "settings.item.bgColorLight.desc": "投稿と投稿フォームの背景に使用されます。",
  "settings.item.textColorLight.name": "文字色（ライトモード）",
  "settings.item.textColorLight.desc": "テキストとアイコンに使用されます。",
  "settings.item.bgColorDark.name": "背景色（ダークモード）",
  "settings.item.bgColorDark.desc": "投稿と投稿フォームの背景に使用されます。",
  "settings.item.textColorDark.name": "文字色（ダークモード）",
  "settings.item.textColorDark.desc": "テキストとアイコンに使用されます。",

  "settings.item.submitLabel.name": "投稿ボタンのテキスト",
  "settings.item.submitLabel.desc": "空欄にするとアイコンのみ表示されます（アイコン設定時のみ）。",
  "settings.item.submitIcon.name": "投稿ボタンのアイコン",
  // {linkOpen}/{linkClose} placeholders mark the part wrapped in an anchor element.
  "settings.item.submitIcon.desc": "アイコン名は {linkOpen}こちら{linkClose} からコピーできます。\n空欄にすると非表示になります。",
  "settings.item.updateLabel.name": "更新ボタンのテキスト",
  "settings.item.updateLabel.desc": "投稿の編集時に表示されます。\n空欄にするとアイコンのみ表示されます（アイコン設定時のみ）。",
  "settings.item.updateIcon.name": "更新ボタンのアイコン",
  "settings.item.updateIcon.desc": "アイコン名は {linkOpen}こちら{linkClose} からコピーできます。\n空欄にすると投稿ボタンと同じアイコンになります。",
  "settings.item.submitGradient.name": "投稿フォームのグラデーション",
  "settings.item.submitGradient.desc": "オンにすると、投稿フォームのアクセントがグラデーションになります。",
  "settings.item.submitGradientMode.name": "グラデーションの明るさ",
  "settings.item.submitGradientMode.desc": "自動では、アクセントカラーの明るさに合わせて切り替わります。",
  "settings.option.submitGradientMode.auto": "自動",
  "settings.option.submitGradientMode.light": "明るく",
  "settings.option.submitGradientMode.dark": "暗く",
  "settings.item.inputPlaceholder.name": "投稿フォームの空欄メッセージ",
  "settings.item.inputPlaceholder.desc": "空欄にするとメッセージを非表示にします。",

  "settings.item.tagSuggest.name": "タグ入力補完",
  "settings.item.tagSuggest.desc":
    "# に続けて入力した際に候補を表示します。\nオフにすると、これまでに学習した候補もリセットされます。",

  "settings.item.pinLimit.name": "ピン留めの上限",
  "settings.item.pinLimit.desc": "「ピン留め」と「あとでピン留め」の上限は個別に設定されます。\n上限を下げた場合、超過した分のピン留めは解除されます。",
  "settings.option.pinLimit.1": "1 件",
  "settings.option.pinLimit.3": "3 件",
  "settings.option.pinLimit.5": "5 件",
  "settings.item.pinFixed.name": "ピン留めを上に固定",
  "settings.item.pinFixed.desc": "オフにすると、ピン留めされた投稿もタイムラインと一緒にスクロールします。",

  "settings.item.ogp.name": "URLプレビュー",
  "settings.item.ogp.desc": "URLからプレビュー情報を取得して表示します。\nオフにすると外部への通信を行いません。",

  "settings.item.checkStrikethrough.name": "チェック済みの取り消し線",
  "settings.item.checkStrikethrough.desc": "オフにすると、チェック後も文字に取り消し線が引かれません。",

  "settings.item.calendarDayShape.name": "日付ボタンの形",
  "settings.item.calendarDayShape.desc": "カレンダーに表示される日付の形状を指定します。",
  "settings.option.calendarDayShape.circle": "円形",
  "settings.option.calendarDayShape.rounded": "角丸",
  "settings.option.calendarDayShape.square": "正方形",

  "settings.item.showCalendarButton.name":"カレンダーボタンを表示",
  "settings.item.showCalendarButton.desc":
    "オンにすると、日付ナビゲーションから任意の日付にジャンプできるようになります。",

  "settings.item.showPostDelete.name": "削除ボタンを表示",
  "settings.item.showPostDelete.desc":
    "オンにすると、投稿メニューに削除ボタンを追加します。\n削除した投稿は復元できません。添付画像は削除されません。",

  "settings.item.useCustomAttachmentFolder.name": "画像の保存先を指定",
  "settings.item.useCustomAttachmentFolder.desc": "Wrotから追加した画像のみが対象になります。",

  "settings.item.attachmentFolder.name": "保存先フォルダ",
  "settings.item.attachmentFolder.desc": "指定したフォルダが存在しない場合は、Obsidianの標準設定に従います。",
  "settings.item.attachmentFolder.placeholder": "フォルダを選択",
  "settings.item.shrinkImages.name": "画像を圧縮して保存",
  "settings.item.shrinkImages.desc": "添付画像を圧縮し、位置情報等を削除して保存します。\nGIFは対象外です。",
  "settings.item.postHeading.name": "テンプレートの見出し指定",
  "settings.item.postHeading.desc": "選んだ見出しの下に投稿が追加されます。",
  "settings.option.postHeading.none": "指定なし",

  "settings.item.tagColorRules.name": "タグ別ルールを使う",
  "settings.item.tagColorRules.desc":
    "タグごとに投稿の色や本体統合の扱いなどを変更できます。\n色は、本文中で先に登場したタグのものが優先されます。",

  "settings.tagRule.label": "ルール {n}",
  "settings.tagRule.tag.name": "タグ",
  "settings.tagRule.tag.desc": "# は省略できます。",
  "settings.tagRule.tag.placeholder": "タグ名",
  "settings.tagRule.bg.name": "背景色",
  "settings.tagRule.bg.desc": "投稿の背景色に適用されます。",
  "settings.tagRule.fg.name": "文字色",
  "settings.tagRule.fg.desc": "タグ、リンク、URLの色はアクセントカラーの設定が適用されます。",
  "settings.tagRule.accent.name": "アクセントカラー",
  "settings.tagRule.accent.desc": "未設定の場合はテーマのアクセントカラーが適用されます。",
  "settings.tagRule.sub.name": "サブカラー",
  "settings.tagRule.sub.desc": "タイムスタンプやリストマーカーなどの色を指定します。\n未設定の場合は自動で算出されます。",
  "settings.tagRule.scope.buttons.name": "タイムスタンプ・メニュー・ピンにサブカラーを適用",
  "settings.tagRule.scope.buttons.desc": "オフにすると、自動で設定された色が適用されます。",
  "settings.tagRule.scope.quote.name": "引用にサブカラーを適用",
  "settings.tagRule.scope.quote.desc": "オフにすると、自動で設定された色が適用されます。",
  "settings.tagRule.scope.list.name": "リスト・チェックボックスにサブカラーを適用",
  "settings.tagRule.scope.list.desc": "オフにすると、自動で設定された色が適用されます。",
  "settings.tagRule.scope.ogp.name": "OGPカードにサブカラーを適用",
  "settings.tagRule.scope.ogp.desc": "オフにすると、自動で設定された色が適用されます。",
  "settings.item.graphTags.name": "タグの本体統合",
  "settings.item.graphTags.desc": "グラフビューやタグ検索（tag:）の対象に含めます。\nオフにすると、Wrot内でのみ有効なタグになります。",
  "settings.tagRule.noIntegration.name": "本体統合から除外",
  "settings.tagRule.noIntegration.desc": "オンにすると、このタグはWrot内でのみ有効になります。",
  "settings.tagRule.hideTimeline.name": "タイムラインに非表示",
  "settings.tagRule.hideTimeline.desc":
    "オンにすると、このタグを含む投稿がタイムラインに表示されなくなります。\nデイリーノートには保存されます。",
  "settings.tagRule.protectDelete.name": "削除ボタンを無効にする",
  "settings.tagRule.protectDelete.desc":
    "オンにすると、このタグを含む投稿の削除を禁止します。",
  "settings.tagRule.button.add": "ルールを追加",
  "settings.item.toolbarEdit.name": "ツールバーの編集ボタンを表示",
  "settings.item.toolbarEdit.desc": "オンにすると、ツールバーのメニューに編集ボタンを追加します。",
  "settings.item.resetToolbar.name": "ツールバーを初期化する",
  "settings.item.resetToolbar.desc": "ツールバーの並び順と表示を初期状態に戻します。",
  "settings.item.resetToolbar.button": "初期化",
  // Shown on the same row after the first press, in place of the label above.
  "settings.item.resetToolbar.confirm": "もう一度押すと初期化",

  "view.toolbarAction.image": "画像",
  "view.toolbarAction.embed": "埋め込み",
  "view.toolbarAction.bold": "太字",
  "view.toolbarAction.italic": "斜体",
  "view.toolbarAction.list": "リスト",
  "view.toolbarAction.check": "チェックリスト",
  "view.toolbarAction.ol": "番号付きリスト",
  "view.toolbarAction.more": "その他",
  "view.toolbarEdit.done": "編集を確定",
  "view.toolbarEdit.cancel": "ツールバーの編集をキャンセル",

  "view.formatMenu.editToolbar": "ツールバーを編集",
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
  "view.postMenu.pinLimitHint": "ピン留めできるのは{limit}件までです。",
  "view.postMenu.schedulePin": "あとでピン留め",
  "view.postMenu.delete": "削除",
  // Shown on the same row after the first press, in place of the label above.
  "view.postMenu.deleteConfirm": "もう一度押すと削除",

  "view.dateNav.today": "今日",
  // Suffix appended to the date label; keyed so each locale can restyle it, brackets included.
  "view.dateNav.todaySuffix": "（今日）",

  "view.empty.noMemos": "表示できるメモがありません",
  "view.notice.saveFailed": "メモの保存に失敗しました: {error}",
  "view.notice.postHeadingMissing": "このノートには設定した見出しが無いため、末尾に追加しました",
  "view.notice.postHeadingNoTemplate": "デイリーノートのテンプレートが見つからないため、テンプレートの見出し指定を「指定なし」に戻しました",
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
  "defaults.timestampFormat": "YYYY/MM/DD HH:mm:ss",
  "defaults.submitLabel": "投稿",
  "defaults.updateLabel": "更新",
  "defaults.inputPlaceholder": "あなたが書くのを待っています...",
};

// Type for other locale files: enforces the exact key set at build time
// while leaving the values free-form.
export type Translations = Record<keyof typeof ja, string>;
export default ja;
