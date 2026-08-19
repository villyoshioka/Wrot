import type { Translations } from "./ja";

// Russian translations. Translated via Nani.
const ru = {
  "settings.section.basic": "Основные настройки",
  "settings.section.advanced": "Расширенные настройки",
  "settings.section.tagrules": "Настройки правил по тегам",

  "settings.item.viewPlacement.name": "Позиция отображения",
  "settings.item.viewPlacement.desc": "Выберите положение панели Wrot.",
  "settings.option.viewPlacement.left": "Левая боковая панель",
  "settings.option.viewPlacement.right": "Правая боковая панель",
  "settings.option.viewPlacement.main": "Основная область",

  "settings.item.followFontSize.name": "Использовать размер шрифта Obsidian",
  "settings.item.followFontSize.desc":
    "Подстраивает размер текста Wrot под настройки внешнего вида Obsidian.",

  "settings.item.headerDateFormat.name": "Формат даты в заголовке",
  "settings.item.headerDateFormat.desc":
    "Укажите формат даты для навигации. (Можно использовать YYYY, MM, DD и т. д.) \nОставьте пустым, чтобы вернуть значение по умолчанию.",

  "settings.item.timestampFormat.name": "Формат временной метки",
  "settings.item.timestampFormat.desc":
    "Укажите формат даты и времени для записей. \n(Например: YYYY, MM, DD, HH, mm, ss)",

  "settings.item.bgColorLight.name": "Цвет фона (Светлая тема)",
  "settings.item.bgColorLight.desc":
    "Цвет фона для записей и поля ввода в светлой теме.",
  "settings.item.textColorLight.name": "Цвет текста (Светлая тема)",
  "settings.item.textColorLight.desc": "Цвет текста и иконок в светлой теме.",
  "settings.item.bgColorDark.name": "Цвет фона (Темная тема)",
  "settings.item.bgColorDark.desc":
    "Цвет фона для записей и поля ввода в темной теме.",
  "settings.item.textColorDark.name": "Цвет текста (Темная тема)",
  "settings.item.textColorDark.desc": "Цвет текста и иконок в темной теме.",

  "settings.item.submitLabel.name": "Текст кнопки поста",
  "settings.item.submitLabel.desc":
    "Вы можете изменить текст, отображаемый на кнопке поста. \nОставьте пустым для кнопки только с иконкой (только если иконка задана).",
  "settings.item.submitIcon.name": "Иконка кнопки поста",
  "settings.item.submitIcon.desc":
    "Меняет значок кнопки публикации. \nНазвание значка скопируйте {linkOpen}здесь{linkClose}. \nПустое поле скрывает значок.",
  "settings.item.updateLabel.name": "Текст кнопки обновления",
  "settings.item.updateLabel.desc":
    "Вы можете изменить текст, отображаемый на кнопке поста во время редактирования записи. \nОставьте пустым для кнопки только с иконкой (только если иконка задана).",
  "settings.item.updateIcon.name": "Иконка кнопки обновления",
  "settings.item.updateIcon.desc":
    "Меняет значок, отображаемый во время редактирования записи. \nНазвание значка скопируйте {linkOpen}здесь{linkClose}. \nОставьте пустым, чтобы использовать значок кнопки поста.",
  "settings.item.inputPlaceholder.name": "Подсказка в пустом поле",
  "settings.item.inputPlaceholder.desc":
    "Текст, отображаемый в пустом поле ввода. \nОставьте поле пустым, чтобы скрыть подсказку.",

  "settings.item.tagSuggest.name": "Автодополнение тегов",
  "settings.item.tagSuggest.desc":
    "После # предлагаются ранее использованные теги. При выключении сохранённые теги удаляются.",

  "settings.item.pinLimit.name": "Лимит закрепления",
  "settings.item.pinLimit.desc":
    "Максимальное количество заметок, которые можно закрепить в ленте.",
  "settings.option.pinLimit.1": "1 запись",
  "settings.option.pinLimit.3": "3 записи",
  "settings.option.pinLimit.5": "5 записей",

  "settings.item.ogp.name": "Предпросмотр URL",
  "settings.item.ogp.desc":
    "Автоматическое получение OGP-информации из ссылок. \nЕсли выключено, внешние соединения не выполняются.",

  "settings.item.checkStrikethrough.name": "Зачеркивание выполненных пунктов",
  "settings.item.checkStrikethrough.desc":
    "Отображать зачеркивание для пунктов с отмеченными чекбоксами.",

  "settings.item.calendarDayShape.name": "Форма кнопок дня",
  "settings.item.calendarDayShape.desc": "Выберите форму кнопок дней в календаре.",
  "settings.option.calendarDayShape.circle": "Круг",
  "settings.option.calendarDayShape.rounded": "Скруглённый",
  "settings.option.calendarDayShape.square": "Квадрат",

  "settings.item.showCalendarButton.name": "Кнопка календаря",
  "settings.item.showCalendarButton.desc":
    "Отображать кнопку календаря в панели навигации. \nНажмите, чтобы быстро перейти к нужной дате.",

  "settings.item.showPostDelete.name": "Кнопка удаления",
  "settings.item.showPostDelete.desc":
    "Добавляет кнопку «Удалить» в меню записи. \nУдалённую запись нельзя восстановить. \nИзображения из записи не удаляются.",

  "settings.item.useCustomAttachmentFolder.name": "Папка для изображений",
  "settings.item.useCustomAttachmentFolder.desc":
    "Сохраняет изображения, добавленные из Wrot, в выбранную папку, \nнезависимо от настройки вложений Obsidian.",

  "settings.item.attachmentFolder.name": "Папка назначения",
  "settings.item.attachmentFolder.desc":
    "Выберите папку для сохранения изображений. \nЕсли папки нет, используется настройка вложений Obsidian.",
  "settings.item.attachmentFolder.placeholder": "Выберите папку",

  "settings.item.tagColorRules.name": "Правила для тегов",
  "settings.item.tagColorRules.desc":
    "Настройка цвета и интеграции для каждого тега. В цветах побеждает тег, идущий в тексте первым.",

  "settings.tagRule.label": "Правило {n}",
  "settings.tagRule.tag.name": "Тег",
  "settings.tagRule.tag.desc":
    "Введите тег для применения правила (символ # можно опустить).",
  "settings.tagRule.tag.placeholder": "Название тега",
  "settings.tagRule.bg.name": "Цвет фона",
  "settings.tagRule.bg.desc": "Цвет фона для записей с этим тегом.",
  "settings.tagRule.fg.name": "Цвет текста",
  "settings.tagRule.fg.desc":
    "Цвет основного текста (для тегов и ссылок используется акцентный цвет).",
  "settings.tagRule.accent.name": "Акцентный цвет",
  "settings.tagRule.accent.desc":
    "Цвет тегов, ссылок и URL. Если не задан, используется акцентный цвет темы.",
  "settings.tagRule.sub.name": "Дополнительный цвет",
  "settings.tagRule.sub.desc":
    "Цвет вспомогательных элементов: отметок времени, маркеров списка. \nЕсли не задан, вычисляется автоматически.",
  "settings.tagRule.scope.buttons.name": "Применять доп. цвет к метаданным",
  "settings.tagRule.scope.buttons.desc":
    "Временные метки, меню и кнопки закрепления.",
  "settings.tagRule.scope.quote.name": "Применять доп. цвет к цитатам",
  "settings.tagRule.scope.quote.desc": "Линии и фон цитат.",
  "settings.tagRule.scope.list.name": "Применять доп. цвет к спискам",
  "settings.tagRule.scope.list.desc": "Маркеры списков и чекбоксы.",
  "settings.tagRule.scope.ogp.name": "Применять доп. цвет к карточкам OGP",
  "settings.tagRule.scope.ogp.desc": "Рамки и фон предпросмотра ссылок.",
  "settings.item.graphTags.name": "Интеграция тегов",
  "settings.item.graphTags.desc":
    "Учитывает теги заметок в графе и поиске tag:. \nЕсли выключено, теги остаются только внутри Wrot.",
  "settings.tagRule.noIntegration.name": "Исключить из интеграции тегов",
  "settings.tagRule.noIntegration.desc": "Если включено, тег этого правила, написанный в заметках, исключается из интеграции тегов \nи остаётся только внутри Wrot.",
  "settings.tagRule.hideTimeline.name": "Скрыть в ленте",
  "settings.tagRule.hideTimeline.desc":
    "Если включено, заметки с этим тегом не отображаются в ленте. В ежедневной заметке они остаются.",
  "settings.tagRule.protectDelete.name": "Отключить кнопку удаления",
  "settings.tagRule.protectDelete.desc":
    "Отключает кнопку «Удалить» у записей с этим тегом.",
  "settings.tagRule.button.add": "Добавить правило",

  "view.formatMenu.code": "Код",
  "view.formatMenu.math": "Формула",
  "view.formatMenu.quote": "Цитата",
  "view.formatMenu.link": "Ссылка",
  "view.formatMenu.strikethrough": "Зачеркивание",
  "view.formatMenu.highlight": "Выделение",
  "view.formatMenu.settings": "Настройки",

  "view.postMenu.copy": "Копировать",
  "view.postMenu.quotePost": "Цитировать запись",
  "view.postMenu.edit": "Редактировать",
  "view.postMenu.cancelEdit": "Отменить редактирование",
  "view.postMenu.unpin": "Открепить",
  "view.postMenu.pin": "Закрепить",
  "view.postMenu.pinLimitHint": "Максимум закрепленных записей: {limit}.",
  "view.postMenu.delete": "Удалить",
  // Shown on the same row after the first press, in place of the label above.
  "view.postMenu.deleteConfirm": "Нажмите ещё раз для удаления",

  "view.dateNav.today": "Сегодня",
  "view.dateNav.todaySuffix": " (Сегодня)",

  "view.empty.noMemos": "Нет записей для отображения",
  "view.notice.saveFailed": "Ошибка сохранения: {error}",
  "view.notice.searchPluginNotFound": "Плагин поиска не найден",

  "view.image.removeAria": "Удалить изображение",

  // Placeholder body of a quote card whose original post is gone.
  "quote.card.notFound": "(Исходная запись не найдена)",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "LLLL YYYY [г.]",

  "defaults.headerDateFormat": "D MMMM YYYY [г.]",
  "defaults.submitLabel": "Постить",
  "defaults.updateLabel": "Обновить",
  "defaults.inputPlaceholder": "Ваши мысли здесь...",
} satisfies Translations;

export default ru;
