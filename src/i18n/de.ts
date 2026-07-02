import type { Translations } from "./ja";

// German translations. Translated via Nani.
const de = {
  "settings.section.basic": "Grundeinstellungen",
  "settings.section.display": "Anzeigeeinstellungen",
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
    "Geben Sie das Format für das Datum in der Datumsnavigation an. (YYYY, MM, DD usw. können verwendet werden) Leer lassen, um auf den Standardwert zurückzusetzen.",

  "settings.item.timestampFormat.name": "Zeitstempel-Format",
  "settings.item.timestampFormat.desc":
    "Geben Sie das Format für Datum und Uhrzeit der Beiträge an. (YYYY, MM, DD, HH, mm, ss können verwendet werden)",

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
    "Sie können den Text ändern, der auf der Posten-Schaltfläche angezeigt wird.",
  "settings.item.submitIcon.name": "Symbol der Posten-Schaltfläche",
  "settings.item.submitIcon.desc":
    "Sie können das Symbol der Posten-Schaltfläche ändern. Kopieren Sie den Symbolnamen von {linkOpen}hier{linkClose}. Lassen Sie das Feld leer, um das Symbol auszublenden.",
  "settings.item.inputPlaceholder.name": "Platzhaltertext im Eingabefeld",
  "settings.item.inputPlaceholder.desc":
    "Sie können den Text ändern, der angezeigt wird, wenn das Eingabefeld leer ist. Lassen Sie das Feld leer, um ihn auszublenden.",

  "settings.item.tagSuggest.name": "Tag-Autovervollständigung",
  "settings.item.tagSuggest.desc":
    "Bei der Eingabe von # im Eingabefeld werden Tags aus früheren Beiträgen als Vorschläge angezeigt.",
  "settings.item.tagSuggestClear.name": "Tag-Vorschlagsverlauf löschen",
  "settings.item.tagSuggestClear.desc":
    "Löscht alle als Vorschläge gespeicherten Tags.",
  "settings.item.tagSuggestClear.button": "Löschen",
  "settings.notice.tagSuggestCleared": "Tag-Vorschlagsverlauf gelöscht",

  "settings.item.pinLimit.name": "Limit für angepinnte Beiträge",
  "settings.item.pinLimit.desc":
    "Legt die maximale Anzahl von Notizen fest, die in der Timeline fixiert werden können.",
  "settings.option.pinLimit.1": "1 Beitrag",
  "settings.option.pinLimit.3": "3 Beiträge",
  "settings.option.pinLimit.5": "5 Beiträge",

  "settings.item.ogp.name": "URL-Vorschau",
  "settings.item.ogp.desc":
    "Ruft automatisch OGP-Informationen von URLs in Notizen ab und zeigt sie an. Wenn deaktiviert, findet keine externe Kommunikation statt.",

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
    "Zeigt einen Button in der Datumsnavigation an, mit dem Sie per Fingertipp direkt zu einem beliebigen Datum springen können.",

  "settings.item.tagColorRules.name": "Farben nach Tags ändern",
  "settings.item.tagColorRules.desc":
    "Ändert die Hintergrund- und Textfarbe von Beiträgen, die bestimmte Tags enthalten. Wenn mehrere Regeln zutreffen, hat das im Text zuerst vorkommende Tag Vorrang.",

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
    "Legt die Farbe für Elemente fest, die die Akzentfarbe verwenden, wie Tags, Links, URLs und das Symbol für \"Kopie abgeschlossen\". Wenn nicht festgelegt, wird die Akzentfarbe des Themes verwendet.",
  "settings.tagRule.sub.name": "Subfarbe",
  "settings.tagRule.sub.desc":
    "Legt die Farbe für untergeordnete Elemente wie Zeitstempel, Symbole, Listenmarker, Zitatlinien und Kontrollkästchen zusammengefasst fest. Wenn nicht festgelegt, wird sie automatisch aus der Hintergrund- und Textfarbe berechnet.",
  "settings.tagRule.scope.buttons.name": "Subfarbe auf Zeitstempel, Menüs und Pins anwenden",
  "settings.tagRule.scope.buttons.desc": "Wenn deaktiviert, wird die automatisch festgelegte Farbe verwendet.",
  "settings.tagRule.scope.quote.name": "Subfarbe auf Zitate anwenden",
  "settings.tagRule.scope.quote.desc": "Wenn deaktiviert, wird die automatisch festgelegte Farbe verwendet.",
  "settings.tagRule.scope.list.name": "Subfarbe auf Listen und Kontrollkästchen anwenden",
  "settings.tagRule.scope.list.desc": "Wenn deaktiviert, wird die automatisch festgelegte Farbe verwendet.",
  "settings.tagRule.scope.ogp.name": "Subfarbe auf OGP-Karten anwenden",
  "settings.tagRule.scope.ogp.desc": "Wenn deaktiviert, wird die automatisch festgelegte Farbe verwendet.",
  "settings.tagRule.button.add": "Regel hinzufügen",

  "settings.tooltip.resetDefault": "Auf Standardwerte zurücksetzen",
  "settings.tooltip.deleteRule": "Diese Regel löschen",
  "settings.tooltip.lock": "Sperren",
  "settings.tooltip.unlock": "Zum Bearbeiten entsperren",

  "view.formatMenu.code": "Code",
  "view.formatMenu.math": "Formel",
  "view.formatMenu.quote": "Zitat",
  "view.formatMenu.link": "Link",
  "view.formatMenu.strikethrough": "Durchgestrichen",
  "view.formatMenu.highlight": "Hervorheben",
  "view.formatMenu.settings": "Einstellungen",

  "view.postMenu.copy": "Kopieren",
  "view.postMenu.quotePost": "Beitrag zitieren",
  "view.postMenu.unpin": "Anpinnen aufheben",
  "view.postMenu.pin": "Anpinnen",
  "view.postMenu.pinLimitHint": "Sie können maximal {limit} Beiträge anpinnen.",

  "view.dateNav.today": "Heute",
  "view.dateNav.todaySuffix": " (Heute)",

  "view.empty.noMemos": "Keine Notizen vorhanden",
  "view.notice.saveFailed": "Fehler beim Speichern der Notiz: {error}",
  "view.notice.searchPluginNotFound": "Such-Plugin nicht gefunden",

  "view.image.removeAria": "Bild löschen",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "MMMM YYYY",

  "defaults.headerDateFormat": "D. MMMM YYYY",
  "defaults.submitLabel": "Posten",
  "defaults.inputPlaceholder": "Schreib etwas ...",
} satisfies Translations;

export default de;
