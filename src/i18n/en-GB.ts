import type { Translations } from "./ja";

// English (UK) translations. Translated via Nani.
const enGB = {
  "settings.section.basic": "Basic Settings",
  "settings.section.advanced": "Advanced Settings",
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
    "Specify the date format for the navigation bar. (e.g. YYYY, MM, DD) \nLeave blank to reset to default.",

  "settings.item.timestampFormat.name": "Timestamp Format",
  "settings.item.timestampFormat.desc":
    "Specify the date and time format for posts. \n(e.g. YYYY, MM, DD, HH, mm, ss)",

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
  "settings.item.submitLabel.desc": "Customise the text displayed on the post button. \nLeave blank for an icon-only button (shown only if an icon is set).",
  "settings.item.submitIcon.name": "Post Button Icon",
  "settings.item.submitIcon.desc":
    "Customise the icon on the post button. \nCopy an icon name from {linkOpen}here{linkClose}. \nLeave blank to hide it.",
  "settings.item.updateLabel.name": "Update Button Text",
  "settings.item.updateLabel.desc":
    "Customise the text displayed on the post button while editing a post. \nLeave blank for an icon-only button (shown only if an icon is set).",
  "settings.item.updateIcon.name": "Update Button Icon",
  "settings.item.updateIcon.desc":
    "Customise the icon shown while editing a post. \nCopy an icon name from {linkOpen}here{linkClose}. \nLeave blank to use the post button's icon.",
  "settings.item.inputPlaceholder.name": "Post Form Placeholder",
  "settings.item.inputPlaceholder.desc":
    "Customise the text shown when the post form is empty. \nLeave blank to hide.",

  "settings.item.tagSuggest.name": "Tag Autocomplete",
  "settings.item.tagSuggest.desc":
    "Typing # suggests tags from your past posts. Switching it off also clears the remembered tags.",

  "settings.item.pinLimit.name": "Pin Limit",
  "settings.item.pinLimit.desc":
    "Set the maximum number of notes that can be pinned to the timeline.",
  "settings.option.pinLimit.1": "1 item",
  "settings.option.pinLimit.3": "3 items",
  "settings.option.pinLimit.5": "5 items",

  "settings.item.ogp.name": "URL Preview",
  "settings.item.ogp.desc":
    "Automatically fetch and display OGP information from URLs in notes. \nIf turned off, no external communication will occur.",

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
    "Add a calendar icon to the navigation bar \nso you can jump straight to any date.",

  "settings.item.showPostDelete.name": "Show delete button",
  "settings.item.showPostDelete.desc":
    "Adds a “Delete” button to the post menu. \nA deleted post cannot be brought back. \nImages attached to the post are not deleted.",

  "settings.item.useCustomAttachmentFolder.name": "Specify image folder",
  "settings.item.useCustomAttachmentFolder.desc":
    "Saves images added from Wrot to a folder of your choice, \nseparate from Obsidian's attachment setting.",

  "settings.item.attachmentFolder.name": "Destination folder",
  "settings.item.attachmentFolder.desc":
    "Select the folder images are saved to. \nIf the folder is missing, Obsidian's attachment setting is used.",
  "settings.item.attachmentFolder.placeholder": "Select a folder",

  "settings.item.tagColorRules.name": "Use Tag Rules",
  "settings.item.tagColorRules.desc":
    "Set colours and tag integration per tag. For colours, the tag appearing first in the text wins.",

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
    "Colour for tags, links, and URLs. Uses the theme's accent colour if unset.",
  "settings.tagRule.sub.name": "Sub Colour",
  "settings.tagRule.sub.desc":
    "Colour for secondary elements like timestamps and list markers. \nCalculated automatically if unset.",
  "settings.tagRule.scope.buttons.name": "Apply Sub Colour to Timestamp, Menu, and Pin",
  "settings.tagRule.scope.buttons.desc": "When off, automatically assigned colours will be used.",
  "settings.tagRule.scope.quote.name": "Apply Sub Colour to Blockquotes",
  "settings.tagRule.scope.quote.desc": "When off, automatically assigned colours will be used.",
  "settings.tagRule.scope.list.name": "Apply Sub Colour to Lists and Tick Boxes",
  "settings.tagRule.scope.list.desc": "When off, automatically assigned colours will be used.",
  "settings.tagRule.scope.ogp.name": "Apply Sub Colour to OGP Cards",
  "settings.tagRule.scope.ogp.desc": "When off, automatically assigned colours will be used.",
  "settings.item.graphTags.name": "Tag Integration",
  "settings.item.graphTags.desc":
    "Makes memo tags count for the graph view and tag: search. \nWhen off, tags stay inside Wrot.",
  "settings.tagRule.noIntegration.name": "Exclude from Tag Integration",
  "settings.tagRule.noIntegration.desc": "When on, this rule's tag written inside memos is left out of Tag Integration \nand stays inside Wrot.",
  "settings.tagRule.hideTimeline.name": "Hide from timeline",
  "settings.tagRule.hideTimeline.desc":
    "When on, memos with this tag no longer appear in the timeline. They stay in the daily note.",
  "settings.tagRule.protectDelete.name": "Disable delete button",
  "settings.tagRule.protectDelete.desc":
    "Greys out the “Delete” button on memos carrying this tag.",
  "settings.tagRule.button.add": "Add Rule",

  "view.formatMenu.code": "Code",
  "view.formatMenu.math": "Maths",
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
  "view.postMenu.pinLimitHint": "Pin limit is {limit} items.",
  "view.postMenu.delete": "Delete",
  // Shown on the same row after the first press, in place of the label above.
  "view.postMenu.deleteConfirm": "Press again to delete",

  "view.dateNav.today": "Today",
  "view.dateNav.todaySuffix": " (Today)",

  "view.empty.noMemos": "No notes to show",
  "view.notice.saveFailed": "Failed to save note: {error}",
  "view.notice.searchPluginNotFound": "Search plugin not found",

  "view.image.removeAria": "Delete image",

  // Placeholder body of a quote card whose original post is gone.
  "quote.card.notFound": "(Original post not found)",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "MMMM YYYY",

  "defaults.headerDateFormat": "D MMMM YYYY",
  "defaults.submitLabel": "Post",
  "defaults.updateLabel": "Update",
  "defaults.inputPlaceholder": "Note to self...",
} satisfies Translations;

export default enGB;
