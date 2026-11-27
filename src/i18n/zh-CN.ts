import type { Translations } from "./ja";

// Simplified Chinese (Mainland) translations. Translated via Nani.
const zhCN = {
  "settings.section.basic": "常规设置",
  "settings.section.advanced": "高级设置",
  "settings.section.tagrules": "标签规则设置",

  "settings.item.viewPlacement.name": "视图位置",
  "settings.item.viewPlacement.desc": "设置 Wrot 的显示位置。",
  "settings.option.viewPlacement.left": "左侧边栏",
  "settings.option.viewPlacement.right": "右侧边栏",
  "settings.option.viewPlacement.main": "主编辑区",
  "command.openLeft": "在左侧边栏打开",
  "command.openRight": "在右侧边栏打开",
  "command.openMain": "在主编辑区打开",
  "command.openSettings": "打开设置",
  "settings.item.openOnStartup.name": "启动时自动打开",
  "settings.item.openOnStartup.desc": "Obsidian 启动时在前台显示 Wrot。",

  "settings.item.followFontSize.name": "跟随 Obsidian 字号",
  "settings.item.followFontSize.desc":
    "开启后，将跟随 Obsidian 外观设置中的字体大小。",

  "settings.item.headerDateFormat.name": "顶部日期格式",
  "settings.item.headerDateFormat.desc": "支持 YYYY、MM、DD 等。\n留空则恢复默认。",

  "settings.item.timestampFormat.name": "时间戳格式",
  "settings.item.timestampFormat.desc": "支持 YYYY、MM、DD、HH、mm、ss。",

  "settings.item.bgColorLight.name": "背景色（浅色模式）",
  "settings.item.bgColorLight.desc": "用于记录及输入框的背景。",
  "settings.item.textColorLight.name": "文字颜色（浅色模式）",
  "settings.item.textColorLight.desc": "用于文本及图标。",
  "settings.item.bgColorDark.name": "背景色（深色模式）",
  "settings.item.bgColorDark.desc": "用于记录及输入框的背景。",
  "settings.item.textColorDark.name": "文字颜色（深色模式）",
  "settings.item.textColorDark.desc": "用于文本及图标。",

  "settings.item.submitLabel.name": "发送按钮文字",
  "settings.item.submitLabel.desc": "若已设置图标，留空则仅显示图标。",
  "settings.item.submitIcon.name": "发送按钮图标",
  "settings.item.submitIcon.desc": "可从 {linkOpen}此处{linkClose} 复制图标名称。\n留空则不显示。",
  "settings.item.updateLabel.name": "保存按钮文字",
  "settings.item.updateLabel.desc": "编辑时显示。\n若已设置图标，留空则仅显示图标。",
  "settings.item.updateIcon.name": "保存按钮图标",
  "settings.item.updateIcon.desc": "可从 {linkOpen}此处{linkClose} 复制图标名称。\n留空则使用与发送按钮相同的图标。",
  "settings.item.submitGradient.name": "输入框渐变高亮",
  "settings.item.submitGradient.desc": "开启后，输入框的强调色将变为渐变。",
  "settings.item.submitGradientMode.name": "渐变明暗",
  "settings.item.submitGradientMode.desc": "设为“自动”时，将根据强调色的明暗切换。",
  "settings.option.submitGradientMode.auto": "自动",
  "settings.option.submitGradientMode.light": "偏亮",
  "settings.option.submitGradientMode.dark": "偏暗",
  "settings.item.inputPlaceholder.name": "输入框占位提示",
  "settings.item.inputPlaceholder.desc": "留空则不显示。",

  "settings.item.tagSuggest.name": "标签补全建议",
  "settings.item.tagSuggest.desc":
    "输入 # 后显示标签建议。\n关闭后，已记录的标签历史也会被重置。",

  "settings.item.pinLimit.name": "置顶数量上限",
  "settings.item.pinLimit.desc": "分别对“置顶”和“稍后置顶”生效。\n调低上限时，超出的记录将取消置顶。",
  "settings.option.pinLimit.1": "1 条",
  "settings.option.pinLimit.3": "3 条",
  "settings.option.pinLimit.5": "5 条",
  "settings.item.pinFixed.name": "置顶记录固定在顶部",
  "settings.item.pinFixed.desc": "关闭后，置顶记录将随时间轴滚动。",

  "settings.item.ogp.name": "链接预览卡片",
  "settings.item.ogp.desc": "获取 URL 的预览信息。\n关闭后，不会发起网络请求。",

  "settings.item.checkStrikethrough.name": "已完成事项删除线",
  "settings.item.checkStrikethrough.desc": "关闭后，勾选待办项时不会添加删除线。",

  "settings.item.calendarDayShape.name": "日历日期外观",
  "settings.item.calendarDayShape.desc": "设置日历中日期的形状。",
  "settings.option.calendarDayShape.circle": "圆形",
  "settings.option.calendarDayShape.rounded": "圆角",
  "settings.option.calendarDayShape.square": "方形",

  "settings.item.showCalendarButton.name": "显示日历按钮",
  "settings.item.showCalendarButton.desc":
    "开启后，可从日期导航栏跳转到任意日期。",

  "settings.item.showPostDelete.name": "显示删除按钮",
  "settings.item.showPostDelete.desc":
    "开启后，记录菜单中会显示删除按钮。\n删除后无法恢复，图片附件不会被删除。",

  "settings.item.useCustomAttachmentFolder.name": "自定义图片保存路径",
  "settings.item.useCustomAttachmentFolder.desc": "仅对通过 Wrot 插入的图片生效。",

  "settings.item.attachmentFolder.name": "图片保存目录",
  "settings.item.attachmentFolder.desc": "若目录不存在，将遵循 Obsidian 的默认设置。",
  "settings.item.attachmentFolder.placeholder": "选择文件夹",
  "settings.item.shrinkImages.name": "压缩图片并去除元数据",
  "settings.item.shrinkImages.desc": "压缩图片并移除位置信息等元数据。\n不包括 GIF。",
  "settings.item.postHeading.name": "模板标题指定",
  "settings.item.postHeading.desc": "记录将追加到所选标题下方。",
  "settings.option.postHeading.none": "不指定",

  "settings.item.tagColorRules.name": "启用标签规则",
  "settings.item.tagColorRules.desc":
    "可按标签自定义记录颜色及集成方式等。\n颜色以正文中先出现的标签为准。",

  "settings.tagRule.label": "规则 {n}",
  "settings.tagRule.tag.name": "目标标签",
  "settings.tagRule.tag.desc": "可不带 # 前缀。",
  "settings.tagRule.tag.placeholder": "标签名称",
  "settings.tagRule.bg.name": "卡片背景色",
  "settings.tagRule.bg.desc": "用于记录的背景。",
  "settings.tagRule.fg.name": "正文文本色",
  "settings.tagRule.fg.desc": "标签、链接和 URL 使用强调色。",
  "settings.tagRule.accent.name": "自定义强调色",
  "settings.tagRule.accent.desc": "留空则使用主题的强调色。",
  "settings.tagRule.sub.name": "次要元素颜色",
  "settings.tagRule.sub.desc": "用于时间戳、列表标号等。\n留空则自动设置。",
  "settings.tagRule.scope.buttons.name": "次要色应用至：时间戳、菜单与置顶图标",
  "settings.tagRule.scope.buttons.desc": "关闭后，使用自动设置的颜色。",
  "settings.tagRule.scope.quote.name": "次要色应用至：引用区块",
  "settings.tagRule.scope.quote.desc": "关闭后，使用自动设置的颜色。",
  "settings.tagRule.scope.list.name": "次要色应用至：列表标号与复选框",
  "settings.tagRule.scope.list.desc": "关闭后，使用自动设置的颜色。",
  "settings.tagRule.scope.ogp.name": "次要色应用至：网页预览卡片",
  "settings.tagRule.scope.ogp.desc": "关闭后，使用自动设置的颜色。",
  "settings.item.graphTags.name": "Obsidian 标签整合",
  "settings.item.graphTags.desc": "纳入关系图谱及标签搜索（tag:）。\n关闭后，标签仅在 Wrot 内部生效。",
  "settings.tagRule.noIntegration.name": "排除标签整合",
  "settings.tagRule.noIntegration.desc": "开启后，该标签仅在 Wrot 内部生效。",
  "settings.tagRule.hideTimeline.name": "在时间轴中隐藏",
  "settings.tagRule.hideTimeline.desc":
    "开启后，含有该标签的记录不会显示在时间轴中。\n日记中仍会保存。",
  "settings.tagRule.protectDelete.name": "防误删保护",
  "settings.tagRule.protectDelete.desc":
    "开启后，含有该标签的记录将无法删除。",
  "settings.tagRule.button.add": "添加新规则",
  "settings.item.toolbarEdit.name": "显示工具栏编辑按钮",
  "settings.item.toolbarEdit.desc": "开启后，工具栏菜单中将显示编辑按钮。",
  "settings.item.resetToolbar.name": "重置工具栏",
  "settings.item.resetToolbar.desc": "恢复工具栏按钮的默认顺序与可见性。",
  "settings.item.resetToolbar.button": "重置",
  "settings.item.resetToolbar.confirm": "再次点击确认重置",

  "view.toolbarAction.image": "图片",
  "view.toolbarAction.bold": "粗体",
  "view.toolbarAction.italic": "斜体",
  "view.toolbarAction.list": "无序列表",
  "view.toolbarAction.check": "待办清单",
  "view.toolbarAction.ol": "有序列表",
  "view.toolbarAction.more": "更多",
  "view.toolbarEdit.done": "完成",
  "view.toolbarEdit.cancel": "取消",

  "view.formatMenu.editToolbar": "自定义工具栏",
  "view.formatMenu.code": "代码",
  "view.formatMenu.math": "公式",
  "view.formatMenu.quote": "引用",
  "view.formatMenu.link": "链接",
  "view.linkPopover.placeholder": "笔记名或网址",
  "view.linkPopover.unlink": "清除链接",
  "view.formatMenu.strikethrough": "删除线",
  "view.formatMenu.highlight": "高亮",
  "view.highlight.default": "默认",
  "view.highlight.red": "红",
  "view.highlight.orange": "橙",
  "view.highlight.yellow": "黄",
  "view.highlight.green": "绿",
  "view.highlight.blue": "蓝",
  "view.highlight.purple": "紫",
  "view.highlight.remove": "清除高亮",
  "view.formatMenu.settings": "设置",

  "view.postMenu.copy": "复制",

  "view.postMenu.copyMath": "复制公式",

  "view.postMenu.copyCode": "复制代码",
  "view.postMenu.quotePost": "引用此条",
  "view.postMenu.edit": "编辑",
  "view.postMenu.cancelEdit": "放弃编辑",
  "view.postMenu.unpin": "取消置顶",
  "view.postMenu.pin": "置顶",
  "view.postMenu.pinLimitHint": "最多置顶 {limit} 条。",
  "view.postMenu.schedulePin": "稍后置顶",
  "view.postMenu.repeatPin": "作为重复置顶",
  "view.postMenu.delete": "删除",
  "view.postMenu.deleteConfirm": "再次点击确认删除",

  "view.dateNav.today": "今天",
  "view.dateNav.todaySuffix": "（今天）",

  "view.empty.noMemos": "暂无记录",
  "view.notice.saveFailed": "保存失败：{error}",
  "view.notice.postHeadingMissing": "笔记中没有指定的标题，已追加至末尾",
  "view.notice.postHeadingNoTemplate": "未找到日记模板，已将模板标题重置为“不指定”",
  "view.notice.searchPluginNotFound": "未找到搜索插件",

  "view.image.removeAria": "移除图片",
  "view.quote.removeAria": "移除引用",

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
