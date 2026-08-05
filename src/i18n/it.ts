import type { Translations } from "./ja";

// Italian translations. Translated via Nani.
const it = {
  "settings.section.basic": "Impostazioni di base",
  "settings.section.advanced": "Impostazioni avanzate",
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
    "Specifica il formato della data nel navigatore delle date (es. YYYY, MM, DD). \nLascia vuoto per ripristinare il valore predefinito.",

  "settings.item.timestampFormat.name": "Formato timestamp",
  "settings.item.timestampFormat.desc":
    "Specifica il formato di data e ora per i post \n(puoi usare YYYY, MM, DD, HH, mm, ss).",

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
    "Puoi modificare il testo visualizzato sul pulsante Posta. \nLascia vuoto per un pulsante con la sola icona (solo se è impostata un'icona).",
  "settings.item.submitIcon.name": "Icona del pulsante Posta",
  "settings.item.submitIcon.desc":
    "Cambia l'icona del pulsante di pubblicazione. \nCopia un nome icona {linkOpen}qui{linkClose}. \nLascia vuoto per nasconderla.",
  "settings.item.updateLabel.name": "Testo del pulsante Aggiorna",
  "settings.item.updateLabel.desc":
    "Puoi modificare il testo visualizzato sul pulsante Posta durante la modifica di un post. \nLascia vuoto per un pulsante con la sola icona (solo se è impostata un'icona).",
  "settings.item.updateIcon.name": "Icona del pulsante Aggiorna",
  "settings.item.updateIcon.desc":
    "Cambia l'icona mostrata durante la modifica di un post. \nCopia un nome icona {linkOpen}qui{linkClose}. \nLascia vuoto per usare l'icona del pulsante Posta.",
  "settings.item.inputPlaceholder.name": "Messaggio segnaposto",
  "settings.item.inputPlaceholder.desc":
    "Puoi modificare il testo visualizzato quando il campo di input è vuoto. \nLascia vuoto per nasconderlo.",

  "settings.item.tagSuggest.name": "Completamento automatico dei tag",
  "settings.item.tagSuggest.desc":
    "Digitando # vengono suggeriti i tag già usati. Disattivandolo, i tag memorizzati vengono cancellati.",

  "settings.item.pinLimit.name": "Limite post fissati",
  "settings.item.pinLimit.desc":
    "Imposta il numero massimo di note che possono essere fissate in alto nella timeline.",
  "settings.option.pinLimit.1": "1 elemento",
  "settings.option.pinLimit.3": "3 elementi",
  "settings.option.pinLimit.5": "5 elementi",

  "settings.item.ogp.name": "Anteprima URL",
  "settings.item.ogp.desc":
    "Ottieni e visualizza automaticamente le informazioni OGP dagli URL nelle note. \nSe disattivato, non verrà effettuata alcuna comunicazione esterna.",

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
    "Aggiunge un pulsante calendario alla barra di navigazione. \nTocca per passare rapidamente a una data specifica.",

  "settings.item.tagColorRules.name": "Usa le regole per tag",
  "settings.item.tagColorRules.desc":
    "Imposta colori e integrazione per tag. Per i colori vince il tag che compare per primo nel testo.",

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
    "Colore di tag, link e URL. Se non impostato viene usato il colore d'accento del tema.",
  "settings.tagRule.sub.name": "Colore secondario",
  "settings.tagRule.sub.desc":
    "Colore degli elementi secondari come orari ed elenchi. \nCalcolato automaticamente se non impostato.",
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
  "settings.item.graphTags.name": "Integrazione dei tag",
  "settings.item.graphTags.desc":
    "Fa contare i tag dei memo nella vista grafo e nella ricerca tag:. \nSe disattivato restano in Wrot.",
  "settings.tagRule.noIntegration.name": "Escludi dall'integrazione dei tag",
  "settings.tagRule.noIntegration.desc":
    "Se attivato, il tag di questa regola scritto nei memo resta fuori dall'integrazione dei tag \ne rimane solo all'interno di Wrot.",
  "settings.tagRule.hideTimeline.name": "Nascondi nella timeline",
  "settings.tagRule.hideTimeline.desc":
    "Se attivato, i memo con questo tag non compaiono più nella timeline. Restano nella nota giornaliera.",
  "settings.tagRule.button.add": "Aggiungi regola",

  "view.formatMenu.code": "Codice",
  "view.formatMenu.math": "Formula",
  "view.formatMenu.quote": "Citazione",
  "view.formatMenu.link": "Link",
  "view.formatMenu.strikethrough": "Barrato",
  "view.formatMenu.highlight": "Evidenziato",
  "view.formatMenu.settings": "Impostazioni",

  "view.postMenu.copy": "Copia",
  "view.postMenu.quotePost": "Cita post",
  "view.postMenu.edit": "Modifica",
  "view.postMenu.cancelEdit": "Annulla modifica",
  "view.postMenu.unpin": "Rimuovi pin",
  "view.postMenu.pin": "Fissa in alto",
  "view.postMenu.pinLimitHint": "Il limite per i pin è di {limit} elementi.",

  "view.dateNav.today": "Oggi",
  "view.dateNav.todaySuffix": " (Oggi)",

  "view.empty.noMemos": "Nessuna nota da mostrare",
  "view.notice.saveFailed": "Salvataggio fallito: {error}",
  "view.notice.searchPluginNotFound": "Plugin di ricerca non trovato",

  "view.image.removeAria": "Elimina immagine",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "MMMM YYYY",

  "defaults.headerDateFormat": "D MMMM YYYY",
  "defaults.submitLabel": "Posta",
  "defaults.updateLabel": "Aggiorna",
  "defaults.inputPlaceholder": "Scrivi qualcosa...",
} satisfies Translations;

export default it;
