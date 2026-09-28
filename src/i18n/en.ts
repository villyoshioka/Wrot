import type { Translations } from "./ja";

// English (US-equivalent) translations. Translated via Nani.
const en = {
  "settings.section.basic": "General",
  "settings.section.advanced": "Advanced",
  "settings.section.tagrules": "Tag Rules",

  "settings.item.viewPlacement.name": "Position",
  "settings.item.viewPlacement.desc": "Choose where Wrot is displayed.",
  "settings.option.viewPlacement.left": "Left sidebar",
  "settings.option.viewPlacement.right": "Right sidebar",
  "settings.option.viewPlacement.main": "Main area",
  "settings.item.openOnStartup.name": "Open on startup",
  "settings.item.openOnStartup.desc": "Automatically open Wrot when Obsidian launches.",

  "settings.item.followFontSize.name": "Match Obsidian font size",
  "settings.item.followFontSize.desc": "Inherit the font size configured in Obsidian's Appearance settings.",

  "settings.item.headerDateFormat.name": "Header date format",
  "settings.item.headerDateFormat.desc": "Supports tokens such as YYYY, MM, and DD. \nLeave blank to reset to default.",

  "settings.item.timestampFormat.name": "Timestamp format",
  "settings.item.timestampFormat.desc": "Supports tokens such as YYYY, MM, DD, HH, mm, and ss.",

  "settings.item.bgColorLight.name": "Background color (light mode)",
  "settings.item.bgColorLight.desc": "Used for posts and the compose box.",
  "settings.item.textColorLight.name": "Text color (light mode)",
  "settings.item.textColorLight.desc": "Used for text and icons.",
  "settings.item.bgColorDark.name": "Background color (dark mode)",
  "settings.item.bgColorDark.desc": "Used for posts and the compose box.",
  "settings.item.textColorDark.name": "Text color (dark mode)",
  "settings.item.textColorDark.desc": "Used for text and icons.",

  "settings.item.submitLabel.name": "Post button text",
  "settings.item.submitLabel.desc": "Leave blank for an icon-only button (requires an icon to be set).",
  "settings.item.submitIcon.name": "Post button icon",
  "settings.item.submitIcon.desc": "Copy an icon name from {linkOpen}here{linkClose}. \nLeave blank to hide.",
  "settings.item.updateLabel.name": "Update button text",
  "settings.item.updateLabel.desc": "Used when editing a post. \nLeave blank for an icon-only button (requires an icon to be set).",
  "settings.item.updateIcon.name": "Update button icon",
  "settings.item.updateIcon.desc": "Copy an icon name from {linkOpen}here{linkClose}. \nLeave blank to use the Post button's icon.",
  "settings.item.submitGradient.name": "Compose box gradient",
  "settings.item.submitGradient.desc": "Adds a gradient accent to the compose box.",
  "settings.item.inputPlaceholder.name": "Compose placeholder text",
  "settings.item.inputPlaceholder.desc": "Leave blank to hide.",

  "settings.item.tagSuggest.name": "Tag autocomplete",
  "settings.item.tagSuggest.desc": "Show suggestions when typing after \"#\". \nDisabling this also clears cached tags.",

  "settings.item.pinLimit.name": "Pin limit",
  "settings.item.pinLimit.desc": "\"Pin\" and \"Pin later\" have separate limits.\nLowering this limit unpins any extra posts.",
  "settings.option.pinLimit.1": "1 post",
  "settings.option.pinLimit.3": "3 posts",
  "settings.option.pinLimit.5": "5 posts",
  "settings.item.pinFixed.name": "Keep pins at the top",
  "settings.item.pinFixed.desc": "When disabled, pinned posts scroll along with the timeline.",

  "settings.item.ogp.name": "Link previews",
  "settings.item.ogp.desc": "Fetches metadata for URL previews. \nDisabling this blocks all external network requests.",

  "settings.item.checkStrikethrough.name": "Strikethrough completed items",
  "settings.item.checkStrikethrough.desc": "Apply strikethrough styling to checked checklist items.",

  "settings.item.calendarDayShape.name": "Calendar date shape",
  "settings.item.calendarDayShape.desc": "Choose the shape for dates in the calendar.",
  "settings.option.calendarDayShape.circle": "Circle",
  "settings.option.calendarDayShape.rounded": "Rounded",
  "settings.option.calendarDayShape.square": "Square",

  "settings.item.showCalendarButton.name": "Calendar button",
  "settings.item.showCalendarButton.desc": "Jump to any date from the date navigation bar.",

  "settings.item.showPostDelete.name": "Delete button",
  "settings.item.showPostDelete.desc": "Add a delete option to the post menu. \nDeleted posts cannot be recovered. Attached images are preserved.",

  "settings.item.useCustomAttachmentFolder.name": "Custom attachment folder",
  "settings.item.useCustomAttachmentFolder.desc": "Applies only to images added through Wrot.",

  "settings.item.attachmentFolder.name": "Attachment folder",
  "settings.item.attachmentFolder.desc": "If the folder doesn't exist, Obsidian's default setting is used.",
  "settings.item.attachmentFolder.placeholder": "Select a folder",
  "settings.item.shrinkImages.name": "Compress images",
  "settings.item.shrinkImages.desc": "Compress attached images and strip location/metadata before saving. \nGIFs are kept as-is.",
  "settings.item.postHeading.name": "Template heading selection",
  "settings.item.postHeading.desc": "Posts are added under the selected heading.",
  "settings.option.postHeading.none": "None",

  "settings.item.tagColorRules.name": "Use tag rules",
  "settings.item.tagColorRules.desc": "Customize colors, tag integration, and more per tag. \nFor colors, the first tag in the post takes priority.",

  "settings.tagRule.label": "Rule {n}",
  "settings.tagRule.tag.name": "Tag",
  "settings.tagRule.tag.desc": "The \"#\" prefix can be omitted.",
  "settings.tagRule.tag.placeholder": "Tag name",
  "settings.tagRule.bg.name": "Background color",
  "settings.tagRule.bg.desc": "Applied to the post background.",
  "settings.tagRule.fg.name": "Text color",
  "settings.tagRule.fg.desc": "Tags, links, and URLs use the accent color instead.",
  "settings.tagRule.accent.name": "Accent color",
  "settings.tagRule.accent.desc": "Uses the theme's default accent color if left blank.",
  "settings.tagRule.sub.name": "Secondary color",
  "settings.tagRule.sub.desc": "Used for timestamps, list bullets, and other accents. \nAutomatically calculated if left blank.",
  "settings.tagRule.scope.buttons.name":
    "Apply secondary color to timestamps, menus, and pins",
  "settings.tagRule.scope.buttons.desc":
    "When disabled, automatically calculated colors will be used.",
  "settings.tagRule.scope.quote.name": "Apply secondary color to blockquotes",
  "settings.tagRule.scope.quote.desc":
    "When disabled, automatically calculated colors will be used.",
  "settings.tagRule.scope.list.name": "Apply secondary color to lists and checkboxes",
  "settings.tagRule.scope.list.desc":
    "When disabled, automatically calculated colors will be used.",
  "settings.tagRule.scope.ogp.name": "Apply secondary color to link previews",
  "settings.tagRule.scope.ogp.desc":
    "When disabled, automatically calculated colors will be used.",
  "settings.item.graphTags.name": "Tag integration",
  "settings.item.graphTags.desc": "Make tags discoverable in graph view and tag: searches. \nWhen disabled, tags remain internal to Wrot.",
  "settings.tagRule.noIntegration.name": "Exclude from tag integration",
  "settings.tagRule.noIntegration.desc": "Keep this tag internal to Wrot.",
  "settings.tagRule.hideTimeline.name": "Hide from timeline",
  "settings.tagRule.hideTimeline.desc": "Posts with this tag won't appear in the timeline. \nThey will still be saved to your daily note.",
  "settings.tagRule.protectDelete.name": "Disable delete button",
  "settings.tagRule.protectDelete.desc": "Prevent posts with this tag from being deleted.",
  "settings.tagRule.button.add": "Add rule",
  "settings.item.toolbarEdit.name": "Show toolbar edit button",
  "settings.item.toolbarEdit.desc": "Adds an option to customize the toolbar in the toolbar menu.",
  "settings.item.resetToolbar.name": "Reset toolbar",
  "settings.item.resetToolbar.desc": "Restore the toolbar layout and visibility to defaults.",
  "settings.item.resetToolbar.button": "Reset",
  // Shown on the same row after the first press, in place of the label above.
  "settings.item.resetToolbar.confirm": "Press again to confirm",

  "view.toolbarAction.image": "Image",
  "view.toolbarAction.embed": "Embed",
  "view.toolbarAction.bold": "Bold",
  "view.toolbarAction.italic": "Italic",
  "view.toolbarAction.list": "Bulleted list",
  "view.toolbarAction.check": "Checklist",
  "view.toolbarAction.ol": "Numbered list",
  "view.toolbarAction.more": "More",
  "view.toolbarEdit.done": "Done",
  "view.toolbarEdit.cancel": "Cancel",

  "view.formatMenu.editToolbar": "Edit toolbar",
  "view.formatMenu.code": "Code",
  "view.formatMenu.math": "Math",
  "view.formatMenu.quote": "Quote",
  "view.formatMenu.link": "Link",
  "view.formatMenu.strikethrough": "Strikethrough",
  "view.formatMenu.highlight": "Highlight",
  "view.formatMenu.settings": "Settings",

  "view.postMenu.copy": "Copy",
  "view.postMenu.quotePost": "Quote post",
  "view.postMenu.edit": "Edit",
  "view.postMenu.cancelEdit": "Cancel edit",
  "view.postMenu.unpin": "Unpin",
  "view.postMenu.pin": "Pin",
  "view.postMenu.pinLimitHint": "You can pin up to {limit} posts.",
  "view.postMenu.schedulePin": "Pin later",
  "view.postMenu.delete": "Delete",
  // Shown on the same row after the first press, in place of the label above.
  "view.postMenu.deleteConfirm": "Press again to confirm",

  "view.dateNav.today": "Today",
  "view.dateNav.todaySuffix": " (Today)",

  "view.empty.noMemos": "No posts to show",
  "view.notice.saveFailed": "Failed to save post: {error}",
  "view.notice.postHeadingMissing": "Heading not found in daily note; post was appended to the bottom.",
  "view.notice.postHeadingNoTemplate": "Daily note template not found; heading setting was reset to None.",
  "view.notice.searchPluginNotFound": "The core Search plugin is not enabled.",

  "view.image.removeAria": "Remove image",

  // Placeholder body of a quote card whose original post is gone.
  "quote.card.notFound": "(Original post not found)",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "MMMM YYYY",

  "defaults.headerDateFormat": "MMMM D, YYYY",

  "defaults.timestampFormat": "MM/DD/YYYY HH:mm:ss",
  "defaults.submitLabel": "Post",
  "defaults.updateLabel": "Update",
  "defaults.inputPlaceholder": "Note to self...",
} satisfies Translations;

export default en;
