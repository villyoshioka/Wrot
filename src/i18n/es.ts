import type { Translations } from "./ja";

// Spanish translations. Translated via Nani.
const es = {
  "settings.section.basic": "Configuración básica",
  "settings.section.advanced": "Configuración avanzada",
  "settings.section.tagrules": "Reglas por etiqueta",

  "settings.item.viewPlacement.name": "Ubicación de la vista",
  "settings.item.viewPlacement.desc": "Lugar donde se muestra Wrot.",
  "settings.option.viewPlacement.left": "Barra lateral izquierda",
  "settings.option.viewPlacement.right": "Barra lateral derecha",
  "settings.option.viewPlacement.main": "Área principal",
  "settings.item.openOnStartup.name": "Abrir al inicio",
  "settings.item.openOnStartup.desc": "Si se activa, Wrot pasa al primer plano al iniciar Obsidian.",

  "settings.item.followFontSize.name": "Usar tamaño de fuente de Obsidian",
  "settings.item.followFontSize.desc": "Si se activa, sigue el tamaño de fuente configurado en la apariencia de Obsidian.",

  "settings.item.headerDateFormat.name": "Formato de fecha del encabezado",
  "settings.item.headerDateFormat.desc": "Ej.: YYYY, MM, DD. \nDéjalo en blanco para usar el valor predeterminado.",

  "settings.item.timestampFormat.name": "Formato de marca de tiempo",
  "settings.item.timestampFormat.desc": "Ej.: YYYY, MM, DD, HH, mm, ss.",

  "settings.item.bgColorLight.name": "Color de fondo (modo claro)",
  "settings.item.bgColorLight.desc": "Se usa en las publicaciones y en el campo de entrada.",
  "settings.item.textColorLight.name": "Color de texto (modo claro)",
  "settings.item.textColorLight.desc": "Se usa en el texto y en los iconos.",
  "settings.item.bgColorDark.name": "Color de fondo (modo oscuro)",
  "settings.item.bgColorDark.desc": "Se usa en las publicaciones y en el campo de entrada.",
  "settings.item.textColorDark.name": "Color de texto (modo oscuro)",
  "settings.item.textColorDark.desc": "Se usa en el texto y en los iconos.",

  "settings.item.submitLabel.name": "Texto del botón de publicar",
  "settings.item.submitLabel.desc": "Déjalo en blanco para mostrar solo el icono (solo si hay uno configurado).",
  "settings.item.submitIcon.name": "Icono del botón de publicar",
  "settings.item.submitIcon.desc": "Copia el nombre de un icono desde {linkOpen}aquí{linkClose}. \nDéjalo en blanco para ocultarlo.",
  "settings.item.updateLabel.name": "Texto del botón de actualizar",
  "settings.item.updateLabel.desc": "Se usa al editar una publicación. \nDéjalo en blanco para mostrar solo el icono (solo si hay uno configurado).",
  "settings.item.updateIcon.name": "Icono del botón de actualizar",
  "settings.item.updateIcon.desc": "Copia el nombre de un icono desde {linkOpen}aquí{linkClose}. \nDéjalo en blanco para usar el mismo icono del botón de publicar.",
  "settings.item.submitGradient.name": "Degradado en el formulario de publicación",
  "settings.item.submitGradient.desc": "Si se activa, se aplica un degradado a los elementos destacados del formulario.",
  "settings.item.inputPlaceholder.name": "Texto del campo vacío",
  "settings.item.inputPlaceholder.desc": "Si se deja en blanco, no se mostrará nada.",

  "settings.item.tagSuggest.name": "Sugerencias de etiquetas",
  "settings.item.tagSuggest.desc": "Muestra sugerencias al escribir después de #. \nAl desactivarlo, se borrarán las etiquetas recordadas.",

  "settings.item.pinLimit.name": "Límite de elementos fijados",
  "settings.item.pinLimit.desc": "«Fijar» y «Fijar más tarde» tienen cada uno su propio límite.\nSi reduces el límite, se desfijarán los elementos sobrantes.",
  "settings.option.pinLimit.1": "1 elemento",
  "settings.option.pinLimit.3": "3 elementos",
  "settings.option.pinLimit.5": "5 elementos",
  "settings.item.pinFixed.name": "Mantener fijados en la parte superior",
  "settings.item.pinFixed.desc": "Si se desactiva, las publicaciones fijadas se desplazarán junto con la cronología.",

  "settings.item.ogp.name": "Vista previa de enlaces (OGP)",
  "settings.item.ogp.desc": "Obtiene datos de vista previa a partir de las URL. \nAl desactivarlo, no se realizará ninguna conexión externa.",

  "settings.item.checkStrikethrough.name": "Tachar tareas completadas",
  "settings.item.checkStrikethrough.desc": "Si se desactiva, las tareas marcadas no aparecerán tachadas.",

  "settings.item.calendarDayShape.name": "Forma de los días del calendario",
  "settings.item.calendarDayShape.desc": "Aplica una forma a los botones de fecha del calendario.",
  "settings.option.calendarDayShape.circle": "Circular",
  "settings.option.calendarDayShape.rounded": "Redondeada",
  "settings.option.calendarDayShape.square": "Cuadrada",

  "settings.item.showCalendarButton.name": "Mostrar botón de calendario",
  "settings.item.showCalendarButton.desc": "Si se activa, podrás saltar a cualquier fecha desde la barra de navegación.",

  "settings.item.showPostDelete.name": "Mostrar botón de eliminar",
  "settings.item.showPostDelete.desc": "Si se activa, se añade una opción para eliminar en el menú de la publicación. \nLas publicaciones eliminadas no se pueden recuperar. Las imágenes adjuntas no se borrarán.",

  "settings.item.useCustomAttachmentFolder.name": "Personalizar carpeta de imágenes",
  "settings.item.useCustomAttachmentFolder.desc": "Solo afecta a las imágenes añadidas desde Wrot.",

  "settings.item.attachmentFolder.name": "Carpeta de destino",
  "settings.item.attachmentFolder.desc": "Si la carpeta no existe, se usará la configuración de Obsidian.",
  "settings.item.attachmentFolder.placeholder": "Seleccionar una carpeta",
  "settings.item.shrinkImages.name": "Comprimir imágenes",
  "settings.item.shrinkImages.desc": "Comprime las imágenes adjuntas y elimina metadatos (como la ubicación) antes de guardarlas. \nLos GIF no se modifican.",
  "settings.item.postHeading.name": "Encabezado de la plantilla",
  "settings.item.postHeading.desc": "Las publicaciones se añadirán debajo del encabezado seleccionado.",
  "settings.option.postHeading.none": "Ninguno",

  "settings.item.tagColorRules.name": "Usar reglas por etiqueta",
  "settings.item.tagColorRules.desc": "Permite personalizar colores, integración y más según la etiqueta. \nPara el color, tendrá prioridad la primera etiqueta que aparezca en el texto.",

  "settings.tagRule.label": "Regla {n}",
  "settings.tagRule.tag.name": "Etiqueta",
  "settings.tagRule.tag.desc": "No es necesario incluir el #.",
  "settings.tagRule.tag.placeholder": "nombre-de-etiqueta",
  "settings.tagRule.bg.name": "Color de fondo",
  "settings.tagRule.bg.desc": "Se usa como fondo de la publicación.",
  "settings.tagRule.fg.name": "Color del texto",
  "settings.tagRule.fg.desc": "Las etiquetas y enlaces usarán el color de acento.",
  "settings.tagRule.accent.name": "Color de acento",
  "settings.tagRule.accent.desc": "Si no se define, se usará el color de acento del tema.",
  "settings.tagRule.sub.name": "Color secundario",
  "settings.tagRule.sub.desc": "Se usa en marcas de tiempo, viñetas y elementos similares. \nSi no se define, se calculará automáticamente.",
  "settings.tagRule.scope.buttons.name":
    "Aplicar color secundario a fechas, menús e iconos de fijar",
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
  "settings.item.graphTags.desc": "Las etiquetas se incluirán en la vista de gráfico y en las búsquedas tag:. \nSi se desactiva, solo funcionarán dentro de Wrot.",
  "settings.tagRule.noIntegration.name": "Excluir de la integración de etiquetas",
  "settings.tagRule.noIntegration.desc": "Si se activa, esta etiqueta solo funcionará dentro de Wrot.",
  "settings.tagRule.hideTimeline.name": "Ocultar en la cronología",
  "settings.tagRule.hideTimeline.desc": "Si se activa, las publicaciones con esta etiqueta no aparecerán en la cronología. \nSeguirán estando en la nota diaria.",
  "settings.tagRule.protectDelete.name": "Desactivar botón de eliminar",
  "settings.tagRule.protectDelete.desc": "Si se activa, las publicaciones con esta etiqueta no se podrán eliminar.",
  "settings.tagRule.button.add": "Añadir regla",
  "settings.item.toolbarEdit.name": "Mostrar botón para editar la barra de herramientas",
  "settings.item.toolbarEdit.desc": "Si se activa, el menú de la barra incluirá una opción para editarla.",
  "settings.item.resetToolbar.name": "Restablecer barra de herramientas",
  "settings.item.resetToolbar.desc": "Restaura el orden y la visibilidad predeterminados de la barra de herramientas.",
  "settings.item.resetToolbar.button": "Restablecer",
  // Shown on the same row after the first press, in place of the label above.
  "settings.item.resetToolbar.confirm": "Pulsa de nuevo para restablecer",

  "view.toolbarAction.image": "Imagen",
  "view.toolbarAction.embed": "Incrustar",
  "view.toolbarAction.bold": "Negrita",
  "view.toolbarAction.italic": "Cursiva",
  "view.toolbarAction.list": "Lista con viñetas",
  "view.toolbarAction.check": "Lista de tareas",
  "view.toolbarAction.ol": "Lista numerada",
  "view.toolbarAction.more": "Más opciones",
  "view.toolbarEdit.done": "Listo",
  "view.toolbarEdit.cancel": "Cancelar edición de la barra",

  "view.formatMenu.editToolbar": "Editar barra de herramientas",
  "view.formatMenu.code": "Código",
  "view.formatMenu.math": "Fórmula",
  "view.formatMenu.quote": "Cita",
  "view.formatMenu.link": "Enlace",
  "view.formatMenu.strikethrough": "Tachado",
  "view.formatMenu.highlight": "Resaltado",
  "view.formatMenu.settings": "Ajustes",

  "view.postMenu.copy": "Copiar",
  "view.postMenu.quotePost": "Citar publicación",
  "view.postMenu.edit": "Editar",
  "view.postMenu.cancelEdit": "Cancelar edición",
  "view.postMenu.unpin": "Desfijar",
  "view.postMenu.pin": "Fijar",
  "view.postMenu.pinLimitHint": "El límite es de {limit} elementos fijados.",
  "view.postMenu.schedulePin": "Fijar más tarde",
  "view.postMenu.delete": "Eliminar",
  // Shown on the same row after the first press, in place of the label above.
  "view.postMenu.deleteConfirm": "Pulsa de nuevo para eliminar",

  "view.dateNav.today": "Hoy",
  "view.dateNav.todaySuffix": " (Hoy)",

  "view.empty.noMemos": "No hay publicaciones para mostrar",
  "view.notice.saveFailed": "Error al guardar la publicación: {error}",
  "view.notice.postHeadingMissing": "Esta nota no tiene el encabezado configurado; la publicación se añadió al final.",
  "view.notice.postHeadingNoTemplate": "No se encontró la plantilla de la nota diaria. El encabezado se restableció a «Ninguno».",
  "view.notice.searchPluginNotFound":
    "El plugin principal «Búsqueda» no está activado.",

  "view.image.removeAria": "Eliminar imagen",

  // Placeholder body of a quote card whose original post is gone.
  "quote.card.notFound": "(Publicación original no encontrada)",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "MMMM [de] YYYY",

  "defaults.headerDateFormat": "D [de] MMMM [de] YYYY",

  "defaults.timestampFormat": "DD/MM/YYYY HH:mm:ss",
  "defaults.submitLabel": "Publicar",
  "defaults.updateLabel": "Actualizar",
  "defaults.inputPlaceholder": "Escribe algo...",
} satisfies Translations;

export default es;
