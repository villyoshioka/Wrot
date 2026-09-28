import type { Translations } from "./ja";

// Traditional Chinese (Taiwan) translations. Translated via Nani.
const zhTW = {
  "settings.section.basic": "一般設定",
  "settings.section.advanced": "進階設定",
  "settings.section.tagrules": "標籤規則設定",

  "settings.item.viewPlacement.name": "顯示位置",
  "settings.item.viewPlacement.desc": "指定 Wrot 的顯示位置。",
  "settings.option.viewPlacement.left": "左側側邊欄",
  "settings.option.viewPlacement.right": "右側側邊欄",
  "settings.option.viewPlacement.main": "主要區域",
  "settings.item.openOnStartup.name": "啟動時開啟",
  "settings.item.openOnStartup.desc": "開啟後，啟動 Obsidian 時將 Wrot 顯示在最上層。",

  "settings.item.followFontSize.name": "依照 Obsidian 字體大小",
  "settings.item.followFontSize.desc": "開啟後，跟隨 Obsidian 外觀設定的字體大小。",

  "settings.item.headerDateFormat.name": "標題日期格式",
  "settings.item.headerDateFormat.desc": "可使用 YYYY、MM、DD 等。 \n留空則恢復為預設值。",

  "settings.item.timestampFormat.name": "時間戳記格式",
  "settings.item.timestampFormat.desc": "可使用 YYYY、MM、DD、HH、mm、ss。",

  "settings.item.bgColorLight.name": "背景顏色（淺色模式）",
  "settings.item.bgColorLight.desc": "套用於貼文與輸入框。",
  "settings.item.textColorLight.name": "文字顏色（淺色模式）",
  "settings.item.textColorLight.desc": "套用於文字與圖示。",
  "settings.item.bgColorDark.name": "背景顏色（深色模式）",
  "settings.item.bgColorDark.desc": "套用於貼文與輸入框。",
  "settings.item.textColorDark.name": "文字顏色（深色模式）",
  "settings.item.textColorDark.desc": "套用於文字與圖示。",

  "settings.item.submitLabel.name": "發布按鈕文字",
  "settings.item.submitLabel.desc": "留空則僅顯示圖示（僅限已設定圖示時）。",
  "settings.item.submitIcon.name": "發布按鈕圖示",
  "settings.item.submitIcon.desc": "圖示名稱可從{linkOpen}這裡{linkClose}複製。 \n留空則隱藏圖示。",
  "settings.item.updateLabel.name": "更新按鈕文字",
  "settings.item.updateLabel.desc": "編輯貼文時使用。 \n留空則僅顯示圖示（僅限已設定圖示時）。",
  "settings.item.updateIcon.name": "更新按鈕圖示",
  "settings.item.updateIcon.desc": "圖示名稱可從{linkOpen}這裡{linkClose}複製。 \n留空則使用發布按鈕的圖示。",
  "settings.item.submitGradient.name": "發布表單漸層效果",
  "settings.item.submitGradient.desc": "開啟後，發布表單的重點部分將套用漸層效果。",
  "settings.item.inputPlaceholder.name": "輸入框提示文字",
  "settings.item.inputPlaceholder.desc": "留空則隱藏。",

  "settings.item.tagSuggest.name": "標籤自動補全",
  "settings.item.tagSuggest.desc": "在輸入 # 後會顯示候選標籤。 \n關閉後將清除已記錄的候選項目。",

  "settings.item.pinLimit.name": "置頂數量上限",
  "settings.item.pinLimit.desc": "「置頂」與「稍後置頂」的上限各自獨立計算。\n調低上限時，超出數量的置頂項目將被取消。",
  "settings.option.pinLimit.1": "1 則",
  "settings.option.pinLimit.3": "3 則",
  "settings.option.pinLimit.5": "5 則",
  "settings.item.pinFixed.name": "固定置頂貼文於頂端",
  "settings.item.pinFixed.desc": "關閉後，置頂的貼文將隨動態時報一起滾動。",

  "settings.item.ogp.name": "網址預覽",
  "settings.item.ogp.desc": "從網址擷取預覽資訊。 \n關閉後將不會進行外部連線。",

  "settings.item.checkStrikethrough.name": "已勾選項目加上刪除線",
  "settings.item.checkStrikethrough.desc": "關閉後，已勾選的項目不會顯示刪除線。",

  "settings.item.calendarDayShape.name": "日期按鈕形狀",
  "settings.item.calendarDayShape.desc": "套用於日曆上的日期。",
  "settings.option.calendarDayShape.circle": "圓形",
  "settings.option.calendarDayShape.rounded": "圓角",
  "settings.option.calendarDayShape.square": "方形",

  "settings.item.showCalendarButton.name": "顯示日曆按鈕",
  "settings.item.showCalendarButton.desc": "開啟後，可從日期導覽列前往任意日期。",

  "settings.item.showPostDelete.name": "顯示刪除按鈕",
  "settings.item.showPostDelete.desc": "開啟後，貼文選單中將新增刪除按鈕。 \n刪除後無法還原。附加的圖片不會被刪除。",

  "settings.item.useCustomAttachmentFolder.name": "指定圖片儲存位置",
  "settings.item.useCustomAttachmentFolder.desc": "僅適用於透過 Wrot 新增的圖片。",

  "settings.item.attachmentFolder.name": "儲存資料夾",
  "settings.item.attachmentFolder.desc": "若資料夾不存在，將依循 Obsidian 的預設設定。",
  "settings.item.attachmentFolder.placeholder": "選擇資料夾",
  "settings.item.shrinkImages.name": "壓縮圖片後儲存",
  "settings.item.shrinkImages.desc": "壓縮附加的圖片，並在儲存前移除位置等中繼資料。\n不包含 GIF 檔。",
  "settings.item.postHeading.name": "指定範本標題",
  "settings.item.postHeading.desc": "貼文將新增至所選的標題下方。",
  "settings.option.postHeading.none": "不指定",

  "settings.item.tagColorRules.name": "啟用標籤規則",
  "settings.item.tagColorRules.desc": "可針對各標籤自訂顏色與整合等設定。 \n若有多個標籤，將優先套用內文中先出現的標籤顏色。",

  "settings.tagRule.label": "規則 {n}",
  "settings.tagRule.tag.name": "標籤",
  "settings.tagRule.tag.desc": "可省略 # 字號。",
  "settings.tagRule.tag.placeholder": "標籤名稱",
  "settings.tagRule.bg.name": "背景顏色",
  "settings.tagRule.bg.desc": "套用於貼文背景。",
  "settings.tagRule.fg.name": "文字顏色",
  "settings.tagRule.fg.desc": "標籤、連結與網址將套用重點色。",
  "settings.tagRule.accent.name": "重點色",
  "settings.tagRule.accent.desc": "未設定時將套用外觀主題的重點色。",
  "settings.tagRule.sub.name": "次要顏色",
  "settings.tagRule.sub.desc": "時間戳記、清單符號等元素的顏色。 \n未設定時將自動計算。",
  "settings.tagRule.scope.buttons.name":
    "於時間戳記、選單、置頂套用次要顏色",
  "settings.tagRule.scope.buttons.desc":
    "關閉時將使用系統自動設定的顏色。",
  "settings.tagRule.scope.quote.name": "於引言套用次要顏色",
  "settings.tagRule.scope.quote.desc":
    "關閉時將使用系統自動設定的顏色。",
  "settings.tagRule.scope.list.name": "於清單、核取方塊套用次要顏色",
  "settings.tagRule.scope.list.desc":
    "關閉時將使用系統自動設定的顏色。",
  "settings.tagRule.scope.ogp.name": "於 OGP 卡片套用次要顏色",
  "settings.tagRule.scope.ogp.desc":
    "關閉時將使用系統自動設定的顏色。",
  "settings.item.graphTags.name": "標籤整合",
  "settings.item.graphTags.desc": "將標籤納入關聯圖檢視與標籤搜尋（tag:）。 \n關閉時僅在 Wrot 內生效。",
  "settings.tagRule.noIntegration.name": "排除於標籤整合之外",
  "settings.tagRule.noIntegration.desc": "開啟後，此標籤僅在 Wrot 內生效。",
  "settings.tagRule.hideTimeline.name": "從動態時報中隱藏",
  "settings.tagRule.hideTimeline.desc": "開啟後，包含此標籤的貼文將不再顯示於動態時報。 \n每日筆記中仍會保留內容。",
  "settings.tagRule.protectDelete.name": "停用刪除按鈕",
  "settings.tagRule.protectDelete.desc": "開啟後，將無法刪除包含此標籤的貼文。",
  "settings.tagRule.button.add": "新增規則",
  "settings.item.toolbarEdit.name": "顯示工具列編輯按鈕",
  "settings.item.toolbarEdit.desc": "開啟後，工具列選單中將新增編輯工具列的選項。",
  "settings.item.resetToolbar.name": "重設工具列",
  "settings.item.resetToolbar.desc": "將工具列的排序與顯示狀態重設為預設值。",
  "settings.item.resetToolbar.button": "重設",
  // Shown on the same row after the first press, in place of the label above.
  "settings.item.resetToolbar.confirm": "再按一次以確認重設",

  "view.toolbarAction.image": "圖片",
  "view.toolbarAction.embed": "嵌入",
  "view.toolbarAction.bold": "粗體",
  "view.toolbarAction.italic": "斜體",
  "view.toolbarAction.list": "無序清單",
  "view.toolbarAction.check": "待辦清單",
  "view.toolbarAction.ol": "編號清單",
  "view.toolbarAction.more": "更多",
  "view.toolbarEdit.done": "完成",
  "view.toolbarEdit.cancel": "取消編輯工具列",

  "view.formatMenu.editToolbar": "編輯工具列",
  "view.formatMenu.code": "程式碼",
  "view.formatMenu.math": "公式",
  "view.formatMenu.quote": "引言",
  "view.formatMenu.link": "連結",
  "view.formatMenu.strikethrough": "刪除線",
  "view.formatMenu.highlight": "螢光標示",
  "view.formatMenu.settings": "設定",

  "view.postMenu.copy": "複製",
  "view.postMenu.quotePost": "引用貼文",
  "view.postMenu.edit": "編輯",
  "view.postMenu.cancelEdit": "取消編輯",
  "view.postMenu.unpin": "取消置頂",
  "view.postMenu.pin": "置頂",
  "view.postMenu.pinLimitHint": "置頂數量上限為 {limit} 則。",
  "view.postMenu.schedulePin": "稍後置頂",
  "view.postMenu.delete": "刪除",
  // Shown on the same row after the first press, in place of the label above.
  "view.postMenu.deleteConfirm": "再按一次以確認刪除",

  "view.dateNav.today": "今天",
  "view.dateNav.todaySuffix": "（今天）",

  "view.empty.noMemos": "沒有可顯示的貼文",
  "view.notice.saveFailed": "貼文儲存失敗：{error}",
  "view.notice.postHeadingMissing": "此筆記中找不到指定的標題，已新增至文末",
  "view.notice.postHeadingNoTemplate": "找不到每日筆記範本，已將範本標題重設為「不指定」",
  "view.notice.searchPluginNotFound": "核心外掛「搜尋」未啟用。",

  "view.image.removeAria": "移除圖片",

  // Placeholder body of a quote card whose original post is gone.
  "quote.card.notFound": "（找不到原始貼文）",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "YYYY[年]M[月]",

  "defaults.headerDateFormat": "YYYY/MM/DD",

  "defaults.timestampFormat": "YYYY/MM/DD HH:mm:ss",
  "defaults.submitLabel": "發布",
  "defaults.updateLabel": "更新",
  "defaults.inputPlaceholder": "在想些什麼？",
} satisfies Translations;

export default zhTW;
