import en from "./en";
import type { Translations } from "./ja";

// English (UK): the US dictionary with the entries that read differently over here.
// Anything not listed falls through to en, so a new key only has to be added there
// unless the UK wording differs.
const enGB = {
  ...en,
  "settings.section.basic": "Basic Settings",
  "settings.section.advanced": "Advanced Settings",
  "settings.item.followFontSize.name": "Inherit Obsidian Font Size",
  "settings.item.headerDateFormat.desc": "e.g. YYYY, MM, DD. \nLeave blank to reset to default.",
  "settings.item.timestampFormat.desc": "e.g. YYYY, MM, DD, HH, mm, ss.",
  "settings.item.bgColorLight.name": "Background Colour (Light Mode)",
  "settings.item.textColorLight.name": "Text Colour (Light Mode)",
  "settings.item.bgColorDark.name": "Background Colour (Dark Mode)",
  "settings.item.textColorDark.name": "Text Colour (Dark Mode)",
  "settings.item.inputPlaceholder.desc": "Leave blank to hide.",
  "settings.option.pinLimit.1": "1 item",
  "settings.option.pinLimit.3": "3 items",
  "settings.option.pinLimit.5": "5 items",
  "settings.item.showCalendarButton.name": "Show calendar button",
  "settings.item.showCalendarButton.desc": "When on, you can jump to any date from the navigation bar.",
  "settings.item.showPostDelete.name": "Show delete button",
  "settings.item.useCustomAttachmentFolder.name": "Specify image folder",
  "settings.item.attachmentFolder.name": "Destination folder",
  "settings.item.tagColorRules.desc": "Lets you change the colour, tag integration and more per tag. \nFor colour, the tag appearing first in the text wins.",
  "settings.tagRule.tag.desc": "# can be omitted.",
  "settings.tagRule.tag.placeholder": "Tag Name",
  "settings.tagRule.bg.name": "Background Colour",
  "settings.tagRule.fg.name": "Text Colour",
  "settings.tagRule.fg.desc": "Tags, links and URLs are set via Accent Colour.",
  "settings.tagRule.accent.name": "Accent Colour",
  "settings.tagRule.accent.desc": "Uses the theme's accent colour if unset.",
  "settings.tagRule.sub.name": "Sub Colour",
  "settings.tagRule.sub.desc": "The colour of timestamps, list markers and the like. \nWorked out automatically if unset.",
  "settings.tagRule.scope.buttons.name": "Apply Sub Colour to Timestamp, Menu, and Pin",
  "settings.tagRule.scope.buttons.desc": "When off, automatically assigned colours will be used.",
  "settings.tagRule.scope.quote.name": "Apply Sub Colour to Blockquotes",
  "settings.tagRule.scope.quote.desc": "When off, automatically assigned colours will be used.",
  "settings.tagRule.scope.list.name": "Apply Sub Colour to Lists and Tick Boxes",
  "settings.tagRule.scope.list.desc": "When off, automatically assigned colours will be used.",
  "settings.tagRule.scope.ogp.name": "Apply Sub Colour to OGP Cards",
  "settings.tagRule.scope.ogp.desc": "When off, automatically assigned colours will be used.",
  "view.formatMenu.math": "Maths",
  "view.postMenu.pinLimitHint": "Pin limit is {limit} items.",
  "view.image.removeAria": "Delete image",
  "defaults.headerDateFormat": "D MMMM YYYY",
} satisfies Translations;

export default enGB;
