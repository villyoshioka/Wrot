import type { Translations } from "./ja";

// Italian translations. Translated via Nani.
const it = {
  "settings.section.basic": "Impostazioni di base",
  "settings.section.display": "Impostazioni di visualizzazione",
  "settings.section.tagrules": "Impostazioni regole tag",

  "settings.item.viewPlacement.name": "Posizione di visualizzazione",
  "settings.item.viewPlacement.desc":
    "Scegli la posizione di visualizzazione del pannello Wrot.",
  "settings.option.viewPlacement.left": "Barra laterale sinistra",
  "settings.option.viewPlacement.right": "Barra laterale destra",
  "settings.option.viewPlacement.main": "Area principale",

  "settings.item.followFontSize.name":
    "Adatta alla dimensione del carattere di Obsidian",
  "settings.item.followFontSize.desc":
    "Sincronizza la dimensione del testo di Wrot con le impostazioni dell'aspetto di Obsidian.",

  "settings.item.headerDateFormat.name": "Formato data intestazione",
  "settings.item.headerDateFormat.desc":
    "Specifica il formato della data nel navigatore delle date (es. YYYY, MM, DD). Lascia vuoto per ripristinare il valore predefinito.",

  "settings.item.timestampFormat.name": "Formato timestamp",
  "settings.item.timestampFormat.desc":
    "Specifica il formato di data e ora per i post (puoi usare YYYY, MM, DD, HH, mm, ss).",

  "settings.item.bgColorLight.name": "Colore di sfondo (Modalità chiara)",
  "settings.item.bgColorLight.desc":
    "Imposta il colore di sfondo per i post e il modulo di invio nel tema chiaro.",
  "settings.item.textColorLight.name": "Colore del testo (Modalità chiara)",
  "settings.item.textColorLight.desc":
    "Imposta il colore del testo e delle icone nel tema chiaro.",
  "settings.item.bgColorDark.name": "Colore di sfondo (Modalità scura)",
  "settings.item.bgColorDark.desc":
    "Imposta il colore di sfondo per i post e il modulo di invio nel tema scuro.",
  "settings.item.textColorDark.name": "Colore del testo (Modalità scura)",
  "settings.item.textColorDark.desc":
    "Imposta il colore del testo e delle icone nel tema scuro.",

  "settings.item.submitLabel.name": "Testo del pulsante Posta",
  "settings.item.submitLabel.desc":
    "Puoi modificare il testo visualizzato sul pulsante Posta.",
  "settings.item.submitIcon.name": "Icona del pulsante Posta",
  "settings.item.submitIcon.desc":
    "Puoi modificare l'icona del pulsante Posta. Copia il nome dell'icona da {linkOpen}qui{linkClose}. Lascia vuoto per nasconderla.",
  "settings.item.inputPlaceholder.name": "Messaggio segnaposto",
  "settings.item.inputPlaceholder.desc":
    "Puoi modificare il testo visualizzato quando il campo di input è vuoto. Lascia vuoto per nasconderlo.",

  "settings.item.pinLimit.name": "Limite post fissati",
  "settings.item.pinLimit.desc":
    "Imposta il numero massimo di note che possono essere fissate in alto nella timeline.",
  "settings.option.pinLimit.1": "1 elemento",
  "settings.option.pinLimit.3": "3 elementi",
  "settings.option.pinLimit.5": "5 elementi",

  "settings.item.zenModePins.name": "Post fissati in Modalità Zen",
  "settings.item.zenModePins.desc": "Scegli se mostrare i post fissati mentre la Modalità Zen è attiva.",
  "settings.option.zenModePins.hide": "Nascondi",
  "settings.option.zenModePins.show": "Mostra",

  "settings.item.ogp.name": "Anteprima URL",
  "settings.item.ogp.desc":
    "Ottieni e visualizza automaticamente le informazioni OGP dagli URL nelle note. Se disattivato, non verrà effettuata alcuna comunicazione esterna.",

  "settings.item.checkStrikethrough.name": "Barrato per elementi completati",
  "settings.item.checkStrikethrough.desc":
    "Mostra una linea barrata sugli elementi con la casella di controllo attivata.",

  "settings.item.calendarDayShape.name": "Forma dei pulsanti data",
  "settings.item.calendarDayShape.desc": "Seleziona la forma dei pulsanti data nel calendario.",
  "settings.option.calendarDayShape.circle": "Cerchio",
  "settings.option.calendarDayShape.rounded": "Arrotondato",
  "settings.option.calendarDayShape.square": "Quadrato",

  "settings.item.showCalendarButton.name": "Mostra pulsante calendario",
  "settings.item.showCalendarButton.desc":
    "Aggiunge un pulsante calendario alla barra di navigazione. Tocca per passare rapidamente a una data specifica.",

  "settings.item.tagColorRules.name": "Cambia colori per tag",
  "settings.item.tagColorRules.desc":
    "Cambia il colore di sfondo e del testo dei post che contengono tag specifici. Se si applicano più regole, ha la priorità il primo tag che appare nel testo.",

  "settings.tagRule.label": "Regola {n}",
  "settings.tagRule.tag.name": "Tag",
  "settings.tagRule.tag.desc":
    "Inserisci il nome del tag per cui vuoi cambiare il colore (puoi omettere #).",
  "settings.tagRule.tag.placeholder": "Nome del tag",
  "settings.tagRule.bg.name": "Colore di sfondo",
  "settings.tagRule.bg.desc":
    "Imposta il colore di sfondo per i post che contengono questo tag.",
  "settings.tagRule.fg.name": "Colore del testo",
  "settings.tagRule.fg.desc":
    "Imposta il colore del testo del corpo per i post che contengono questo tag (tag, link e URL vengono impostati tramite il colore accento).",
  "settings.tagRule.accent.name": "Colore accento",
  "settings.tagRule.accent.desc":
    "Imposta il colore per gli elementi come tag, link e icone. Se non impostato, verrà utilizzato il colore accento del tema.",
  "settings.tagRule.sub.name": "Colore secondario",
  "settings.tagRule.sub.desc":
    "Imposta collettivamente il colore per timestamp, icone, marcatori e checkbox. Se non impostato, verrà calcolato automaticamente.",
  "settings.tagRule.scope.buttons.name":
    "Applica colore secondario a timestamp, menu e pin",
  "settings.tagRule.scope.buttons.desc":
    "Se disattivato, verrà utilizzato il colore impostato automaticamente.",
  "settings.tagRule.scope.quote.name":
    "Applica colore secondario alle citazioni",
  "settings.tagRule.scope.quote.desc":
    "Se disattivato, verrà utilizzato il colore impostato automaticamente.",
  "settings.tagRule.scope.list.name":
    "Applica colore secondario a elenchi e checkbox",
  "settings.tagRule.scope.list.desc":
    "Se disattivato, verrà utilizzato il colore impostato automaticamente.",
  "settings.tagRule.scope.ogp.name":
    "Applica colore secondario alle schede OGP",
  "settings.tagRule.scope.ogp.desc":
    "Se disattivato, verrà utilizzato il colore impostato automaticamente.",
  "settings.tagRule.button.add": "Aggiungi regola",

  "settings.tooltip.resetDefault": "Ripristina predefiniti",
  "settings.tooltip.deleteRule": "Elimina questa regola",
  "settings.tooltip.lock": "Blocca",
  "settings.tooltip.unlock": "Sblocca per modificare",

  "view.formatMenu.code": "Codice",
  "view.formatMenu.math": "Formula",
  "view.formatMenu.quote": "Citazione",
  "view.formatMenu.link": "Link",
  "view.formatMenu.strikethrough": "Barrato",
  "view.formatMenu.highlight": "Evidenziato",
  "view.formatMenu.settings": "Impostazioni",
  "view.formatMenu.zenMode": "Modalità Zen",

  "view.postMenu.copy": "Copia",
  "view.postMenu.quotePost": "Cita post",
  "view.postMenu.unpin": "Rimuovi pin",
  "view.postMenu.pin": "Fissa in alto",
  "view.postMenu.pinLimitHint": "Il limite per i pin è di {limit} elementi.",

  "view.dateNav.today": "Oggi",
  "view.dateNav.todaySuffix": " (Oggi)",

  "view.empty.noMemos": "Nessuna nota presente",
  "view.notice.saveFailed": "Salvataggio fallito: {error}",
  "view.notice.searchPluginNotFound": "Plugin di ricerca non trovato",

  "view.image.removeAria": "Elimina immagine",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "MMMM YYYY",

  "defaults.headerDateFormat": "D MMMM YYYY",
  "defaults.submitLabel": "Posta",
  "defaults.inputPlaceholder": "Scrivi qualcosa...",
} satisfies Translations;

export default it;
