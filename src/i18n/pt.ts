import type { Translations } from "./ja";

// Portuguese translations. Translated via Nani.
const pt = {
  "settings.section.basic": "Configurações básicas",
  "settings.section.advanced": "Configurações avançadas",
  "settings.section.tagrules": "Regras por tag",

  "settings.item.viewPlacement.name": "Posição de exibição",
  "settings.item.viewPlacement.desc":
    "Escolha onde o painel do Wrot será exibido.",
  "settings.option.viewPlacement.left": "Barra lateral esquerda",
  "settings.option.viewPlacement.right": "Barra lateral direita",
  "settings.option.viewPlacement.main": "Área principal",

  "settings.item.followFontSize.name": "Seguir tamanho da fonte do Obsidian",
  "settings.item.followFontSize.desc":
    "Ajusta o tamanho do texto do Wrot de acordo com as configurações de aparência do Obsidian.",

  "settings.item.headerDateFormat.name": "Formato de data no cabeçalho",
  "settings.item.headerDateFormat.desc":
    "Define o formato da data na navegação (Ex: YYYY, MM, DD). \nDeixe em branco para usar o padrão.",

  "settings.item.timestampFormat.name": "Formato do carimbo de data/hora",
  "settings.item.timestampFormat.desc":
    "Define o formato de data e hora das postagens \n(Ex: YYYY, MM, DD, HH, mm, ss).",

  "settings.item.bgColorLight.name": "Cor de fundo (Modo claro)",
  "settings.item.bgColorLight.desc":
    "Define a cor de fundo das postagens e do formulário no tema claro.",
  "settings.item.textColorLight.name": "Cor do texto (Modo claro)",
  "settings.item.textColorLight.desc":
    "Define a cor do texto e dos ícones no tema claro.",
  "settings.item.bgColorDark.name": "Cor de fundo (Modo escuro)",
  "settings.item.bgColorDark.desc":
    "Define a cor de fundo das postagens e do formulário no tema escuro.",
  "settings.item.textColorDark.name": "Cor do texto (Modo escuro)",
  "settings.item.textColorDark.desc":
    "Define a cor do texto e dos ícones no tema escuro.",

  "settings.item.submitLabel.name": "Texto do botão de postagem",
  "settings.item.submitLabel.desc": "Altera o texto exibido no botão de postagem. \nDeixe em branco para um botão somente com ícone (apenas se houver um definido).",
  "settings.item.submitIcon.name": "Ícone do botão de postagem",
  "settings.item.submitIcon.desc":
    "Muda o ícone do botão de publicar. \nCopie um nome de ícone {linkOpen}aqui{linkClose}. \nDeixe vazio para ocultar.",
  "settings.item.updateLabel.name": "Texto do botão de atualizar",
  "settings.item.updateLabel.desc":
    "Altera o texto exibido no botão de postagem enquanto edita uma postagem. \nDeixe em branco para um botão somente com ícone (apenas se houver um definido).",
  "settings.item.updateIcon.name": "Ícone do botão de atualizar",
  "settings.item.updateIcon.desc":
    "Muda o ícone exibido enquanto edita uma postagem. \nCopie um nome de ícone {linkOpen}aqui{linkClose}. \nDeixe vazio para usar o ícone do botão de postagem.",
  "settings.item.inputPlaceholder.name":
    "Mensagem de campo vazio no formulário",
  "settings.item.inputPlaceholder.desc":
    "Texto exibido quando o campo de postagem está vazio. \nDeixe em branco para ocultar.",

  "settings.item.tagSuggest.name": "Autocompletar de tags",
  "settings.item.tagSuggest.desc":
    "Digitar # sugere tags já usadas. Desativar apaga as tags memorizadas.",

  "settings.item.pinLimit.name": "Limite de fixação",
  "settings.item.pinLimit.desc":
    "Define o número máximo de notas que podem ser fixadas na linha do tempo.",
  "settings.option.pinLimit.1": "1 item",
  "settings.option.pinLimit.3": "3 itens",
  "settings.option.pinLimit.5": "5 itens",

  "settings.item.ogp.name": "Visualização de URL",
  "settings.item.ogp.desc":
    "Exibe automaticamente informações de OGP para URLs. \nSe desativado, não realizará comunicações externas.",

  "settings.item.checkStrikethrough.name": "Tachado em itens marcados",
  "settings.item.checkStrikethrough.desc":
    "Exibe uma linha de tachado em itens com a caixa de seleção marcada.",

  "settings.item.calendarDayShape.name": "Forma dos botões de data",
  "settings.item.calendarDayShape.desc": "Selecione a forma dos botões de data no calendário.",
  "settings.option.calendarDayShape.circle": "Círculo",
  "settings.option.calendarDayShape.rounded": "Arredondado",
  "settings.option.calendarDayShape.square": "Quadrado",

  "settings.item.showCalendarButton.name": "Mostrar botão de calendário",
  "settings.item.showCalendarButton.desc":
    "Exibe um ícone de calendário na barra de navegação. \nToque para selecionar e ir direto para qualquer data.",

  "settings.item.showPostDelete.name": "Mostrar botão Excluir",
  "settings.item.showPostDelete.desc":
    "Adiciona o botão «Excluir» ao menu do memo. \nUm memo excluído não pode ser recuperado. \nAs imagens do memo não são excluídas.",

  "settings.item.tagColorRules.name": "Usar regras por tag",
  "settings.item.tagColorRules.desc":
    "Define cores e integração por tag. Nas cores, vence a tag que aparece primeiro no texto.",

  "settings.tagRule.label": "Regra {n}",
  "settings.tagRule.tag.name": "Tag",
  "settings.tagRule.tag.desc": "Insira o nome da tag (o símbolo # é opcional).",
  "settings.tagRule.tag.placeholder": "Nome da tag",
  "settings.tagRule.bg.name": "Cor de fundo",
  "settings.tagRule.bg.desc":
    "Define a cor de fundo para postagens com esta tag.",
  "settings.tagRule.fg.name": "Cor do texto",
  "settings.tagRule.fg.desc":
    "Define a cor do corpo do texto. (Tags e links usam a cor de destaque)",
  "settings.tagRule.accent.name": "Cor de destaque",
  "settings.tagRule.accent.desc":
    "Cor para tags, links e URLs. Se não definida, usa a cor de destaque do tema.",
  "settings.tagRule.sub.name": "Cor secundária",
  "settings.tagRule.sub.desc":
    "Cor de elementos secundários como carimbos de data e marcadores de lista. \nCalculada automaticamente se não definida.",
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
  "settings.item.graphTags.desc":
    "Faz as tags dos memos contarem no grafo e na busca tag:. \nSe desativado, ficam apenas dentro do Wrot.",
  "settings.tagRule.noIntegration.name": "Excluir da integração de tags",
  "settings.tagRule.noIntegration.desc": "Se ativado, a tag desta regra escrita dentro dos memos fica fora da integração de tags \ne permanece apenas dentro do Wrot.",
  "settings.tagRule.hideTimeline.name": "Ocultar na linha do tempo",
  "settings.tagRule.hideTimeline.desc":
    "Se ativado, memos com esta tag deixam de aparecer na linha do tempo. Permanecem na nota diária.",
  "settings.tagRule.protectDelete.name": "Desativar o botão Excluir",
  "settings.tagRule.protectDelete.desc":
    "Desativa o botão «Excluir» nos memos que têm esta tag.",
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
