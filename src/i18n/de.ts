import type { Translations } from "./ja";

// German translations. Translated via Nani.
const de = {
  "settings.section.basic": "Grundeinstellungen",
  "settings.section.advanced": "Erweiterte Einstellungen",
  "settings.section.tagrules": "Tag-Regeleinstellungen",

  "settings.item.viewPlacement.name": "Anzeigeposition",
  "settings.item.viewPlacement.desc": "Wählen Sie die Anzeigeposition für das Wrot-Panel aus.",
  "settings.option.viewPlacement.left": "Linke Seitenleiste",
  "settings.option.viewPlacement.right": "Rechte Seitenleiste",
  "settings.option.viewPlacement.main": "Hauptbereich",

  "settings.item.followFontSize.name": "Schriftgröße von Obsidian folgen",
  "settings.item.followFontSize.desc":
    "Passt die Textgröße von Wrot an die Darstellungseinstellungen von Obsidian an.",

  "settings.item.headerDateFormat.name": "Datumsformat der Kopfzeile",
  "settings.item.headerDateFormat.desc":
    "Geben Sie das Format für das Datum in der Datumsnavigation an. (YYYY, MM, DD usw. können verwendet werden) \nLeer lassen, um auf den Standardwert zurückzusetzen.",

  "settings.item.timestampFormat.name": "Zeitstempel-Format",
  "settings.item.timestampFormat.desc":
    "Geben Sie das Format für Datum und Uhrzeit der Beiträge an. \n(YYYY, MM, DD, HH, mm, ss können verwendet werden)",

  "settings.item.bgColorLight.name": "Hintergrundfarbe (Heller Modus)",
  "settings.item.bgColorLight.desc":
    "Legt die Hintergrundfarbe für Beiträge und das Beitragsformular im hellen Design fest.",
  "settings.item.textColorLight.name": "Textfarbe (Heller Modus)",
  "settings.item.textColorLight.desc":
    "Legt die Farbe für Text und Symbole im hellen Design fest.",
  "settings.item.bgColorDark.name": "Hintergrundfarbe (Dunkler Modus)",
  "settings.item.bgColorDark.desc":
    "Legt die Hintergrundfarbe für Beiträge und das Beitragsformular im dunklen Design fest.",
  "settings.item.textColorDark.name": "Textfarbe (Dunkler Modus)",
  "settings.item.textColorDark.desc":
    "Legt die Farbe für Text und Symbole im dunklen Design fest.",

  "settings.item.submitLabel.name": "Text der Posten-Schaltfläche",
  "settings.item.submitLabel.desc":
    "Sie können den Text ändern, der auf der Posten-Schaltfläche angezeigt wird. \nLeer lassen für eine reine Symbol-Schaltfläche (nur wenn ein Symbol festgelegt ist).",
  "settings.item.submitIcon.name": "Symbol der Posten-Schaltfläche",
  "settings.item.submitIcon.desc":
    "Ändert das Symbol der Beitragsschaltfläche. \nSymbolnamen {linkOpen}hier{linkClose} kopieren. \nLeer lassen blendet es aus.",
  "settings.item.updateLabel.name": "Text der Aktualisieren-Schaltfläche",
  "settings.item.updateLabel.desc":
    "Sie können den Text ändern, der während der Bearbeitung eines Beitrags auf der Posten-Schaltfläche angezeigt wird. \nLeer lassen für eine reine Symbol-Schaltfläche (nur wenn ein Symbol festgelegt ist).",
  "settings.item.updateIcon.name": "Symbol der Aktualisieren-Schaltfläche",
  "settings.item.updateIcon.desc":
    "Ändert das Symbol, das während der Bearbeitung eines Beitrags angezeigt wird. \nSymbolnamen {linkOpen}hier{linkClose} kopieren. \nLeer lassen übernimmt das Symbol der Posten-Schaltfläche.",
  "settings.item.inputPlaceholder.name": "Platzhaltertext im Eingabefeld",
  "settings.item.inputPlaceholder.desc":
    "Sie können den Text ändern, der angezeigt wird, wenn das Eingabefeld leer ist. \nLassen Sie das Feld leer, um ihn auszublenden.",

  "settings.item.tagSuggest.name": "Tag-Autovervollständigung",
  "settings.item.tagSuggest.desc":
    "Nach # werden bereits genutzte Tags vorgeschlagen. Beim Ausschalten werden die gemerkten Tags gelöscht.",

  "settings.item.pinLimit.name": "Limit für angepinnte Beiträge",
  "settings.item.pinLimit.desc":
    "Legt die maximale Anzahl von Notizen fest, die in der Timeline fixiert werden können.",
  "settings.option.pinLimit.1": "1 Beitrag",
  "settings.option.pinLimit.3": "3 Beiträge",
  "settings.option.pinLimit.5": "5 Beiträge",

  "settings.item.ogp.name": "URL-Vorschau",
  "settings.item.ogp.desc":
    "Ruft automatisch OGP-Informationen von URLs in Notizen ab und zeigt sie an. \nWenn deaktiviert, findet keine externe Kommunikation statt.",

  "settings.item.checkStrikethrough.name": "Durchstreichen bei aktiviertem Kontrollkästchen",
  "settings.item.checkStrikethrough.desc":
    "Zeigt eine Durchstreichung für Elemente an, deren Kontrollkästchen aktiviert ist.",

  "settings.item.calendarDayShape.name": "Form der Datumstasten",
  "settings.item.calendarDayShape.desc": "Wähle die Form der Datumstasten im Kalender.",
  "settings.option.calendarDayShape.circle": "Rund",
  "settings.option.calendarDayShape.rounded": "Abgerundet",
  "settings.option.calendarDayShape.square": "Eckig",

  "settings.item.showCalendarButton.name": "Kalender-Button einblenden",
  "settings.item.showCalendarButton.desc":
    "Zeigt einen Button in der Datumsnavigation an, \nmit dem Sie per Fingertipp direkt zu einem beliebigen Datum springen können.",

  "settings.item.tagColorRules.name": "Tag-Regeln verwenden",
  "settings.item.tagColorRules.desc":
    "Legt Farben und Tag-Integration pro Tag fest. Bei Farben gewinnt der zuerst genannte Tag.",

  "settings.tagRule.label": "Regel {n}",
  "settings.tagRule.tag.name": "Tag",
  "settings.tagRule.tag.desc":
    "Geben Sie den Namen des Tags ein, dessen Farbe Sie ändern möchten. (# kann weggelassen werden)",
  "settings.tagRule.tag.placeholder": "Tag-Name",
  "settings.tagRule.bg.name": "Hintergrundfarbe",
  "settings.tagRule.bg.desc": "Legt die Hintergrundfarbe für Beiträge fest, die dieses Tag enthalten.",
  "settings.tagRule.fg.name": "Textfarbe",
  "settings.tagRule.fg.desc":
    "Legt die Textfarbe für Beiträge fest, die dieses Tag enthalten. (Tags, Links und URLs werden über die Akzentfarbe eingestellt)",
  "settings.tagRule.accent.name": "Akzentfarbe",
  "settings.tagRule.accent.desc":
    "Farbe für Tags, Links und URLs. Ohne Angabe wird die Akzentfarbe des Themes verwendet.",
  "settings.tagRule.sub.name": "Subfarbe",
  "settings.tagRule.sub.desc":
    "Farbe für Nebenelemente wie Zeitstempel und Listenpunkte. \nOhne Angabe automatisch berechnet.",
  "settings.tagRule.scope.buttons.name": "Subfarbe auf Zeitstempel, Menüs und Pins anwenden",
  "settings.tagRule.scope.buttons.desc": "Wenn deaktiviert, wird die automatisch festgelegte Farbe verwendet.",
  "settings.tagRule.scope.quote.name": "Subfarbe auf Zitate anwenden",
  "settings.tagRule.scope.quote.desc": "Wenn deaktiviert, wird die automatisch festgelegte Farbe verwendet.",
  "settings.tagRule.scope.list.name": "Subfarbe auf Listen und Kontrollkästchen anwenden",
  "settings.tagRule.scope.list.desc": "Wenn deaktiviert, wird die automatisch festgelegte Farbe verwendet.",
  "settings.tagRule.scope.ogp.name": "Subfarbe auf OGP-Karten anwenden",
  "settings.tagRule.scope.ogp.desc": "Wenn deaktiviert, wird die automatisch festgelegte Farbe verwendet.",
  "settings.item.graphTags.name": "Tag-Integration",
  "settings.item.graphTags.desc":
    "Lässt Memo-Tags in der Graphansicht und der tag:-Suche zählen. \nAus bleiben sie nur in Wrot.",
  "settings.tagRule.noIntegration.name": "Von der Tag-Integration ausschließen",
  "settings.tagRule.noIntegration.desc": "Wenn aktiviert, wird der in Memos geschriebene Tag dieser Regel von der Tag-Integration ausgenommen \nund bleibt nur innerhalb von Wrot.",
  "settings.tagRule.hideTimeline.name": "In der Timeline ausblenden",
  "settings.tagRule.hideTimeline.desc":
    "Wenn aktiviert, erscheinen Memos mit diesem Tag nicht mehr in der Timeline. In der Tagesnotiz bleiben sie.",
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

  "view.dateNav.today": "Heute",
  "view.dateNav.todaySuffix": " (Heute)",

  "view.empty.noMemos": "Keine Notizen anzuzeigen",
  "view.notice.saveFailed": "Fehler beim Speichern der Notiz: {error}",
  "view.notice.searchPluginNotFound": "Such-Plugin nicht gefunden",

  "view.image.removeAria": "Bild löschen",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "MMMM YYYY",

  "defaults.headerDateFormat": "D. MMMM YYYY",
  "defaults.submitLabel": "Posten",
  "defaults.updateLabel": "Aktualisieren",
  "defaults.inputPlaceholder": "Schreib etwas ...",
} satisfies Translations;

export default de;
