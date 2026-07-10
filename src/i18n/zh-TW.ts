import type { Translations } from "./ja";

// Traditional Chinese (Taiwan) translations. Translated via Nani.
const zhTW = {
  "settings.section.basic": "基本設定",
  "settings.section.advanced": "進階設定",
  "settings.section.tagrules": "標籤規則設定",

  "settings.item.viewPlacement.name": "顯示位置",
  "settings.item.viewPlacement.desc": "選擇 Wrot 面板的顯示位置。",
  "settings.option.viewPlacement.left": "左側欄",
  "settings.option.viewPlacement.right": "右側欄",
  "settings.option.viewPlacement.main": "主區域",

  "settings.item.followFontSize.name": "自動適應 Obsidian 字體大小",
  "settings.item.followFontSize.desc":
    "使 Wrot 的文字大小與 Obsidian 的外觀設定保持一致。",

  "settings.item.headerDateFormat.name": "標題日期顯示格式",
  "settings.item.headerDateFormat.desc":
    "指定顯示在日期導覽列中的日期格式。（可以使用 YYYY, MM, DD 等）留空則恢復成預設值。",

  "settings.item.timestampFormat.name": "時間戳記顯示格式",
  "settings.item.timestampFormat.desc":
    "指定貼文的日期時間格式。（可以使用 YYYY, MM, DD, HH, mm, ss）",

  "settings.item.bgColorLight.name": "背景顏色（淺色模式）",
  "settings.item.bgColorLight.desc":
    "設定淺色主題下貼文與貼文表單的背景顏色。",
  "settings.item.textColorLight.name": "文字顏色（淺色模式）",
  "settings.item.textColorLight.desc":
    "設定淺色主題下文字與圖示的顏色。",
  "settings.item.bgColorDark.name": "背景顏色（深色模式）",
  "settings.item.bgColorDark.desc":
    "設定深色主題下貼文與貼文表單的背景顏色。",
  "settings.item.textColorDark.name": "文字顏色（深色模式）",
  "settings.item.textColorDark.desc":
    "設定深色主題下文字與圖示的顏色。",

  "settings.item.submitLabel.name": "發佈按鈕文字",
  "settings.item.submitLabel.desc":
    "可以更改發佈按鈕上顯示的文字。",
  "settings.item.submitIcon.name": "發佈按鈕圖示",
  "settings.item.submitIcon.desc":
    "可以更改發佈按鈕的圖示。請從 {linkOpen}這裡{linkClose} 複製圖示名稱。留空則隱藏圖示。",
  "settings.item.inputPlaceholder.name": "貼文表單空白提示訊息",
  "settings.item.inputPlaceholder.desc":
    "可以更改貼文表單為空時顯示的文字（佔位符）。留空則隱藏。",

  "settings.item.tagSuggest.name": "標籤自動補全",
  "settings.item.tagSuggest.desc":
    "在輸入框中輸入 # 時，會將過去貼文中使用過的標籤顯示為候選。垃圾桶圖示可清除補全候選。",
  "settings.item.tagSuggestClear.name": "清除標籤補全候選",
  "settings.notice.tagSuggestCleared": "已清除標籤補全候選",
  "settings.item.tagSuggestClear.confirmLabel": "再按一次以確認",

  "settings.item.pinLimit.name": "釘選上限",
  "settings.item.pinLimit.desc":
    "設定可固定在時間軸上的筆記最大數量。",
  "settings.option.pinLimit.1": "1 件",
  "settings.option.pinLimit.3": "3 件",
  "settings.option.pinLimit.5": "5 件",

  "settings.item.ogp.name": "URL 預覽",
  "settings.item.ogp.desc":
    "自動從筆記內的 URL 取得 OGP 資訊並顯示。關閉後將不進行外部通訊。",

  "settings.item.checkStrikethrough.name": "已勾選項目加刪除線",
  "settings.item.checkStrikethrough.desc":
    "在勾選框為 ON 的項目上顯示刪除線。",

  "settings.item.calendarDayShape.name": "日期按鈕形狀",
  "settings.item.calendarDayShape.desc": "選擇行事曆中日期按鈕的形狀。",
  "settings.option.calendarDayShape.circle": "圓形",
  "settings.option.calendarDayShape.rounded": "圓角",
  "settings.option.calendarDayShape.square": "方形",

  "settings.item.showCalendarButton.name": "顯示日曆按鈕",
  "settings.item.showCalendarButton.desc":
    "在日期導覽列中顯示日曆按鈕，點擊即可快速跳轉至指定日期。",

  "settings.item.tagColorRules.name": "使用標籤規則",
  "settings.item.tagColorRules.desc":
    "按標籤設定規則：變更包含指定標籤之貼文的顏色，以及從標籤整合中排除。顏色方面，若符合多個規則，將優先適用本文中先出現的標籤。",

  "settings.tagRule.label": "規則 {n}",
  "settings.tagRule.tag.name": "標籤",
  "settings.tagRule.tag.desc":
    "輸入想要變更顏色的標籤名稱。（可省略 #）",
  "settings.tagRule.tag.placeholder": "標籤名稱",
  "settings.tagRule.bg.name": "背景顏色",
  "settings.tagRule.bg.desc":
    "設定包含此標籤之貼文的背景顏色。",
  "settings.tagRule.fg.name": "文字顏色",
  "settings.tagRule.fg.desc":
    "設定包含此標籤之貼文的正文文字顏色。（標籤、連結、URL 由強調色側設定）",
  "settings.tagRule.accent.name": "強調色",
  "settings.tagRule.accent.desc":
    "設定標籤、連結、URL、複製完成圖示等使用強調色的元素顏色。未設定時將使用主題的強調色。",
  "settings.tagRule.sub.name": "輔助色",
  "settings.tagRule.sub.desc":
    "統一設定時間戳記、圖示、清單標記、引用線、勾選框等輔助元素的顏色。未設定時將根據背景顏色與文字顏色自動計算。",
  "settings.tagRule.scope.buttons.name":
    "於時間戳記、選單、釘選套用輔助色",
  "settings.tagRule.scope.buttons.desc":
    "關閉時將使用自動設定的顏色。",
  "settings.tagRule.scope.quote.name": "於引用套用輔助色",
  "settings.tagRule.scope.quote.desc":
    "關閉時將使用自動設定的顏色。",
  "settings.tagRule.scope.list.name": "於清單、勾選框套用輔助色",
  "settings.tagRule.scope.list.desc":
    "關閉時將使用自動設定的顏色。",
  "settings.tagRule.scope.ogp.name": "於 OGP 卡片套用輔助色",
  "settings.tagRule.scope.ogp.desc":
    "關閉時將使用自動設定的顏色。",
  "settings.item.graphTags.name": "標籤整合",
  "settings.item.graphTags.desc": "將備忘錄標籤與 Obsidian 整合。\n備忘錄內的標籤會像一般標籤一樣顯示在關係圖中，也能被標籤搜尋（tag:）命中。\n停用後，標籤僅保留在 Wrot 內。",
  "settings.tagRule.noIntegration.name": "從標籤整合中排除",
  "settings.tagRule.noIntegration.desc": "開啟後，寫在備忘錄內的此規則標籤將不參與標籤整合，僅保留在 Wrot 內。",
  "settings.tagRule.button.add": "新增規則",

  "view.formatMenu.code": "程式碼",
  "view.formatMenu.math": "數式",
  "view.formatMenu.quote": "引用",
  "view.formatMenu.link": "連結",
  "view.formatMenu.strikethrough": "刪除線",
  "view.formatMenu.highlight": "高亮",
  "view.formatMenu.settings": "設定",

  "view.postMenu.copy": "複製",
  "view.postMenu.quotePost": "引用貼文",
  "view.postMenu.unpin": "取消釘選",
  "view.postMenu.pin": "釘選",
  "view.postMenu.pinLimitHint": "釘選上限為 {limit} 件。",

  "view.dateNav.today": "今天",
  "view.dateNav.todaySuffix": "（今天）",

  "view.empty.noMemos": "沒有筆記",
  "view.notice.saveFailed": "筆記儲存失敗：{error}",
  "view.notice.searchPluginNotFound": "找不到搜尋插件",

  "view.image.removeAria": "刪除圖片",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "YYYY[年]M[月]",

  "defaults.headerDateFormat": "YYYY/MM/DD",
  "defaults.submitLabel": "發佈",
  "defaults.inputPlaceholder": "在想些什麼？",
} satisfies Translations;

export default zhTW;
