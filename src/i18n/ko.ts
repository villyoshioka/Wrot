import type { Translations } from "./ja";

// Korean translations. Translated via Nani.
const ko = {
  "settings.section.basic": "기본 설정",
  "settings.section.advanced": "고급 설정",
  "settings.section.tagrules": "태그별 규칙 설정",

  "settings.item.viewPlacement.name": "표시 위치",
  "settings.item.viewPlacement.desc": "Wrot을 닫았다 다시 열면 반영됩니다.",
  "settings.option.viewPlacement.left": "왼쪽 사이드바",
  "settings.option.viewPlacement.right": "오른쪽 사이드바",
  "settings.option.viewPlacement.main": "메인 영역",

  "settings.item.followFontSize.name": "Obsidian 글꼴 크기 동기화",
  "settings.item.followFontSize.desc": "켜면 Obsidian 외관 설정의 글자 크기에 맞춥니다.",

  "settings.item.headerDateFormat.name": "헤더 날짜 표시 형식",
  "settings.item.headerDateFormat.desc": "YYYY, MM, DD 등을 사용할 수 있습니다. \n비워두면 기본값으로 돌아갑니다.",

  "settings.item.timestampFormat.name": "타임스탬프 형식",
  "settings.item.timestampFormat.desc": "YYYY, MM, DD, HH, mm, ss 를 사용할 수 있습니다.",

  "settings.item.bgColorLight.name": "배경색 (라이트 모드)",
  "settings.item.bgColorLight.desc": "게시물과 입력창에 사용됩니다.",
  "settings.item.textColorLight.name": "글자색 (라이트 모드)",
  "settings.item.textColorLight.desc": "텍스트와 아이콘에 사용됩니다.",
  "settings.item.bgColorDark.name": "배경색 (다크 모드)",
  "settings.item.bgColorDark.desc": "게시물과 입력창에 사용됩니다.",
  "settings.item.textColorDark.name": "글자색 (다크 모드)",
  "settings.item.textColorDark.desc": "텍스트와 아이콘에 사용됩니다.",

  "settings.item.submitLabel.name": "게시 버튼 텍스트",
  "settings.item.submitLabel.desc": "비워두면 아이콘만 표시됩니다(아이콘이 설정된 경우에 한해).",
  "settings.item.submitIcon.name": "게시 버튼 아이콘",
  "settings.item.submitIcon.desc": "아이콘 이름은 {linkOpen}여기{linkClose}에서 복사하세요. \n비우면 숨겨집니다.",
  "settings.item.updateLabel.name": "수정 버튼 텍스트",
  "settings.item.updateLabel.desc": "게시물을 수정하는 동안 사용됩니다. \n비워두면 아이콘만 표시됩니다(아이콘이 설정된 경우에 한해).",
  "settings.item.updateIcon.name": "수정 버튼 아이콘",
  "settings.item.updateIcon.desc": "아이콘 이름은 {linkOpen}여기{linkClose}에서 복사하세요. \n비워두면 게시 버튼과 같은 아이콘이 사용됩니다.",
  "settings.item.inputPlaceholder.name": "입력창 안내 문구",
  "settings.item.inputPlaceholder.desc": "비워두면 표시되지 않습니다.",

  "settings.item.tagSuggest.name": "태그 자동 완성",
  "settings.item.tagSuggest.desc": "# 뒤에 입력하면 후보가 표시됩니다. \n끄면 기억한 후보도 지워집니다.",

  "settings.item.pinLimit.name": "고정 개수 제한",
  "settings.item.pinLimit.desc": "상한을 낮추면 초과한 고정은 해제됩니다.",
  "settings.option.pinLimit.1": "1개",
  "settings.option.pinLimit.3": "3개",
  "settings.option.pinLimit.5": "5개",

  "settings.item.ogp.name": "URL 미리보기 (OGP)",
  "settings.item.ogp.desc": "URL에서 미리보기 정보를 가져옵니다. \n끄면 외부와 통신하지 않습니다.",

  "settings.item.checkStrikethrough.name": "체크된 항목 취소선",
  "settings.item.checkStrikethrough.desc": "끄면 글자 그대로 남습니다.",

  "settings.item.calendarDayShape.name": "날짜 버튼 모양",
  "settings.item.calendarDayShape.desc": "캘린더의 날짜에 적용됩니다.",
  "settings.option.calendarDayShape.circle": "원형",
  "settings.option.calendarDayShape.rounded": "둥근 모서리",
  "settings.option.calendarDayShape.square": "사각형",

  "settings.item.showCalendarButton.name": "캘린더 버튼 표시",
  "settings.item.showCalendarButton.desc": "켜면 날짜 내비게이션에서 원하는 날짜로 이동할 수 있습니다.",

  "settings.item.showPostDelete.name": "삭제 버튼 표시",
  "settings.item.showPostDelete.desc": "켜면 게시물 메뉴에 삭제 버튼이 추가됩니다. \n삭제한 게시물은 되돌릴 수 없습니다. 첨부한 이미지는 삭제되지 않습니다.",

  "settings.item.useCustomAttachmentFolder.name": "이미지 저장 위치 지정",
  "settings.item.useCustomAttachmentFolder.desc": "Wrot에서 추가한 이미지에만 적용됩니다.",

  "settings.item.attachmentFolder.name": "저장 폴더",
  "settings.item.attachmentFolder.desc": "지정한 폴더가 없으면 Obsidian의 설정을 따릅니다.",
  "settings.item.attachmentFolder.placeholder": "폴더 선택",

  "settings.item.tagColorRules.name": "태그별 규칙 사용",
  "settings.item.tagColorRules.desc": "태그마다 색과 태그 통합 등을 다르게 설정할 수 있습니다. \n색은 본문에서 먼저 나온 태그가 우선합니다.",

  "settings.tagRule.label": "규칙 {n}",
  "settings.tagRule.tag.name": "태그",
  "settings.tagRule.tag.desc": "#은 생략 가능합니다.",
  "settings.tagRule.tag.placeholder": "태그명",
  "settings.tagRule.bg.name": "배경색",
  "settings.tagRule.bg.desc": "게시물 배경에 사용됩니다.",
  "settings.tagRule.fg.name": "글자색",
  "settings.tagRule.fg.desc": "태그, 링크 등은 액센트 컬러에서 설정합니다.",
  "settings.tagRule.accent.name": "액센트 컬러",
  "settings.tagRule.accent.desc": "설정하지 않으면 테마의 강조색을 사용합니다.",
  "settings.tagRule.sub.name": "서브 컬러",
  "settings.tagRule.sub.desc": "타임스탬프·리스트 마커 등의 색입니다. \n설정하지 않으면 자동 계산됩니다.",
  "settings.tagRule.scope.buttons.name": "버튼 및 고정 아이콘에 서브 컬러 적용",
  "settings.tagRule.scope.buttons.desc":
    "끄면 시스템 기본 색상으로 표시됩니다.",
  "settings.tagRule.scope.quote.name": "인용문에 서브 컬러 적용",
  "settings.tagRule.scope.quote.desc": "끄면 시스템 기본 색상으로 표시됩니다.",
  "settings.tagRule.scope.list.name": "리스트 및 체크박스에 서브 컬러 적용",
  "settings.tagRule.scope.list.desc": "끄면 시스템 기본 색상으로 표시됩니다.",
  "settings.tagRule.scope.ogp.name": "OGP 카드에 서브 컬러 적용",
  "settings.tagRule.scope.ogp.desc": "끄면 시스템 기본 색상으로 표시됩니다.",
  "settings.item.graphTags.name": "태그 통합",
  "settings.item.graphTags.desc": "그래프 뷰와 태그 검색(tag:)의 대상이 됩니다. \n끄면 Wrot 안에서만 쓰입니다.",
  "settings.tagRule.noIntegration.name": "태그 통합에서 제외",
  "settings.tagRule.noIntegration.desc": "켜면 이 태그는 Wrot 안에서만 사용됩니다.",
  "settings.tagRule.hideTimeline.name": "타임라인에서 숨기기",
  "settings.tagRule.hideTimeline.desc": "켜면 이 태그가 있는 게시물이 타임라인에 나오지 않습니다. \n데일리 노트에는 남아 있습니다.",
  "settings.tagRule.protectDelete.name": "삭제 버튼 비활성화",
  "settings.tagRule.protectDelete.desc": "켜면 이 태그가 있는 게시물은 삭제할 수 없습니다.",
  "settings.tagRule.button.add": "규칙 추가",

  "view.formatMenu.code": "코드",
  "view.formatMenu.math": "수식",
  "view.formatMenu.quote": "인용",
  "view.formatMenu.link": "링크",
  "view.formatMenu.strikethrough": "취소선",
  "view.formatMenu.highlight": "형광펜",
  "view.formatMenu.settings": "설정",

  "view.postMenu.copy": "복사",
  "view.postMenu.quotePost": "게시물 인용",
  "view.postMenu.edit": "수정",
  "view.postMenu.cancelEdit": "수정 취소",
  "view.postMenu.unpin": "고정 해제",
  "view.postMenu.pin": "상단 고정",
  "view.postMenu.pinLimitHint": "최대 {limit}개까지만 고정할 수 있습니다.",
  "view.postMenu.delete": "삭제",
  // Shown on the same row after the first press, in place of the label above.
  "view.postMenu.deleteConfirm": "한 번 더 누르면 삭제",

  "view.dateNav.today": "오늘",
  "view.dateNav.todaySuffix": " (오늘)",

  "view.empty.noMemos": "표시할 게시물이 없습니다",
  "view.notice.saveFailed": "저장 실패: {error}",
  "view.notice.searchPluginNotFound": "검색 플러그인을 찾을 수 없습니다.",

  "view.image.removeAria": "이미지 삭제",

  // Placeholder body of a quote card whose original post is gone.
  "quote.card.notFound": "(원본 게시물을 찾을 수 없습니다)",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "YYYY[년] M[월]",

  "defaults.headerDateFormat": "YYYY년 MM월 DD일",
  "defaults.submitLabel": "게시",
  "defaults.updateLabel": "수정",
  "defaults.inputPlaceholder": "새로운 내용을 게시해 보세요...",
} satisfies Translations;

export default ko;
