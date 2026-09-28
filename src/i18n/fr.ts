import type { Translations } from "./ja";

// French translations. Translated via Nani.
const fr = {
  "settings.section.basic": "Paramètres généraux",
  "settings.section.advanced": "Paramètres avancés",
  "settings.section.tagrules": "Règles par tag",

  "settings.item.viewPlacement.name": "Emplacement de la vue",
  "settings.item.viewPlacement.desc": "Endroit où Wrot s'affiche.",
  "settings.option.viewPlacement.left": "Barre latérale gauche",
  "settings.option.viewPlacement.right": "Barre latérale droite",
  "settings.option.viewPlacement.main": "Panneau principal",
  "settings.item.openOnStartup.name": "Ouvrir au démarrage",
  "settings.item.openOnStartup.desc": "Si activé, Wrot s'affiche au premier plan au démarrage d'Obsidian.",

  "settings.item.followFontSize.name":
    "Adapter à la taille de police d'Obsidian",
  "settings.item.followFontSize.desc": "Si activé, utilise la taille de police définie dans les paramètres d'apparence d'Obsidian.",

  "settings.item.headerDateFormat.name": "Format de date de l'en-tête",
  "settings.item.headerDateFormat.desc": "Prend en charge YYYY, MM, DD, etc. \nLaissez vide pour utiliser la valeur par défaut.",

  "settings.item.timestampFormat.name": "Format de l'horodatage",
  "settings.item.timestampFormat.desc": "Prend en charge YYYY, MM, DD, HH, mm, ss.",

  "settings.item.bgColorLight.name": "Couleur d'arrière-plan (mode clair)",
  "settings.item.bgColorLight.desc": "Utilisée pour les publications et la zone de saisie.",
  "settings.item.textColorLight.name": "Couleur du texte (mode clair)",
  "settings.item.textColorLight.desc": "Utilisée pour le texte et les icônes.",
  "settings.item.bgColorDark.name": "Couleur d'arrière-plan (mode sombre)",
  "settings.item.bgColorDark.desc": "Utilisée pour les publications et la zone de saisie.",
  "settings.item.textColorDark.name": "Couleur du texte (mode sombre)",
  "settings.item.textColorDark.desc": "Utilisée pour le texte et les icônes.",

  "settings.item.submitLabel.name": "Texte du bouton Publier",
  "settings.item.submitLabel.desc": "Laissez vide pour n'afficher que l'icône (uniquement si une icône est configurée).",
  "settings.item.submitIcon.name": "Icône du bouton Publier",
  "settings.item.submitIcon.desc": "Copiez un nom d'icône {linkOpen}ici{linkClose}. \nLaissez vide pour la masquer.",
  "settings.item.updateLabel.name": "Texte du bouton Mettre à jour",
  "settings.item.updateLabel.desc": "Utilisé lors de la modification d'un post. \nLaissez vide pour n'afficher que l'icône (uniquement si une icône est configurée).",
  "settings.item.updateIcon.name": "Icône du bouton Mettre à jour",
  "settings.item.updateIcon.desc": "Copiez un nom d'icône {linkOpen}ici{linkClose}. \nLaissez vide pour réutiliser l'icône du bouton Publier.",
  "settings.item.submitGradient.name": "Dégradé du formulaire de publication",
  "settings.item.submitGradient.desc": "Si activé, applique un dégradé aux couleurs d'accentuation du formulaire.",
  "settings.item.inputPlaceholder.name": "Texte indicatif",
  "settings.item.inputPlaceholder.desc": "Laissez vide pour ne rien afficher.",

  "settings.item.tagSuggest.name": "Suggestions automatiques de tags",
  "settings.item.tagSuggest.desc": "Saisir un # affiche des suggestions. \nDésactiver cette option efface également l'historique mémorisé.",

  "settings.item.pinLimit.name": "Limite d'épingles",
  "settings.item.pinLimit.desc": "« Épingler » et « Épingler plus tard » ont chacun leur propre limite.\nRéduire cette limite désépinglera les éléments excédentaires.",
  "settings.option.pinLimit.1": "1 élément",
  "settings.option.pinLimit.3": "3 éléments",
  "settings.option.pinLimit.5": "5 éléments",
  "settings.item.pinFixed.name": "Garder les éléments épinglés en haut",
  "settings.item.pinFixed.desc": "Si désactivé, les publications épinglées défilent avec le fil d'actualité.",

  "settings.item.ogp.name": "Aperçu des liens (Open Graph)",
  "settings.item.ogp.desc": "Récupère les métadonnées d'aperçu des URL. \nSi désactivé, aucune requête réseau externe n'est émise.",

  "settings.item.checkStrikethrough.name": "Barrer les éléments terminés",
  "settings.item.checkStrikethrough.desc": "Si désactivé, les éléments cochés ne seront pas barrés.",

  "settings.item.calendarDayShape.name": "Forme des cases du calendrier",
  "settings.item.calendarDayShape.desc": "S'applique aux jours affichés dans le calendrier.",
  "settings.option.calendarDayShape.circle": "Ronde",
  "settings.option.calendarDayShape.rounded": "Arrondie",
  "settings.option.calendarDayShape.square": "Carrée",

  "settings.item.showCalendarButton.name": "Bouton Calendrier",
  "settings.item.showCalendarButton.desc": "Si activé, permet d'accéder à n'importe quelle date depuis la barre de navigation.",

  "settings.item.showPostDelete.name": "Bouton Supprimer",
  "settings.item.showPostDelete.desc": "Si activé, une option de suppression est ajoutée au menu de chaque publication. \nUne publication supprimée est irrécupérable. Les images jointes ne sont pas supprimées.",

  "settings.item.useCustomAttachmentFolder.name": "Dossier des pièces jointes dédié",
  "settings.item.useCustomAttachmentFolder.desc": "Ne concerne que les images insérées depuis Wrot.",

  "settings.item.attachmentFolder.name": "Dossier de destination",
  "settings.item.attachmentFolder.desc": "Si le dossier n'existe pas, l'emplacement par défaut d'Obsidian sera utilisé.",
  "settings.item.attachmentFolder.placeholder": "Sélectionner un dossier",
  "settings.item.shrinkImages.name": "Compresser les images",
  "settings.item.shrinkImages.desc": "Compresse les images jointes et supprime les métadonnées (comme la géolocalisation) avant l'enregistrement. \nLes GIF ne sont pas modifiés.",
  "settings.item.postHeading.name": "En-tête de section cible",
  "settings.item.postHeading.desc": "Les publications seront insérées sous cet en-tête dans la note.",
  "settings.option.postHeading.none": "Aucun",

  "settings.item.tagColorRules.name": "Utiliser les règles par tag",
  "settings.item.tagColorRules.desc": "Permet de personnaliser la couleur et le comportement selon le tag. \nPour la couleur, le premier tag présent l'emporte.",

  "settings.tagRule.label": "Règle {n}",
  "settings.tagRule.tag.name": "Tag",
  "settings.tagRule.tag.desc": "Le symbole # peut être omis.",
  "settings.tagRule.tag.placeholder": "Nom du tag",
  "settings.tagRule.bg.name": "Couleur d'arrière-plan",
  "settings.tagRule.bg.desc": "Utilisée pour le fond de la publication.",
  "settings.tagRule.fg.name": "Couleur du texte",
  "settings.tagRule.fg.desc": "Les tags et les liens utiliseront la couleur d'accentuation.",
  "settings.tagRule.accent.name": "Couleur d'accentuation",
  "settings.tagRule.accent.desc": "Si non définie, la couleur d'accentuation du thème Obsidian est utilisée.",
  "settings.tagRule.sub.name": "Couleur secondaire",
  "settings.tagRule.sub.desc": "Couleur des horodatages, puces de listes, etc. \nSi non définie, elle est calculée automatiquement.",
  "settings.tagRule.scope.buttons.name":
    "Appliquer aux boutons et à l'horodatage",
  "settings.tagRule.scope.buttons.desc":
    "Si désactivé, la couleur calculée automatiquement est utilisée.",
  "settings.tagRule.scope.quote.name": "Appliquer aux citations",
  "settings.tagRule.scope.quote.desc":
    "Si désactivé, la couleur calculée automatiquement est utilisée.",
  "settings.tagRule.scope.list.name": "Appliquer aux listes et cases à cocher",
  "settings.tagRule.scope.list.desc":
    "Si désactivé, la couleur calculée automatiquement est utilisée.",
  "settings.tagRule.scope.ogp.name": "Appliquer aux aperçus de liens (OGP)",
  "settings.tagRule.scope.ogp.desc":
    "Si désactivé, la couleur calculée automatiquement est utilisée.",
  "settings.item.graphTags.name": "Intégration globale des tags",
  "settings.item.graphTags.desc": "Les tags apparaîtront dans la vue graphique et la recherche tag:. \nSi désactivé, ils restent réservés à Wrot.",
  "settings.tagRule.noIntegration.name": "Exclure de l'intégration des tags",
  "settings.tagRule.noIntegration.desc": "Si activé, ce tag ne sera visible que dans Wrot.",
  "settings.tagRule.hideTimeline.name": "Masquer du fil d'actualité",
  "settings.tagRule.hideTimeline.desc": "Si activé, les publications avec ce tag n'apparaîtront pas dans le fil Wrot. \nElles restent visibles dans la note quotidienne.",
  "settings.tagRule.protectDelete.name": "Empêcher la suppression",
  "settings.tagRule.protectDelete.desc": "Si activé, les publications portant ce tag ne pourront pas être supprimées.",
  "settings.tagRule.button.add": "Ajouter une règle",
  "settings.item.toolbarEdit.name": "Bouton d'édition de la barre d'outils",
  "settings.item.toolbarEdit.desc": "Ajoute au menu de la barre d'outils une option pour la personnaliser.",
  "settings.item.resetToolbar.name": "Réinitialiser la barre d'outils",
  "settings.item.resetToolbar.desc": "Restaure l'ordre et la disposition par défaut de la barre d'outils.",
  "settings.item.resetToolbar.button": "Réinitialiser",
  // Shown on the same row after the first press, in place of the label above.
  "settings.item.resetToolbar.confirm": "Appuyez à nouveau pour confirmer",

  "view.toolbarAction.image": "Image",
  "view.toolbarAction.embed": "Fichier intégré",
  "view.toolbarAction.bold": "Gras",
  "view.toolbarAction.italic": "Italique",
  "view.toolbarAction.list": "Liste à puces",
  "view.toolbarAction.check": "Liste de contrôle",
  "view.toolbarAction.ol": "Liste numérotée",
  "view.toolbarAction.more": "Plus d'options",
  "view.toolbarEdit.done": "Terminé",
  "view.toolbarEdit.cancel": "Annuler la personnalisation",

  "view.formatMenu.editToolbar": "Personnaliser la barre d'outils",
  "view.formatMenu.code": "Code",
  "view.formatMenu.math": "Équation",
  "view.formatMenu.quote": "Citation",
  "view.formatMenu.link": "Lien",
  "view.formatMenu.strikethrough": "Barré",
  "view.formatMenu.highlight": "Surligné",
  "view.formatMenu.settings": "Paramètres",

  "view.postMenu.copy": "Copier le texte",
  "view.postMenu.quotePost": "Citer cette publication",
  "view.postMenu.edit": "Modifier",
  "view.postMenu.cancelEdit": "Annuler la modification",
  "view.postMenu.unpin": "Désépingler",
  "view.postMenu.pin": "Épingler",
  "view.postMenu.pinLimitHint": "Limite maximale : {limit} épingles.",
  "view.postMenu.schedulePin": "Épingler plus tard",
  "view.postMenu.delete": "Supprimer",
  // Shown on the same row after the first press, in place of the label above.
  "view.postMenu.deleteConfirm": "Appuyez à nouveau pour supprimer",

  "view.dateNav.today": "Aujourd'hui",
  "view.dateNav.todaySuffix": " (Aujourd'hui)",

  "view.empty.noMemos": "Aucune publication à afficher",
  "view.notice.saveFailed": "Échec de l'enregistrement de la publication : {error}",
  "view.notice.postHeadingMissing": "L'en-tête cible est introuvable dans cette note ; la publication a été ajoutée à la fin.",
  "view.notice.postHeadingNoTemplate": "Modèle de note quotidienne introuvable : l'en-tête cible a été réinitialisé sur « Aucun ».",
  "view.notice.searchPluginNotFound": "Le plugin principal « Recherche » n'est pas activé.",

  "view.image.removeAria": "Supprimer l'image",

  // Placeholder body of a quote card whose original post is gone.
  "quote.card.notFound": "(Publication d'origine introuvable)",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "MMMM YYYY",

  "defaults.headerDateFormat": "D MMMM YYYY",

  "defaults.timestampFormat": "DD/MM/YYYY HH:mm:ss",
  "defaults.submitLabel": "Publier",
  "defaults.updateLabel": "Mettre à jour",
  "defaults.inputPlaceholder": "À vous de jouer...",
} satisfies Translations;

export default fr;
