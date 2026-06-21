import type { Translations } from "./ja";

// Portuguese translations. Translated via Nani.
const pt = {
  "settings.section.basic": "Configurações básicas",
  "settings.section.display": "Configurações de exibição",
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
    "Define o formato da data na navegação (Ex: YYYY, MM, DD). Deixe em branco para usar o padrão.",

  "settings.item.timestampFormat.name": "Formato do carimbo de data/hora",
  "settings.item.timestampFormat.desc":
    "Define o formato de data e hora das postagens (Ex: YYYY, MM, DD, HH, mm, ss).",

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
  "settings.item.submitLabel.desc": "Altera o texto exibido no botão de postagem.",
  "settings.item.submitIcon.name": "Ícone do botão de postagem",
  "settings.item.submitIcon.desc":
    "Altera o ícone do botão. Copie o nome do ícone de {linkOpen}aqui{linkClose}. Deixe em branco para ocultar.",
  "settings.item.inputPlaceholder.name":
    "Mensagem de campo vazio no formulário",
  "settings.item.inputPlaceholder.desc":
    "Texto exibido quando o campo de postagem está vazio. Deixe em branco para ocultar.",

  "settings.item.pinLimit.name": "Limite de fixação",
  "settings.item.pinLimit.desc":
    "Define o número máximo de notas que podem ser fixadas na linha do tempo.",
  "settings.option.pinLimit.1": "1 item",
  "settings.option.pinLimit.3": "3 itens",
  "settings.option.pinLimit.5": "5 itens",

  "settings.item.zenModePins.name": "Publicações fixadas no Modo Zen",
  "settings.item.zenModePins.desc": "Escolha se deseja exibir publicações fixadas enquanto o Modo Zen está ativo.",
  "settings.option.zenModePins.hide": "Ocultar",
  "settings.option.zenModePins.show": "Exibir",

  "settings.item.ogp.name": "Visualização de URL",
  "settings.item.ogp.desc":
    "Exibe automaticamente informações de OGP para URLs. Se desativado, não realizará comunicações externas.",

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
    "Exibe um ícone de calendário na barra de navegação. Toque para selecionar e ir direto para qualquer data.",

  "settings.item.tagColorRules.name": "Mudar cor por tag",
  "settings.item.tagColorRules.desc":
    "Altera as cores de postagens que contêm tags específicas. Se houver múltiplas tags, a primeira que aparecer terá prioridade.",

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
    "Define a cor de tags, links e ícones. Se vazio, usa o destaque padrão do tema.",
  "settings.tagRule.sub.name": "Cor secundária",
  "settings.tagRule.sub.desc":
    "Define a cor de elementos como carimbos de hora e ícones. Se vazio, é calculado automaticamente.",
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
  "settings.tagRule.button.add": "Adicionar regra",

  "settings.tooltip.resetDefault": "Restaurar valores padrão",
  "settings.tooltip.deleteRule": "Excluir regra",
  "settings.tooltip.lock": "Bloquear",
  "settings.tooltip.unlock": "Desbloquear para editar",

  "view.formatMenu.code": "Código",
  "view.formatMenu.math": "Fórmula",
  "view.formatMenu.quote": "Citação",
  "view.formatMenu.link": "Link",
  "view.formatMenu.strikethrough": "Tachado",
  "view.formatMenu.highlight": "Destaque",
  "view.formatMenu.settings": "Configurações",
  "view.formatMenu.zenMode": "Modo Zen",

  "view.postMenu.copy": "Copiar",
  "view.postMenu.quotePost": "Citar postagem",
  "view.postMenu.unpin": "Desafixar",
  "view.postMenu.pin": "Fixar",
  "view.postMenu.pinLimitHint": "O limite é de {limit} itens fixados.",

  "view.dateNav.today": "Hoje",
  "view.dateNav.todaySuffix": " (Hoje)",

  "view.empty.noMemos": "Não há notas",
  "view.notice.saveFailed": "Falha ao salvar a nota: {error}",
  "view.notice.searchPluginNotFound": "Plugin de busca não encontrado",

  "view.image.removeAria": "Excluir imagem",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "MMMM [de] YYYY",

  "defaults.headerDateFormat": "D [de] MMMM [de] YYYY",
  "defaults.submitLabel": "Postar",
  "defaults.inputPlaceholder": "Escreva algo aqui...",
} satisfies Translations;

export default pt;
