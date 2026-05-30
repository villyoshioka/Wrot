import type { Translations } from "./ja";

// French translations. Translated via Nani.
const fr = {
  "settings.section.basic": "Paramètres de base",
  "settings.section.display": "Paramètres d'affichage",

  "settings.item.viewPlacement.name": "Position d'affichage",
  "settings.item.viewPlacement.desc":
    "Choisissez l'emplacement du panneau Wrot.",
  "settings.option.viewPlacement.left": "Barre latérale gauche",
  "settings.option.viewPlacement.right": "Barre latérale droite",
  "settings.option.viewPlacement.main": "Zone principale",

  "settings.item.followFontSize.name":
    "Adapter à la taille de la police d'Obsidian",
  "settings.item.followFontSize.desc":
    "Aligne la taille du texte de Wrot sur les paramètres d'apparence d'Obsidian.",

  "settings.item.headerDateFormat.name": "Format de date de l'en-tête",
  "settings.item.headerDateFormat.desc":
    "Définissez le format de la date pour la navigation. (YYYY, MM, DD, etc. sont acceptés) Laissez vide pour utiliser la valeur par défaut.",

  "settings.item.timestampFormat.name": "Format de l'horodatage",
  "settings.item.timestampFormat.desc":
    "Définissez le format de la date et de l'heure des publications (YYYY, MM, DD, HH, mm, ss).",

  "settings.item.bgColorLight.name": "Couleur de fond (Mode clair)",
  "settings.item.bgColorLight.desc":
    "Définit la couleur de fond des publications et du champ de saisie en mode clair.",
  "settings.item.textColorLight.name": "Couleur du texte (Mode clair)",
  "settings.item.textColorLight.desc":
    "Définit la couleur du texte et des icônes en mode clair.",
  "settings.item.bgColorDark.name": "Couleur de fond (Mode sombre)",
  "settings.item.bgColorDark.desc":
    "Définit la couleur de fond des publications et du champ de saisie en mode sombre.",
  "settings.item.textColorDark.name": "Couleur du texte (Mode sombre)",
  "settings.item.textColorDark.desc":
    "Définit la couleur du texte et des icônes en mode sombre.",

  "settings.item.submitLabel.name": "Libellé du bouton Poster",
  "settings.item.submitLabel.desc":
    "Personnalisez le texte affiché sur le bouton Poster.",
  "settings.item.submitIcon.name": "Icône du bouton Poster",
  "settings.item.submitIcon.desc":
    "Modifiez l'icône du bouton. Copiez le nom de l'icône depuis {linkOpen}ici{linkClose}. Laissez vide pour la masquer.",
  "settings.item.inputPlaceholder.name": "Message du champ vide",
  "settings.item.inputPlaceholder.desc":
    "Texte affiché lorsque le champ de saisie est vide. Laissez vide pour ne rien afficher.",

  "settings.item.pinLimit.name": "Limite d'épinglage",
  "settings.item.pinLimit.desc":
    "Nombre maximal de notes pouvant être épinglées à la chronologie.",
  "settings.option.pinLimit.1": "1 élément",
  "settings.option.pinLimit.3": "3 éléments",
  "settings.option.pinLimit.5": "5 éléments",

  "settings.item.ogp.name": "Aperçu de l'URL",
  "settings.item.ogp.desc":
    "Récupère et affiche automatiquement les informations OGP à partir des URL. Si désactivé, aucune communication externe n'est effectuée.",

  "settings.item.checkStrikethrough.name": "Rayer les éléments cochés",
  "settings.item.checkStrikethrough.desc":
    "Applique un style barré aux éléments de liste dont la case est cochée.",

  "settings.item.showCalendarButton.name": "Bouton Calendrier",
  "settings.item.showCalendarButton.desc":
    "Affiche un bouton calendrier dans la barre de navigation. Touchez-le pour accéder directement à n'importe quelle date.",

  "settings.item.tagColorRules.name": "Coloration par étiquette",
  "settings.item.tagColorRules.desc":
    "Personnalise les couleurs des publications selon leurs étiquettes. En cas de conflit, la première étiquette du texte est prioritaire.",

  "settings.tagRule.label": "Règle {n}",
  "settings.tagRule.tag.name": "Étiquette",
  "settings.tagRule.tag.desc":
    "Nom de l'étiquette (le symbole # peut être omis).",
  "settings.tagRule.tag.placeholder": "Nom de l'étiquette",
  "settings.tagRule.bg.name": "Couleur de fond",
  "settings.tagRule.bg.desc": "Couleur de fond pour cette étiquette.",
  "settings.tagRule.fg.name": "Couleur du texte",
  "settings.tagRule.fg.desc":
    "Couleur du texte principal (les étiquettes et liens utilisent la couleur d'accentuation).",
  "settings.tagRule.accent.name": "Couleur d'accentuation",
  "settings.tagRule.accent.desc":
    "Couleur des liens, étiquettes et icônes d'action. Utilise la couleur du thème par défaut.",
  "settings.tagRule.sub.name": "Couleur secondaire",
  "settings.tagRule.sub.desc":
    "Couleur des éléments secondaires (horodatage, icônes, listes, citations). Calculée automatiquement si non définie.",
  "settings.tagRule.scope.buttons.name":
    "Appliquer aux boutons et à l'horodatage",
  "settings.tagRule.scope.buttons.desc":
    "Si désactivé, utilise la couleur par défaut.",
  "settings.tagRule.scope.quote.name": "Appliquer aux citations",
  "settings.tagRule.scope.quote.desc":
    "Si désactivé, utilise la couleur par défaut.",
  "settings.tagRule.scope.list.name": "Appliquer aux listes et cases à cocher",
  "settings.tagRule.scope.list.desc":
    "Si désactivé, utilise la couleur par défaut.",
  "settings.tagRule.scope.ogp.name": "Appliquer aux cartes OGP",
  "settings.tagRule.scope.ogp.desc":
    "Si désactivé, utilise la couleur par défaut.",
  "settings.tagRule.button.add": "Ajouter une règle",

  "settings.tooltip.resetDefault": "Rétablir par défaut",
  "settings.tooltip.deleteRule": "Supprimer la règle",
  "settings.tooltip.lock": "Verrouiller",
  "settings.tooltip.unlock": "Déverrouiller pour modifier",

  "view.formatMenu.code": "Code",
  "view.formatMenu.math": "Équation",
  "view.formatMenu.quote": "Citation",
  "view.formatMenu.link": "Lien",
  "view.formatMenu.strikethrough": "Barré",
  "view.formatMenu.highlight": "Surlignage",
  "view.formatMenu.settings": "Paramètres",

  "view.postMenu.copy": "Copier",
  "view.postMenu.quotePost": "Citer le post",
  "view.postMenu.unpin": "Désépingler",
  "view.postMenu.pin": "Épingler",
  "view.postMenu.pinLimitHint": "La limite est de {limit} épingles.",

  "view.dateNav.today": "Aujourd'hui",
  "view.dateNav.todaySuffix": " (Aujourd'hui)",

  "view.empty.noMemos": "Aucune note",
  "view.notice.saveFailed": "Échec de l'enregistrement de la note : {error}",
  "view.notice.searchPluginNotFound": "Plugin de recherche introuvable",

  "view.image.removeAria": "Supprimer l'image",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "MMMM YYYY",

  "defaults.headerDateFormat": "D MMMM YYYY",
  "defaults.submitLabel": "Poster",
  "defaults.inputPlaceholder": "À vous de jouer...",
} satisfies Translations;

export default fr;
