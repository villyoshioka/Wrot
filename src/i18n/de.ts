import type { Translations } from "./ja";

// German translations. Translated via Nani.
const de = {
  "settings.section.basic": "Allgemein",
  "settings.section.advanced": "Erweitert",
  "settings.section.tagrules": "Tag-Regeln",

  "settings.item.viewPlacement.name": "Position",
  "settings.item.viewPlacement.desc": "Legt fest, wo Wrot angezeigt wird.",
  "settings.option.viewPlacement.left": "Linke Seitenleiste",
  "settings.option.viewPlacement.right": "Rechte Seitenleiste",
  "settings.option.viewPlacement.main": "Hauptbereich",
  "settings.item.openOnStartup.name": "Beim Start öffnen",
  "settings.item.openOnStartup.desc": "Öffnet Wrot beim Start von Obsidian automatisch im Vordergrund.",

  "settings.item.followFontSize.name": "Obsidian-Schriftgröße verwenden",
  "settings.item.followFontSize.desc": "Übernimmt die Schriftgröße aus den Darstellungseinstellungen von Obsidian.",

  "settings.item.headerDateFormat.name": "Datumsformat der Kopfzeile",
  "settings.item.headerDateFormat.desc": "Formate wie YYYY, MM, DD usw. werden unterstützt.\nLeer lassen für Standardeinstellung.",

  "settings.item.timestampFormat.name": "Zeitstempel-Format",
  "settings.item.timestampFormat.desc": "Unterstützt YYYY, MM, DD, HH, mm, ss.",

  "settings.item.bgColorLight.name": "Hintergrundfarbe (Hell)",
  "settings.item.bgColorLight.desc": "Gilt für Beiträge und das Eingabefeld.",
  "settings.item.textColorLight.name": "Textfarbe (Hell)",
  "settings.item.textColorLight.desc": "Gilt für Text und Symbole.",
  "settings.item.bgColorDark.name": "Hintergrundfarbe (Dunkel)",
  "settings.item.bgColorDark.desc": "Gilt für Beiträge und das Eingabefeld.",
  "settings.item.textColorDark.name": "Textfarbe (Dunkel)",
  "settings.item.textColorDark.desc": "Gilt für Text und Symbole.",

  "settings.item.submitLabel.name": "Beschriftung der Senden-Schaltfläche",
  "settings.item.submitLabel.desc": "Leer lassen, um nur das Symbol anzuzeigen (nur wenn ein Symbol festgelegt ist).",
  "settings.item.submitIcon.name": "Symbol der Senden-Schaltfläche",
  "settings.item.submitIcon.desc": "Symbolnamen {linkOpen}hier kopieren{linkClose}.\nLeer lassen blendet das Symbol aus.",
  "settings.item.updateLabel.name": "Beschriftung der Aktualisieren-Schaltfläche",
  "settings.item.updateLabel.desc": "Wird beim Bearbeiten eines Beitrags verwendet.\nLeer lassen, um nur das Symbol anzuzeigen (nur wenn ein Symbol festgelegt ist).",
  "settings.item.updateIcon.name": "Symbol der Aktualisieren-Schaltfläche",
  "settings.item.updateIcon.desc": "Symbolnamen {linkOpen}hier kopieren{linkClose}.\nLeer lassen übernimmt das Symbol der Senden-Schaltfläche.",
  "settings.item.submitGradient.name": "Farbverlauf des Eingabeformulars",
  "settings.item.submitGradient.desc": "Aktiviert einen subtilen Farbverlauf auf den Akzentflächen des Formulars.",
  "settings.item.submitGradientMode.name": "Helligkeit des Farbverlaufs",
  "settings.item.submitGradientMode.desc": "„Automatisch“ richtet sich nach der Helligkeit der Akzentfarbe.",
  "settings.option.submitGradientMode.auto": "Automatisch",
  "settings.option.submitGradientMode.light": "Heller",
  "settings.option.submitGradientMode.dark": "Dunkler",
  "settings.item.inputPlaceholder.name": "Platzhaltertext des Eingabefelds",
  "settings.item.inputPlaceholder.desc": "Leer lassen, um den Hinweistext auszublenden.",

  "settings.item.tagSuggest.name": "Tag-Vervollständigung",
  "settings.item.tagSuggest.desc": "Zeigt Vorschläge nach der Eingabe von # an.\nBeim Deaktivieren wird der Vorschlagsverlauf gelöscht.",

  "settings.item.pinLimit.name": "Maximale Anzahl angepinnter Beiträge",
  "settings.item.pinLimit.desc": "Gilt jeweils separat für „Anpinnen“ und „Später anpinnen“.\nBeim Reduzieren des Limits werden überzählige Beiträge gelöst.",
  "settings.option.pinLimit.1": "1 Beitrag",
  "settings.option.pinLimit.3": "3 Beiträge",
  "settings.option.pinLimit.5": "5 Beiträge",
  "settings.item.pinFixed.name": "Angepinnte Beiträge oben fixieren",
  "settings.item.pinFixed.desc": "Wenn deaktiviert, scrollen angepinnte Beiträge normal mit der Timeline mit.",

  "settings.item.ogp.name": "Link-Vorschau",
  "settings.item.ogp.desc": "Lädt Metadaten und Vorschaubilder für URLs.\nWenn deaktiviert, werden keine externen Anfragen gesendet.",

  "settings.item.checkStrikethrough.name": "Erledigte Aufgaben durchstreichen",
  "settings.item.checkStrikethrough.desc": "Aktivierte Kontrollkästchen werden nicht durchgestrichen, wenn diese Option ausgeschaltet ist.",

  "settings.item.calendarDayShape.name": "Form der Tagestasten",
  "settings.item.calendarDayShape.desc": "Design der Datumsanzeigen im Kalender.",
  "settings.option.calendarDayShape.circle": "Kreis",
  "settings.option.calendarDayShape.rounded": "Abgerundet",
  "settings.option.calendarDayShape.square": "Quadratisch",

  "settings.item.showCalendarButton.name": "Kalender-Button anzeigen",
  "settings.item.showCalendarButton.desc": "Ermöglicht das schnelle Springen zu einem beliebigen Datum über die Navigation.",

  "settings.item.showPostDelete.name": "Löschen-Schaltfläche anzeigen",
  "settings.item.showPostDelete.desc": "Fügt dem Beitragsmenü die Option „Löschen“ hinzu.\nGelöschte Beiträge können nicht wiederhergestellt werden (Medienanhänge bleiben erhalten).",

  "settings.item.useCustomAttachmentFolder.name": "Eigenen Medienordner verwenden",
  "settings.item.useCustomAttachmentFolder.desc": "Gilt ausschließlich für über Wrot eingefügte Bilder.",

  "settings.item.attachmentFolder.name": "Speicherort",
  "settings.item.attachmentFolder.desc": "Existiert der Ordner nicht, gelten die Einstellungen von Obsidian.",
  "settings.item.attachmentFolder.placeholder": "Ordner auswählen",
  "settings.item.shrinkImages.name": "Bilder komprimieren",
  "settings.item.shrinkImages.desc": "Komprimiert Anhänge und entfernt Metadaten (wie EXIF/Standort) vor dem Speichern.\nGIFs bleiben unverändert.",
  "settings.item.postHeading.name": "Ziel-Überschrift (Vorlage)",
  "settings.item.postHeading.desc": "Neue Einträge werden automatisch unter der ausgewählten Überschrift einsortiert.",
  "settings.option.postHeading.none": "Keine",

  "settings.item.tagColorRules.name": "Tag-spezifische Regeln",
  "settings.item.tagColorRules.desc": "Erlaubt individuelle Farben und Einstellungen pro Tag.\nEnthält ein Beitrag mehrere Tags, bestimmt das erste Tag das Aussehen.",

  "settings.tagRule.label": "Regel {n}",
  "settings.tagRule.tag.name": "Tag",
  "settings.tagRule.tag.desc": "Das führende #-Symbol kann weggelassen werden.",
  "settings.tagRule.tag.placeholder": "Tag-Name",
  "settings.tagRule.bg.name": "Hintergrundfarbe",
  "settings.tagRule.bg.desc": "Farbe für den Hintergrund der Notizkarte.",
  "settings.tagRule.fg.name": "Textfarbe",
  "settings.tagRule.fg.desc": "Farbe für Fließtext (Tags, Links und URLs richten sich nach der Akzentfarbe).",
  "settings.tagRule.accent.name": "Akzentfarbe",
  "settings.tagRule.accent.desc": "Standardmäßig wird die Akzentfarbe des aktuellen Themes verwendet.",
  "settings.tagRule.sub.name": "Sekundärfarbe",
  "settings.tagRule.sub.desc": "Für Zeitstempel, Listenpunkte und Symbole.\nWird automatisch berechnet, wenn nicht angegeben.",
  "settings.tagRule.scope.buttons.name": "Sekundärfarbe für Buttons & Zeitstempel",
  "settings.tagRule.scope.buttons.desc": "Wenn deaktiviert, wird die berechnete Standardfarbe verwendet.",
  "settings.tagRule.scope.quote.name": "Sekundärfarbe für Zitate",
  "settings.tagRule.scope.quote.desc": "Wenn deaktiviert, wird die berechnete Standardfarbe verwendet.",
  "settings.tagRule.scope.list.name": "Sekundärfarbe für Listen & Kontrollkästchen",
  "settings.tagRule.scope.list.desc": "Wenn deaktiviert, wird die berechnete Standardfarbe verwendet.",
  "settings.tagRule.scope.ogp.name": "Sekundärfarbe für Link-Vorschaukarten",
  "settings.tagRule.scope.ogp.desc": "Wenn deaktiviert, wird die berechnete Standardfarbe verwendet.",
  "settings.item.graphTags.name": "Globale Tag-Integration",
  "settings.item.graphTags.desc": "Tags werden in der Graph-Ansicht und Obsidian-Suche (tag:) erfasst.\nWenn deaktiviert, bleiben sie rein intern in Wrot.",
  "settings.tagRule.noIntegration.name": "Von Tag-Integration ausschließen",
  "settings.tagRule.noIntegration.desc": "Behandelt dieses Tag ausschließlich intern in Wrot.",
  "settings.tagRule.hideTimeline.name": "In der Timeline ausblenden",
  "settings.tagRule.hideTimeline.desc": "Einträge mit diesem Tag erscheinen nicht in der Timeline, bleiben aber in der Tagesnotiz erhalten.",
  "settings.tagRule.protectDelete.name": "Löschschutz aktivieren",
  "settings.tagRule.protectDelete.desc": "Verhindert das Löschen von Beiträgen mit diesem Tag.",
  "settings.tagRule.button.add": "Regel hinzufügen",
  "settings.item.toolbarEdit.name": "Eintrag „Symbolleiste anpassen“ anzeigen",
  "settings.item.toolbarEdit.desc": "Fügt dem Menü der Symbolleiste eine Option zur Anpassung hinzu.",
  "settings.item.resetToolbar.name": "Symbolleiste zurücksetzen",
  "settings.item.resetToolbar.desc": "Stellt die standardmäßige Anordnung und Sichtbarkeit der Leiste wieder her.",
  "settings.item.resetToolbar.button": "Zurücksetzen",
  // Shown on the same row after the first press, in place of the label above.
  "settings.item.resetToolbar.confirm": "Zum Bestätigen nochmals drücken",

  "view.toolbarAction.image": "Bild",
  "view.toolbarAction.embed": "Einbetten",
  "view.toolbarAction.bold": "Fett",
  "view.toolbarAction.italic": "Kursiv",
  "view.toolbarAction.list": "Aufzählung",
  "view.toolbarAction.check": "Checkliste",
  "view.toolbarAction.ol": "Nummerierte Liste",
  "view.toolbarAction.more": "Weitere",
  "view.toolbarEdit.done": "Fertig",
  "view.toolbarEdit.cancel": "Abbrechen",

  "view.formatMenu.editToolbar": "Symbolleiste anpassen",
  "view.formatMenu.code": "Code",
  "view.formatMenu.math": "Formel",
  "view.formatMenu.quote": "Zitat",
  "view.formatMenu.link": "Link",
  "view.formatMenu.strikethrough": "Durchgestrichen",
  "view.formatMenu.highlight": "Hervorgehoben",
  "view.formatMenu.settings": "Einstellungen",

  "view.postMenu.copy": "Kopieren",
  "view.postMenu.quotePost": "Zitieren",
  "view.postMenu.edit": "Bearbeiten",
  "view.postMenu.cancelEdit": "Bearbeitung abbrechen",
  "view.postMenu.unpin": "Lösen",
  "view.postMenu.pin": "Anpinnen",
  "view.postMenu.pinLimitHint": "Maximal {limit} angepinnte Beiträge möglich.",
  "view.postMenu.schedulePin": "Später anpinnen",
  "view.postMenu.delete": "Löschen",
  // Shown on the same row after the first press, in place of the label above.
  "view.postMenu.deleteConfirm": "Zum Bestätigen nochmals drücken",

  "view.dateNav.today": "Heute",
  "view.dateNav.todaySuffix": " (Heute)",

  "view.empty.noMemos": "Keine Einträge vorhanden",
  "view.notice.saveFailed": "Fehler beim Speichern der Notiz: {error}",
  "view.notice.postHeadingMissing": "Die angegebene Überschrift wurde in dieser Notiz nicht gefunden. Der Eintrag wurde am Dateiende angehängt.",
  "view.notice.postHeadingNoTemplate": "Vorlage für tägliche Notizen nicht gefunden. Überschrift wurde auf „Keine“ zurückgesetzt.",
  "view.notice.searchPluginNotFound": "Das Kern-Plugin „Suche“ ist nicht aktiviert.",

  "view.image.removeAria": "Bild entfernen",

  // Placeholder body of a quote card whose original post is gone.
  "quote.card.notFound": "(Zitiertes Original nicht gefunden)",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "MMMM YYYY",

  "defaults.headerDateFormat": "D. MMMM YYYY",

  "defaults.timestampFormat": "DD.MM.YYYY HH:mm:ss",
  "defaults.submitLabel": "Senden",
  "defaults.updateLabel": "Aktualisieren",
  "defaults.inputPlaceholder": "Schreib etwas ...",
} satisfies Translations;

export default de;
