import type { Translations } from "./ja";

// Korean translations. Translated via Nani.
const ko = {
  "settings.section.basic": "기본 설정",
  "settings.section.advanced": "고급 설정",
  "settings.section.tagrules": "태그별 규칙",

  "settings.item.viewPlacement.name": "표시 위치",
  "settings.item.viewPlacement.desc": "Wrot을 표시할 위치를 지정합니다.",
  "settings.option.viewPlacement.left": "왼쪽 사이드바",
  "settings.option.viewPlacement.right": "오른쪽 사이드바",
  "settings.option.viewPlacement.main": "메인 편집창",
  "command.openLeft": "왼쪽 사이드바에서 열기",
  "command.openRight": "오른쪽 사이드바에서 열기",
  "command.openMain": "메인 편집창에서 열기",
  "command.openSettings": "설정 열기",
  "settings.item.openOnStartup.name": "시작 시 자동으로 열기",
  "settings.item.openOnStartup.desc": "Obsidian을 실행할 때 Wrot을 바로 엽니다.",

  "settings.item.followFontSize.name": "Obsidian 글꼴 크기 연동",
  "settings.item.followFontSize.desc":
    "활성화하면 Obsidian 화면 설정의 글자 크기에 맞춥니다.",

  "settings.item.headerDateFormat.name": "헤더 날짜 표시 형식",
  "settings.item.headerDateFormat.desc": "YYYY, MM, DD 등을 사용할 수 있습니다.\n비워 두면 기본값으로 재설정됩니다.",

  "settings.item.timestampFormat.name": "타임스탬프 형식",
  "settings.item.timestampFormat.desc": "YYYY, MM, DD, HH, mm, ss를 사용할 수 있습니다.",

  "settings.item.bgColorLight.name": "배경색 (라이트 모드)",
  "settings.item.bgColorLight.desc": "게시물과 입력창의 배경에 사용됩니다.",
  "settings.item.textColorLight.name": "글자색 (라이트 모드)",
  "settings.item.textColorLight.desc": "텍스트와 아이콘에 적용됩니다.",
  "settings.item.bgColorDark.name": "배경색 (다크 모드)",
  "settings.item.bgColorDark.desc": "게시물과 입력창의 배경에 사용됩니다.",
  "settings.item.textColorDark.name": "글자색 (다크 모드)",
  "settings.item.textColorDark.desc": "텍스트와 아이콘에 적용됩니다.",

  "settings.item.submitLabel.name": "작성 버튼 텍스트",
  "settings.item.submitLabel.desc": "아이콘을 설정한 경우, 비워 두면 아이콘만 표시됩니다.",
  "settings.item.submitIcon.name": "작성 버튼 아이콘",
  "settings.item.submitIcon.desc": "아이콘 이름은 {linkOpen}여기{linkClose}에서 복사할 수 있습니다.\n비워 두면 표시되지 않습니다.",
  "settings.item.updateLabel.name": "수정 버튼 텍스트",
  "settings.item.updateLabel.desc": "게시물을 수정할 때 표시됩니다.\n아이콘을 설정한 경우, 비워 두면 아이콘만 표시됩니다.",
  "settings.item.updateIcon.name": "수정 버튼 아이콘",
  "settings.item.updateIcon.desc": "아이콘 이름은 {linkOpen}여기{linkClose}에서 복사할 수 있습니다.\n비워 두면 작성 버튼과 동일한 아이콘이 사용됩니다.",
  "settings.item.submitGradient.name": "입력창 그라데이션",
  "settings.item.submitGradient.desc": "활성화하면 입력창에 그라데이션 효과가 적용됩니다.",
  "settings.item.submitGradientMode.name": "그라데이션 명도",
  "settings.item.submitGradientMode.desc": "'자동'으로 설정하면 강조 색상의 밝기에 맞게 조절됩니다.",
  "settings.option.submitGradientMode.auto": "자동",
  "settings.option.submitGradientMode.light": "밝게",
  "settings.option.submitGradientMode.dark": "어둡게",
  "settings.item.inputPlaceholder.name": "입력창 안내 문구",
  "settings.item.inputPlaceholder.desc": "비워 두면 표시되지 않습니다.",

  "settings.item.tagSuggest.name": "태그 자동 완성",
  "settings.item.tagSuggest.desc":
    "# 뒤에 입력하면 추천 태그를 표시합니다.\n비활성화하면 저장된 기록도 초기화됩니다.",

  "settings.item.pinLimit.name": "상단 고정 최대 개수",
  "settings.item.pinLimit.desc": "'상단 고정'과 '예약 고정'에 각각 적용됩니다.\n개수를 줄이면 초과된 항목은 고정이 해제됩니다.",
  "settings.option.pinLimit.1": "1개",
  "settings.option.pinLimit.3": "3개",
  "settings.option.pinLimit.5": "5개",
  "settings.item.pinFixed.name": "고정된 게시물 상단 유지",
  "settings.item.pinFixed.desc": "비활성화하면 고정된 게시물도 타임라인과 함께 스크롤됩니다.",

  "settings.item.ogp.name": "링크 미리보기 (OGP)",
  "settings.item.ogp.desc": "URL의 미리보기 정보를 가져옵니다.\n비활성화하면 외부와 통신하지 않습니다.",

  "settings.item.checkStrikethrough.name": "완료 항목 취소선",
  "settings.item.checkStrikethrough.desc": "비활성화하면 체크박스를 선택해도 취소선이 생기지 않습니다.",

  "settings.item.calendarDayShape.name": "달력 날짜 버튼 모양",
  "settings.item.calendarDayShape.desc": "달력의 날짜 버튼 모양을 지정합니다.",
  "settings.option.calendarDayShape.circle": "원형",
  "settings.option.calendarDayShape.rounded": "둥근 모서리",
  "settings.option.calendarDayShape.square": "사각형",

  "settings.item.showCalendarButton.name": "달력 버튼 표시",
  "settings.item.showCalendarButton.desc":
    "활성화하면 날짜 탐색 바에서 원하는 날짜로 이동할 수 있습니다.",

  "settings.item.showPostDelete.name": "삭제 버튼 표시",
  "settings.item.showPostDelete.desc":
    "활성화하면 메뉴에 삭제 버튼이 추가됩니다.\n삭제한 게시물은 되돌릴 수 없으며, 첨부된 이미지는 함께 삭제되지 않습니다.",

  "settings.item.useCustomAttachmentFolder.name": "이미지 저장 경로 사용자 지정",
  "settings.item.useCustomAttachmentFolder.desc": "Wrot에서 추가한 이미지에만 적용됩니다.",

  "settings.item.attachmentFolder.name": "저장 폴더",
  "settings.item.attachmentFolder.desc": "지정한 폴더가 없으면 Obsidian의 기본 설정을 따릅니다.",
  "settings.item.attachmentFolder.placeholder": "폴더 선택",
  "settings.item.shrinkImages.name": "이미지 압축",
  "settings.item.shrinkImages.desc": "첨부 이미지를 압축하고 위치 정보 등을 제거하여 저장합니다.\n(GIF 제외)",
  "settings.item.postHeading.name": "템플릿 제목 지정",
  "settings.item.postHeading.desc": "선택한 제목 아래에 게시물이 추가됩니다.",
  "settings.option.postHeading.none": "사용 안 함",

  "settings.item.tagColorRules.name": "태그별 스타일 규칙",
  "settings.item.tagColorRules.desc":
    "태그별로 게시물 색상과 Obsidian 연동 방식 등을 설정할 수 있습니다.\n색상은 본문에 먼저 나오는 태그를 우선 적용합니다.",

  "settings.tagRule.label": "규칙 {n}",
  "settings.tagRule.tag.name": "태그",
  "settings.tagRule.tag.desc": "#은 붙이지 않아도 됩니다.",
  "settings.tagRule.tag.placeholder": "태그 이름",
  "settings.tagRule.bg.name": "배경색",
  "settings.tagRule.bg.desc": "게시물 배경에 사용됩니다.",
  "settings.tagRule.fg.name": "글자색",
  "settings.tagRule.fg.desc": "태그, 링크, URL에는 강조 색상이 적용됩니다.",
  "settings.tagRule.accent.name": "강조 색상",
  "settings.tagRule.accent.desc": "지정하지 않으면 테마의 강조 색상을 사용합니다.",
  "settings.tagRule.sub.name": "보조 색상",
  "settings.tagRule.sub.desc": "타임스탬프, 목록 기호 등의 색상입니다.\n지정하지 않으면 자동으로 결정됩니다.",
  "settings.tagRule.scope.buttons.name": "타임스탬프·메뉴·고정 아이콘에 보조 색상 적용",
  "settings.tagRule.scope.buttons.desc": "비활성화하면 자동 색상으로 표시됩니다.",
  "settings.tagRule.scope.quote.name": "인용 블록에 보조 색상 적용",
  "settings.tagRule.scope.quote.desc": "비활성화하면 자동 색상으로 표시됩니다.",
  "settings.tagRule.scope.list.name": "목록·체크박스에 보조 색상 적용",
  "settings.tagRule.scope.list.desc": "비활성화하면 자동 색상으로 표시됩니다.",
  "settings.tagRule.scope.ogp.name": "미리보기 카드에 보조 색상 적용",
  "settings.tagRule.scope.ogp.desc": "비활성화하면 자동 색상으로 표시됩니다.",
  "settings.item.graphTags.name": "Obsidian 본문 태그로 등록",
  "settings.item.graphTags.desc": "그래프 뷰나 태그 검색(tag:)에 포함시킵니다.\n비활성화하면 Wrot 내부에서만 태그로 작동합니다.",
  "settings.tagRule.noIntegration.name": "Obsidian 본문 태그에서 제외",
  "settings.tagRule.noIntegration.desc": "활성화하면 이 태그는 Wrot 내부에서만 작동합니다.",
  "settings.tagRule.hideTimeline.name": "타임라인에서 숨기기",
  "settings.tagRule.hideTimeline.desc":
    "활성화하면 이 태그가 달린 게시물은 타임라인에 표시되지 않습니다.\n(데일리 노트에는 그대로 기록됩니다)",
  "settings.tagRule.protectDelete.name": "삭제 방지",
  "settings.tagRule.protectDelete.desc":
    "활성화하면 이 태그가 달린 게시물은 삭제할 수 없습니다.",
  "settings.tagRule.button.add": "규칙 추가",
  "settings.item.toolbarEdit.name": "툴바 편집 버튼 표시",
  "settings.item.toolbarEdit.desc": "활성화하면 툴바 메뉴에 편집 아이콘이 추가됩니다.",
  "settings.item.resetToolbar.name": "툴바 초기화",
  "settings.item.resetToolbar.desc": "툴바 항목의 순서와 구성을 초기 상태로 되돌립니다.",
  "settings.item.resetToolbar.button": "초기화",
  "settings.item.resetToolbar.confirm": "다시 누르면 초기화됩니다",

  "view.toolbarAction.image": "이미지",
  "view.toolbarAction.bold": "굵게",
  "view.toolbarAction.italic": "기울임꼴",
  "view.toolbarAction.list": "글머리 기호 목록",
  "view.toolbarAction.check": "할 일 목록",
  "view.toolbarAction.ol": "번호 매기기 목록",
  "view.toolbarAction.more": "더보기",
  "view.toolbarEdit.done": "완료",
  "view.toolbarEdit.cancel": "편집 취소",

  "view.formatMenu.editToolbar": "툴바 편집",
  "view.formatMenu.code": "코드",
  "view.formatMenu.math": "수식",
  "view.formatMenu.quote": "인용",
  "view.formatMenu.link": "링크",
  "view.linkPopover.placeholder": "노트 제목 또는 URL",
  "view.linkPopover.unlink": "링크 제거",
  "view.formatMenu.strikethrough": "취소선",
  "view.formatMenu.highlight": "형광펜",
  "view.highlight.default": "기본",
  "view.highlight.red": "빨강",
  "view.highlight.orange": "주황",
  "view.highlight.yellow": "노랑",
  "view.highlight.green": "초록",
  "view.highlight.blue": "파랑",
  "view.highlight.purple": "보라",
  "view.highlight.remove": "형광펜 지우기",
  "view.formatMenu.settings": "설정",

  "view.postMenu.copy": "복사",

  "view.postMenu.copyMath": "수식 복사",

  "view.postMenu.copyCode": "코드 복사",
  "view.postMenu.quotePost": "게시물 인용",
  "view.postMenu.edit": "편집",
  "view.postMenu.cancelEdit": "편집 취소",
  "view.postMenu.unpin": "상단 고정 해제",
  "view.postMenu.pin": "상단 고정",
  "view.postMenu.pinLimitHint": "최대 {limit}개까지만 고정할 수 있습니다.",
  "view.postMenu.schedulePin": "나중에 고정",
  "view.postMenu.delete": "삭제",
  "view.postMenu.deleteConfirm": "다시 누르면 삭제됩니다",

  "view.dateNav.today": "오늘",
  "view.dateNav.todaySuffix": " (오늘)",

  "view.empty.noMemos": "작성된 게시물이 없습니다",
  "view.notice.saveFailed": "게시물 저장 실패: {error}",
  "view.notice.postHeadingMissing": "지정한 제목이 없어 문서 끝에 추가했습니다.",
  "view.notice.postHeadingNoTemplate": "데일리 노트 템플릿을 찾을 수 없어 제목 지정을 '사용 안 함'으로 변경했습니다.",
  "view.notice.searchPluginNotFound": "검색 플러그인을 찾을 수 없습니다.",

  "view.image.removeAria": "이미지 제거",
  "view.quote.removeAria": "인용 제거",

  "quote.card.notFound": "(원본 게시물을 찾을 수 없습니다)",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "YYYY[년] M[월]",

  "defaults.headerDateFormat": "YYYY년 MM월 DD일",

  "defaults.timestampFormat": "YYYY.MM.DD HH:mm:ss",
  "defaults.submitLabel": "게시",
  "defaults.updateLabel": "수정",
  "defaults.inputPlaceholder": "새로운 내용을 남겨보세요...",
} satisfies Translations;

export default ko;
