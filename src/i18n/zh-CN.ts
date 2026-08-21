import type { Translations } from "./ja";

// Simplified Chinese (Mainland) translations. Translated via Nani.
const zhCN = {
  "settings.section.basic": "基本设置",
  "settings.section.advanced": "高级设置",
  "settings.section.tagrules": "标签规则设置",

  "settings.item.viewPlacement.name": "显示位置",
  "settings.item.viewPlacement.desc": "关闭并重新打开 Wrot 后生效。",
  "settings.option.viewPlacement.left": "左侧边栏",
  "settings.option.viewPlacement.right": "右侧边栏",
  "settings.option.viewPlacement.main": "主工作区",

  "settings.item.followFontSize.name": "跟随 Obsidian 字体大小",
  "settings.item.followFontSize.desc": "开启后，跟随 Obsidian 外观设置的字号。",

  "settings.item.headerDateFormat.name": "页眉日期格式",
  "settings.item.headerDateFormat.desc": "支持 YYYY, MM, DD 等。 \n留空则恢复默认值。",

  "settings.item.timestampFormat.name": "时间戳格式",
  "settings.item.timestampFormat.desc": "支持 YYYY, MM, DD, HH, mm, ss。",

  "settings.item.bgColorLight.name": "背景颜色（浅色模式）",
  "settings.item.bgColorLight.desc": "用于记录和输入框。",
  "settings.item.textColorLight.name": "文字颜色（浅色模式）",
  "settings.item.textColorLight.desc": "用于文字和图标。",
  "settings.item.bgColorDark.name": "背景颜色（深色模式）",
  "settings.item.bgColorDark.desc": "用于记录和输入框。",
  "settings.item.textColorDark.name": "文字颜色（深色模式）",
  "settings.item.textColorDark.desc": "用于文字和图标。",

  "settings.item.submitLabel.name": "发布按钮文本",
  "settings.item.submitLabel.desc": "留空则仅显示图标（仅当已设置图标时）。",
  "settings.item.submitIcon.name": "发布按钮图标",
  "settings.item.submitIcon.desc": "图标名称可从{linkOpen}这里{linkClose}复制。 \n留空则隐藏图标。",
  "settings.item.updateLabel.name": "更新按钮文本",
  "settings.item.updateLabel.desc": "编辑内容时使用。 \n留空则仅显示图标（仅当已设置图标时）。",
  "settings.item.updateIcon.name": "更新按钮图标",
  "settings.item.updateIcon.desc": "图标名称可从{linkOpen}这里{linkClose}复制。 \n留空则使用发布按钮的图标。",
  "settings.item.inputPlaceholder.name": "输入框占位文本",
  "settings.item.inputPlaceholder.desc": "留空则不显示。",

  "settings.item.tagSuggest.name": "标签自动补全",
  "settings.item.tagSuggest.desc": "在 # 后输入时会显示候选。 \n关闭后会清除已记住的候选。",

  "settings.item.pinLimit.name": "置顶上限",
  "settings.item.pinLimit.desc": "调低上限时，超出的固定会被解除。",
  "settings.option.pinLimit.1": "1 条",
  "settings.option.pinLimit.3": "3 条",
  "settings.option.pinLimit.5": "5 条",

  "settings.item.ogp.name": "URL 预览",
  "settings.item.ogp.desc": "从 URL 获取预览信息。 \n关闭后不进行外部通信。",

  "settings.item.checkStrikethrough.name": "已完成项目显示删除线",
  "settings.item.checkStrikethrough.desc": "关闭时文字保持原样。",

  "settings.item.calendarDayShape.name": "日期按钮形状",
  "settings.item.calendarDayShape.desc": "应用于日历中的日期。",
  "settings.option.calendarDayShape.circle": "圆形",
  "settings.option.calendarDayShape.rounded": "圆角",
  "settings.option.calendarDayShape.square": "方形",

  "settings.item.showCalendarButton.name": "显示日历按钮",
  "settings.item.showCalendarButton.desc": "开启后，可从日期导航栏跳转到任意日期。",

  "settings.item.showPostDelete.name": "显示删除按钮",
  "settings.item.showPostDelete.desc": "开启后，笔记菜单中会增加删除按钮。 \n删除后无法恢复。附加的图片不会被删除。",

  "settings.item.useCustomAttachmentFolder.name": "指定图片保存位置",
  "settings.item.useCustomAttachmentFolder.desc": "仅适用于从 Wrot 添加的图片。",

  "settings.item.attachmentFolder.name": "保存文件夹",
  "settings.item.attachmentFolder.desc": "若文件夹不存在，则遵循 Obsidian 的设置。",
  "settings.item.attachmentFolder.placeholder": "选择文件夹",

  "settings.item.tagColorRules.name": "使用标签规则",
  "settings.item.tagColorRules.desc": "可按标签分别设置颜色和标签集成等。 \n颜色以正文中先出现的标签为准。",

  "settings.tagRule.label": "规则 {n}",
  "settings.tagRule.tag.name": "标签",
  "settings.tagRule.tag.desc": "可省略 #。",
  "settings.tagRule.tag.placeholder": "标签名",
  "settings.tagRule.bg.name": "背景颜色",
  "settings.tagRule.bg.desc": "用于记录的背景。",
  "settings.tagRule.fg.name": "文字颜色",
  "settings.tagRule.fg.desc": "标签、链接、URL 由强调色设置。",
  "settings.tagRule.accent.name": "强调色",
  "settings.tagRule.accent.desc": "未设置时使用主题的强调色。",
  "settings.tagRule.sub.name": "辅助色",
  "settings.tagRule.sub.desc": "时间戳、列表标记等的颜色。 \n未设置时自动计算。",
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
  "settings.item.graphTags.name": "标签集成",
  "settings.item.graphTags.desc": "标签会纳入图谱视图和标签搜索（tag:）。 \n关闭时仅在 Wrot 内使用。",
  "settings.tagRule.noIntegration.name": "从标签集成中排除",
  "settings.tagRule.noIntegration.desc": "开启后，此标签仅在 Wrot 内使用。",
  "settings.tagRule.hideTimeline.name": "在时间轴中隐藏",
  "settings.tagRule.hideTimeline.desc": "开启后，含有此标签的记录不再显示在时间轴中。 \n每日笔记中仍会保留。",
  "settings.tagRule.protectDelete.name": "停用删除按钮",
  "settings.tagRule.protectDelete.desc": "开启后，含有此标签的记录无法删除。",
  "settings.tagRule.button.add": "添加规则",

  "view.formatMenu.code": "代码",
  "view.formatMenu.math": "公式",
  "view.formatMenu.quote": "引用",
  "view.formatMenu.link": "链接",
  "view.formatMenu.strikethrough": "删除线",
  "view.formatMenu.highlight": "高亮",
  "view.formatMenu.settings": "设置",

  "view.postMenu.copy": "复制",
  "view.postMenu.quotePost": "引用此条内容",
  "view.postMenu.edit": "编辑",
  "view.postMenu.cancelEdit": "取消编辑",
  "view.postMenu.unpin": "取消置顶",
  "view.postMenu.pin": "置顶",
  "view.postMenu.pinLimitHint": "置顶条数已达上限（最多 {limit} 条）。",
  "view.postMenu.delete": "删除",
  // Shown on the same row after the first press, in place of the label above.
  "view.postMenu.deleteConfirm": "再按一次即删除",

  "view.dateNav.today": "今天",
  "view.dateNav.todaySuffix": "（今天）",

  "view.empty.noMemos": "暂无可显示的笔记",
  "view.notice.saveFailed": "笔记保存失败：{error}",
  "view.notice.searchPluginNotFound": "未找到搜索插件",

  "view.image.removeAria": "删除图片",

  // Placeholder body of a quote card whose original post is gone.
  "quote.card.notFound": "(未找到原始笔记)",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "YYYY[年]M[月]",

  "defaults.headerDateFormat": "YYYY/MM/DD",
  "defaults.submitLabel": "发布",
  "defaults.updateLabel": "更新",
  "defaults.inputPlaceholder": "这一刻的想法...",
} satisfies Translations;

export default zhCN;
