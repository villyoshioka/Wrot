import type { Translations } from "./ja";

// Spanish translations. Translated via Nani.
const es = {
  "settings.section.basic": "Configuración básica",
  "settings.section.advanced": "Configuración avanzada",
  "settings.section.tagrules": "Reglas por etiqueta",

  "settings.item.viewPlacement.name": "Posición de visualización",
  "settings.item.viewPlacement.desc": "Se aplica la próxima vez que abras Wrot.",
  "settings.option.viewPlacement.left": "Barra lateral izquierda",
  "settings.option.viewPlacement.right": "Barra lateral derecha",
  "settings.option.viewPlacement.main": "Área principal",

  "settings.item.followFontSize.name": "Usar tamaño de fuente de Obsidian",
  "settings.item.followFontSize.desc": "Si se activa, usa el tamaño de fuente de la configuración de apariencia de Obsidian.",

  "settings.item.headerDateFormat.name": "Formato de fecha del encabezado",
  "settings.item.headerDateFormat.desc": "Ej. YYYY, MM, DD. \nDéjalo en blanco para usar el valor predeterminado.",

  "settings.item.timestampFormat.name": "Formato de marca de tiempo",
  "settings.item.timestampFormat.desc": "Ej. YYYY, MM, DD, HH, mm, ss.",

  "settings.item.bgColorLight.name": "Color de fondo (modo claro)",
  "settings.item.bgColorLight.desc": "Se usa en los posts y en el campo de entrada.",
  "settings.item.textColorLight.name": "Color de texto (modo claro)",
  "settings.item.textColorLight.desc": "Se usa en el texto y los iconos.",
  "settings.item.bgColorDark.name": "Color de fondo (modo oscuro)",
  "settings.item.bgColorDark.desc": "Se usa en los posts y en el campo de entrada.",
  "settings.item.textColorDark.name": "Color de texto (modo oscuro)",
  "settings.item.textColorDark.desc": "Se usa en el texto y los iconos.",

  "settings.item.submitLabel.name": "Texto del botón de postear",
  "settings.item.submitLabel.desc": "Déjalo en blanco para un botón solo con icono (solo si hay uno configurado).",
  "settings.item.submitIcon.name": "Icono del botón de postear",
  "settings.item.submitIcon.desc": "Copia un nombre de icono desde {linkOpen}aquí{linkClose}. \nDéjalo vacío para ocultarlo.",
  "settings.item.updateLabel.name": "Texto del botón de actualizar",
  "settings.item.updateLabel.desc": "Se usa mientras editas un post. \nDéjalo en blanco para un botón solo con icono (solo si hay uno configurado).",
  "settings.item.updateIcon.name": "Icono del botón de actualizar",
  "settings.item.updateIcon.desc": "Copia un nombre de icono desde {linkOpen}aquí{linkClose}. \nDéjalo vacío para usar el icono del botón de postear.",
  "settings.item.inputPlaceholder.name": "Mensaje de campo vacío",
  "settings.item.inputPlaceholder.desc": "Si se deja en blanco, se ocultará.",

  "settings.item.tagSuggest.name": "Autocompletado de etiquetas",
  "settings.item.tagSuggest.desc": "Al escribir después de #, aparecen sugerencias. \nAl desactivarlo también se borran las recordadas.",

  "settings.item.pinLimit.name": "Límite de fijados",
  "settings.item.pinLimit.desc": "Si bajas el límite, se desfijan los que sobren.",
  "settings.option.pinLimit.1": "1 elemento",
  "settings.option.pinLimit.3": "3 elementos",
  "settings.option.pinLimit.5": "5 elementos",

  "settings.item.ogp.name": "Vista previa de URL (OGP)",
  "settings.item.ogp.desc": "Obtiene datos de vista previa desde las URL. \nAl desactivarlo no se realiza ninguna conexión externa.",

  "settings.item.checkStrikethrough.name": "Tachado en tareas completadas",
  "settings.item.checkStrikethrough.desc": "Si está desactivado, el texto se queda igual.",

  "settings.item.calendarDayShape.name": "Forma de los botones de fecha",
  "settings.item.calendarDayShape.desc": "Se aplica a los días del calendario.",
  "settings.option.calendarDayShape.circle": "Círculo",
  "settings.option.calendarDayShape.rounded": "Redondeado",
  "settings.option.calendarDayShape.square": "Cuadrado",

  "settings.item.showCalendarButton.name": "Mostrar el botón de calendario",
  "settings.item.showCalendarButton.desc": "Si se activa, podrás saltar a cualquier fecha desde la barra de navegación.",

  "settings.item.showPostDelete.name": "Mostrar el botón Eliminar",
  "settings.item.showPostDelete.desc": "Si se activa, se añade un botón de eliminar al menú del memo. \nUn memo eliminado no se puede recuperar. Las imágenes adjuntas no se eliminan.",

  "settings.item.useCustomAttachmentFolder.name": "Especificar la carpeta de imágenes",
  "settings.item.useCustomAttachmentFolder.desc": "Solo afecta a las imágenes añadidas desde Wrot.",

  "settings.item.attachmentFolder.name": "Carpeta de destino",
  "settings.item.attachmentFolder.desc": "Si la carpeta no existe, se usa la configuración de Obsidian.",
  "settings.item.attachmentFolder.placeholder": "Selecciona una carpeta",

  "settings.item.tagColorRules.name": "Usar reglas por etiqueta",
  "settings.item.tagColorRules.desc": "Permite cambiar el color, la integración de etiquetas y más por etiqueta. \nEn el color manda la etiqueta que aparece primero en el texto.",

  "settings.tagRule.label": "Regla {n}",
  "settings.tagRule.tag.name": "Etiqueta",
  "settings.tagRule.tag.desc": "Puedes omitir el #.",
  "settings.tagRule.tag.placeholder": "nombre-de-etiqueta",
  "settings.tagRule.bg.name": "Color de fondo",
  "settings.tagRule.bg.desc": "Se usa en el fondo del post.",
  "settings.tagRule.fg.name": "Color de texto",
  "settings.tagRule.fg.desc": "Las etiquetas y los enlaces usan el color de acento.",
  "settings.tagRule.accent.name": "Color de acento",
  "settings.tagRule.accent.desc": "Si no se define, se usa el color de acento del tema.",
  "settings.tagRule.sub.name": "Color secundario",
  "settings.tagRule.sub.desc": "El color de las marcas de tiempo, viñetas y similares. \nSi no se define, se calcula automáticamente.",
  "settings.tagRule.scope.buttons.name":
    "Aplicar color secundario a fechas, menús y chinchetas",
  "settings.tagRule.scope.buttons.desc":
    "Si se desactiva, se usará el color calculado automáticamente.",
  "settings.tagRule.scope.quote.name": "Aplicar color secundario a las citas",
  "settings.tagRule.scope.quote.desc":
    "Si se desactiva, se usará el color calculado automáticamente.",
  "settings.tagRule.scope.list.name":
    "Aplicar color secundario a listas y casillas",
  "settings.tagRule.scope.list.desc":
    "Si se desactiva, se usará el color calculado automáticamente.",
  "settings.tagRule.scope.ogp.name": "Aplicar color secundario a tarjetas OGP",
  "settings.tagRule.scope.ogp.desc":
    "Si se desactiva, se usará el color calculado automáticamente.",
  "settings.item.graphTags.name": "Integración de etiquetas",
  "settings.item.graphTags.desc": "Las etiquetas entran en la vista gráfica y la búsqueda tag:. \nSi está desactivado, se quedan solo dentro de Wrot.",
  "settings.tagRule.noIntegration.name": "Excluir de la integración de etiquetas",
  "settings.tagRule.noIntegration.desc": "Si se activa, esta etiqueta se queda solo dentro de Wrot.",
  "settings.tagRule.hideTimeline.name": "Ocultar en la línea de tiempo",
  "settings.tagRule.hideTimeline.desc": "Si se activa, los memos con esta etiqueta dejan de aparecer en la línea de tiempo. \nPermanecen en la nota diaria.",
  "settings.tagRule.protectDelete.name": "Desactivar el botón Eliminar",
  "settings.tagRule.protectDelete.desc": "Si se activa, los memos con esta etiqueta no se pueden eliminar.",
  "settings.tagRule.button.add": "Añadir regla",

  "view.formatMenu.code": "Código",
  "view.formatMenu.math": "Fórmula",
  "view.formatMenu.quote": "Cita",
  "view.formatMenu.link": "Enlace",
  "view.formatMenu.strikethrough": "Tachado",
  "view.formatMenu.highlight": "Resaltado",
  "view.formatMenu.settings": "Configuración",

  "view.postMenu.copy": "Copiar",
  "view.postMenu.quotePost": "Citar post",
  "view.postMenu.edit": "Editar",
  "view.postMenu.cancelEdit": "Cancelar edición",
  "view.postMenu.unpin": "Desfijar",
  "view.postMenu.pin": "Fijar",
  "view.postMenu.pinLimitHint": "El límite es de {limit} elementos fijados.",
  "view.postMenu.delete": "Eliminar",
  // Shown on the same row after the first press, in place of the label above.
  "view.postMenu.deleteConfirm": "Pulsa otra vez para eliminar",

  "view.dateNav.today": "Hoy",
  "view.dateNav.todaySuffix": " (Hoy)",

  "view.empty.noMemos": "No hay notas que mostrar",
  "view.notice.saveFailed": "Error al guardar la nota: {error}",
  "view.notice.searchPluginNotFound":
    "No se encontró el complemento de búsqueda",

  "view.image.removeAria": "Eliminar imagen",

  // Placeholder body of a quote card whose original post is gone.
  "quote.card.notFound": "(No se encuentra el memo original)",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "MMMM [de] YYYY",

  "defaults.headerDateFormat": "D [de] MMMM [de] YYYY",
  "defaults.submitLabel": "Postear",
  "defaults.updateLabel": "Actualizar",
  "defaults.inputPlaceholder": "Escribe algo...",
} satisfies Translations;

export default es;
