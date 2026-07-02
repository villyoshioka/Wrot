import type { Translations } from "./ja";

// Simplified Chinese (Mainland) translations. Translated via Nani.
const zhCN = {
  "settings.section.basic": "基本设置",
  "settings.section.display": "显示设置",
  "settings.section.tagrules": "标签规则设置",

  "settings.item.viewPlacement.name": "显示位置",
  "settings.item.viewPlacement.desc": "选择 Wrot 面板的显示位置。",
  "settings.option.viewPlacement.left": "左侧边栏",
  "settings.option.viewPlacement.right": "右侧边栏",
  "settings.option.viewPlacement.main": "主工作区",

  "settings.item.followFontSize.name": "跟随 Obsidian 字体大小",
  "settings.item.followFontSize.desc":
    "Wrot 的字体大小将与 Obsidian 的外观设置保持一致。",

  "settings.item.headerDateFormat.name": "页眉日期格式",
  "settings.item.headerDateFormat.desc":
    "指定日期导航栏中显示的日期格式。（支持 YYYY, MM, DD 等）留空则恢复默认值。",

  "settings.item.timestampFormat.name": "时间戳格式",
  "settings.item.timestampFormat.desc":
    "指定记录的日期时间格式。（支持 YYYY, MM, DD, HH, mm, ss）",

  "settings.item.bgColorLight.name": "背景颜色（浅色模式）",
  "settings.item.bgColorLight.desc":
    "设置浅色模式下记录与输入框的背景颜色。",
  "settings.item.textColorLight.name": "文字颜色（浅色模式）",
  "settings.item.textColorLight.desc":
    "设置浅色模式下文本与图标的颜色。",
  "settings.item.bgColorDark.name": "背景颜色（深色模式）",
  "settings.item.bgColorDark.desc":
    "设置深色模式下记录与输入框的背景颜色。",
  "settings.item.textColorDark.name": "文字颜色（深色模式）",
  "settings.item.textColorDark.desc":
    "设置深色模式下文本与图标的颜色。",

  "settings.item.submitLabel.name": "发布按钮文本",
  "settings.item.submitLabel.desc":
    "自定义发布按钮上显示的文字。",
  "settings.item.submitIcon.name": "发布按钮图标",
  "settings.item.submitIcon.desc":
    "自定义发布按钮的图标。请从 {linkOpen}此处{linkClose} 复制图标名称。留空则隐藏图标。",
  "settings.item.inputPlaceholder.name": "输入框占位文本",
  "settings.item.inputPlaceholder.desc":
    "可以自定义输入框为空时显示的提示文字。留空则不显示。",

  "settings.item.tagSuggest.name": "标签自动补全",
  "settings.item.tagSuggest.desc":
    "在输入框中输入 # 时，会将过去帖子中用过的标签显示为候选。",
  "settings.item.tagSuggestClear.name": "清除标签补全历史",
  "settings.item.tagSuggestClear.desc": "删除所有已记住的标签候选。",
  "settings.item.tagSuggestClear.button": "清除",
  "settings.notice.tagSuggestCleared": "已清除标签补全历史",

  "settings.item.pinLimit.name": "置顶上限",
  "settings.item.pinLimit.desc":
    "设置时间轴中最多可以置顶的笔记数量。",
  "settings.option.pinLimit.1": "1 条",
  "settings.option.pinLimit.3": "3 条",
  "settings.option.pinLimit.5": "5 条",

  "settings.item.ogp.name": "URL 预览",
  "settings.item.ogp.desc":
    "自动获取并显示笔记内 URL 的 OGP 信息。关闭后将不再访问外部网络。",

  "settings.item.checkStrikethrough.name": "已完成项目显示删除线",
  "settings.item.checkStrikethrough.desc":
    "为已勾选复选框的项目添加删除线。",

  "settings.item.calendarDayShape.name": "日期按钮形状",
  "settings.item.calendarDayShape.desc": "选择日历中日期按钮的形状。",
  "settings.option.calendarDayShape.circle": "圆形",
  "settings.option.calendarDayShape.rounded": "圆角",
  "settings.option.calendarDayShape.square": "方形",

  "settings.item.showCalendarButton.name": "显示日历按钮",
  "settings.item.showCalendarButton.desc":
    "在日期导航栏中显示日历图标，方便你直接跳转到任何日期。",

  "settings.item.tagColorRules.name": "按标签自定义颜色",
  "settings.item.tagColorRules.desc":
    "根据特定标签更改记录的背景和文字颜色。若符合多个规则，优先适用正文中先出现的标签。",

  "settings.tagRule.label": "规则 {n}",
  "settings.tagRule.tag.name": "标签",
  "settings.tagRule.tag.desc":
    "输入需要自定义颜色的标签名。（可省略 #）",
  "settings.tagRule.tag.placeholder": "标签名",
  "settings.tagRule.bg.name": "背景颜色",
  "settings.tagRule.bg.desc":
    "设置包含此标签的记录背景色。",
  "settings.tagRule.fg.name": "文字颜色",
  "settings.tagRule.fg.desc":
    "设置包含此标签的记录正文颜色。（标签、链接、URL 将使用强调色）",
  "settings.tagRule.accent.name": "强调色",
  "settings.tagRule.accent.desc":
    "设置标签、链接、URL、复制成功图标等强调元素的颜色。未设置时将沿用主题强调色。",
  "settings.tagRule.sub.name": "辅助色",
  "settings.tagRule.sub.desc":
    "统一设置时间戳、图标、列表标记、引用线、复选框等次要元素的颜色。未设置时将根据背景色和文字色自动计算。",
  "settings.tagRule.scope.buttons.name":
    "将辅助色应用于时间戳、菜单及置顶图标",
  "settings.tagRule.scope.buttons.desc":
    "关闭时将使用系统自动计算的颜色。",
  "settings.tagRule.scope.quote.name": "将辅助色应用于引用",
  "settings.tagRule.scope.quote.desc":
    "关闭时将使用系统自动计算的颜色。",
  "settings.tagRule.scope.list.name": "将辅助色应用于列表及复选框",
  "settings.tagRule.scope.list.desc":
    "关闭时将使用系统自动计算的颜色。",
  "settings.tagRule.scope.ogp.name": "将辅助色应用于 OGP 卡片",
  "settings.tagRule.scope.ogp.desc":
    "关闭时将使用系统自动计算的颜色。",
  "settings.tagRule.button.add": "添加规则",

  "settings.tooltip.resetDefault": "恢复默认值",
  "settings.tooltip.deleteRule": "删除此规则",
  "settings.tooltip.lock": "锁定",
  "settings.tooltip.unlock": "解锁后即可编辑",

  "view.formatMenu.code": "代码",
  "view.formatMenu.math": "公式",
  "view.formatMenu.quote": "引用",
  "view.formatMenu.link": "链接",
  "view.formatMenu.strikethrough": "删除线",
  "view.formatMenu.highlight": "高亮",
  "view.formatMenu.settings": "设置",

  "view.postMenu.copy": "复制",
  "view.postMenu.quotePost": "引用此条内容",
  "view.postMenu.unpin": "取消置顶",
  "view.postMenu.pin": "置顶",
  "view.postMenu.pinLimitHint": "置顶条数已达上限（最多 {limit} 条）。",

  "view.dateNav.today": "今天",
  "view.dateNav.todaySuffix": "（今天）",

  "view.empty.noMemos": "暂无笔记",
  "view.notice.saveFailed": "笔记保存失败：{error}",
  "view.notice.searchPluginNotFound": "未找到搜索插件",

  "view.image.removeAria": "删除图片",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "YYYY[年]M[月]",

  "defaults.headerDateFormat": "YYYY/MM/DD",
  "defaults.submitLabel": "发布",
  "defaults.inputPlaceholder": "这一刻的想法...",
} satisfies Translations;

export default zhCN;
