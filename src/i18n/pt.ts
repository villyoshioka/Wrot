import type { Translations } from "./ja";

// Portuguese translations. Translated via Nani.
const pt = {
  "settings.section.basic": "Configurações básicas",
  "settings.section.advanced": "Configurações avançadas",
  "settings.section.tagrules": "Regras por tag",

  "settings.item.viewPlacement.name": "Posição de exibição",
  "settings.item.viewPlacement.desc": "Define onde o Wrot será exibido.",
  "settings.option.viewPlacement.left": "Barra lateral esquerda",
  "settings.option.viewPlacement.right": "Barra lateral direita",
  "settings.option.viewPlacement.main": "Área principal",
  "settings.item.openOnStartup.name": "Abrir ao iniciar",
  "settings.item.openOnStartup.desc": "Se ativado, o Wrot será trazido para o primeiro plano ao iniciar o Obsidian.",

  "settings.item.followFontSize.name": "Seguir tamanho da fonte do Obsidian",
  "settings.item.followFontSize.desc": "Se ativado, usará o tamanho da fonte das configurações de aparência do Obsidian.",

  "settings.item.headerDateFormat.name": "Formato de data do cabeçalho",
  "settings.item.headerDateFormat.desc": "Ex.: YYYY, MM, DD. \nDeixe em branco para usar o padrão.",

  "settings.item.timestampFormat.name": "Formato do carimbo de data/hora",
  "settings.item.timestampFormat.desc": "Ex.: YYYY, MM, DD, HH, mm, ss.",

  "settings.item.bgColorLight.name": "Cor de fundo (Modo claro)",
  "settings.item.bgColorLight.desc": "Usada nas postagens e na caixa de texto.",
  "settings.item.textColorLight.name": "Cor do texto (Modo claro)",
  "settings.item.textColorLight.desc": "Usada no texto e nos ícones.",
  "settings.item.bgColorDark.name": "Cor de fundo (Modo escuro)",
  "settings.item.bgColorDark.desc": "Usada nas postagens e na caixa de texto.",
  "settings.item.textColorDark.name": "Cor do texto (Modo escuro)",
  "settings.item.textColorDark.desc": "Usada no texto e nos ícones.",

  "settings.item.submitLabel.name": "Texto do botão de postagem",
  "settings.item.submitLabel.desc": "Deixe em branco para exibir apenas o ícone (caso um esteja definido).",
  "settings.item.submitIcon.name": "Ícone do botão de postagem",
  "settings.item.submitIcon.desc": "Copie o nome do ícone {linkOpen}aqui{linkClose}. \nDeixe em branco para ocultar.",
  "settings.item.updateLabel.name": "Texto do botão de atualização",
  "settings.item.updateLabel.desc": "Exibido durante a edição de uma postagem. \nDeixe em branco para exibir apenas o ícone (caso um esteja definido).",
  "settings.item.updateIcon.name": "Ícone do botão de atualização",
  "settings.item.updateIcon.desc": "Copie o nome do ícone {linkOpen}aqui{linkClose}. \nDeixe em branco para usar o mesmo ícone do botão de postagem.",
  "settings.item.submitGradient.name": "Gradiente do formulário de postagem",
  "settings.item.submitGradient.desc": "Se ativado, aplica um gradiente no destaque do formulário de postagem.",
  "settings.item.submitGradientMode.name": "Brilho do gradiente",
  "settings.item.submitGradientMode.desc": "No automático, muda conforme a luminosidade da cor de destaque.",
  "settings.option.submitGradientMode.auto": "Automático",
  "settings.option.submitGradientMode.light": "Mais claro",
  "settings.option.submitGradientMode.dark": "Mais escuro",
  "settings.item.inputPlaceholder.name": "Texto de espaço reservado",
  "settings.item.inputPlaceholder.desc": "Deixe em branco para ocultar.",

  "settings.item.tagSuggest.name": "Sugestão automática de tags",
  "settings.item.tagSuggest.desc": "Exibe sugestões ao digitar após o caractere #. \nSe desativado, o histórico de tags salvas também será limpo.",

  "settings.item.pinLimit.name": "Limite de itens fixados",
  "settings.item.pinLimit.desc": "«Fixar» e «Fixar mais tarde» possuem limites individuais.\nAo reduzir o limite, as postagens excedentes serão desafixadas.",
  "settings.option.pinLimit.1": "1 item",
  "settings.option.pinLimit.3": "3 itens",
  "settings.option.pinLimit.5": "5 itens",
  "settings.item.pinFixed.name": "Manter fixados no topo",
  "settings.item.pinFixed.desc": "Se desativado, os itens fixados rolarão junto com a linha do tempo.",

  "settings.item.ogp.name": "Pré-visualização de URLs",
  "settings.item.ogp.desc": "Carrega informações de pré-visualização de links (OGP). \nSe desativado, não fará nenhuma conexão externa.",

  "settings.item.checkStrikethrough.name": "Tachar itens concluídos",
  "settings.item.checkStrikethrough.desc": "Se desativado, os itens marcados não serão riscados.",

  "settings.item.calendarDayShape.name": "Formato dos botões de data",
  "settings.item.calendarDayShape.desc": "Aplica-se aos dias exibidos no calendário.",
  "settings.option.calendarDayShape.circle": "Circular",
  "settings.option.calendarDayShape.rounded": "Arredondado",
  "settings.option.calendarDayShape.square": "Quadrado",

  "settings.item.showCalendarButton.name": "Exibir botão do calendário",
  "settings.item.showCalendarButton.desc": "Se ativado, permite navegar para qualquer data pela barra de navegação.",

  "settings.item.showPostDelete.name": "Exibir botão Excluir",
  "settings.item.showPostDelete.desc": "Se ativado, adiciona a opção de exclusão ao menu de cada postagem. \nPostagens excluídas não podem ser recuperadas. Imagens anexadas não serão apagadas.",

  "settings.item.useCustomAttachmentFolder.name": "Pasta personalizada para imagens",
  "settings.item.useCustomAttachmentFolder.desc": "Aplica-se apenas às imagens adicionadas pelo Wrot.",

  "settings.item.attachmentFolder.name": "Pasta de destino",
  "settings.item.attachmentFolder.desc": "Se a pasta não for encontrada, será usada a configuração padrão do Obsidian.",
  "settings.item.attachmentFolder.placeholder": "Selecione uma pasta",
  "settings.item.shrinkImages.name": "Comprimir imagens",
  "settings.item.shrinkImages.desc": "Comprime as imagens anexadas e remove metadados (como localização) antes de salvar. \nImagens em GIF não serão alteradas.",
  "settings.item.postHeading.name": "Título da seção no modelo",
  "settings.item.postHeading.desc": "As postagens serão inseridas logo abaixo do título escolhido.",
  "settings.option.postHeading.none": "Nenhum",

  "settings.item.tagColorRules.name": "Usar regras por tag",
  "settings.item.tagColorRules.desc": "Permite personalizar cor, integração e outras opções por tag. \nPara a cor, terá prioridade a primeira tag que aparecer na postagem.",

  "settings.tagRule.label": "Regra {n}",
  "settings.tagRule.tag.name": "Tag",
  "settings.tagRule.tag.desc": "O caractere # é opcional.",
  "settings.tagRule.tag.placeholder": "Nome da tag",
  "settings.tagRule.bg.name": "Cor de fundo",
  "settings.tagRule.bg.desc": "Cor de fundo do card da postagem.",
  "settings.tagRule.fg.name": "Cor do texto",
  "settings.tagRule.fg.desc": "Tags e links utilizarão a cor de destaque.",
  "settings.tagRule.accent.name": "Cor de destaque",
  "settings.tagRule.accent.desc": "Se não for definida, será usada a cor de destaque do tema.",
  "settings.tagRule.sub.name": "Cor secundária",
  "settings.tagRule.sub.desc": "Cor usada em horários, marcadores de lista, etc. \nSe não for definida, será calculada automaticamente.",
  "settings.tagRule.scope.buttons.name":
    "Aplicar cor secundária a horários, menus e pins",
  "settings.tagRule.scope.buttons.desc":
    "Se desativado, usará a cor calculada automaticamente.",
  "settings.tagRule.scope.quote.name": "Aplicar cor secundária a citações",
  "settings.tagRule.scope.quote.desc": "Se desativado, usará a cor calculada automaticamente.",
  "settings.tagRule.scope.list.name": "Aplicar cor secundária a listas e caixas de seleção",
  "settings.tagRule.scope.list.desc": "Se desativado, usará a cor calculada automaticamente.",
  "settings.tagRule.scope.ogp.name": "Aplicar cor secundária a cartões OGP",
  "settings.tagRule.scope.ogp.desc": "Se desativado, usará a cor calculada automaticamente.",
  "settings.item.graphTags.name": "Integração de tags no Obsidian",
  "settings.item.graphTags.desc": "Inclui as tags na visualização em grafo e na busca global por tag:. \nSe desativado, as tags funcionarão apenas no Wrot.",
  "settings.tagRule.noIntegration.name": "Excluir da integração de tags",
  "settings.tagRule.noIntegration.desc": "Se ativado, esta tag será reconhecida apenas dentro do Wrot.",
  "settings.tagRule.hideTimeline.name": "Ocultar da linha do tempo",
  "settings.tagRule.hideTimeline.desc": "Se ativado, postagens com esta tag não serão exibidas na linha do tempo. \nElas permanecem na nota diária.",
  "settings.tagRule.protectDelete.name": "Proteger contra exclusão",
  "settings.tagRule.protectDelete.desc": "Se ativado, postagens com esta tag não poderão ser excluídas.",
  "settings.tagRule.button.add": "Adicionar regra",
  "settings.item.toolbarEdit.name": "Exibir botão para editar barra de ferramentas",
  "settings.item.toolbarEdit.desc": "Se ativado, adiciona ao menu da barra de ferramentas uma opção para personalizá-la.",
  "settings.item.resetToolbar.name": "Redefinir barra de ferramentas",
  "settings.item.resetToolbar.desc": "Restaura a ordem e a visibilidade dos botões para o padrão inicial.",
  "settings.item.resetToolbar.button": "Redefinir",
  // Shown on the same row after the first press, in place of the label above.
  "settings.item.resetToolbar.confirm": "Pressione novamente para confirmar",

  "view.toolbarAction.image": "Imagem",
  "view.toolbarAction.embed": "Incorporar",
  "view.toolbarAction.bold": "Negrito",
  "view.toolbarAction.italic": "Itálico",
  "view.toolbarAction.list": "Lista com marcadores",
  "view.toolbarAction.check": "Lista de tarefas",
  "view.toolbarAction.ol": "Lista numerada",
  "view.toolbarAction.more": "Mais opções",
  "view.toolbarEdit.done": "Concluir",
  "view.toolbarEdit.cancel": "Cancelar edição",

  "view.formatMenu.editToolbar": "Editar barra de ferramentas",
  "view.formatMenu.code": "Código",
  "view.formatMenu.math": "Fórmula",
  "view.formatMenu.quote": "Citação",
  "view.formatMenu.link": "Link",
  "view.formatMenu.strikethrough": "Tachado",
  "view.formatMenu.highlight": "Destaque",
  "view.formatMenu.settings": "Configurações",

  "view.postMenu.copy": "Copiar",
  "view.postMenu.quotePost": "Citar postagem",
  "view.postMenu.edit": "Editar",
  "view.postMenu.cancelEdit": "Cancelar edição",
  "view.postMenu.unpin": "Desafixar",
  "view.postMenu.pin": "Fixar",
  "view.postMenu.pinLimitHint": "O limite é de {limit} postagens fixadas.",
  "view.postMenu.schedulePin": "Fixar mais tarde",
  "view.postMenu.delete": "Excluir",
  // Shown on the same row after the first press, in place of the label above.
  "view.postMenu.deleteConfirm": "Pressione novamente para confirmar",

  "view.dateNav.today": "Hoje",
  "view.dateNav.todaySuffix": " (Hoje)",

  "view.empty.noMemos": "Nenhuma postagem encontrada",
  "view.notice.saveFailed": "Erro ao salvar a postagem: {error}",
  "view.notice.postHeadingMissing": "O título especificado não foi encontrado nesta nota. A postagem foi adicionada ao final.",
  "view.notice.postHeadingNoTemplate": "O modelo de nota diária não foi encontrado; a opção de título foi redefinida para “Nenhum”.",
  "view.notice.searchPluginNotFound": "O plugin principal de busca não está ativado.",

  "view.image.removeAria": "Remover imagem",

  // Placeholder body of a quote card whose original post is gone.
  "quote.card.notFound": "(Postagem original não encontrada)",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "MMMM [de] YYYY",

  "defaults.headerDateFormat": "D [de] MMMM [de] YYYY",

  "defaults.timestampFormat": "DD/MM/YYYY HH:mm:ss",
  "defaults.submitLabel": "Postar",
  "defaults.updateLabel": "Atualizar",
  "defaults.inputPlaceholder": "Escreva algo aqui...",
} satisfies Translations;

export default pt;
