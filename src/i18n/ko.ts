import type { Translations } from "./ja";

// Korean translations. Translated via Nani.
const ko = {
  "settings.section.basic": "기본 설정",
  "settings.section.display": "표시 설정",
  "settings.section.tagrules": "태그별 규칙 설정",

  "settings.item.viewPlacement.name": "표시 위치",
  "settings.item.viewPlacement.desc": "Wrot 패널의 표시 위치를 선택합니다.",
  "settings.option.viewPlacement.left": "왼쪽 사이드바",
  "settings.option.viewPlacement.right": "오른쪽 사이드바",
  "settings.option.viewPlacement.main": "메인 영역",

  "settings.item.followFontSize.name": "Obsidian 글꼴 크기 동기화",
  "settings.item.followFontSize.desc":
    "Obsidian의 외관 설정에 Wrot의 글자 크기를 맞춥니다.",

  "settings.item.headerDateFormat.name": "헤더 날짜 표시 형식",
  "settings.item.headerDateFormat.desc":
    "날짜 내비게이션에 표시할 형식을 지정합니다. (YYYY, MM, DD 등을 사용 가능) 비워두면 기본값으로 돌아갑니다.",

  "settings.item.timestampFormat.name": "타임스탬프 형식",
  "settings.item.timestampFormat.desc":
    "게시물의 날짜와 시간 형식을 지정합니다. (YYYY, MM, DD, HH, mm, ss 사용 가능)",

  "settings.item.bgColorLight.name": "배경색 (라이트 모드)",
  "settings.item.bgColorLight.desc":
    "라이트 테마의 게시물 및 입력창 배경색을 설정합니다.",
  "settings.item.textColorLight.name": "글자색 (라이트 모드)",
  "settings.item.textColorLight.desc":
    "라이트 테마의 텍스트 및 아이콘 색상을 설정합니다.",
  "settings.item.bgColorDark.name": "배경색 (다크 모드)",
  "settings.item.bgColorDark.desc":
    "다크 테마의 게시물 및 입력창 배경색을 설정합니다.",
  "settings.item.textColorDark.name": "글자색 (다크 모드)",
  "settings.item.textColorDark.desc":
    "다크 테마의 텍스트 및 아이콘 색상을 설정합니다.",

  "settings.item.submitLabel.name": "게시 버튼 텍스트",
  "settings.item.submitLabel.desc":
    "게시 버튼에 표시될 문구를 변경할 수 있습니다.",
  "settings.item.submitIcon.name": "게시 버튼 아이콘",
  "settings.item.submitIcon.desc":
    "게시 버튼의 아이콘을 변경할 수 있습니다. 아이콘 이름은 {linkOpen}여기{linkClose}에서 복사해 주세요. 비워두면 아이콘이 숨겨집니다.",
  "settings.item.inputPlaceholder.name": "입력창 안내 문구",
  "settings.item.inputPlaceholder.desc":
    "입력창이 비어 있을 때 표시되는 텍스트를 변경할 수 있습니다. 비워두면 표시되지 않습니다.",

  "settings.item.pinLimit.name": "고정 개수 제한",
  "settings.item.pinLimit.desc":
    "타임라인 상단에 고정할 수 있는 게시물의 최대 개수를 설정합니다.",
  "settings.option.pinLimit.1": "1개",
  "settings.option.pinLimit.3": "3개",
  "settings.option.pinLimit.5": "5개",

  "settings.item.zenModePins.name": "젠 모드에서 고정 게시물 표시",
  "settings.item.zenModePins.desc": "젠 모드가 활성화된 동안 고정된 게시물을 표시할지 선택합니다.",
  "settings.option.zenModePins.hide": "숨기기",
  "settings.option.zenModePins.show": "표시",

  "settings.item.ogp.name": "URL 미리보기 (OGP)",
  "settings.item.ogp.desc":
    "게시물 내 URL의 미리보기 정보를 가져옵니다. 끄면 외부와 통신하지 않습니다.",

  "settings.item.checkStrikethrough.name": "체크된 항목 취소선",
  "settings.item.checkStrikethrough.desc":
    "체크박스가 완료된 항목에 취소선을 표시합니다.",

  "settings.item.calendarDayShape.name": "날짜 버튼 모양",
  "settings.item.calendarDayShape.desc": "달력의 날짜 버튼 모양을 선택합니다.",
  "settings.option.calendarDayShape.circle": "원형",
  "settings.option.calendarDayShape.rounded": "둥근 모서리",
  "settings.option.calendarDayShape.square": "사각형",

  "settings.item.showCalendarButton.name": "캘린더 버튼 표시",
  "settings.item.showCalendarButton.desc":
    "날짜 네비게이션에 캘린더 버튼을 추가합니다. 버튼을 눌러 원하는 날짜로 바로 이동할 수 있습니다.",

  "settings.item.tagColorRules.name": "태그별 색상 규칙",
  "settings.item.tagColorRules.desc":
    "특정 태그가 포함된 게시물의 배경색과 글자색을 변경합니다. 여러 규칙이 겹치면 본문에서 먼저 등장한 태그가 우선 적용됩니다.",

  "settings.tagRule.label": "규칙 {n}",
  "settings.tagRule.tag.name": "태그",
  "settings.tagRule.tag.desc":
    "색상을 변경할 태그를 입력하세요. (#은 생략 가능합니다)",
  "settings.tagRule.tag.placeholder": "태그명",
  "settings.tagRule.bg.name": "배경색",
  "settings.tagRule.bg.desc":
    "해당 태그를 포함한 게시물의 배경색을 설정합니다.",
  "settings.tagRule.fg.name": "글자색",
  "settings.tagRule.fg.desc":
    "해당 태그를 포함한 게시물의 본문 글자색을 설정합니다. (태그, 링크 등은 액센트 컬러에서 설정)",
  "settings.tagRule.accent.name": "액센트 컬러",
  "settings.tagRule.accent.desc":
    "태그, 링크, 아이콘 등 포인트가 되는 요소의 색상을 설정합니다. 설정하지 않으면 테마 기본색을 사용합니다.",
  "settings.tagRule.sub.name": "서브 컬러",
  "settings.tagRule.sub.desc":
    "타임스탬프, 리스트 마커 등 보조 요소의 색상을 설정합니다. 설정하지 않으면 배경/글자색에 맞춰 자동 계산됩니다.",
  "settings.tagRule.scope.buttons.name": "버튼 및 고정 아이콘에 서브 컬러 적용",
  "settings.tagRule.scope.buttons.desc":
    "끄면 시스템 기본 색상으로 표시됩니다.",
  "settings.tagRule.scope.quote.name": "인용문에 서브 컬러 적용",
  "settings.tagRule.scope.quote.desc": "끄면 시스템 기본 색상으로 표시됩니다.",
  "settings.tagRule.scope.list.name": "리스트 및 체크박스에 서브 컬러 적용",
  "settings.tagRule.scope.list.desc": "끄면 시스템 기본 색상으로 표시됩니다.",
  "settings.tagRule.scope.ogp.name": "OGP 카드에 서브 컬러 적용",
  "settings.tagRule.scope.ogp.desc": "끄면 시스템 기본 색상으로 표시됩니다.",
  "settings.tagRule.button.add": "규칙 추가",

  "settings.tooltip.resetDefault": "기본값으로 복원",
  "settings.tooltip.deleteRule": "규칙 삭제",
  "settings.tooltip.lock": "편집 잠금",
  "settings.tooltip.unlock": "클릭하여 잠금 해제",

  "view.formatMenu.code": "코드",
  "view.formatMenu.math": "수식",
  "view.formatMenu.quote": "인용",
  "view.formatMenu.link": "링크",
  "view.formatMenu.strikethrough": "취소선",
  "view.formatMenu.highlight": "형광펜",
  "view.formatMenu.settings": "설정",
  "view.formatMenu.zenMode": "젠 모드",

  "view.postMenu.copy": "복사",
  "view.postMenu.quotePost": "게시물 인용",
  "view.postMenu.unpin": "고정 해제",
  "view.postMenu.pin": "상단 고정",
  "view.postMenu.pinLimitHint": "최대 {limit}개까지만 고정할 수 있습니다.",

  "view.dateNav.today": "오늘",
  "view.dateNav.todaySuffix": " (오늘)",

  "view.empty.noMemos": "작성된 게시물이 없습니다",
  "view.notice.saveFailed": "저장 실패: {error}",
  "view.notice.searchPluginNotFound": "검색 플러그인을 찾을 수 없습니다.",

  "view.image.removeAria": "이미지 삭제",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "YYYY[년] M[월]",

  "defaults.headerDateFormat": "YYYY년 MM월 DD일",
  "defaults.submitLabel": "게시",
  "defaults.inputPlaceholder": "새로운 내용을 게시해 보세요...",
} satisfies Translations;

export default ko;
