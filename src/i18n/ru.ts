import type { Translations } from "./ja";

// Russian translations. Translated via Nani.
const ru = {
  "settings.section.basic": "Основные настройки",
  "settings.section.advanced": "Расширенные настройки",
  "settings.section.tagrules": "Правила для тегов",

  "settings.item.viewPlacement.name": "Расположение панели",
  "settings.item.viewPlacement.desc": "Где отображать Wrot.",
  "settings.option.viewPlacement.left": "Левая боковая панель",
  "settings.option.viewPlacement.right": "Правая боковая панель",
  "settings.option.viewPlacement.main": "Основная область",
  "settings.item.openOnStartup.name": "Открывать при запуске",
  "settings.item.openOnStartup.desc": "Открывать Wrot на переднем плане при запуске Obsidian.",

  "settings.item.followFontSize.name": "Использовать размер шрифта Obsidian",
  "settings.item.followFontSize.desc": "Использовать размер шрифта из настроек оформления Obsidian.",

  "settings.item.headerDateFormat.name": "Формат даты в заголовке",
  "settings.item.headerDateFormat.desc": "Поддерживает YYYY, MM, DD и т. д. \nОставьте пустым для значения по умолчанию.",

  "settings.item.timestampFormat.name": "Формат времени",
  "settings.item.timestampFormat.desc": "Например: YYYY, MM, DD, HH, mm, ss.",

  "settings.item.bgColorLight.name": "Цвет фона (светлая тема)",
  "settings.item.bgColorLight.desc": "Используется для записей и поля ввода.",
  "settings.item.textColorLight.name": "Цвет текста (светлая тема)",
  "settings.item.textColorLight.desc": "Используется для текста и значков.",
  "settings.item.bgColorDark.name": "Цвет фона (тёмная тема)",
  "settings.item.bgColorDark.desc": "Используется для записей и поля ввода.",
  "settings.item.textColorDark.name": "Цвет текста (тёмная тема)",
  "settings.item.textColorDark.desc": "Используется для текста и значков.",

  "settings.item.submitLabel.name": "Текст кнопки отправки",
  "settings.item.submitLabel.desc": "Оставьте пустым, чтобы отображалась только иконка (если она задана).",
  "settings.item.submitIcon.name": "Иконка кнопки отправки",
  "settings.item.submitIcon.desc": "Имя иконки можно скопировать {linkOpen}отсюда{linkClose}. \nОставьте пустым, чтобы скрыть.",
  "settings.item.updateLabel.name": "Текст кнопки сохранения",
  "settings.item.updateLabel.desc": "Отображается при редактировании записи. \nОставьте пустым, чтобы отображалась только иконка (если она задана).",
  "settings.item.updateIcon.name": "Иконка кнопки сохранения",
  "settings.item.updateIcon.desc": "Имя иконки можно скопировать {linkOpen}отсюда{linkClose}. \nОставьте пустым, чтобы использовать иконку отправки.",
  "settings.item.submitGradient.name": "Градиент формы отправки",
  "settings.item.submitGradient.desc": "Добавляет градиент к акцентным элементам формы отправки.",
  "settings.item.submitGradientMode.name": "Яркость градиента",
  "settings.item.submitGradientMode.desc": "В автоматическом режиме зависит от яркости акцентного цвета.",
  "settings.option.submitGradientMode.auto": "Автоматически",
  "settings.option.submitGradientMode.light": "Светлее",
  "settings.option.submitGradientMode.dark": "Темнее",
  "settings.item.inputPlaceholder.name": "Подсказка в поле ввода",
  "settings.item.inputPlaceholder.desc": "Оставьте пустым, чтобы убрать подсказку.",

  "settings.item.tagSuggest.name": "Автодополнение тегов",
  "settings.item.tagSuggest.desc": "Показывать варианты при вводе символа #. \nПри отключении сохранённый кэш подсказок будет очищен.",

  "settings.item.pinLimit.name": "Лимит закреплений",
  "settings.item.pinLimit.desc": "Для «Закрепить» и «Закрепить на будущее» действуют раздельные лимиты.\nПри уменьшении лимита лишние записи открепляются.",
  "settings.option.pinLimit.1": "1 запись",
  "settings.option.pinLimit.3": "3 записи",
  "settings.option.pinLimit.5": "5 записей",
  "settings.item.pinFixed.name": "Фиксировать закреплённые сверху",
  "settings.item.pinFixed.desc": "Если выключено, закреплённые записи прокручиваются вместе с остальной лентой.",

  "settings.item.ogp.name": "Предпросмотр ссылок (OGP)",
  "settings.item.ogp.desc": "Загружать превью для внешних ссылок. \nПри выключении сетевые запросы не выполняются.",

  "settings.item.checkStrikethrough.name": "Зачёркивать выполненные задачи",
  "settings.item.checkStrikethrough.desc": "Зачёркивать текст при установке флажка в списке задач.",

  "settings.item.calendarDayShape.name": "Форма дат в календаре",
  "settings.item.calendarDayShape.desc": "Внешний вид кнопок дней в календаре.",
  "settings.option.calendarDayShape.circle": "Круг",
  "settings.option.calendarDayShape.rounded": "Скругленный прямоугольник",
  "settings.option.calendarDayShape.square": "Квадрат",

  "settings.item.showCalendarButton.name": "Кнопка календаря",
  "settings.item.showCalendarButton.desc": "Отображать кнопку перехода к дате на панели навигации.",

  "settings.item.showPostDelete.name": "Кнопка удаления",
  "settings.item.showPostDelete.desc": "Показывать пункт удаления в меню записи. \nУдалённую запись нельзя восстановить (вложения не удаляются).",

  "settings.item.useCustomAttachmentFolder.name": "Своя папка для изображений",
  "settings.item.useCustomAttachmentFolder.desc": "Применяется только к изображениям, добавленным через Wrot.",

  "settings.item.attachmentFolder.name": "Папка для сохранения",
  "settings.item.attachmentFolder.desc": "Если папка не существует, используется стандартная настройка вложений Obsidian.",
  "settings.item.attachmentFolder.placeholder": "Выберите папку",
  "settings.item.shrinkImages.name": "Сжимать изображения",
  "settings.item.shrinkImages.desc": "Сжимать прикрепляемые изображения и удалять EXIF-данные (геолокацию и др.). \nGIF сохраняются без изменений.",
  "settings.item.postHeading.name": "Раздел для добавления записей",
  "settings.item.postHeading.desc": "Новые записи будут добавляться под выбранный заголовок.",
  "settings.option.postHeading.none": "Не задан",

  "settings.item.tagColorRules.name": "Использовать правила для тегов",
  "settings.item.tagColorRules.desc": "Позволяет настроить цвета и поведение для отдельных тегов. \nПриоритет цвета отдаётся первому тегу в тексте.",

  "settings.tagRule.label": "Правило {n}",
  "settings.tagRule.tag.name": "Тег",
  "settings.tagRule.tag.desc": "Символ # указывать необязательно.",
  "settings.tagRule.tag.placeholder": "Название тега",
  "settings.tagRule.bg.name": "Цвет фона",
  "settings.tagRule.bg.desc": "Фон блока с записью.",
  "settings.tagRule.fg.name": "Цвет текста",
  "settings.tagRule.fg.desc": "Основной цвет текста записи.",
  "settings.tagRule.accent.name": "Акцентный цвет",
  "settings.tagRule.accent.desc": "Цвет ссылок и тегов. По умолчанию используется акцент темы.",
  "settings.tagRule.sub.name": "Второстепенный цвет",
  "settings.tagRule.sub.desc": "Для времени, маркеров списка и рамок. \nЕсли не задан, подбирается автоматически.",
  "settings.tagRule.scope.buttons.name": "Второстепенный цвет для метаданных",
  "settings.tagRule.scope.buttons.desc":
    "Применять к меткам времени, меню и кнопкам закрепления.",
  "settings.tagRule.scope.quote.name": "Второстепенный цвет для цитат",
  "settings.tagRule.scope.quote.desc": "Применять к линиям и фону блоков цитат.",
  "settings.tagRule.scope.list.name": "Второстепенный цвет для списков",
  "settings.tagRule.scope.list.desc": "Применять к маркерам списков и чекбоксам.",
  "settings.tagRule.scope.ogp.name": "Второстепенный цвет для карточек OGP",
  "settings.tagRule.scope.ogp.desc": "Применять к рамкам и фону предпросмотра ссылок.",
  "settings.item.graphTags.name": "Сквозная интеграция тегов",
  "settings.item.graphTags.desc": "Учитывать теги в графе связей и общем поиске tag:. \nЕсли выключено, теги работают только внутри Wrot.",
  "settings.tagRule.noIntegration.name": "Исключить из сквозной интеграции",
  "settings.tagRule.noIntegration.desc": "Не передавать этот тег в глобальный поиск и граф Obsidian.",
  "settings.tagRule.hideTimeline.name": "Скрыть из ленты",
  "settings.tagRule.hideTimeline.desc": "Записи с этим тегом не будут видны в ленте. \nВ ежедневной заметке они сохраняются.",
  "settings.tagRule.protectDelete.name": "Защита от удаления",
  "settings.tagRule.protectDelete.desc": "Запретить удаление записей с этим тегом.",
  "settings.tagRule.button.add": "Добавить правило",
  "settings.item.toolbarEdit.name": "Кнопка настройки панели",
  "settings.item.toolbarEdit.desc": "Добавляет пункт настройки панели инструментов в выпадающее меню.",
  "settings.item.resetToolbar.name": "Сбросить панель инструментов",
  "settings.item.resetToolbar.desc": "Восстановить порядок и видимость кнопок по умолчанию.",
  "settings.item.resetToolbar.button": "Сбросить",
  // Shown on the same row after the first press, in place of the label above.
  "settings.item.resetToolbar.confirm": "Нажмите ещё раз для подтверждения",

  "view.toolbarAction.image": "Изображение",
  "view.toolbarAction.embed": "Вставка",
  "view.toolbarAction.bold": "Жирный",
  "view.toolbarAction.italic": "Курсив",
  "view.toolbarAction.list": "Маркированный список",
  "view.toolbarAction.check": "Список задач",
  "view.toolbarAction.ol": "Нумерованный список",
  "view.toolbarAction.more": "Ещё",
  "view.toolbarEdit.done": "Готово",
  "view.toolbarEdit.cancel": "Отмена",

  "view.formatMenu.editToolbar": "Настроить панель инструментов",
  "view.formatMenu.code": "Код",
  "view.formatMenu.math": "Формула",
  "view.formatMenu.quote": "Цитата",
  "view.formatMenu.link": "Ссылка",
  "view.formatMenu.strikethrough": "Зачёркивание",
  "view.formatMenu.highlight": "Выделение",
  "view.formatMenu.settings": "Настройки",

  "view.postMenu.copy": "Копировать",
  "view.postMenu.quotePost": "Цитировать запись",
  "view.postMenu.edit": "Редактировать",
  "view.postMenu.cancelEdit": "Отменить редактирование",
  "view.postMenu.unpin": "Открепить",
  "view.postMenu.pin": "Закрепить",
  "view.postMenu.pinLimitHint": "Максимум закреплённых записей: {limit}.",
  "view.postMenu.schedulePin": "Закрепить на будущее",
  "view.postMenu.delete": "Удалить",
  // Shown on the same row after the first press, in place of the label above.
  "view.postMenu.deleteConfirm": "Нажмите ещё раз для удаления",

  "view.dateNav.today": "Сегодня",
  "view.dateNav.todaySuffix": " (сегодня)",

  "view.empty.noMemos": "Нет записей",
  "view.notice.saveFailed": "Ошибка сохранения: {error}",
  "view.notice.postHeadingMissing": "Указанный заголовок не найден в заметке. Запись добавлена в конец.",
  "view.notice.postHeadingNoTemplate": "Шаблон ежедневной заметки не найден. Параметр заголовка сброшен на «Не задан».",
  "view.notice.searchPluginNotFound": "Основной плагин «Поиск» не включён.",

  "view.image.removeAria": "Удалить изображение",

  // Placeholder body of a quote card whose original post is gone.
  "quote.card.notFound": "(Исходная запись не найдена)",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "LLLL YYYY [г.]",

  "defaults.headerDateFormat": "D MMMM YYYY [г.]",

  "defaults.timestampFormat": "DD.MM.YYYY HH:mm:ss",
  "defaults.submitLabel": "Отправить",
  "defaults.updateLabel": "Сохранить",
  "defaults.inputPlaceholder": "Ваши мысли здесь...",
} satisfies Translations;

export default ru;
