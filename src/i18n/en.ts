import type { Translations } from "./ja";

// English (US-equivalent) translations. Translated via Nani.
const en = {
  "settings.section.basic": "General",
  "settings.section.display": "Appearance",

  "settings.item.viewPlacement.name": "Display Position",
  "settings.item.viewPlacement.desc": "Select where to display the Wrot panel.",
  "settings.option.viewPlacement.left": "Left Sidebar",
  "settings.option.viewPlacement.right": "Right Sidebar",
  "settings.option.viewPlacement.main": "Main Area",

  "settings.item.followFontSize.name": "Follow Obsidian Font Size",
  "settings.item.followFontSize.desc":
    "Match Wrot's text size to Obsidian's appearance settings.",

  "settings.item.headerDateFormat.name": "Header Date Format",
  "settings.item.headerDateFormat.desc":
    "Specify the date format for the date navigation. (YYYY, MM, DD, etc. can be used) Leave blank to reset to default.",

  "settings.item.timestampFormat.name": "Timestamp Format",
  "settings.item.timestampFormat.desc":
    "Specify the date and time format for posts. (YYYY, MM, DD, HH, mm, ss can be used)",

  "settings.item.bgColorLight.name": "Background Color (Light Mode)",
  "settings.item.bgColorLight.desc":
    "Set the background color for posts and the post form in light theme.",
  "settings.item.textColorLight.name": "Text Color (Light Mode)",
  "settings.item.textColorLight.desc":
    "Set the color for text and icons in light theme.",
  "settings.item.bgColorDark.name": "Background Color (Dark Mode)",
  "settings.item.bgColorDark.desc":
    "Set the background color for posts and the post form in dark theme.",
  "settings.item.textColorDark.name": "Text Color (Dark Mode)",
  "settings.item.textColorDark.desc":
    "Set the color for text and icons in dark theme.",

  "settings.item.submitLabel.name": "Post Button Text",
  "settings.item.submitLabel.desc":
    "Change the text displayed on the post button.",
  "settings.item.submitIcon.name": "Post Button Icon",
  "settings.item.submitIcon.desc":
    "Change the icon of the post button. Copy the icon name from {linkOpen}here{linkClose}. Leave blank to hide the icon.",
  "settings.item.inputPlaceholder.name": "Post Form Placeholder",
  "settings.item.inputPlaceholder.desc":
    "Change the text displayed when the post form is empty. Leave blank to hide it.",

  "settings.item.pinLimit.name": "Pin Limit",
  "settings.item.pinLimit.desc":
    "Set the maximum number of notes that can be pinned to the timeline.",
  "settings.option.pinLimit.1": "1 Post",
  "settings.option.pinLimit.3": "3 Posts",
  "settings.option.pinLimit.5": "5 Posts",

  "settings.item.ogp.name": "URL Preview",
  "settings.item.ogp.desc":
    "Automatically retrieve and display OGP information from URLs in notes. If turned off, no external communication will occur.",

  "settings.item.checkStrikethrough.name": "Strikethrough for Checked Items",
  "settings.item.checkStrikethrough.desc":
    "Display a strikethrough for items with a checked checkbox.",

  "settings.item.showCalendarButton.name": "Calendar Button",
  "settings.item.showCalendarButton.desc":
    "Adds a calendar button to the date nav, letting you jump to any date with a quick tap.",

  "settings.item.tagColorRules.name": "Change Color by Tag",
  "settings.item.tagColorRules.desc":
    "Change the background and text color of posts containing specific tags. If multiple rules apply, the tag that appears first in the text takes priority.",

  "settings.tagRule.label": "Rule {n}",
  "settings.tagRule.tag.name": "Tag",
  "settings.tagRule.tag.desc":
    "Enter the tag name you want to color. (The # symbol can be omitted)",
  "settings.tagRule.tag.placeholder": "Tag name",
  "settings.tagRule.bg.name": "Background Color",
  "settings.tagRule.bg.desc":
    "Set the background color for posts containing this tag.",
  "settings.tagRule.fg.name": "Text Color",
  "settings.tagRule.fg.desc":
    "Set the text color for the body of posts containing this tag. (Tags, links, and URLs are set using the accent color)",
  "settings.tagRule.accent.name": "Accent Color",
  "settings.tagRule.accent.desc":
    "Set the color for elements where the accent color is used, such as tags, links, URLs, and the copy completion icon. If unset, the theme's accent color will be used.",
  "settings.tagRule.sub.name": "Sub Color",
  "settings.tagRule.sub.desc":
    "Batch set the color for secondary elements like timestamps, icons, list markers, blockquote lines, and checkboxes. If unset, it will be automatically calculated from the background and text colors.",
  "settings.tagRule.scope.buttons.name":
    "Apply Sub Color to Timestamp, Menu, and Pins",
  "settings.tagRule.scope.buttons.desc":
    "When off, automatically determined colors will be used.",
  "settings.tagRule.scope.quote.name": "Apply Sub Color to Blockquotes",
  "settings.tagRule.scope.quote.desc":
    "When off, automatically determined colors will be used.",
  "settings.tagRule.scope.list.name": "Apply Sub Color to Lists and Checkboxes",
  "settings.tagRule.scope.list.desc":
    "When off, automatically determined colors will be used.",
  "settings.tagRule.scope.ogp.name": "Apply Sub Color to OGP Cards",
  "settings.tagRule.scope.ogp.desc":
    "When off, automatically determined colors will be used.",
  "settings.tagRule.button.add": "Add Rule",

  "settings.tooltip.resetDefault": "Reset to Defaults",
  "settings.tooltip.deleteRule": "Delete This Rule",
  "settings.tooltip.lock": "Lock",
  "settings.tooltip.unlock": "Unlock to edit",

  "view.formatMenu.code": "Code",
  "view.formatMenu.math": "Math",
  "view.formatMenu.quote": "Quote",
  "view.formatMenu.link": "Link",
  "view.formatMenu.strikethrough": "Strikethrough",
  "view.formatMenu.highlight": "Highlight",
  "view.formatMenu.settings": "Settings",

  "view.postMenu.copy": "Copy",
  "view.postMenu.quotePost": "Quote Post",
  "view.postMenu.unpin": "Unpin",
  "view.postMenu.pin": "Pin",
  "view.postMenu.pinLimitHint": "You can pin up to {limit} posts.",

  "view.dateNav.today": "Today",
  "view.dateNav.todaySuffix": " (Today)",

  "view.empty.noMemos": "No notes found",
  "view.notice.saveFailed": "Failed to save note: {error}",
  "view.notice.searchPluginNotFound": "Search plugin not found",

  "view.image.removeAria": "Remove image",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "MMMM YYYY",

  "defaults.headerDateFormat": "MMMM D, YYYY",
  "defaults.submitLabel": "Post",
  "defaults.inputPlaceholder": "Note to self...",
} satisfies Translations;

export default en;
