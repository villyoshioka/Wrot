import type { Translations } from "./ja";

// German translations. Translated via Nani.
const de = {
  "settings.section.basic": "Grundeinstellungen",
  "settings.section.advanced": "Erweiterte Einstellungen",
  "settings.section.tagrules": "Tag-Regeleinstellungen",

  "settings.item.viewPlacement.name": "Anzeigeposition",
  "settings.item.viewPlacement.desc": "Wirkt sich beim nächsten Öffnen von Wrot aus.",
  "settings.option.viewPlacement.left": "Linke Seitenleiste",
  "settings.option.viewPlacement.right": "Rechte Seitenleiste",
  "settings.option.viewPlacement.main": "Hauptbereich",

  "settings.item.followFontSize.name": "Schriftgröße von Obsidian folgen",
  "settings.item.followFontSize.desc": "Wenn aktiviert, wird die Schriftgröße aus den Darstellungseinstellungen von Obsidian übernommen.",

  "settings.item.headerDateFormat.name": "Datumsformat der Kopfzeile",
  "settings.item.headerDateFormat.desc": "YYYY, MM, DD usw. können verwendet werden. \nLeer lassen, um auf den Standardwert zurückzusetzen.",

  "settings.item.timestampFormat.name": "Zeitstempel-Format",
  "settings.item.timestampFormat.desc": "YYYY, MM, DD, HH, mm, ss können verwendet werden.",

  "settings.item.bgColorLight.name": "Hintergrundfarbe (Heller Modus)",
  "settings.item.bgColorLight.desc": "Gilt für Beiträge und das Eingabefeld.",
  "settings.item.textColorLight.name": "Textfarbe (Heller Modus)",
  "settings.item.textColorLight.desc": "Gilt für Text und Symbole.",
  "settings.item.bgColorDark.name": "Hintergrundfarbe (Dunkler Modus)",
  "settings.item.bgColorDark.desc": "Gilt für Beiträge und das Eingabefeld.",
  "settings.item.textColorDark.name": "Textfarbe (Dunkler Modus)",
  "settings.item.textColorDark.desc": "Gilt für Text und Symbole.",

  "settings.item.submitLabel.name": "Text der Posten-Schaltfläche",
  "settings.item.submitLabel.desc": "Leer lassen für eine reine Symbol-Schaltfläche (nur wenn ein Symbol festgelegt ist).",
  "settings.item.submitIcon.name": "Symbol der Posten-Schaltfläche",
  "settings.item.submitIcon.desc": "Symbolnamen {linkOpen}hier{linkClose} kopieren. \nLeer lassen blendet es aus.",
  "settings.item.updateLabel.name": "Text der Aktualisieren-Schaltfläche",
  "settings.item.updateLabel.desc": "Wird während der Bearbeitung eines Beitrags verwendet. \nLeer lassen für eine reine Symbol-Schaltfläche (nur wenn ein Symbol festgelegt ist).",
  "settings.item.updateIcon.name": "Symbol der Aktualisieren-Schaltfläche",
  "settings.item.updateIcon.desc": "Symbolnamen {linkOpen}hier{linkClose} kopieren. \nLeer lassen übernimmt das Symbol der Posten-Schaltfläche.",
  "settings.item.inputPlaceholder.name": "Platzhaltertext im Eingabefeld",
  "settings.item.inputPlaceholder.desc": "Lassen Sie das Feld leer, um ihn auszublenden.",

  "settings.item.tagSuggest.name": "Tag-Autovervollständigung",
  "settings.item.tagSuggest.desc": "Nach dem # erscheinen Vorschläge. \nBeim Ausschalten werden die gemerkten Vorschläge gelöscht.",

  "settings.item.pinLimit.name": "Limit für angepinnte Beiträge",
  "settings.item.pinLimit.desc": "Wird das Limit gesenkt, werden überzählige Anheftungen gelöst.",
  "settings.option.pinLimit.1": "1 Beitrag",
  "settings.option.pinLimit.3": "3 Beiträge",
  "settings.option.pinLimit.5": "5 Beiträge",

  "settings.item.ogp.name": "URL-Vorschau",
  "settings.item.ogp.desc": "Ruft Vorschaudaten von URLs ab. \nAusgeschaltet findet keine Verbindung nach außen statt.",

  "settings.item.checkStrikethrough.name": "Durchstreichen bei aktiviertem Kontrollkästchen",
  "settings.item.checkStrikethrough.desc": "Ausgeschaltet bleibt der Text unverändert.",

  "settings.item.calendarDayShape.name": "Form der Datumstasten",
  "settings.item.calendarDayShape.desc": "Gilt für die Tage im Kalender.",
  "settings.option.calendarDayShape.circle": "Rund",
  "settings.option.calendarDayShape.rounded": "Abgerundet",
  "settings.option.calendarDayShape.square": "Eckig",

  "settings.item.showCalendarButton.name": "Kalender-Button einblenden",
  "settings.item.showCalendarButton.desc": "Wenn aktiviert, springen Sie aus der Datumsnavigation zu einem beliebigen Datum.",

  "settings.item.showPostDelete.name": "Löschen-Button einblenden",
  "settings.item.showPostDelete.desc": "Wenn aktiviert, kommt im Memo-Menü eine Löschen-Schaltfläche hinzu. \nEin gelöschtes Memo lässt sich nicht wiederherstellen. Angehängte Bilder werden nicht gelöscht.",

  "settings.item.useCustomAttachmentFolder.name": "Bildordner festlegen",
  "settings.item.useCustomAttachmentFolder.desc": "Gilt nur für über Wrot hinzugefügte Bilder.",

  "settings.item.attachmentFolder.name": "Zielordner",
  "settings.item.attachmentFolder.desc": "Fehlt der Ordner, gilt die Einstellung von Obsidian.",
  "settings.item.attachmentFolder.placeholder": "Ordner wählen",

  "settings.item.tagColorRules.name": "Tag-Regeln verwenden",
  "settings.item.tagColorRules.desc": "Farbe, Tag-Integration und mehr lassen sich je Tag festlegen. \nBei der Farbe gewinnt das zuerst im Text stehende Tag.",

  "settings.tagRule.label": "Regel {n}",
  "settings.tagRule.tag.name": "Tag",
  "settings.tagRule.tag.desc": "# kann weggelassen werden.",
  "settings.tagRule.tag.placeholder": "Tag-Name",
  "settings.tagRule.bg.name": "Hintergrundfarbe",
  "settings.tagRule.bg.desc": "Gilt für den Hintergrund des Beitrags.",
  "settings.tagRule.fg.name": "Textfarbe",
  "settings.tagRule.fg.desc": "Tags, Links und URLs werden über die Akzentfarbe eingestellt.",
  "settings.tagRule.accent.name": "Akzentfarbe",
  "settings.tagRule.accent.desc": "Ohne Angabe wird die Akzentfarbe des Themes verwendet.",
  "settings.tagRule.sub.name": "Subfarbe",
  "settings.tagRule.sub.desc": "Die Farbe von Zeitstempeln, Listenzeichen und Ähnlichem. \nOhne Angabe wird sie automatisch berechnet.",
  "settings.tagRule.scope.buttons.name": "Subfarbe auf Zeitstempel, Menüs und Pins anwenden",
  "settings.tagRule.scope.buttons.desc": "Wenn deaktiviert, wird die automatisch festgelegte Farbe verwendet.",
  "settings.tagRule.scope.quote.name": "Subfarbe auf Zitate anwenden",
  "settings.tagRule.scope.quote.desc": "Wenn deaktiviert, wird die automatisch festgelegte Farbe verwendet.",
  "settings.tagRule.scope.list.name": "Subfarbe auf Listen und Kontrollkästchen anwenden",
  "settings.tagRule.scope.list.desc": "Wenn deaktiviert, wird die automatisch festgelegte Farbe verwendet.",
  "settings.tagRule.scope.ogp.name": "Subfarbe auf OGP-Karten anwenden",
  "settings.tagRule.scope.ogp.desc": "Wenn deaktiviert, wird die automatisch festgelegte Farbe verwendet.",
  "settings.item.graphTags.name": "Tag-Integration",
  "settings.item.graphTags.desc": "Tags werden Teil von Graphansicht und tag:-Suche. \nAusgeschaltet bleiben sie nur in Wrot.",
  "settings.tagRule.noIntegration.name": "Von der Tag-Integration ausschließen",
  "settings.tagRule.noIntegration.desc": "Wenn aktiviert, bleibt dieses Tag nur in Wrot.",
  "settings.tagRule.hideTimeline.name": "In der Timeline ausblenden",
  "settings.tagRule.hideTimeline.desc": "Wenn aktiviert, erscheinen Memos mit diesem Tag nicht mehr in der Timeline. \nIn der Tagesnotiz bleiben sie.",
  "settings.tagRule.protectDelete.name": "Löschen-Button deaktivieren",
  "settings.tagRule.protectDelete.desc": "Wenn aktiviert, lassen sich Memos mit diesem Tag nicht löschen.",
  "settings.tagRule.button.add": "Regel hinzufügen",

  "view.formatMenu.code": "Code",
  "view.formatMenu.math": "Formel",
  "view.formatMenu.quote": "Zitat",
  "view.formatMenu.link": "Link",
  "view.formatMenu.strikethrough": "Durchgestrichen",
  "view.formatMenu.highlight": "Hervorheben",
  "view.formatMenu.settings": "Einstellungen",

  "view.postMenu.copy": "Kopieren",
  "view.postMenu.quotePost": "Beitrag zitieren",
  "view.postMenu.edit": "Bearbeiten",
  "view.postMenu.cancelEdit": "Bearbeitung abbrechen",
  "view.postMenu.unpin": "Anpinnen aufheben",
  "view.postMenu.pin": "Anpinnen",
  "view.postMenu.pinLimitHint": "Sie können maximal {limit} Beiträge anpinnen.",
  "view.postMenu.delete": "Löschen",
  // Shown on the same row after the first press, in place of the label above.
  "view.postMenu.deleteConfirm": "Zum Löschen erneut drücken",

  "view.dateNav.today": "Heute",
  "view.dateNav.todaySuffix": " (Heute)",

  "view.empty.noMemos": "Keine Notizen anzuzeigen",
  "view.notice.saveFailed": "Fehler beim Speichern der Notiz: {error}",
  "view.notice.searchPluginNotFound": "Such-Plugin nicht gefunden",

  "view.image.removeAria": "Bild löschen",

  // Placeholder body of a quote card whose original post is gone.
  "quote.card.notFound": "(Ursprüngliches Memo nicht gefunden)",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "MMMM YYYY",

  "defaults.headerDateFormat": "D. MMMM YYYY",
  "defaults.submitLabel": "Posten",
  "defaults.updateLabel": "Aktualisieren",
  "defaults.inputPlaceholder": "Schreib etwas ...",
} satisfies Translations;

export default de;
