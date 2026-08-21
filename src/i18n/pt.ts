import type { Translations } from "./ja";

// Portuguese translations. Translated via Nani.
const pt = {
  "settings.section.basic": "Configurações básicas",
  "settings.section.advanced": "Configurações avançadas",
  "settings.section.tagrules": "Regras por tag",

  "settings.item.viewPlacement.name": "Posição de exibição",
  "settings.item.viewPlacement.desc": "Aplica-se na próxima vez que o Wrot for aberto.",
  "settings.option.viewPlacement.left": "Barra lateral esquerda",
  "settings.option.viewPlacement.right": "Barra lateral direita",
  "settings.option.viewPlacement.main": "Área principal",

  "settings.item.followFontSize.name": "Seguir tamanho da fonte do Obsidian",
  "settings.item.followFontSize.desc": "Se ativado, usa o tamanho da fonte das configurações de aparência do Obsidian.",

  "settings.item.headerDateFormat.name": "Formato de data no cabeçalho",
  "settings.item.headerDateFormat.desc": "Ex: YYYY, MM, DD. \nDeixe em branco para usar o padrão.",

  "settings.item.timestampFormat.name": "Formato do carimbo de data/hora",
  "settings.item.timestampFormat.desc": "Ex: YYYY, MM, DD, HH, mm, ss.",

  "settings.item.bgColorLight.name": "Cor de fundo (Modo claro)",
  "settings.item.bgColorLight.desc": "Usado nas postagens e no campo de postagem.",
  "settings.item.textColorLight.name": "Cor do texto (Modo claro)",
  "settings.item.textColorLight.desc": "Usado no texto e nos ícones.",
  "settings.item.bgColorDark.name": "Cor de fundo (Modo escuro)",
  "settings.item.bgColorDark.desc": "Usado nas postagens e no campo de postagem.",
  "settings.item.textColorDark.name": "Cor do texto (Modo escuro)",
  "settings.item.textColorDark.desc": "Usado no texto e nos ícones.",

  "settings.item.submitLabel.name": "Texto do botão de postagem",
  "settings.item.submitLabel.desc": "Deixe em branco para um botão somente com ícone (apenas se houver um definido).",
  "settings.item.submitIcon.name": "Ícone do botão de postagem",
  "settings.item.submitIcon.desc": "Copie um nome de ícone {linkOpen}aqui{linkClose}. \nDeixe vazio para ocultar.",
  "settings.item.updateLabel.name": "Texto do botão de atualizar",
  "settings.item.updateLabel.desc": "Usado enquanto edita uma postagem. \nDeixe em branco para um botão somente com ícone (apenas se houver um definido).",
  "settings.item.updateIcon.name": "Ícone do botão de atualizar",
  "settings.item.updateIcon.desc": "Copie um nome de ícone {linkOpen}aqui{linkClose}. \nDeixe vazio para usar o ícone do botão de postagem.",
  "settings.item.inputPlaceholder.name":
    "Mensagem de campo vazio no formulário",
  "settings.item.inputPlaceholder.desc": "Deixe em branco para ocultar.",

  "settings.item.tagSuggest.name": "Autocompletar de tags",
  "settings.item.tagSuggest.desc": "Ao digitar após #, aparecem sugestões. \nAo desativar, as memorizadas também são apagadas.",

  "settings.item.pinLimit.name": "Limite de fixação",
  "settings.item.pinLimit.desc": "Ao reduzir o limite, os fixados em excesso são soltos.",
  "settings.option.pinLimit.1": "1 item",
  "settings.option.pinLimit.3": "3 itens",
  "settings.option.pinLimit.5": "5 itens",

  "settings.item.ogp.name": "Visualização de URL",
  "settings.item.ogp.desc": "Busca informações de pré-visualização das URLs. \nDesativado, não há nenhuma conexão externa.",

  "settings.item.checkStrikethrough.name": "Tachado em itens marcados",
  "settings.item.checkStrikethrough.desc": "Desativado, o texto permanece igual.",

  "settings.item.calendarDayShape.name": "Forma dos botões de data",
  "settings.item.calendarDayShape.desc": "Aplica-se aos dias do calendário.",
  "settings.option.calendarDayShape.circle": "Círculo",
  "settings.option.calendarDayShape.rounded": "Arredondado",
  "settings.option.calendarDayShape.square": "Quadrado",

  "settings.item.showCalendarButton.name": "Mostrar botão de calendário",
  "settings.item.showCalendarButton.desc": "Se ativado, você pode ir para qualquer data pela barra de navegação.",

  "settings.item.showPostDelete.name": "Mostrar botão Excluir",
  "settings.item.showPostDelete.desc": "Se ativado, um botão de exclusão é adicionado ao menu do memo. \nUm memo excluído não pode ser recuperado. As imagens anexadas não são excluídas.",

  "settings.item.useCustomAttachmentFolder.name": "Especificar a pasta de imagens",
  "settings.item.useCustomAttachmentFolder.desc": "Vale apenas para as imagens adicionadas pelo Wrot.",

  "settings.item.attachmentFolder.name": "Pasta de destino",
  "settings.item.attachmentFolder.desc": "Se a pasta não existir, a configuração do Obsidian é usada.",
  "settings.item.attachmentFolder.placeholder": "Selecione uma pasta",

  "settings.item.tagColorRules.name": "Usar regras por tag",
  "settings.item.tagColorRules.desc": "Permite mudar a cor, a integração de tags e mais, por tag. \nNa cor, vale a tag que aparece primeiro no texto.",

  "settings.tagRule.label": "Regra {n}",
  "settings.tagRule.tag.name": "Tag",
  "settings.tagRule.tag.desc": "O símbolo # é opcional.",
  "settings.tagRule.tag.placeholder": "Nome da tag",
  "settings.tagRule.bg.name": "Cor de fundo",
  "settings.tagRule.bg.desc": "Usado no fundo da postagem.",
  "settings.tagRule.fg.name": "Cor do texto",
  "settings.tagRule.fg.desc": "Tags e links usam a cor de destaque.",
  "settings.tagRule.accent.name": "Cor de destaque",
  "settings.tagRule.accent.desc": "Se não definida, usa a cor de destaque do tema.",
  "settings.tagRule.sub.name": "Cor secundária",
  "settings.tagRule.sub.desc": "A cor dos horários, marcadores de lista e afins. \nSe não definida, é calculada automaticamente.",
  "settings.tagRule.scope.buttons.name":
    "Aplicar cor secundária a botões e pin",
  "settings.tagRule.scope.buttons.desc":
    "Se desativado, usará a cor automática.",
  "settings.tagRule.scope.quote.name": "Aplicar cor secundária a citações",
  "settings.tagRule.scope.quote.desc": "Se desativado, usará a cor automática.",
  "settings.tagRule.scope.list.name": "Aplicar cor secundária a listas",
  "settings.tagRule.scope.list.desc": "Se desativado, usará a cor automática.",
  "settings.tagRule.scope.ogp.name": "Aplicar cor secundária a cartões OGP",
  "settings.tagRule.scope.ogp.desc": "Se desativado, usará a cor automática.",
  "settings.item.graphTags.name": "Integração de tags",
  "settings.item.graphTags.desc": "As tags entram na visualização em grafo e na busca tag:. \nDesativado, ficam apenas dentro do Wrot.",
  "settings.tagRule.noIntegration.name": "Excluir da integração de tags",
  "settings.tagRule.noIntegration.desc": "Se ativado, esta tag fica apenas dentro do Wrot.",
  "settings.tagRule.hideTimeline.name": "Ocultar na linha do tempo",
  "settings.tagRule.hideTimeline.desc": "Se ativado, memos com esta tag deixam de aparecer na linha do tempo. \nPermanecem na nota diária.",
  "settings.tagRule.protectDelete.name": "Desativar o botão Excluir",
  "settings.tagRule.protectDelete.desc": "Se ativado, memos com esta tag não podem ser excluídos.",
  "settings.tagRule.button.add": "Adicionar regra",

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
  "view.postMenu.pinLimitHint": "O limite é de {limit} itens fixados.",
  "view.postMenu.delete": "Excluir",
  // Shown on the same row after the first press, in place of the label above.
  "view.postMenu.deleteConfirm": "Pressione de novo para excluir",

  "view.dateNav.today": "Hoje",
  "view.dateNav.todaySuffix": " (Hoje)",

  "view.empty.noMemos": "Não há notas para mostrar",
  "view.notice.saveFailed": "Falha ao salvar a nota: {error}",
  "view.notice.searchPluginNotFound": "Plugin de busca não encontrado",

  "view.image.removeAria": "Excluir imagem",

  // Placeholder body of a quote card whose original post is gone.
  "quote.card.notFound": "(Memo original não encontrado)",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "MMMM [de] YYYY",

  "defaults.headerDateFormat": "D [de] MMMM [de] YYYY",
  "defaults.submitLabel": "Postar",
  "defaults.updateLabel": "Atualizar",
  "defaults.inputPlaceholder": "Escreva algo aqui...",
} satisfies Translations;

export default pt;
