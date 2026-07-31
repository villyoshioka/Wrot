// Japanese translations (source of truth). Other locale files match this key structure via `satisfies`.
const ja = {
  "settings.section.basic": "基本設定",
  "settings.section.advanced": "詳細設定",
  "settings.section.tagrules": "タグ別ルール設定",

  "settings.item.viewPlacement.name": "表示位置",
  "settings.item.viewPlacement.desc": "Wrotパネルの表示位置を選びます。",
  "settings.option.viewPlacement.left": "左サイドバー",
  "settings.option.viewPlacement.right": "右サイドバー",
  "settings.option.viewPlacement.main": "メインエリア",

  "settings.item.followFontSize.name": "Obsidianのフォントサイズに追従",
  "settings.item.followFontSize.desc": "Obsidianの外観設定にWrotの文字サイズを合わせます。",

  "settings.item.headerDateFormat.name": "ヘッダー日付表示形式",
  "settings.item.headerDateFormat.desc":
    "日付ナビのフォーマットを指定します。（YYYY, MM, DD などが使えます）\n空欄で初期値に戻ります。",

  "settings.item.timestampFormat.name": "タイムスタンプ表示形式",
  "settings.item.timestampFormat.desc":
    "投稿の日時フォーマットを指定します。\n（YYYY, MM, DD, HH, mm, ss が使えます）",

  "settings.item.bgColorLight.name": "背景色（ライトモード）",
  "settings.item.bgColorLight.desc": "ライトテーマでの投稿・投稿フォームの背景色を設定します。",
  "settings.item.textColorLight.name": "文字色（ライトモード）",
  "settings.item.textColorLight.desc": "ライトテーマでのテキスト・アイコンの色を設定します。",
  "settings.item.bgColorDark.name": "背景色（ダークモード）",
  "settings.item.bgColorDark.desc": "ダークテーマでの投稿・投稿フォームの背景色を設定します。",
  "settings.item.textColorDark.name": "文字色（ダークモード）",
  "settings.item.textColorDark.desc": "ダークテーマでのテキスト・アイコンの色を設定します。",

  "settings.item.submitLabel.name": "投稿ボタンのテキスト",
  "settings.item.submitLabel.desc": "投稿ボタンに表示するテキストを変更できます。\n空欄にするとアイコンのみの表示にできます(アイコン設定時のみ)。",
  "settings.item.submitIcon.name": "投稿ボタンのアイコン",
  // {linkOpen}/{linkClose} placeholders mark the part wrapped in an anchor element.
  "settings.item.submitIcon.desc":
    "投稿ボタンのアイコンを変更できます。\nアイコン名は {linkOpen}こちら{linkClose} からコピーできます。\n空欄にすると非表示になります。",
  "settings.item.inputPlaceholder.name": "投稿フォームの空欄メッセージ",
  "settings.item.inputPlaceholder.desc":
    "投稿フォームが空の時に表示されるテキストを変更できます。\n空欄にすると非表示になります。",

  "settings.item.tagSuggest.name": "タグ入力補完",
  "settings.item.tagSuggest.desc":
    "# に続けて入力すると、過去に使ったタグを候補表示します。オフにすると覚えた候補も消えます。",

  "settings.item.pinLimit.name": "ピン留めの上限",
  "settings.item.pinLimit.desc": "タイムラインに固定できるメモの上限を設定します。",
  "settings.option.pinLimit.1": "1 件",
  "settings.option.pinLimit.3": "3 件",
  "settings.option.pinLimit.5": "5 件",

  "settings.item.ogp.name": "URLプレビュー",
  "settings.item.ogp.desc":
    "メモ内のURLからOGP情報を自動取得して表示します。\nオフにすると外部通信を行いません。",

  "settings.item.checkStrikethrough.name": "チェック済みの取り消し線",
  "settings.item.checkStrikethrough.desc": "チェックボックスがONの項目に取り消し線を表示します。",

  "settings.item.calendarDayShape.name": "日付ボタンの形",
  "settings.item.calendarDayShape.desc": "カレンダーの日付ボタンの形を選びます。",
  "settings.option.calendarDayShape.circle": "円形",
  "settings.option.calendarDayShape.rounded": "角丸",
  "settings.option.calendarDayShape.square": "正方形",

  "settings.item.showCalendarButton.name":"カレンダーボタンを表示",
  "settings.item.showCalendarButton.desc":
    "日付ナビにカレンダーボタンを表示します。\nタップで任意の日付へジャンプできます。",

  "settings.item.tagColorRules.name": "タグ別ルールを使う",
  "settings.item.tagColorRules.desc":
    "タグごとに投稿の色や本体統合の扱いを設定します。色は本文で先に出たタグが優先されます。",

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
    "タグ・リンク・URLなどに使う色です。未設定時はテーマのアクセントカラーになります。",
  "settings.tagRule.sub.name": "サブカラー",
  "settings.tagRule.sub.desc":
    "タイムスタンプ・リストマーカーなどサブ要素の色です。\n未設定時は背景色と文字色から自動算出します。",
  "settings.tagRule.scope.buttons.name": "タイムスタンプ・メニュー・ピンにサブカラーを適用",
  "settings.tagRule.scope.buttons.desc": "オフのときは自動設定された色になります。",
  "settings.tagRule.scope.quote.name": "引用にサブカラーを適用",
  "settings.tagRule.scope.quote.desc": "オフのときは自動設定された色になります。",
  "settings.tagRule.scope.list.name": "リスト・チェックボックスにサブカラーを適用",
  "settings.tagRule.scope.list.desc": "オフのときは自動設定された色になります。",
  "settings.tagRule.scope.ogp.name": "OGPカードにサブカラーを適用",
  "settings.tagRule.scope.ogp.desc": "オフのときは自動設定された色になります。",
  "settings.item.graphTags.name": "タグの本体統合",
  "settings.item.graphTags.desc":
    "メモ内のタグをグラフビューやタグ検索（tag:）の対象にします。\nオフのときは、タグはWrotの中だけのものになります。",
  "settings.tagRule.noIntegration.name": "本体統合から除外",
  "settings.tagRule.noIntegration.desc":
    "オンにすると、メモ内に書いたこのルールのタグは本体統合の対象から外れ、\nWrotの中だけのものになります。",
  "settings.tagRule.hideTimeline.name": "タイムラインに非表示",
  "settings.tagRule.hideTimeline.desc":
    "オンにすると、このタグを含む投稿がタイムラインに出なくなります。デイリーノートには残ります。",
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
  "view.postMenu.unpin": "ピンを外す",
  "view.postMenu.pin": "ピン留め",
  "view.postMenu.pinLimitHint": "ピン留めは{limit}件までです。",

  "view.dateNav.today": "今日",
  // Suffix appended to the date label; keyed so each locale can restyle it, brackets included.
  "view.dateNav.todaySuffix": "（今日）",

  "view.empty.noMemos": "表示できるメモはありません",
  "view.notice.saveFailed": "メモの保存に失敗しました: {error}",
  "view.notice.searchPluginNotFound": "検索プラグインが見つかりません",

  "view.image.removeAria": "画像を削除",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  // Month/year label atop the calendar popover, as moment format tokens.
  // Literal chars (年/月) must be bracketed so moment does not parse them as tokens.
  "calendar.monthYearFormat": "YYYY[年]M[月]",

  // Locale-dependent defaults adopted on fresh install instead of DEFAULT_SETTINGS.
  "defaults.headerDateFormat": "YYYY年MM月DD日",
  "defaults.submitLabel": "投稿",
  "defaults.inputPlaceholder": "あなたが書くのを待っています...",
};

// Type for other locale files: enforces the exact key set at build time
// while leaving the values free-form.
export type Translations = Record<keyof typeof ja, string>;
export default ja;
