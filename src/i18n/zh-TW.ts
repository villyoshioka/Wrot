import type { Translations } from "./ja";

// Traditional Chinese (Taiwan) translations. Translated via Nani.
const zhTW = {
  "settings.section.basic": "一般設定",
  "settings.section.advanced": "進階設定",
  "settings.section.tagrules": "標籤專屬規則",

  "settings.item.viewPlacement.name": "顯示位置",
  "settings.item.viewPlacement.desc": "設定 Wrot 的顯示位置。",
  "settings.option.viewPlacement.left": "左側邊欄",
  "settings.option.viewPlacement.right": "右側邊欄",
  "settings.option.viewPlacement.main": "主編輯區",
  "command.openLeft": "在左側邊欄開啟",
  "command.openRight": "在右側邊欄開啟",
  "command.openMain": "在主編輯區開啟",
  "command.openSettings": "開啟設定",
  "settings.item.openOnStartup.name": "啟動時開啟",
  "settings.item.openOnStartup.desc": "Obsidian 啟動時在前景顯示 Wrot。",

  "settings.item.followFontSize.name": "跟隨 Obsidian 字型大小",
  "settings.item.followFontSize.desc":
    "開啟後，將套用 Obsidian 外觀設定的字型大小。",

  "settings.item.headerDateFormat.name": "頁首日期格式",
  "settings.item.headerDateFormat.desc": "可使用 YYYY、MM、DD 等。\n留空將還原為預設值。",

  "settings.item.timestampFormat.name": "時間戳記格式",
  "settings.item.timestampFormat.desc": "可使用 YYYY、MM、DD、HH、mm、ss。",

  "settings.item.bgColorLight.name": "背景顏色（淺色模式）",
  "settings.item.bgColorLight.desc": "用於貼文卡片與輸入框的背景。",
  "settings.item.textColorLight.name": "文字顏色（淺色模式）",
  "settings.item.textColorLight.desc": "用於內文與圖示。",
  "settings.item.bgColorDark.name": "背景顏色（深色模式）",
  "settings.item.bgColorDark.desc": "用於貼文卡片與輸入框的背景。",
  "settings.item.textColorDark.name": "文字顏色（深色模式）",
  "settings.item.textColorDark.desc": "用於內文與圖示。",

  "settings.item.submitLabel.name": "發布按鈕文字",
  "settings.item.submitLabel.desc": "若已設定圖示，留空時將僅顯示圖示。",
  "settings.item.submitIcon.name": "發布按鈕圖示",
  "settings.item.submitIcon.desc": "可從 {linkOpen}這裡{linkClose} 複製圖示名稱。\n留空則不顯示。",
  "settings.item.updateLabel.name": "更新按鈕文字",
  "settings.item.updateLabel.desc": "編輯貼文時顯示。\n若已設定圖示，留空時將僅顯示圖示。",
  "settings.item.updateIcon.name": "更新按鈕圖示",
  "settings.item.updateIcon.desc": "可從 {linkOpen}這裡{linkClose} 複製圖示名稱。\n留空時將沿用發布按鈕的圖示。",
  "settings.item.submitGradient.name": "輸入框漸層效果",
  "settings.item.submitGradient.desc": "開啟後，輸入框的強調色將變為漸層。",
  "settings.item.submitGradientMode.name": "漸層明暗模式",
  "settings.item.submitGradientMode.desc": "設為「自動」時，將依強調色的明暗切換。",
  "settings.option.submitGradientMode.auto": "自動",
  "settings.option.submitGradientMode.light": "偏亮",
  "settings.option.submitGradientMode.dark": "偏暗",
  "settings.item.inputPlaceholder.name": "輸入框預設提示文字",
  "settings.item.inputPlaceholder.desc": "留空則不顯示。",

  "settings.item.tagSuggest.name": "標籤自動補齊",
  "settings.item.tagSuggest.desc":
    "輸入 # 後顯示候選標籤。\n關閉後將清除已記錄的候選。",

  "settings.item.pinLimit.name": "置頂上限",
  "settings.item.pinLimit.desc": "分別套用於「置頂」與「稍後置頂」。\n調低上限時，超出數量的貼文將解除置頂。",
  "settings.option.pinLimit.1": "1 則",
  "settings.option.pinLimit.3": "3 則",
  "settings.option.pinLimit.5": "5 則",
  "settings.item.pinFixed.name": "固定置頂貼文",
  "settings.item.pinFixed.desc": "關閉後，置頂貼文會隨時間軸一同滾動。",

  "settings.item.ogp.name": "網址預覽卡片",
  "settings.item.ogp.desc": "從網址擷取預覽資訊。\n關閉後將不會連線外部網路。",

  "settings.item.checkStrikethrough.name": "已完成項目加上刪除線",
  "settings.item.checkStrikethrough.desc": "關閉後，勾選待辦項目時將不會套用刪除線。",

  "settings.item.calendarDayShape.name": "日期按鈕形狀",
  "settings.item.calendarDayShape.desc": "設定日曆中日期按鈕的外型。",
  "settings.option.calendarDayShape.circle": "圓形",
  "settings.option.calendarDayShape.rounded": "圓角",
  "settings.option.calendarDayShape.square": "正方形",

  "settings.item.showCalendarButton.name": "顯示日曆按鈕",
  "settings.item.showCalendarButton.desc":
    "開啟後，可從日期導覽列跳轉至任意日期。",

  "settings.item.showPostDelete.name": "顯示刪除按鈕",
  "settings.item.showPostDelete.desc":
    "開啟後，貼文選單中將加入刪除按鈕。\n刪除後無法復原，附加的圖片不會被刪除。",

  "settings.item.useCustomAttachmentFolder.name": "自訂圖片儲存路徑",
  "settings.item.useCustomAttachmentFolder.desc": "僅適用於透過 Wrot 新增的圖片。",

  "settings.item.attachmentFolder.name": "圖片儲存資料夾",
  "settings.item.attachmentFolder.desc": "若資料夾不存在，將依循 Obsidian 的預設設定。",
  "settings.item.attachmentFolder.placeholder": "選擇資料夾",
  "settings.item.shrinkImages.name": "壓縮並儲存圖片",
  "settings.item.shrinkImages.desc": "壓縮圖片並移除位置資訊等中繼資料。\n不包含 GIF。",
  "settings.item.postHeading.name": "插入至指定標題下",
  "settings.item.postHeading.desc": "貼文將加在所選標題下方。",
  "settings.option.postHeading.none": "不指定",

  "settings.item.tagColorRules.name": "啟用標籤自訂樣式",
  "settings.item.tagColorRules.desc":
    "可依標籤自訂貼文顏色及整合方式等。\n顏色以內文中最早出現的標籤為準。",

  "settings.tagRule.label": "規則 {n}",
  "settings.tagRule.tag.name": "標籤",
  "settings.tagRule.tag.desc": "開頭的 # 可省略。",
  "settings.tagRule.tag.placeholder": "標籤名稱",
  "settings.tagRule.bg.name": "背景顏色",
  "settings.tagRule.bg.desc": "用於貼文的背景。",
  "settings.tagRule.fg.name": "文字顏色",
  "settings.tagRule.fg.desc": "標籤、連結及網址使用強調色。",
  "settings.tagRule.accent.name": "強調色",
  "settings.tagRule.accent.desc": "未設定時套用主題的強調色。",
  "settings.tagRule.sub.name": "次要顏色",
  "settings.tagRule.sub.desc": "用於時間戳記與清單符號等。\n未設定時將自動設定。",
  "settings.tagRule.scope.buttons.name": "時間戳記、選單與置頂圖示套用次要顏色",
  "settings.tagRule.scope.buttons.desc": "關閉後將使用自動設定的顏色。",
  "settings.tagRule.scope.quote.name": "引用區塊套用次要顏色",
  "settings.tagRule.scope.quote.desc": "關閉後將使用自動設定的顏色。",
  "settings.tagRule.scope.list.name": "清單與核取方塊套用次要顏色",
  "settings.tagRule.scope.list.desc": "關閉後將使用自動設定的顏色。",
  "settings.tagRule.scope.ogp.name": "網址預覽卡片套用次要顏色",
  "settings.tagRule.scope.ogp.desc": "關閉後將使用自動設定的顏色。",
  "settings.item.graphTags.name": "整合至 Obsidian 全域標籤",
  "settings.item.graphTags.desc": "納入關聯圖檢視及標籤搜尋（tag:）。\n關閉後，標籤僅在 Wrot 內部生效。",
  "settings.tagRule.noIntegration.name": "排除於全域標籤之外",
  "settings.tagRule.noIntegration.desc": "開啟後，此標籤將僅在 Wrot 內部生效。",
  "settings.tagRule.hideTimeline.name": "從時間軸隱藏",
  "settings.tagRule.hideTimeline.desc":
    "開啟後，帶有此標籤的貼文不會顯示在時間軸上。\n每日筆記中仍會保留。",
  "settings.tagRule.protectDelete.name": "防止誤刪貼文",
  "settings.tagRule.protectDelete.desc":
    "開啟後，包含此標籤的貼文將無法被刪除。",
  "settings.tagRule.button.add": "新增規則",
  "settings.item.toolbarEdit.name": "顯示工具列自訂按鈕",
  "settings.item.toolbarEdit.desc": "開啟後，工具列選單中將顯示「編輯工具列」按鈕。",
  "settings.item.resetToolbar.name": "重設工具列",
  "settings.item.resetToolbar.desc": "將工具列的排序與顯示還原為初始狀態。",
  "settings.item.resetToolbar.button": "重設",
  "settings.item.resetToolbar.confirm": "再按一次以確定重設",

  "view.toolbarAction.image": "圖片",
  "view.toolbarAction.bold": "粗體",
  "view.toolbarAction.italic": "斜體",
  "view.toolbarAction.list": "無序清單",
  "view.toolbarAction.check": "待辦清單",
  "view.toolbarAction.ol": "編號清單",
  "view.toolbarAction.more": "更多",
  "view.toolbarEdit.done": "完成編輯",
  "view.toolbarEdit.cancel": "取消編輯",

  "view.formatMenu.editToolbar": "自訂工具列",
  "view.formatMenu.code": "程式碼",
  "view.formatMenu.math": "數學公式",
  "view.formatMenu.quote": "引用",
  "view.formatMenu.link": "連結",
  "view.linkPopover.placeholder": "筆記名稱或網址",
  "view.linkPopover.unlink": "移除連結",
  "view.formatMenu.strikethrough": "刪除線",
  "view.formatMenu.highlight": "螢光標示",
  "view.highlight.default": "預設",
  "view.highlight.red": "紅",
  "view.highlight.orange": "橘",
  "view.highlight.yellow": "黃",
  "view.highlight.green": "綠",
  "view.highlight.blue": "藍",
  "view.highlight.purple": "紫",
  "view.highlight.remove": "取消螢光標示",
  "view.formatMenu.settings": "設定",

  "view.postMenu.copy": "複製",

  "view.postMenu.copyMath": "複製公式",

  "view.postMenu.copyCode": "複製程式碼",
  "view.postMenu.quotePost": "引用貼文",
  "view.postMenu.edit": "編輯",
  "view.postMenu.cancelEdit": "取消編輯",
  "view.postMenu.unpin": "取消置頂",
  "view.postMenu.pin": "置頂",
  "view.postMenu.pinLimitHint": "最多可置頂 {limit} 則。",
  "view.postMenu.schedulePin": "稍後置頂",
  "view.postMenu.repeatPin": "作為重複置頂",
  "view.postMenu.delete": "刪除",
  "view.postMenu.deleteConfirm": "再按一次以確定刪除",

  "view.dateNav.today": "今天",
  "view.dateNav.todaySuffix": "（今天）",

  "view.empty.noMemos": "目前沒有任何貼文",
  "view.notice.saveFailed": "貼文儲存失敗：{error}",
  "view.notice.postHeadingMissing": "筆記中找不到指定的標題，已附加於結尾",
  "view.notice.postHeadingNoTemplate": "找不到每日筆記範本，已將插入標題重設為「不指定」",
  "view.notice.searchPluginNotFound": "找不到搜尋外掛",

  "view.image.removeAria": "移除圖片",
  "view.quote.removeAria": "移除引用",

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
