import type { Translations } from "./ja";

// Italian translations. Translated via Nani.
const it = {
  "settings.section.basic": "Impostazioni di base",
  "settings.section.advanced": "Impostazioni avanzate",
  "settings.section.tagrules": "Impostazioni regole tag",

  "settings.item.viewPlacement.name": "Posizione di visualizzazione",
  "settings.item.viewPlacement.desc": "Si applica alla prossima apertura di Wrot.",
  "settings.option.viewPlacement.left": "Barra laterale sinistra",
  "settings.option.viewPlacement.right": "Barra laterale destra",
  "settings.option.viewPlacement.main": "Area principale",

  "settings.item.followFontSize.name":
    "Adatta alla dimensione del carattere di Obsidian",
  "settings.item.followFontSize.desc": "Se attivato, usa la dimensione del testo delle impostazioni di aspetto di Obsidian.",

  "settings.item.headerDateFormat.name": "Formato data intestazione",
  "settings.item.headerDateFormat.desc": "Es. YYYY, MM, DD. \nLascia vuoto per ripristinare il valore predefinito.",

  "settings.item.timestampFormat.name": "Formato timestamp",
  "settings.item.timestampFormat.desc": "Puoi usare YYYY, MM, DD, HH, mm, ss.",

  "settings.item.bgColorLight.name": "Colore di sfondo (Modalità chiara)",
  "settings.item.bgColorLight.desc": "Usato per i post e il campo di input.",
  "settings.item.textColorLight.name": "Colore del testo (Modalità chiara)",
  "settings.item.textColorLight.desc": "Usato per testo e icone.",
  "settings.item.bgColorDark.name": "Colore di sfondo (Modalità scura)",
  "settings.item.bgColorDark.desc": "Usato per i post e il campo di input.",
  "settings.item.textColorDark.name": "Colore del testo (Modalità scura)",
  "settings.item.textColorDark.desc": "Usato per testo e icone.",

  "settings.item.submitLabel.name": "Testo del pulsante Posta",
  "settings.item.submitLabel.desc": "Lascia vuoto per un pulsante con la sola icona (solo se è impostata un'icona).",
  "settings.item.submitIcon.name": "Icona del pulsante Posta",
  "settings.item.submitIcon.desc": "Copia un nome icona {linkOpen}qui{linkClose}. \nLascia vuoto per nasconderla.",
  "settings.item.updateLabel.name": "Testo del pulsante Aggiorna",
  "settings.item.updateLabel.desc": "Usato durante la modifica di un post. \nLascia vuoto per un pulsante con la sola icona (solo se è impostata un'icona).",
  "settings.item.updateIcon.name": "Icona del pulsante Aggiorna",
  "settings.item.updateIcon.desc": "Copia un nome icona {linkOpen}qui{linkClose}. \nLascia vuoto per usare l'icona del pulsante Posta.",
  "settings.item.inputPlaceholder.name": "Messaggio segnaposto",
  "settings.item.inputPlaceholder.desc": "Lascia vuoto per nasconderlo.",

  "settings.item.tagSuggest.name": "Completamento automatico dei tag",
  "settings.item.tagSuggest.desc": "Digitando dopo # compaiono i suggerimenti. \nDisattivandolo si cancellano anche quelli memorizzati.",

  "settings.item.pinLimit.name": "Limite post fissati",
  "settings.item.pinLimit.desc": "Abbassando il limite, i fissaggi in eccesso vengono rimossi.",
  "settings.option.pinLimit.1": "1 elemento",
  "settings.option.pinLimit.3": "3 elementi",
  "settings.option.pinLimit.5": "5 elementi",

  "settings.item.ogp.name": "Anteprima URL",
  "settings.item.ogp.desc": "Recupera i dati di anteprima dagli URL. \nDisattivato, non viene effettuata alcuna connessione esterna.",

  "settings.item.checkStrikethrough.name": "Barrato per elementi completati",
  "settings.item.checkStrikethrough.desc": "Disattivato, il testo resta invariato.",

  "settings.item.calendarDayShape.name": "Forma dei pulsanti data",
  "settings.item.calendarDayShape.desc": "Si applica ai giorni nel calendario.",
  "settings.option.calendarDayShape.circle": "Cerchio",
  "settings.option.calendarDayShape.rounded": "Arrotondato",
  "settings.option.calendarDayShape.square": "Quadrato",

  "settings.item.showCalendarButton.name": "Mostra pulsante calendario",
  "settings.item.showCalendarButton.desc": "Se attivato, puoi passare a qualsiasi data dalla barra di navigazione.",

  "settings.item.showPostDelete.name": "Mostra pulsante Elimina",
  "settings.item.showPostDelete.desc": "Se attivato, al menu del memo viene aggiunto un pulsante di eliminazione. \nUn memo eliminato non è recuperabile. Le immagini allegate non vengono eliminate.",

  "settings.item.useCustomAttachmentFolder.name": "Specifica la cartella delle immagini",
  "settings.item.useCustomAttachmentFolder.desc": "Vale solo per le immagini aggiunte da Wrot.",

  "settings.item.attachmentFolder.name": "Cartella di destinazione",
  "settings.item.attachmentFolder.desc": "Se la cartella non esiste, viene usata l'impostazione di Obsidian.",
  "settings.item.attachmentFolder.placeholder": "Seleziona una cartella",

  "settings.item.tagColorRules.name": "Usa le regole per tag",
  "settings.item.tagColorRules.desc": "Permette di cambiare colore, integrazione dei tag e altro per ogni tag. \nPer il colore vince il tag che compare per primo nel testo.",

  "settings.tagRule.label": "Regola {n}",
  "settings.tagRule.tag.name": "Tag",
  "settings.tagRule.tag.desc": "Puoi omettere #.",
  "settings.tagRule.tag.placeholder": "Nome del tag",
  "settings.tagRule.bg.name": "Colore di sfondo",
  "settings.tagRule.bg.desc": "Usato per lo sfondo del post.",
  "settings.tagRule.fg.name": "Colore del testo",
  "settings.tagRule.fg.desc": "Tag, link e URL si impostano dal colore accento.",
  "settings.tagRule.accent.name": "Colore accento",
  "settings.tagRule.accent.desc": "Se non impostato viene usato il colore d'accento del tema.",
  "settings.tagRule.sub.name": "Colore secondario",
  "settings.tagRule.sub.desc": "Il colore di orari, elenchi puntati e simili. \nSe non impostato viene calcolato automaticamente.",
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
  "settings.item.graphTags.desc": "I tag entrano nella vista grafico e nella ricerca tag:. \nDisattivato, restano solo dentro Wrot.",
  "settings.tagRule.noIntegration.name": "Escludi dall'integrazione dei tag",
  "settings.tagRule.noIntegration.desc": "Se attivato, questo tag resta solo dentro Wrot.",
  "settings.tagRule.hideTimeline.name": "Nascondi nella timeline",
  "settings.tagRule.hideTimeline.desc": "Se attivato, i memo con questo tag non compaiono più nella timeline. \nRestano nella nota giornaliera.",
  "settings.tagRule.protectDelete.name": "Disattiva il pulsante Elimina",
  "settings.tagRule.protectDelete.desc": "Se attivato, i memo con questo tag non possono essere eliminati.",
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
  "view.postMenu.delete": "Elimina",
  // Shown on the same row after the first press, in place of the label above.
  "view.postMenu.deleteConfirm": "Premi di nuovo per eliminare",

  "view.dateNav.today": "Oggi",
  "view.dateNav.todaySuffix": " (Oggi)",

  "view.empty.noMemos": "Nessuna nota da mostrare",
  "view.notice.saveFailed": "Salvataggio fallito: {error}",
  "view.notice.searchPluginNotFound": "Plugin di ricerca non trovato",

  "view.image.removeAria": "Elimina immagine",

  // Placeholder body of a quote card whose original post is gone.
  "quote.card.notFound": "(Memo originale non trovato)",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "MMMM YYYY",

  "defaults.headerDateFormat": "D MMMM YYYY",
  "defaults.submitLabel": "Posta",
  "defaults.updateLabel": "Aggiorna",
  "defaults.inputPlaceholder": "Scrivi qualcosa...",
} satisfies Translations;

export default it;
