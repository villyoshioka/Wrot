import type { Translations } from "./ja";

// Italian translations. Translated via Nani.
const it = {
  "settings.section.basic": "Impostazioni generali",
  "settings.section.advanced": "Avanzate",
  "settings.section.tagrules": "Regole per i tag",

  "settings.item.viewPlacement.name": "Posizione della vista",
  "settings.item.viewPlacement.desc": "Scegli dove mostrare Wrot.",
  "settings.option.viewPlacement.left": "Barra laterale sinistra",
  "settings.option.viewPlacement.right": "Barra laterale destra",
  "settings.option.viewPlacement.main": "Area principale",
  "settings.item.openOnStartup.name": "Apri all'avvio",
  "settings.item.openOnStartup.desc": "Se attivato, Wrot viene portato in primo piano all'avvio di Obsidian.",

  "settings.item.followFontSize.name":
    "Adatta alle dimensioni dei caratteri di Obsidian",
  "settings.item.followFontSize.desc": "Se attivato, usa le dimensioni del testo definite nelle impostazioni dell'aspetto di Obsidian.",

  "settings.item.headerDateFormat.name": "Formato data dell'intestazione",
  "settings.item.headerDateFormat.desc": "Es. YYYY, MM, DD. \nLascia vuoto per ripristinare il valore predefinito.",

  "settings.item.timestampFormat.name": "Formato del timestamp",
  "settings.item.timestampFormat.desc": "Puoi usare: YYYY, MM, DD, HH, mm, ss.",

  "settings.item.bgColorLight.name": "Colore di sfondo (Tema chiaro)",
  "settings.item.bgColorLight.desc": "Usato per i post e il campo di inserimento.",
  "settings.item.textColorLight.name": "Colore del testo (Tema chiaro)",
  "settings.item.textColorLight.desc": "Usato per il testo e le icone.",
  "settings.item.bgColorDark.name": "Colore di sfondo (Tema scuro)",
  "settings.item.bgColorDark.desc": "Usato per i post e il campo di inserimento.",
  "settings.item.textColorDark.name": "Colore del testo (Tema scuro)",
  "settings.item.textColorDark.desc": "Usato per il testo e le icone.",

  "settings.item.submitLabel.name": "Testo del pulsante di invio",
  "settings.item.submitLabel.desc": "Lascia vuoto per mostrare solo l'icona (richiede che sia impostata un'icona).",
  "settings.item.submitIcon.name": "Icona del pulsante di invio",
  "settings.item.submitIcon.desc": "Copia il nome di un'icona da {linkOpen}qui{linkClose}. \nLascia vuoto per nasconderla.",
  "settings.item.updateLabel.name": "Testo del pulsante di aggiornamento",
  "settings.item.updateLabel.desc": "Usato durante la modifica di un post. \nLascia vuoto per mostrare solo l'icona (richiede che sia impostata un'icona).",
  "settings.item.updateIcon.name": "Icona del pulsante di aggiornamento",
  "settings.item.updateIcon.desc": "Copia il nome di un'icona da {linkOpen}qui{linkClose}. \nLascia vuoto per riutilizzare l'icona del pulsante di invio.",
  "settings.item.submitGradient.name": "Sfumatura del riquadro di invio",
  "settings.item.submitGradient.desc": "Se attivato, applica una sfumatura agli accenti nel riquadro di composizione.",
  "settings.item.submitGradientMode.name": "Luminosità della sfumatura",
  "settings.item.submitGradientMode.desc": "In automatico, si adatta alla luminosità del colore di accento.",
  "settings.option.submitGradientMode.auto": "Automatico",
  "settings.option.submitGradientMode.light": "Più chiaro",
  "settings.option.submitGradientMode.dark": "Più scuro",
  "settings.item.inputPlaceholder.name": "Testo segnaposto",
  "settings.item.inputPlaceholder.desc": "Lascia vuoto per non mostrare alcun testo.",

  "settings.item.tagSuggest.name": "Completamento automatico dei tag",
  "settings.item.tagSuggest.desc": "Digitando «#» compaiono i tag suggeriti. \nDisattivandolo, la cronologia dei tag memorizzati verrà eliminata.",

  "settings.item.pinLimit.name": "Limite dei post fissati",
  "settings.item.pinLimit.desc": "«Fissa in alto» e «Pianifica fissaggio» hanno limiti separati.\nRiducendo il limite, i post in eccesso verranno rimossi.",
  "settings.option.pinLimit.1": "1 elemento",
  "settings.option.pinLimit.3": "3 elementi",
  "settings.option.pinLimit.5": "5 elementi",
  "settings.item.pinFixed.name": "Mantieni i post fissati in alto",
  "settings.item.pinFixed.desc": "Se disattivato, i post fissati scorrono insieme al resto della timeline.",

  "settings.item.ogp.name": "Anteprima dei link (OGP)",
  "settings.item.ogp.desc": "Recupera i dati di anteprima dagli URL inseriti. \nSe disattivato, non verrà effettuata alcuna connessione esterna.",

  "settings.item.checkStrikethrough.name": "Barra gli elementi completati",
  "settings.item.checkStrikethrough.desc": "Se disattivato, le attività completate non verranno barrate.",

  "settings.item.calendarDayShape.name": "Forma dei giorni nel calendario",
  "settings.item.calendarDayShape.desc": "Determina la forma dei pulsanti dei giorni nel calendario.",
  "settings.option.calendarDayShape.circle": "Cerchio",
  "settings.option.calendarDayShape.rounded": "Bordi arrotondati",
  "settings.option.calendarDayShape.square": "Quadrato",

  "settings.item.showCalendarButton.name": "Mostra pulsante del calendario",
  "settings.item.showCalendarButton.desc": "Se attivato, puoi selezionare qualsiasi data direttamente dalla barra di navigazione.",

  "settings.item.showPostDelete.name": "Mostra pulsante di eliminazione",
  "settings.item.showPostDelete.desc": "Se attivato, aggiunge l'opzione per eliminare un post dal rispettivo menu. \nI post eliminati non possono essere recuperati (le immagini allegate non verranno cancellate).",

  "settings.item.useCustomAttachmentFolder.name": "Cartella personalizzata per gli allegati",
  "settings.item.useCustomAttachmentFolder.desc": "Si applica solo alle immagini aggiunte tramite Wrot.",

  "settings.item.attachmentFolder.name": "Cartella di destinazione",
  "settings.item.attachmentFolder.desc": "Se la cartella specificata non esiste, verrà usata l'impostazione predefinita di Obsidian.",
  "settings.item.attachmentFolder.placeholder": "Seleziona una cartella",
  "settings.item.shrinkImages.name": "Comprimi le immagini",
  "settings.item.shrinkImages.desc": "Comprime le immagini allegate e rimuove metadati come la geolocalizzazione prima del salvataggio. \nNon influisce sulle GIF.",
  "settings.item.postHeading.name": "Intestazione del modello",
  "settings.item.postHeading.desc": "I post verranno aggiunti al di sotto dell'intestazione selezionata.",
  "settings.option.postHeading.none": "Nessuna",

  "settings.item.tagColorRules.name": "Attiva regole per i tag",
  "settings.item.tagColorRules.desc": "Consente di personalizzare colori e integrazioni per ciascun tag. \nPer il colore, ha priorità il primo tag presente nel testo.",

  "settings.tagRule.label": "Regola {n}",
  "settings.tagRule.tag.name": "Tag",
  "settings.tagRule.tag.desc": "Il simbolo «#» può essere omesso.",
  "settings.tagRule.tag.placeholder": "Nome del tag",
  "settings.tagRule.bg.name": "Colore di sfondo",
  "settings.tagRule.bg.desc": "Usato come sfondo del post.",
  "settings.tagRule.fg.name": "Colore del testo",
  "settings.tagRule.fg.desc": "Tag, link e URL dipendono dal colore di accento.",
  "settings.tagRule.accent.name": "Colore di accento",
  "settings.tagRule.accent.desc": "Se non specificato, viene utilizzato il colore di accento del tema attivo.",
  "settings.tagRule.sub.name": "Colore secondario",
  "settings.tagRule.sub.desc": "Colore per orari, punti elenco e altri elementi secondari. \nSe non specificato, viene calcolato automaticamente.",
  "settings.tagRule.scope.buttons.name":
    "Applica colore secondario a timestamp, menu e pin",
  "settings.tagRule.scope.buttons.desc":
    "Se disattivato, verrà utilizzato il colore calcolato in automatico.",
  "settings.tagRule.scope.quote.name":
    "Applica colore secondario alle citazioni",
  "settings.tagRule.scope.quote.desc":
    "Se disattivato, verrà utilizzato il colore calcolato in automatico.",
  "settings.tagRule.scope.list.name":
    "Applica colore secondario a elenchi e caselle di controllo",
  "settings.tagRule.scope.list.desc":
    "Se disattivato, verrà utilizzato il colore calcolato in automatico.",
  "settings.tagRule.scope.ogp.name":
    "Applica colore secondario alle schede di anteprima link",
  "settings.tagRule.scope.ogp.desc":
    "Se disattivato, verrà utilizzato il colore calcolato in automatico.",
  "settings.item.graphTags.name": "Integrazione dei tag",
  "settings.item.graphTags.desc": "Include i tag nella vista grafico e nelle ricerche native «tag:». \nSe disattivato, i tag saranno visibili solo all'interno di Wrot.",
  "settings.tagRule.noIntegration.name": "Escludi dall'integrazione dei tag",
  "settings.tagRule.noIntegration.desc": "Se attivato, questo tag rimane limitato a Wrot.",
  "settings.tagRule.hideTimeline.name": "Nascondi nella timeline",
  "settings.tagRule.hideTimeline.desc": "Se attivato, i post con questo tag non verranno mostrati nella timeline (resteranno comunque nella nota giornaliera).",
  "settings.tagRule.protectDelete.name": "Proteggi dall'eliminazione",
  "settings.tagRule.protectDelete.desc": "Se attivato, impedisce l'eliminazione dei post con questo tag.",
  "settings.tagRule.button.add": "Aggiungi regola",
  "settings.item.toolbarEdit.name": "Mostra pulsante di modifica della barra degli strumenti",
  "settings.item.toolbarEdit.desc": "Aggiunge l'opzione di modifica al menu della barra degli strumenti.",
  "settings.item.resetToolbar.name": "Ripristina barra degli strumenti",
  "settings.item.resetToolbar.desc": "Reimposta l'ordine e la visibilità della barra degli strumenti ai valori predefiniti.",
  "settings.item.resetToolbar.button": "Ripristina",
  // Shown on the same row after the first press, in place of the label above.
  "settings.item.resetToolbar.confirm": "Premi di nuovo per confermare",

  "view.toolbarAction.image": "Immagine",
  "view.toolbarAction.embed": "Incorpora",
  "view.toolbarAction.bold": "Grassetto",
  "view.toolbarAction.italic": "Corsivo",
  "view.toolbarAction.list": "Elenco puntato",
  "view.toolbarAction.check": "Elenco puntato con caselle",
  "view.toolbarAction.ol": "Elenco numerato",
  "view.toolbarAction.more": "Altro",
  "view.toolbarEdit.done": "Fine",
  "view.toolbarEdit.cancel": "Annulla",

  "view.formatMenu.editToolbar": "Personalizza barra degli strumenti",
  "view.formatMenu.code": "Codice",
  "view.formatMenu.math": "Formula",
  "view.formatMenu.quote": "Citazione",
  "view.formatMenu.link": "Collegamento",
  "view.formatMenu.strikethrough": "Barrato",
  "view.formatMenu.highlight": "Evidenziato",
  "view.formatMenu.settings": "Impostazioni",

  "view.postMenu.copy": "Copia testo",
  "view.postMenu.quotePost": "Cita post",
  "view.postMenu.edit": "Modifica",
  "view.postMenu.cancelEdit": "Annulla modifica",
  "view.postMenu.unpin": "Rimuovi dai fissati",
  "view.postMenu.pin": "Fissa in alto",
  "view.postMenu.pinLimitHint": "Il limite per i post fissati è di {limit}.",
  "view.postMenu.schedulePin": "Pianifica fissaggio",
  "view.postMenu.delete": "Elimina",
  // Shown on the same row after the first press, in place of the label above.
  "view.postMenu.deleteConfirm": "Premi di nuovo per eliminare",

  "view.dateNav.today": "Oggi",
  "view.dateNav.todaySuffix": " (Oggi)",

  "view.empty.noMemos": "Nessun post da mostrare",
  "view.notice.saveFailed": "Salvataggio non riuscito: {error}",
  "view.notice.postHeadingMissing": "L'intestazione specificata non è stata trovata: il post è stato inserito in fondo alla nota.",
  "view.notice.postHeadingNoTemplate": "Modello della nota giornaliera non trovato. L'intestazione è stata reimpostata su «Nessuna».",
  "view.notice.searchPluginNotFound": "Il plugin principale «Ricerca» non è attivo.",

  "view.image.removeAria": "Rimuovi immagine",

  // Placeholder body of a quote card whose original post is gone.
  "quote.card.notFound": "(Post originale non trovato)",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "MMMM YYYY",

  "defaults.headerDateFormat": "D MMMM YYYY",

  "defaults.timestampFormat": "DD/MM/YYYY HH:mm:ss",
  "defaults.submitLabel": "Invia",
  "defaults.updateLabel": "Aggiorna",
  "defaults.inputPlaceholder": "Scrivi qualcosa...",
} satisfies Translations;

export default it;
