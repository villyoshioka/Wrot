import type { Translations } from "./ja";

// French translations. Translated via Nani.
const fr = {
  "settings.section.basic": "Paramètres de base",
  "settings.section.advanced": "Paramètres avancés",
  "settings.section.tagrules": "Règles par balise",

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
    "Définissez le format de la date pour la navigation. (YYYY, MM, DD, etc. sont acceptés) \nLaissez vide pour utiliser la valeur par défaut.",

  "settings.item.timestampFormat.name": "Format de l'horodatage",
  "settings.item.timestampFormat.desc":
    "Définissez le format de la date et de l'heure des publications \n(YYYY, MM, DD, HH, mm, ss).",

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
    "Personnalisez le texte affiché sur le bouton Poster. \nLaissez vide pour un bouton avec seulement l'icône (uniquement si une icône est définie).",
  "settings.item.submitIcon.name": "Icône du bouton Poster",
  "settings.item.submitIcon.desc":
    "Change l'icône du bouton de publication. \nCopiez un nom d'icône {linkOpen}ici{linkClose}. \nLaissez vide pour la masquer.",
  "settings.item.updateLabel.name": "Libellé du bouton Mettre à jour",
  "settings.item.updateLabel.desc":
    "Personnalisez le texte affiché sur le bouton Poster pendant la modification d'un post. \nLaissez vide pour un bouton avec seulement l'icône (uniquement si une icône est définie).",
  "settings.item.updateIcon.name": "Icône du bouton Mettre à jour",
  "settings.item.updateIcon.desc":
    "Changez l'icône affichée pendant la modification d'un post. \nCopiez un nom d'icône {linkOpen}ici{linkClose}. \nLaissez vide pour utiliser l'icône du bouton Poster.",
  "settings.item.inputPlaceholder.name": "Message du champ vide",
  "settings.item.inputPlaceholder.desc":
    "Texte affiché lorsque le champ de saisie est vide. \nLaissez vide pour ne rien afficher.",

  "settings.item.tagSuggest.name": "Saisie semi-automatique des tags",
  "settings.item.tagSuggest.desc":
    "Taper # propose les tags déjà utilisés. Le désactiver efface les tags mémorisés.",

  "settings.item.pinLimit.name": "Limite d'épinglage",
  "settings.item.pinLimit.desc":
    "Nombre maximal de notes pouvant être épinglées à la chronologie.",
  "settings.option.pinLimit.1": "1 élément",
  "settings.option.pinLimit.3": "3 éléments",
  "settings.option.pinLimit.5": "5 éléments",

  "settings.item.ogp.name": "Aperçu de l'URL",
  "settings.item.ogp.desc":
    "Récupère et affiche automatiquement les informations OGP à partir des URL. \nSi désactivé, aucune communication externe n'est effectuée.",

  "settings.item.checkStrikethrough.name": "Rayer les éléments cochés",
  "settings.item.checkStrikethrough.desc":
    "Applique un style barré aux éléments de liste dont la case est cochée.",

  "settings.item.calendarDayShape.name": "Forme des boutons de date",
  "settings.item.calendarDayShape.desc": "Sélectionnez la forme des boutons de date dans le calendrier.",
  "settings.option.calendarDayShape.circle": "Cercle",
  "settings.option.calendarDayShape.rounded": "Arrondi",
  "settings.option.calendarDayShape.square": "Carré",

  "settings.item.showCalendarButton.name": "Bouton Calendrier",
  "settings.item.showCalendarButton.desc":
    "Affiche un bouton calendrier dans la barre de navigation. \nTouchez-le pour accéder directement à n'importe quelle date.",

  "settings.item.showPostDelete.name": "Bouton Supprimer",
  "settings.item.showPostDelete.desc":
    "Ajoute le bouton « Supprimer » au menu du mémo. \nUn mémo supprimé est irrécupérable. \nLes images du mémo ne sont pas supprimées.",

  "settings.item.useCustomAttachmentFolder.name": "Dossier des images",
  "settings.item.useCustomAttachmentFolder.desc":
    "Enregistre les images ajoutées depuis Wrot dans le dossier de votre choix, \nindépendamment du réglage des pièces jointes d'Obsidian.",

  "settings.item.attachmentFolder.name": "Dossier de destination",
  "settings.item.attachmentFolder.desc":
    "Sélectionnez le dossier où les images sont enregistrées. \nSi le dossier n'existe pas, le réglage des pièces jointes d'Obsidian est utilisé.",
  "settings.item.attachmentFolder.placeholder": "Sélectionner un dossier",

  "settings.item.tagColorRules.name": "Utiliser les règles par tag",
  "settings.item.tagColorRules.desc":
    "Définit couleurs et intégration par tag. Pour les couleurs, le tag apparaissant en premier l'emporte.",

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
    "Couleur des tags, liens et URL. Sans réglage, la couleur d'accent du thème est utilisée.",
  "settings.tagRule.sub.name": "Couleur secondaire",
  "settings.tagRule.sub.desc":
    "Couleur des éléments secondaires comme les horodatages et les puces. \nCalculée automatiquement si non définie.",
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
  "settings.item.graphTags.name": "Intégration des tags",
  "settings.item.graphTags.desc":
    "Fait compter les tags des mémos dans le graphe et la recherche tag:. \nDésactivé, ils restent dans Wrot.",
  "settings.tagRule.noIntegration.name": "Exclure de l'intégration des tags",
  "settings.tagRule.noIntegration.desc":
    "Si activé, le tag de cette règle écrit dans les mémos est exclu de l'intégration des tags \net reste uniquement dans Wrot.",
  "settings.tagRule.hideTimeline.name": "Masquer dans la timeline",
  "settings.tagRule.hideTimeline.desc":
    "Si activé, les mémos portant ce tag n'apparaissent plus dans la timeline. Ils restent dans la note quotidienne.",
  "settings.tagRule.protectDelete.name": "Désactiver le bouton Supprimer",
  "settings.tagRule.protectDelete.desc":
    "Désactive le bouton « Supprimer » sur les mémos portant ce tag.",
  "settings.tagRule.button.add": "Ajouter une règle",

  "view.formatMenu.code": "Code",
  "view.formatMenu.math": "Équation",
  "view.formatMenu.quote": "Citation",
  "view.formatMenu.link": "Lien",
  "view.formatMenu.strikethrough": "Barré",
  "view.formatMenu.highlight": "Surlignage",
  "view.formatMenu.settings": "Paramètres",

  "view.postMenu.copy": "Copier",
  "view.postMenu.quotePost": "Citer le post",
  "view.postMenu.edit": "Modifier",
  "view.postMenu.cancelEdit": "Annuler la modification",
  "view.postMenu.unpin": "Désépingler",
  "view.postMenu.pin": "Épingler",
  "view.postMenu.pinLimitHint": "La limite est de {limit} épingles.",
  "view.postMenu.delete": "Supprimer",
  // Shown on the same row after the first press, in place of the label above.
  "view.postMenu.deleteConfirm": "Appuyez encore pour supprimer",

  "view.dateNav.today": "Aujourd'hui",
  "view.dateNav.todaySuffix": " (Aujourd'hui)",

  "view.empty.noMemos": "Aucune note à afficher",
  "view.notice.saveFailed": "Échec de l'enregistrement de la note : {error}",
  "view.notice.searchPluginNotFound": "Plugin de recherche introuvable",

  "view.image.removeAria": "Supprimer l'image",

  // Placeholder body of a quote card whose original post is gone.
  "quote.card.notFound": "(Mémo d'origine introuvable)",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "MMMM YYYY",

  "defaults.headerDateFormat": "D MMMM YYYY",
  "defaults.submitLabel": "Poster",
  "defaults.updateLabel": "Mettre à jour",
  "defaults.inputPlaceholder": "À vous de jouer...",
} satisfies Translations;

export default fr;
