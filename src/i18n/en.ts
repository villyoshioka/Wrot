import type { Translations } from "./ja";

// English (US-equivalent) translations. Translated via Nani.
const en = {
  "settings.section.basic": "General",
  "settings.section.advanced": "Advanced",
  "settings.section.tagrules": "Tag Rules",

  "settings.item.viewPlacement.name": "Display Position",
  "settings.item.viewPlacement.desc": "Applies the next time Wrot is opened.",
  "settings.option.viewPlacement.left": "Left Sidebar",
  "settings.option.viewPlacement.right": "Right Sidebar",
  "settings.option.viewPlacement.main": "Main Area",

  "settings.item.followFontSize.name": "Follow Obsidian Font Size",
  "settings.item.followFontSize.desc": "When on, matches the font size from Obsidian's appearance settings.",

  "settings.item.headerDateFormat.name": "Header Date Format",
  "settings.item.headerDateFormat.desc": "YYYY, MM, DD, etc. can be used. \nLeave blank to reset to default.",

  "settings.item.timestampFormat.name": "Timestamp Format",
  "settings.item.timestampFormat.desc": "YYYY, MM, DD, HH, mm, ss can be used.",

  "settings.item.bgColorLight.name": "Background Color (Light Mode)",
  "settings.item.bgColorLight.desc": "Used for posts and the post form.",
  "settings.item.textColorLight.name": "Text Color (Light Mode)",
  "settings.item.textColorLight.desc": "Used for text and icons.",
  "settings.item.bgColorDark.name": "Background Color (Dark Mode)",
  "settings.item.bgColorDark.desc": "Used for posts and the post form.",
  "settings.item.textColorDark.name": "Text Color (Dark Mode)",
  "settings.item.textColorDark.desc": "Used for text and icons.",

  "settings.item.submitLabel.name": "Post Button Text",
  "settings.item.submitLabel.desc": "Leave blank for an icon-only button (only if an icon is set).",
  "settings.item.submitIcon.name": "Post Button Icon",
  "settings.item.submitIcon.desc": "Copy an icon name from {linkOpen}here{linkClose}. \nLeave blank to hide it.",
  "settings.item.updateLabel.name": "Update Button Text",
  "settings.item.updateLabel.desc": "Used while editing a post. \nLeave blank for an icon-only button (only if an icon is set).",
  "settings.item.updateIcon.name": "Update Button Icon",
  "settings.item.updateIcon.desc": "Copy an icon name from {linkOpen}here{linkClose}. \nLeave blank to use the post button's icon.",
  "settings.item.inputPlaceholder.name": "Post Form Placeholder",
  "settings.item.inputPlaceholder.desc": "Leave blank to hide it.",

  "settings.item.tagSuggest.name": "Tag Autocomplete",
  "settings.item.tagSuggest.desc": "Typing after # shows suggestions. \nSwitching it off also clears the remembered ones.",

  "settings.item.pinLimit.name": "Pin Limit",
  "settings.item.pinLimit.desc": "Lowering the limit unpins anything over it.",
  "settings.option.pinLimit.1": "1 Post",
  "settings.option.pinLimit.3": "3 Posts",
  "settings.option.pinLimit.5": "5 Posts",

  "settings.item.ogp.name": "URL Preview",
  "settings.item.ogp.desc": "Fetches preview details from URLs. \nSwitching it off stops all outside connections.",

  "settings.item.checkStrikethrough.name": "Strikethrough for Checked Items",
  "settings.item.checkStrikethrough.desc": "Left off, the text stays as it is.",

  "settings.item.calendarDayShape.name": "Date Button Shape",
  "settings.item.calendarDayShape.desc": "Applies to the days in the calendar.",
  "settings.option.calendarDayShape.circle": "Circle",
  "settings.option.calendarDayShape.rounded": "Rounded",
  "settings.option.calendarDayShape.square": "Square",

  "settings.item.showCalendarButton.name": "Calendar Button",
  "settings.item.showCalendarButton.desc": "When on, you can jump to any date from the date nav.",

  "settings.item.showPostDelete.name": "Delete Button",
  "settings.item.showPostDelete.desc": "When on, a delete button is added to the post menu. \nA deleted post cannot be brought back. Attached images are not deleted.",

  "settings.item.useCustomAttachmentFolder.name": "Image Folder",
  "settings.item.useCustomAttachmentFolder.desc": "Applies only to images added from Wrot.",

  "settings.item.attachmentFolder.name": "Destination Folder",
  "settings.item.attachmentFolder.desc": "If the folder is missing, Obsidian's own setting is used.",
  "settings.item.attachmentFolder.placeholder": "Select a folder",

  "settings.item.tagColorRules.name": "Use Tag Rules",
  "settings.item.tagColorRules.desc": "Lets you change the color, tag integration and more per tag. \nFor color, the tag appearing first in the text wins.",

  "settings.tagRule.label": "Rule {n}",
  "settings.tagRule.tag.name": "Tag",
  "settings.tagRule.tag.desc": "The # symbol can be omitted.",
  "settings.tagRule.tag.placeholder": "Tag name",
  "settings.tagRule.bg.name": "Background Color",
  "settings.tagRule.bg.desc": "Used for the post background.",
  "settings.tagRule.fg.name": "Text Color",
  "settings.tagRule.fg.desc": "Tags, links and URLs are set using the accent color.",
  "settings.tagRule.accent.name": "Accent Color",
  "settings.tagRule.accent.desc": "Uses the theme's accent color if unset.",
  "settings.tagRule.sub.name": "Sub Color",
  "settings.tagRule.sub.desc": "The color of timestamps, list markers and the like. \nWorked out automatically if unset.",
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
  "settings.item.graphTags.name": "Tag Integration",
  "settings.item.graphTags.desc": "Tags become part of graph view and tag: search. \nLeft off, they stay inside Wrot.",
  "settings.tagRule.noIntegration.name": "Exclude from Tag Integration",
  "settings.tagRule.noIntegration.desc": "When on, this tag stays inside Wrot.",
  "settings.tagRule.hideTimeline.name": "Hide from timeline",
  "settings.tagRule.hideTimeline.desc": "When on, posts with this tag no longer appear in the timeline. \nThey stay in the daily note.",
  "settings.tagRule.protectDelete.name": "Disable delete button",
  "settings.tagRule.protectDelete.desc": "When on, posts with this tag cannot be deleted.",
  "settings.tagRule.button.add": "Add Rule",

  "view.formatMenu.code": "Code",
  "view.formatMenu.math": "Math",
  "view.formatMenu.quote": "Quote",
  "view.formatMenu.link": "Link",
  "view.formatMenu.strikethrough": "Strikethrough",
  "view.formatMenu.highlight": "Highlight",
  "view.formatMenu.settings": "Settings",

  "view.postMenu.copy": "Copy",
  "view.postMenu.quotePost": "Quote Post",
  "view.postMenu.edit": "Edit",
  "view.postMenu.cancelEdit": "Cancel Edit",
  "view.postMenu.unpin": "Unpin",
  "view.postMenu.pin": "Pin",
  "view.postMenu.pinLimitHint": "You can pin up to {limit} posts.",
  "view.postMenu.delete": "Delete",
  // Shown on the same row after the first press, in place of the label above.
  "view.postMenu.deleteConfirm": "Press again to delete",

  "view.dateNav.today": "Today",
  "view.dateNav.todaySuffix": " (Today)",

  "view.empty.noMemos": "No notes to show",
  "view.notice.saveFailed": "Failed to save note: {error}",
  "view.notice.searchPluginNotFound": "Search plugin not found",

  "view.image.removeAria": "Remove image",

  // Placeholder body of a quote card whose original post is gone.
  "quote.card.notFound": "(Original post not found)",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "MMMM YYYY",

  "defaults.headerDateFormat": "MMMM D, YYYY",
  "defaults.submitLabel": "Post",
  "defaults.updateLabel": "Update",
  "defaults.inputPlaceholder": "Note to self...",
} satisfies Translations;

export default en;
