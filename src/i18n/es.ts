import type { Translations } from "./ja";

// Spanish translations. Translated via Nani.
const es = {
  "settings.section.basic": "Configuración básica",
  "settings.section.advanced": "Configuración avanzada",
  "settings.section.tagrules": "Reglas por etiqueta",

  "settings.item.viewPlacement.name": "Posición de visualización",
  "settings.item.viewPlacement.desc":
    "Selecciona la posición donde se mostrará el panel de Wrot.",
  "settings.option.viewPlacement.left": "Barra lateral izquierda",
  "settings.option.viewPlacement.right": "Barra lateral derecha",
  "settings.option.viewPlacement.main": "Área principal",

  "settings.item.followFontSize.name": "Usar tamaño de fuente de Obsidian",
  "settings.item.followFontSize.desc":
    "Ajusta el tamaño del texto de Wrot según la configuración de apariencia de Obsidian.",

  "settings.item.headerDateFormat.name": "Formato de fecha del encabezado",
  "settings.item.headerDateFormat.desc":
    "Especifica el formato de fecha para la navegación diaria (ej. YYYY, MM, DD). \nDéjalo en blanco para usar el valor predeterminado.",

  "settings.item.timestampFormat.name": "Formato de marca de tiempo",
  "settings.item.timestampFormat.desc":
    "Especifica el formato de fecha y hora para los posts \n(YYYY, MM, DD, HH, mm, ss).",

  "settings.item.bgColorLight.name": "Color de fondo (modo claro)",
  "settings.item.bgColorLight.desc":
    "Establece el color de fondo de los posts y del formulario en el tema claro.",
  "settings.item.textColorLight.name": "Color de texto (modo claro)",
  "settings.item.textColorLight.desc":
    "Establece el color del texto y de los iconos en el tema claro.",
  "settings.item.bgColorDark.name": "Color de fondo (modo oscuro)",
  "settings.item.bgColorDark.desc":
    "Establece el color de fondo de los posts y del formulario en el tema oscuro.",
  "settings.item.textColorDark.name": "Color de texto (modo oscuro)",
  "settings.item.textColorDark.desc":
    "Establece el color del texto y de los iconos en el tema oscuro.",

  "settings.item.submitLabel.name": "Texto del botón de postear",
  "settings.item.submitLabel.desc":
    "Cambia el texto que se muestra en el botón de postear. \nDéjalo en blanco para un botón solo con icono (solo si hay uno configurado).",
  "settings.item.submitIcon.name": "Icono del botón de postear",
  "settings.item.submitIcon.desc":
    "Cambia el icono del botón de publicar. \nCopia un nombre de icono desde {linkOpen}aquí{linkClose}. \nDéjalo vacío para ocultarlo.",
  "settings.item.inputPlaceholder.name": "Mensaje de campo vacío",
  "settings.item.inputPlaceholder.desc":
    "Cambia el texto que aparece cuando el campo de entrada está vacío. \nSi se deja en blanco, se ocultará.",

  "settings.item.tagSuggest.name": "Autocompletado de etiquetas",
  "settings.item.tagSuggest.desc":
    "Al escribir # se sugieren etiquetas ya usadas. Al desactivarlo se borran las recordadas.",

  "settings.item.pinLimit.name": "Límite de fijados",
  "settings.item.pinLimit.desc":
    "Establece el número máximo de notas que se pueden fijar en la línea de tiempo.",
  "settings.option.pinLimit.1": "1 elemento",
  "settings.option.pinLimit.3": "3 elementos",
  "settings.option.pinLimit.5": "5 elementos",

  "settings.item.ogp.name": "Vista previa de URL (OGP)",
  "settings.item.ogp.desc":
    "Obtiene y muestra automáticamente la información OGP de las URL. \nSi se desactiva, no se realizarán conexiones externas.",

  "settings.item.checkStrikethrough.name": "Tachado en tareas completadas",
  "settings.item.checkStrikethrough.desc":
    "Muestra una línea de tachado en los elementos con la casilla de verificación marcada.",

  "settings.item.calendarDayShape.name": "Forma de los botones de fecha",
  "settings.item.calendarDayShape.desc": "Selecciona la forma de los botones de fecha en el calendario.",
  "settings.option.calendarDayShape.circle": "Círculo",
  "settings.option.calendarDayShape.rounded": "Redondeado",
  "settings.option.calendarDayShape.square": "Cuadrado",

  "settings.item.showCalendarButton.name": "Mostrar el botón de calendario",
  "settings.item.showCalendarButton.desc":
    "Muestra un icono de calendario en la barra de navegación. \nAl pulsarlo, podrás saltar directamente a la fecha que elijas.",

  "settings.item.tagColorRules.name": "Usar reglas por etiqueta",
  "settings.item.tagColorRules.desc":
    "Define colores e integración por etiqueta. En los colores, gana la etiqueta que aparece primero en el texto.",

  "settings.tagRule.label": "Regla {n}",
  "settings.tagRule.tag.name": "Etiqueta",
  "settings.tagRule.tag.desc": "Introduce la etiqueta (puedes omitir el #).",
  "settings.tagRule.tag.placeholder": "nombre-de-etiqueta",
  "settings.tagRule.bg.name": "Color de fondo",
  "settings.tagRule.bg.desc":
    "Color de fondo para los posts con esta etiqueta.",
  "settings.tagRule.fg.name": "Color de texto",
  "settings.tagRule.fg.desc":
    "Color del cuerpo del texto para estos posts (etiquetas y enlaces usarán el color de acento).",
  "settings.tagRule.accent.name": "Color de acento",
  "settings.tagRule.accent.desc":
    "Color para etiquetas, enlaces y URL. Si no se define, se usa el color de acento del tema.",
  "settings.tagRule.sub.name": "Color secundario",
  "settings.tagRule.sub.desc":
    "Color de elementos secundarios como marcas de tiempo y marcadores de lista. \nSe calcula solo si no se define.",
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
  "settings.item.graphTags.desc":
    "Hace que las etiquetas de los memos cuenten en el grafo y en la búsqueda tag:. \nSi se desactiva, quedan solo dentro de Wrot.",
  "settings.tagRule.noIntegration.name": "Excluir de la integración de etiquetas",
  "settings.tagRule.noIntegration.desc":
    "Si se activa, la etiqueta de esta regla escrita dentro de los memos queda fuera de la integración de etiquetas \ny se queda solo dentro de Wrot.",
  "settings.tagRule.hideTimeline.name": "Ocultar en la línea de tiempo",
  "settings.tagRule.hideTimeline.desc":
    "Si se activa, los memos con esta etiqueta dejan de aparecer en la línea de tiempo. Permanecen en la nota diaria.",
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
  "view.postMenu.unpin": "Desfijar",
  "view.postMenu.pin": "Fijar",
  "view.postMenu.pinLimitHint": "El límite es de {limit} elementos fijados.",

  "view.dateNav.today": "Hoy",
  "view.dateNav.todaySuffix": " (Hoy)",

  "view.empty.noMemos": "No hay notas que mostrar",
  "view.notice.saveFailed": "Error al guardar la nota: {error}",
  "view.notice.searchPluginNotFound":
    "No se encontró el complemento de búsqueda",

  "view.image.removeAria": "Eliminar imagen",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "MMMM [de] YYYY",

  "defaults.headerDateFormat": "D [de] MMMM [de] YYYY",
  "defaults.submitLabel": "Postear",
  "defaults.inputPlaceholder": "Escribe algo...",
} satisfies Translations;

export default es;
