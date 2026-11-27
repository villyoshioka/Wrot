import type { Translations } from "./ja";

// Russian translations. Translated via Nani.
const ru = {
  "settings.section.basic": "Основные",
  "settings.section.advanced": "Дополнительно",
  "settings.section.tagrules": "Правила для тегов",

  "settings.item.viewPlacement.name": "Расположение",
  "settings.item.viewPlacement.desc": "Где открывать панель Wrot.",
  "settings.option.viewPlacement.left": "В левой панели",
  "settings.option.viewPlacement.right": "В правой панели",
  "settings.option.viewPlacement.main": "В рабочей области",
  "command.openLeft": "Открыть в левой панели",
  "command.openRight": "Открыть в правой панели",
  "command.openMain": "Открыть в рабочей области",
  "command.openSettings": "Открыть настройки",
  "settings.item.openOnStartup.name": "Открывать при запуске",
  "settings.item.openOnStartup.desc": "Показывать Wrot на переднем плане при запуске Obsidian.",

  "settings.item.followFontSize.name": "Синхронизировать размер шрифта с Obsidian",
  "settings.item.followFontSize.desc":
    "Подстраивать размер текста под параметры оформления Obsidian.",

  "settings.item.headerDateFormat.name": "Формат даты в заголовке",
  "settings.item.headerDateFormat.desc": "Поддерживаются токены YYYY, MM, DD и др.\nОставьте пустым для сброса по умолчанию.",

  "settings.item.timestampFormat.name": "Формат времени",
  "settings.item.timestampFormat.desc": "Поддерживаются токены YYYY, MM, DD, HH, mm, ss.",

  "settings.item.bgColorLight.name": "Цвет фона (светлая тема)",
  "settings.item.bgColorLight.desc": "Фон для записей и формы ввода.",
  "settings.item.textColorLight.name": "Цвет текста (светлая тема)",
  "settings.item.textColorLight.desc": "Цвет текста и иконок.",
  "settings.item.bgColorDark.name": "Цвет фона (тёмная тема)",
  "settings.item.bgColorDark.desc": "Фон для записей и формы ввода.",
  "settings.item.textColorDark.name": "Цвет текста (тёмная тема)",
  "settings.item.textColorDark.desc": "Цвет текста и иконок.",

  "settings.item.submitLabel.name": "Текст кнопки отправки",
  "settings.item.submitLabel.desc": "Если задана иконка, при пустом поле останется только она.",
  "settings.item.submitIcon.name": "Иконка кнопки отправки",
  "settings.item.submitIcon.desc": "Названия иконок можно скопировать {linkOpen}отсюда{linkClose}.\nОставьте пустым, чтобы скрыть.",
  "settings.item.updateLabel.name": "Текст кнопки обновления",
  "settings.item.updateLabel.desc": "Это отображается при редактировании.\nЕсли задана иконка, при пустом поле останется только она.",
  "settings.item.updateIcon.name": "Иконка кнопки обновления",
  "settings.item.updateIcon.desc": "Названия иконок можно скопировать {linkOpen}отсюда{linkClose}.\nОставьте пустым, чтобы использовать иконку отправки.",
  "settings.item.submitGradient.name": "Градиент формы ввода",
  "settings.item.submitGradient.desc": "Делает акцентный цвет формы ввода градиентным.",
  "settings.item.submitGradientMode.name": "Тон градиента",
  "settings.item.submitGradientMode.desc": "В режиме «Авто» подстраивается под яркость акцентного цвета темы.",
  "settings.option.submitGradientMode.auto": "Авто",
  "settings.option.submitGradientMode.light": "Светлый",
  "settings.option.submitGradientMode.dark": "Тёмный",
  "settings.item.inputPlaceholder.name": "Подсказка в поле ввода",
  "settings.item.inputPlaceholder.desc": "Оставьте пустым, чтобы скрыть.",

  "settings.item.tagSuggest.name": "Автодополнение тегов",
  "settings.item.tagSuggest.desc":
    "Предлагать подходящие теги при вводе символа #.\nПри отключении история тегов будет сброшена.",

  "settings.item.pinLimit.name": "Лимит закреплений",
  "settings.item.pinLimit.desc": "Применяется отдельно к закреплению и отложенному закреплению.\nПри снижении лимита лишние записи будут откреплены.",
  "settings.option.pinLimit.1": "1",
  "settings.option.pinLimit.3": "3",
  "settings.option.pinLimit.5": "5",
  "settings.item.pinFixed.name": "Фиксировать закреплённые записи",
  "settings.item.pinFixed.desc": "Если выключено, закреплённые записи прокручиваются вместе с остальной лентой.",

  "settings.item.ogp.name": "Превью ссылок",
  "settings.item.ogp.desc": "Загружать данные для предпросмотра по URL.\nЕсли выключено, сетевые запросы не отправляются.",

  "settings.item.checkStrikethrough.name": "Зачёркивать выполненные пункты",
  "settings.item.checkStrikethrough.desc": "Если выключено, текст после установки отметки не перечёркивается.",

  "settings.item.calendarDayShape.name": "Форма дат в календаре",
  "settings.item.calendarDayShape.desc": "Форма кнопок с числами в календаре.",
  "settings.option.calendarDayShape.circle": "Круг",
  "settings.option.calendarDayShape.rounded": "Скруглённый квадрат",
  "settings.option.calendarDayShape.square": "Квадрат",

  "settings.item.showCalendarButton.name": "Кнопка календаря",
  "settings.item.showCalendarButton.desc":
    "Позволяет быстро переходить к любой дате из панели навигации.",

  "settings.item.showPostDelete.name": "Кнопка удаления записи",
  "settings.item.showPostDelete.desc":
    "Добавляет пункт удаления в контекстное меню записи.\nУдалённые записи нельзя восстановить. Вложенные файлы и изображения при этом сохраняются.",

  "settings.item.useCustomAttachmentFolder.name": "Своя папка для изображений",
  "settings.item.useCustomAttachmentFolder.desc": "Применяется только к файлам, добавленным через Wrot.",

  "settings.item.attachmentFolder.name": "Папка для сохранения",
  "settings.item.attachmentFolder.desc": "Если папка не найдена, будут использованы стандартные настройки файлов в Obsidian.",
  "settings.item.attachmentFolder.placeholder": "Выберите папку",
  "settings.item.shrinkImages.name": "Сжимать изображения",
  "settings.item.shrinkImages.desc": "Оптимизирует размер вложений и удаляет метаданные (включая геолокацию).\nНе затрагивает GIF-анимации.",
  "settings.item.postHeading.name": "Заголовок для вставки в шаблоне",
  "settings.item.postHeading.desc": "Новые записи будут добавляться под этим заголовком.",
  "settings.option.postHeading.none": "Не задан",

  "settings.item.tagColorRules.name": "Правила оформления тегов",
  "settings.item.tagColorRules.desc":
    "Индивидуальная настройка цветов записей и поведения тегов в хранилище.\nЦвет определяется по первому найденному тегу в тексте.",

  "settings.tagRule.label": "Правило {n}",
  "settings.tagRule.tag.name": "Тег",
  "settings.tagRule.tag.desc": "Символ # указывать не обязательно.",
  "settings.tagRule.tag.placeholder": "Имя тега",
  "settings.tagRule.bg.name": "Цвет фона",
  "settings.tagRule.bg.desc": "Фон записи.",
  "settings.tagRule.fg.name": "Цвет текста",
  "settings.tagRule.fg.desc": "Для ссылок, тегов и URL используется акцентный цвет.",
  "settings.tagRule.accent.name": "Акцентный цвет",
  "settings.tagRule.accent.desc": "Если не задан, используется цвет активной темы.",
  "settings.tagRule.sub.name": "Дополнительный цвет",
  "settings.tagRule.sub.desc": "Цвет меток времени, маркеров списков и т. д.\nЕсли не задан, подбирается автоматически.",
  "settings.tagRule.scope.buttons.name": "Применять доп. цвет к времени, меню и пинам",
  "settings.tagRule.scope.buttons.desc": "Если выключено, цвет определяется автоматически.",
  "settings.tagRule.scope.quote.name": "Применять доп. цвет к цитатам",
  "settings.tagRule.scope.quote.desc": "Если выключено, цвет определяется автоматически.",
  "settings.tagRule.scope.list.name": "Применять доп. цвет к спискам и флажкам",
  "settings.tagRule.scope.list.desc": "Если выключено, цвет определяется автоматически.",
  "settings.tagRule.scope.ogp.name": "Применять доп. цвет к карточкам ссылок",
  "settings.tagRule.scope.ogp.desc": "Если выключено, цвет определяется автоматически.",
  "settings.item.graphTags.name": "Учитывать теги в хранилище",
  "settings.item.graphTags.desc": "Включает теги в граф и глобальный поиск (tag:).\nЕсли выключено, теги распознаются только внутри Wrot.",
  "settings.tagRule.noIntegration.name": "Исключить из хранилища",
  "settings.tagRule.noIntegration.desc": "Тег будет обрабатываться исключительно внутри Wrot.",
  "settings.tagRule.hideTimeline.name": "Скрыть из ленты",
  "settings.tagRule.hideTimeline.desc":
    "Записи с этим тегом перестанут показываться в ленте Wrot,\nно по-прежнему будут сохраняться в ежедневных заметках.",
  "settings.tagRule.protectDelete.name": "Защитить от удаления",
  "settings.tagRule.protectDelete.desc":
    "Блокирует возможность удаления для записей с этим тегом.",
  "settings.tagRule.button.add": "Добавить правило",
  "settings.item.toolbarEdit.name": "Кнопка настройки панели инструментов",
  "settings.item.toolbarEdit.desc": "Добавляет кнопку настройки в меню панели инструментов.",
  "settings.item.resetToolbar.name": "Сбросить панель инструментов",
  "settings.item.resetToolbar.desc": "Возвращает исходный порядок и видимость кнопок панели.",
  "settings.item.resetToolbar.button": "Сбросить",
  "settings.item.resetToolbar.confirm": "Нажмите ещё раз для подтверждения",

  "view.toolbarAction.image": "Изображение",
  "view.toolbarAction.bold": "Жирный",
  "view.toolbarAction.italic": "Курсив",
  "view.toolbarAction.list": "Список",
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
  "view.linkPopover.placeholder": "Имя заметки или ссылка",
  "view.linkPopover.unlink": "Убрать ссылку",
  "view.formatMenu.strikethrough": "Зачёркивание",
  "view.formatMenu.highlight": "Выделение цветом",
  "view.highlight.default": "По умолчанию",
  "view.highlight.red": "Красный",
  "view.highlight.orange": "Оранжевый",
  "view.highlight.yellow": "Жёлтый",
  "view.highlight.green": "Зелёный",
  "view.highlight.blue": "Синий",
  "view.highlight.purple": "Фиолетовый",
  "view.highlight.remove": "Снять выделение",
  "view.formatMenu.settings": "Настройки",

  "view.postMenu.copy": "Копировать",

  "view.postMenu.copyMath": "Копировать формулу",

  "view.postMenu.copyCode": "Копировать код",
  "view.postMenu.quotePost": "Цитировать",
  "view.postMenu.edit": "Редактировать",
  "view.postMenu.cancelEdit": "Отменить",
  "view.postMenu.unpin": "Открепить",
  "view.postMenu.pin": "Закрепить",
  "view.postMenu.pinLimitHint": "Максимум закреплений: {limit}",
  "view.postMenu.schedulePin": "Закрепить позже",
  "view.postMenu.repeatPin": "Закрепить как повторяющееся",
  "view.postMenu.delete": "Удалить",
  "view.postMenu.deleteConfirm": "Нажмите ещё раз для подтверждения",

  "view.dateNav.today": "Сегодня",
  "view.dateNav.todaySuffix": " (сегодня)",

  "view.empty.noMemos": "Пока нет записей",
  "view.notice.saveFailed": "Ошибка при сохранении: {error}",
  "view.notice.postHeadingMissing": "Заданный заголовок не найден в заметке, запись добавлена в конец",
  "view.notice.postHeadingNoTemplate": "Шаблон ежедневных заметок не найден. Параметр заголовка сброшен",
  "view.notice.searchPluginNotFound": "Плагин поиска не найден",

  "view.image.removeAria": "Удалить изображение",
  "view.quote.removeAria": "Удалить цитату",

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
