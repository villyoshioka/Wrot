import type { Translations } from "./ja";

// English (UK) translations. Translated via Nani.
const enGB = {
  "settings.section.basic": "Basic Settings",
  "settings.section.display": "Display Settings",
  "settings.section.tagrules": "Tag Rules",

  "settings.item.viewPlacement.name": "Display Position",
  "settings.item.viewPlacement.desc": "Choose where to display the Wrot panel.",
  "settings.option.viewPlacement.left": "Left Sidebar",
  "settings.option.viewPlacement.right": "Right Sidebar",
  "settings.option.viewPlacement.main": "Main Area",

  "settings.item.followFontSize.name": "Inherit Obsidian Font Size",
  "settings.item.followFontSize.desc":
    "Match Wrot text size with Obsidian appearance settings.",

  "settings.item.headerDateFormat.name": "Header Date Format",
  "settings.item.headerDateFormat.desc":
    "Specify the date format for the navigation bar. (e.g. YYYY, MM, DD) Leave blank to reset to default.",

  "settings.item.timestampFormat.name": "Timestamp Format",
  "settings.item.timestampFormat.desc":
    "Specify the date and time format for posts. (e.g. YYYY, MM, DD, HH, mm, ss)",

  "settings.item.bgColorLight.name": "Background Colour (Light Mode)",
  "settings.item.bgColorLight.desc":
    "Set the background colour for posts and the post form in light theme.",
  "settings.item.textColorLight.name": "Text Colour (Light Mode)",
  "settings.item.textColorLight.desc":
    "Set the colour for text and icons in light theme.",
  "settings.item.bgColorDark.name": "Background Colour (Dark Mode)",
  "settings.item.bgColorDark.desc":
    "Set the background colour for posts and the post form in dark theme.",
  "settings.item.textColorDark.name": "Text Colour (Dark Mode)",
  "settings.item.textColorDark.desc":
    "Set the colour for text and icons in dark theme.",

  "settings.item.submitLabel.name": "Post Button Text",
  "settings.item.submitLabel.desc": "Customise the text displayed on the post button.",
  "settings.item.submitIcon.name": "Post Button Icon",
  "settings.item.submitIcon.desc":
    "Customise the icon for the post button. Copy icon names from {linkOpen}here{linkClose}. Leave blank to hide the icon.",
  "settings.item.inputPlaceholder.name": "Post Form Placeholder",
  "settings.item.inputPlaceholder.desc":
    "Customise the text shown when the post form is empty. Leave blank to hide.",

  "settings.item.pinLimit.name": "Pin Limit",
  "settings.item.pinLimit.desc":
    "Set the maximum number of notes that can be pinned to the timeline.",
  "settings.option.pinLimit.1": "1 item",
  "settings.option.pinLimit.3": "3 items",
  "settings.option.pinLimit.5": "5 items",

  "settings.item.ogp.name": "URL Preview",
  "settings.item.ogp.desc":
    "Automatically fetch and display OGP information from URLs in notes. If turned off, no external communication will occur.",

  "settings.item.checkStrikethrough.name": "Strikethrough for Checked Items",
  "settings.item.checkStrikethrough.desc":
    "Display a strikethrough on items where the tick box is checked.",

  "settings.item.calendarDayShape.name": "Date Button Shape",
  "settings.item.calendarDayShape.desc": "Select the shape of the date buttons in the calendar.",
  "settings.option.calendarDayShape.circle": "Circle",
  "settings.option.calendarDayShape.rounded": "Rounded",
  "settings.option.calendarDayShape.square": "Square",

  "settings.item.showCalendarButton.name": "Show calendar button",
  "settings.item.showCalendarButton.desc":
    "Add a calendar icon to the navigation bar so you can jump straight to any date.",

  "settings.item.tagColorRules.name": "Colour by Tag",
  "settings.item.tagColorRules.desc":
    "Change the background and text colour of posts containing specific tags. If multiple rules apply, the tag appearing first in the text takes priority.",

  "settings.tagRule.label": "Rule {n}",
  "settings.tagRule.tag.name": "Tag",
  "settings.tagRule.tag.desc":
    "Enter the tag name to colour. (# can be omitted)",
  "settings.tagRule.tag.placeholder": "Tag Name",
  "settings.tagRule.bg.name": "Background Colour",
  "settings.tagRule.bg.desc": "Set the background colour for posts containing this tag.",
  "settings.tagRule.fg.name": "Text Colour",
  "settings.tagRule.fg.desc":
    "Set the body text colour for posts containing this tag. (Tags, links, and URLs are set via Accent Colour)",
  "settings.tagRule.accent.name": "Accent Colour",
  "settings.tagRule.accent.desc":
    "Set the colour for elements using accent colours, such as tags, links, URLs, and the copy-complete icon. Uses the theme accent colour if unset.",
  "settings.tagRule.sub.name": "Sub Colour",
  "settings.tagRule.sub.desc":
    "Set the colour for sub-elements collectively, such as timestamps, icons, list markers, blockquotes, and tick boxes. Automatically calculated from background and text colours if unset.",
  "settings.tagRule.scope.buttons.name": "Apply Sub Colour to Timestamp, Menu, and Pin",
  "settings.tagRule.scope.buttons.desc": "When off, automatically assigned colours will be used.",
  "settings.tagRule.scope.quote.name": "Apply Sub Colour to Blockquotes",
  "settings.tagRule.scope.quote.desc": "When off, automatically assigned colours will be used.",
  "settings.tagRule.scope.list.name": "Apply Sub Colour to Lists and Tick Boxes",
  "settings.tagRule.scope.list.desc": "When off, automatically assigned colours will be used.",
  "settings.tagRule.scope.ogp.name": "Apply Sub Colour to OGP Cards",
  "settings.tagRule.scope.ogp.desc": "When off, automatically assigned colours will be used.",
  "settings.tagRule.button.add": "Add Rule",

  "settings.tooltip.resetDefault": "Reset to Defaults",
  "settings.tooltip.deleteRule": "Delete this rule",
  "settings.tooltip.lock": "Lock",
  "settings.tooltip.unlock": "Unlock to edit",

  "view.formatMenu.code": "Code",
  "view.formatMenu.math": "Maths",
  "view.formatMenu.quote": "Quote",
  "view.formatMenu.link": "Link",
  "view.formatMenu.strikethrough": "Strikethrough",
  "view.formatMenu.highlight": "Highlight",
  "view.formatMenu.settings": "Settings",

  "view.postMenu.copy": "Copy",
  "view.postMenu.quotePost": "Quote Post",
  "view.postMenu.unpin": "Unpin",
  "view.postMenu.pin": "Pin",
  "view.postMenu.pinLimitHint": "Pin limit is {limit} items.",

  "view.dateNav.today": "Today",
  "view.dateNav.todaySuffix": " (Today)",

  "view.empty.noMemos": "No notes found",
  "view.notice.saveFailed": "Failed to save note: {error}",
  "view.notice.searchPluginNotFound": "Search plugin not found",

  "view.image.removeAria": "Delete image",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "MMMM YYYY",

  "defaults.headerDateFormat": "D MMMM YYYY",
  "defaults.submitLabel": "Post",
  "defaults.inputPlaceholder": "Note to self...",
} satisfies Translations;

export default enGB;
