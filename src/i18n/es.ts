import type { Translations } from "./ja";

// Spanish translations. Translated via Nani.
const es = {
  "settings.section.basic": "Configuración básica",
  "settings.section.display": "Configuración de visualización",

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
    "Especifica el formato de fecha para la navegación diaria (ej. YYYY, MM, DD). Déjalo en blanco para usar el valor predeterminado.",

  "settings.item.timestampFormat.name": "Formato de marca de tiempo",
  "settings.item.timestampFormat.desc":
    "Especifica el formato de fecha y hora para los posts (YYYY, MM, DD, HH, mm, ss).",

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
    "Cambia el texto que se muestra en el botón de postear.",
  "settings.item.submitIcon.name": "Icono del botón de postear",
  "settings.item.submitIcon.desc":
    "Cambia el icono del botón de postear. Copia el nombre del icono desde {linkOpen}aquí{linkClose}. Si se deja en blanco, el icono se ocultará.",
  "settings.item.inputPlaceholder.name": "Mensaje de campo vacío",
  "settings.item.inputPlaceholder.desc":
    "Cambia el texto que aparece cuando el campo de entrada está vacío. Si se deja en blanco, se ocultará.",

  "settings.item.pinLimit.name": "Límite de fijados",
  "settings.item.pinLimit.desc":
    "Establece el número máximo de notas que se pueden fijar en la línea de tiempo.",
  "settings.option.pinLimit.1": "1 elemento",
  "settings.option.pinLimit.3": "3 elementos",
  "settings.option.pinLimit.5": "5 elementos",

  "settings.item.ogp.name": "Vista previa de URL (OGP)",
  "settings.item.ogp.desc":
    "Obtiene y muestra automáticamente la información OGP de las URL. Si se desactiva, no se realizarán conexiones externas.",

  "settings.item.checkStrikethrough.name": "Tachado en tareas completadas",
  "settings.item.checkStrikethrough.desc":
    "Muestra una línea de tachado en los elementos con la casilla de verificación marcada.",

  "settings.item.tagColorRules.name": "Colores personalizados por etiqueta",
  "settings.item.tagColorRules.desc":
    "Cambia el color de los posts que contienen etiquetas específicas. Si coinciden varias, se aplicará la de la primera etiqueta encontrada.",

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
    "Color para etiquetas, enlaces e iconos de estado. Si se deja vacío, se usará el del tema.",
  "settings.tagRule.sub.name": "Color secundario",
  "settings.tagRule.sub.desc":
    "Color para elementos secundarios (fechas, iconos, listas, etc.). Si se deja vacío, se calculará automáticamente.",
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
  "settings.tagRule.button.add": "Añadir regla",

  "settings.tooltip.resetDefault": "Restablecer valores",
  "settings.tooltip.deleteRule": "Eliminar esta regla",
  "settings.tooltip.lock": "Bloquear",
  "settings.tooltip.unlock": "Desbloquear para editar",

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

  "view.empty.noMemos": "No hay notas",
  "view.notice.saveFailed": "Error al guardar la nota: {error}",
  "view.notice.searchPluginNotFound":
    "No se encontró el complemento de búsqueda",

  "view.image.removeAria": "Eliminar imagen",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "defaults.headerDateFormat": "D [de] MMMM [de] YYYY",
  "defaults.submitLabel": "Postear",
  "defaults.inputPlaceholder": "Escribe algo...",
} satisfies Translations;

export default es;
