import en from "./en";
import type { Translations } from "./ja";

// Only entries that differ from en; anything not listed falls through to en.
const enGB = {
  ...en,
  "settings.item.bgColorLight.name": "Background colour (light mode)",
  "settings.item.textColorLight.name": "Text colour (light mode)",
  "settings.item.bgColorDark.name": "Background colour (dark mode)",
  "settings.item.textColorDark.name": "Text colour (dark mode)",
  "settings.item.tagColorRules.desc": "Customise colours, tag integration, and more per tag. \nFor colours, the first tag in the post takes priority.",
  "settings.tagRule.bg.name": "Background colour",
  "settings.tagRule.fg.name": "Text colour",
  "settings.tagRule.fg.desc": "Tags, links, and URLs use the accent colour instead.",
  "settings.tagRule.accent.name": "Accent colour",
  "settings.tagRule.accent.desc": "Uses the theme's default accent colour if left blank.",
  "settings.tagRule.sub.name": "Secondary colour",
  "settings.tagRule.scope.buttons.name": "Apply secondary colour to timestamps, menus, and pins",
  "settings.tagRule.scope.buttons.desc": "When off, an automatic colour is used.",
  "settings.tagRule.scope.quote.name": "Apply secondary colour to blockquotes",
  "settings.tagRule.scope.quote.desc": "When off, an automatic colour is used.",
  "settings.tagRule.scope.list.name": "Apply secondary colour to lists and tick boxes",
  "settings.tagRule.scope.list.desc": "When off, an automatic colour is used.",
  "settings.tagRule.scope.ogp.name": "Apply secondary colour to link previews",
  "settings.tagRule.scope.ogp.desc": "When off, an automatic colour is used.",
  "settings.item.submitGradientMode.desc": "Auto switches based on how light your accent colour is.",
  "settings.item.toolbarEdit.desc": "Adds an option to customise the toolbar in the toolbar menu.",
  "view.formatMenu.math": "Maths",
  "defaults.headerDateFormat": "D MMMM YYYY",
  "defaults.timestampFormat": "DD/MM/YYYY HH:mm:ss",
} satisfies Translations;

export default enGB;
