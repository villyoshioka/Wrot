import type { Translations } from "./ja";

// Simplified Chinese (Mainland) translations. Translated via Nani.
const zhCN = {
  "settings.section.basic": "常规设置",
  "settings.section.advanced": "高级设置",
  "settings.section.tagrules": "标签规则",

  "settings.item.viewPlacement.name": "显示位置",
  "settings.item.viewPlacement.desc": "指定 Wrot 的显示面板位置。",
  "settings.option.viewPlacement.left": "左侧边栏",
  "settings.option.viewPlacement.right": "右侧边栏",
  "settings.option.viewPlacement.main": "主工作区",
  "settings.item.openOnStartup.name": "启动时打开",
  "settings.item.openOnStartup.desc": "开启后，启动 Obsidian 时将 Wrot 默认显示在最前。",

  "settings.item.followFontSize.name": "跟随 Obsidian 字体大小",
  "settings.item.followFontSize.desc": "开启后，将遵循 Obsidian 外观设置中的字体大小。",

  "settings.item.headerDateFormat.name": "页眉日期格式",
  "settings.item.headerDateFormat.desc": "支持 YYYY、MM、DD 等格式。\n留空则恢复默认值。",

  "settings.item.timestampFormat.name": "时间戳格式",
  "settings.item.timestampFormat.desc": "支持 YYYY、MM、DD、HH、mm、ss 等格式。",

  "settings.item.bgColorLight.name": "背景颜色（浅色模式）",
  "settings.item.bgColorLight.desc": "应用于记录卡片与输入框。",
  "settings.item.textColorLight.name": "文字颜色（浅色模式）",
  "settings.item.textColorLight.desc": "应用于文本和图标。",
  "settings.item.bgColorDark.name": "背景颜色（深色模式）",
  "settings.item.bgColorDark.desc": "应用于记录卡片与输入框。",
  "settings.item.textColorDark.name": "文字颜色（深色模式）",
  "settings.item.textColorDark.desc": "应用于文本和图标。",

  "settings.item.submitLabel.name": "发布按钮文本",
  "settings.item.submitLabel.desc": "留空则仅显示图标（仅在已设置图标时生效）。",
  "settings.item.submitIcon.name": "发布按钮图标",
  "settings.item.submitIcon.desc": "可从{linkOpen}此处{linkClose}复制图标名称。\n留空则隐藏图标。",
  "settings.item.updateLabel.name": "更新按钮文本",
  "settings.item.updateLabel.desc": "编辑内容时使用。\n留空则仅显示图标（仅在已设置图标时生效）。",
  "settings.item.updateIcon.name": "更新按钮图标",
  "settings.item.updateIcon.desc": "可从{linkOpen}此处{linkClose}复制图标名称。\n留空则沿用发布按钮的图标。",
  "settings.item.submitGradient.name": "发布框渐变效果",
  "settings.item.submitGradient.desc": "开启后，发布框的强调部分将应用渐变色。",
  "settings.item.inputPlaceholder.name": "输入框占位文本",
  "settings.item.inputPlaceholder.desc": "留空则不显示占位文本。",

  "settings.item.tagSuggest.name": "标签自动补全",
  "settings.item.tagSuggest.desc": "在输入 # 时自动显示候选标签。\n关闭后将清除已记录的候选列表。",

  "settings.item.pinLimit.name": "置顶数量上限",
  "settings.item.pinLimit.desc": "“置顶”与“稍后置顶”的上限分别计算。\n调低上限时，超出数量的置顶将被取消。",
  "settings.option.pinLimit.1": "1 条",
  "settings.option.pinLimit.3": "3 条",
  "settings.option.pinLimit.5": "5 条",
  "settings.item.pinFixed.name": "置顶内容固定在顶部",
  "settings.item.pinFixed.desc": "关闭后，置顶的记录会随时间线一起滚动。",

  "settings.item.ogp.name": "网页链接预览 (OGP)",
  "settings.item.ogp.desc": "从网页链接获取预览卡片。\n关闭后将不会发起外部网络请求。",

  "settings.item.checkStrikethrough.name": "已完成事项添加删除线",
  "settings.item.checkStrikethrough.desc": "关闭后，勾选完成的待办事项将不添加删除线。",

  "settings.item.calendarDayShape.name": "日历日期形状",
  "settings.item.calendarDayShape.desc": "应用于日历中日期的显示外观。",
  "settings.option.calendarDayShape.circle": "圆形",
  "settings.option.calendarDayShape.rounded": "圆角矩形",
  "settings.option.calendarDayShape.square": "方形",

  "settings.item.showCalendarButton.name": "显示日历按钮",
  "settings.item.showCalendarButton.desc": "开启后，可通过日期导航栏快速跳转至指定日期。",

  "settings.item.showPostDelete.name": "显示删除按钮",
  "settings.item.showPostDelete.desc": "开启后，记录菜单中将显示删除按钮。\n删除后无法恢复，但已添加的图片附件不会被删除。",

  "settings.item.useCustomAttachmentFolder.name": "自定义图片保存路径",
  "settings.item.useCustomAttachmentFolder.desc": "仅适用于从 Wrot 插入的图片。",

  "settings.item.attachmentFolder.name": "图片保存目录",
  "settings.item.attachmentFolder.desc": "若文件夹不存在，将遵循 Obsidian 的附件默认设置。",
  "settings.item.attachmentFolder.placeholder": "选择文件夹",
  "settings.item.shrinkImages.name": "压缩后保存图片",
  "settings.item.shrinkImages.desc": "压缩插入的图片，并在保存前移除 EXIF 等元数据。\n不包含 GIF 动图。",
  "settings.item.postHeading.name": "指定插入的标题位置",
  "settings.item.postHeading.desc": "发布的内容将被追加到所选标题下方。",
  "settings.option.postHeading.none": "不指定",

  "settings.item.tagColorRules.name": "启用标签规则",
  "settings.item.tagColorRules.desc": "可针对不同标签自定义颜色及集成方式。\n颜色以正文中优先出现的标签为准。",

  "settings.tagRule.label": "规则 {n}",
  "settings.tagRule.tag.name": "标签",
  "settings.tagRule.tag.desc": "无需输入前缀 #。",
  "settings.tagRule.tag.placeholder": "输入标签名",
  "settings.tagRule.bg.name": "背景颜色",
  "settings.tagRule.bg.desc": "应用于记录背景。",
  "settings.tagRule.fg.name": "文本颜色",
  "settings.tagRule.fg.desc": "标签、链接及 URL 将使用强调色。",
  "settings.tagRule.accent.name": "强调色",
  "settings.tagRule.accent.desc": "留空时将使用当前主题的强调色。",
  "settings.tagRule.sub.name": "辅助色",
  "settings.tagRule.sub.desc": "应用于时间戳、列表标记等要素。\n留空时将自动计算生成。",
  "settings.tagRule.scope.buttons.name":
    "将辅助色应用于时间戳、菜单和置顶图标",
  "settings.tagRule.scope.buttons.desc":
    "关闭后将使用系统自动计算的配色。",
  "settings.tagRule.scope.quote.name": "将辅助色应用于引用块",
  "settings.tagRule.scope.quote.desc":
    "关闭后将使用系统自动计算的配色。",
  "settings.tagRule.scope.list.name": "将辅助色应用于列表与复选框",
  "settings.tagRule.scope.list.desc":
    "关闭后将使用系统自动计算的配色。",
  "settings.tagRule.scope.ogp.name": "将辅助色应用于链接预览卡片",
  "settings.tagRule.scope.ogp.desc":
    "关闭后将使用系统自动计算的配色。",
  "settings.item.graphTags.name": "标签系统集成",
  "settings.item.graphTags.desc": "使标签能够被 Obsidian 关系图谱及标签搜索（tag:）检索。\n关闭后标签将仅在 Wrot 插件内部生效。",
  "settings.tagRule.noIntegration.name": "从 Obsidian 标签系统中排除",
  "settings.tagRule.noIntegration.desc": "开启后，该标签将仅在 Wrot 内部生效。",
  "settings.tagRule.hideTimeline.name": "在时间线中隐藏",
  "settings.tagRule.hideTimeline.desc": "开启后，含有此标签的记录不会显示在时间线中。\n日记文档中的原文仍会保留。",
  "settings.tagRule.protectDelete.name": "禁用删除功能",
  "settings.tagRule.protectDelete.desc": "开启后，含有此标签的记录将无法被删除。",
  "settings.tagRule.button.add": "添加新规则",
  "settings.item.toolbarEdit.name": "显示工具栏自定义按钮",
  "settings.item.toolbarEdit.desc": "开启后，可在更多菜单中自定义编辑工具栏。",
  "settings.item.resetToolbar.name": "重置工具栏",
  "settings.item.resetToolbar.desc": "将工具栏的按钮顺序及显示状态恢复为默认值。",
  "settings.item.resetToolbar.button": "重置",
  // Shown on the same row after the first press, in place of the label above.
  "settings.item.resetToolbar.confirm": "再次点击以确认重置",

  "view.toolbarAction.image": "图片",
  "view.toolbarAction.embed": "嵌入",
  "view.toolbarAction.bold": "加粗",
  "view.toolbarAction.italic": "斜体",
  "view.toolbarAction.list": "无序列表",
  "view.toolbarAction.check": "待办列表",
  "view.toolbarAction.ol": "有序列表",
  "view.toolbarAction.more": "更多",
  "view.toolbarEdit.done": "完成",
  "view.toolbarEdit.cancel": "取消编辑",

  "view.formatMenu.editToolbar": "自定义工具栏",
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
  "view.postMenu.pinLimitHint": "已达置顶数量上限（最多 {limit} 条）。",
  "view.postMenu.schedulePin": "稍后置顶",
  "view.postMenu.delete": "删除",
  // Shown on the same row after the first press, in place of the label above.
  "view.postMenu.deleteConfirm": "再次点击以确认删除",

  "view.dateNav.today": "今天",
  "view.dateNav.todaySuffix": "（今天）",

  "view.empty.noMemos": "暂无记录",
  "view.notice.saveFailed": "保存记录失败：{error}",
  "view.notice.postHeadingMissing": "未找到设置的目标标题，内容已追加至文末",
  "view.notice.postHeadingNoTemplate": "未找到日记模板，已将目标标题设置为“不指定”",
  "view.notice.searchPluginNotFound": "核心插件“搜索”未启用。",

  "view.image.removeAria": "移除图片",

  // Placeholder body of a quote card whose original post is gone.
  "quote.card.notFound": "（未找到原始记录）",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "YYYY[年]M[月]",

  "defaults.headerDateFormat": "YYYY/MM/DD",

  "defaults.timestampFormat": "YYYY/MM/DD HH:mm:ss",
  "defaults.submitLabel": "发布",
  "defaults.updateLabel": "更新",
  "defaults.inputPlaceholder": "这一刻的想法...",
} satisfies Translations;

export default zhCN;
