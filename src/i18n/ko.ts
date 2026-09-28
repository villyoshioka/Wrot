import type { Translations } from "./ja";

// Korean translations. Translated via Nani.
const ko = {
  "settings.section.basic": "기본 설정",
  "settings.section.advanced": "고급 설정",
  "settings.section.tagrules": "태그별 규칙 설정",

  "settings.item.viewPlacement.name": "표시 위치",
  "settings.item.viewPlacement.desc": "Wrot을 표시할 위치를 지정합니다.",
  "settings.option.viewPlacement.left": "왼쪽 사이드바",
  "settings.option.viewPlacement.right": "오른쪽 사이드바",
  "settings.option.viewPlacement.main": "메인 영역",
  "settings.item.openOnStartup.name": "시작 시 열기",
  "settings.item.openOnStartup.desc": "활성화하면 Obsidian을 시작할 때 Wrot을 전면에 표시합니다.",

  "settings.item.followFontSize.name": "Obsidian 글꼴 크기 동기화",
  "settings.item.followFontSize.desc": "활성화하면 Obsidian 디자인 설정의 글자 크기에 맞춥니다.",

  "settings.item.headerDateFormat.name": "헤더 날짜 표시 형식",
  "settings.item.headerDateFormat.desc": "YYYY, MM, DD 등을 사용할 수 있습니다. \n비워 두면 기본값으로 복원됩니다.",

  "settings.item.timestampFormat.name": "타임스탬프 형식",
  "settings.item.timestampFormat.desc": "YYYY, MM, DD, HH, mm, ss를 사용할 수 있습니다.",

  "settings.item.bgColorLight.name": "배경색 (라이트 모드)",
  "settings.item.bgColorLight.desc": "게시물과 입력창에 적용됩니다.",
  "settings.item.textColorLight.name": "글자색 (라이트 모드)",
  "settings.item.textColorLight.desc": "텍스트와 아이콘에 적용됩니다.",
  "settings.item.bgColorDark.name": "배경색 (다크 모드)",
  "settings.item.bgColorDark.desc": "게시물과 입력창에 적용됩니다.",
  "settings.item.textColorDark.name": "글자색 (다크 모드)",
  "settings.item.textColorDark.desc": "텍스트와 아이콘에 적용됩니다.",

  "settings.item.submitLabel.name": "게시 버튼 텍스트",
  "settings.item.submitLabel.desc": "비워 두면 아이콘만 표시됩니다(아이콘이 설정된 경우).",
  "settings.item.submitIcon.name": "게시 버튼 아이콘",
  "settings.item.submitIcon.desc": "아이콘 이름은 {linkOpen}여기{linkClose}에서 복사할 수 있습니다. \n비워 두면 숨겨집니다.",
  "settings.item.updateLabel.name": "수정 버튼 텍스트",
  "settings.item.updateLabel.desc": "게시물을 수정할 때 표시됩니다. \n비워 두면 아이콘만 표시됩니다(아이콘이 설정된 경우).",
  "settings.item.updateIcon.name": "수정 버튼 아이콘",
  "settings.item.updateIcon.desc": "아이콘 이름은 {linkOpen}여기{linkClose}에서 복사할 수 있습니다. \n비워 두면 게시 버튼과 같은 아이콘이 사용됩니다.",
  "settings.item.submitGradient.name": "게시 폼 그라데이션",
  "settings.item.submitGradient.desc": "활성화하면 게시 폼의 강조 영역이 그라데이션으로 표시됩니다.",
  "settings.item.inputPlaceholder.name": "입력창 안내 문구",
  "settings.item.inputPlaceholder.desc": "비워 두면 표시되지 않습니다.",

  "settings.item.tagSuggest.name": "태그 자동 완성",
  "settings.item.tagSuggest.desc": "# 입력 후 텍스트를 작성하면 추천 태그가 표시됩니다. \n비활성화하면 저장된 기록도 삭제됩니다.",

  "settings.item.pinLimit.name": "고정 개수 제한",
  "settings.item.pinLimit.desc": "「상단 고정」과 「나중에 고정」의 최대 개수가 각각 설정됩니다.\n제한 개수를 줄이면 초과된 항목은 고정이 해제됩니다.",
  "settings.option.pinLimit.1": "1개",
  "settings.option.pinLimit.3": "3개",
  "settings.option.pinLimit.5": "5개",
  "settings.item.pinFixed.name": "상단 고정 유지",
  "settings.item.pinFixed.desc": "비활성화하면 고정된 게시물도 타임라인과 함께 스크롤됩니다.",

  "settings.item.ogp.name": "URL 미리보기 (OGP)",
  "settings.item.ogp.desc": "URL에서 미리보기 정보를 가져옵니다. \n비활성화하면 외부 네트워크 요청을 하지 않습니다.",

  "settings.item.checkStrikethrough.name": "완료 항목 취소선 표시",
  "settings.item.checkStrikethrough.desc": "비활성화하면 체크박스를 선택해도 취소선이 적용되지 않습니다.",

  "settings.item.calendarDayShape.name": "날짜 버튼 모양",
  "settings.item.calendarDayShape.desc": "캘린더 내 날짜 버튼에 적용됩니다.",
  "settings.option.calendarDayShape.circle": "원형",
  "settings.option.calendarDayShape.rounded": "둥근 모서리",
  "settings.option.calendarDayShape.square": "사각형",

  "settings.item.showCalendarButton.name": "캘린더 버튼 표시",
  "settings.item.showCalendarButton.desc": "활성화하면 날짜 탐색 바에서 원하는 날짜로 이동할 수 있습니다.",

  "settings.item.showPostDelete.name": "삭제 버튼 표시",
  "settings.item.showPostDelete.desc": "활성화하면 게시물 메뉴에 삭제 버튼이 표시됩니다. \n삭제한 게시물은 복구할 수 없으며, 첨부된 이미지는 삭제되지 않습니다.",

  "settings.item.useCustomAttachmentFolder.name": "이미지 저장 위치 지정",
  "settings.item.useCustomAttachmentFolder.desc": "Wrot에서 추가한 이미지에만 적용됩니다.",

  "settings.item.attachmentFolder.name": "저장 폴더",
  "settings.item.attachmentFolder.desc": "지정한 폴더가 없으면 Obsidian의 기본 설정을 따릅니다.",
  "settings.item.attachmentFolder.placeholder": "폴더 선택",
  "settings.item.shrinkImages.name": "이미지 압축 후 저장",
  "settings.item.shrinkImages.desc": "첨부 이미지를 압축하고 위치 정보(EXIF) 등을 제거한 뒤 저장합니다.\nGIF는 그대로 저장됩니다.",
  "settings.item.postHeading.name": "템플릿 내 추가 위치(제목)",
  "settings.item.postHeading.desc": "선택한 제목(Heading) 아래에 게시물이 추가됩니다.",
  "settings.option.postHeading.none": "지정 안 함",

  "settings.item.tagColorRules.name": "태그별 규칙 사용",
  "settings.item.tagColorRules.desc": "태그별로 색상 및 태그 통합 여부를 설정할 수 있습니다. \n색상은 본문에 먼저 등장한 태그를 우선 적용합니다.",

  "settings.tagRule.label": "규칙 {n}",
  "settings.tagRule.tag.name": "태그",
  "settings.tagRule.tag.desc": "#은 생략할 수 있습니다.",
  "settings.tagRule.tag.placeholder": "태그명",
  "settings.tagRule.bg.name": "배경색",
  "settings.tagRule.bg.desc": "게시물 배경에 사용됩니다.",
  "settings.tagRule.fg.name": "글자색",
  "settings.tagRule.fg.desc": "태그, 링크 등은 액센트 색상 설정을 따릅니다.",
  "settings.tagRule.accent.name": "액센트 색상",
  "settings.tagRule.accent.desc": "설정하지 않으면 테마의 기본 강조 색상을 사용합니다.",
  "settings.tagRule.sub.name": "보조 색상",
  "settings.tagRule.sub.desc": "타임스탬프, 목록 마커 등에 적용되는 색상입니다. \n설정하지 않으면 자동으로 계산됩니다.",
  "settings.tagRule.scope.buttons.name": "타임스탬프·메뉴·고정 아이콘에 보조 색상 적용",
  "settings.tagRule.scope.buttons.desc":
    "비활성화하면 자동으로 계산된 색상으로 표시됩니다.",
  "settings.tagRule.scope.quote.name": "인용문에 보조 색상 적용",
  "settings.tagRule.scope.quote.desc": "비활성화하면 자동으로 계산된 색상으로 표시됩니다.",
  "settings.tagRule.scope.list.name": "목록 및 체크박스에 보조 색상 적용",
  "settings.tagRule.scope.list.desc": "비활성화하면 자동으로 계산된 색상으로 표시됩니다.",
  "settings.tagRule.scope.ogp.name": "OGP 카드에 보조 색상 적용",
  "settings.tagRule.scope.ogp.desc": "비활성화하면 자동으로 계산된 색상으로 표시됩니다.",
  "settings.item.graphTags.name": "태그 통합",
  "settings.item.graphTags.desc": "그래프 뷰 및 태그 검색(tag:)에 포함됩니다. \n비활성화하면 Wrot 내부에서만 사용됩니다.",
  "settings.tagRule.noIntegration.name": "태그 통합 제외",
  "settings.tagRule.noIntegration.desc": "활성화하면 이 태그는 Wrot 내부에서만 사용됩니다.",
  "settings.tagRule.hideTimeline.name": "타임라인에서 숨기기",
  "settings.tagRule.hideTimeline.desc": "활성화하면 이 태그가 포함된 게시물은 타임라인에 표시되지 않습니다. \n(데일리 노트에는 그대로 유지됩니다)",
  "settings.tagRule.protectDelete.name": "삭제 방지",
  "settings.tagRule.protectDelete.desc": "활성화하면 이 태그가 포함된 게시물은 삭제할 수 없습니다.",
  "settings.tagRule.button.add": "규칙 추가",
  "settings.item.toolbarEdit.name": "도구 모음 편집 버튼 표시",
  "settings.item.toolbarEdit.desc": "활성화하면 도구 모음 메뉴에 편집 항목이 추가됩니다.",
  "settings.item.resetToolbar.name": "도구 모음 초기화",
  "settings.item.resetToolbar.desc": "도구 모음의 순서와 표시 설정을 기본 상태로 되돌립니다.",
  "settings.item.resetToolbar.button": "초기화",
  // Shown on the same row after the first press, in place of the label above.
  "settings.item.resetToolbar.confirm": "한 번 더 누르면 초기화",

  "view.toolbarAction.image": "이미지",
  "view.toolbarAction.embed": "임베드",
  "view.toolbarAction.bold": "굵게",
  "view.toolbarAction.italic": "기울임꼴",
  "view.toolbarAction.list": "글머리 기호 목록",
  "view.toolbarAction.check": "체크리스트",
  "view.toolbarAction.ol": "번호 매기기 목록",
  "view.toolbarAction.more": "더보기",
  "view.toolbarEdit.done": "완료",
  "view.toolbarEdit.cancel": "편집 취소",

  "view.formatMenu.editToolbar": "도구 모음 편집",
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
  "view.postMenu.schedulePin": "나중에 고정",
  "view.postMenu.delete": "삭제",
  // Shown on the same row after the first press, in place of the label above.
  "view.postMenu.deleteConfirm": "한 번 더 누르면 삭제",

  "view.dateNav.today": "오늘",
  "view.dateNav.todaySuffix": " (오늘)",

  "view.empty.noMemos": "표시할 게시물이 없습니다",
  "view.notice.saveFailed": "저장 실패: {error}",
  "view.notice.postHeadingMissing": "설정한 제목(Heading)을 찾을 수 없어 문서 끝에 추가했습니다.",
  "view.notice.postHeadingNoTemplate": "데일리 노트 템플릿을 찾을 수 없어 제목 지정 설정을 '지정 안 함'으로 변경했습니다.",
  "view.notice.searchPluginNotFound": "핵심 플러그인 '검색'이 활성화되어 있지 않습니다.",

  "view.image.removeAria": "이미지 삭제",

  // Placeholder body of a quote card whose original post is gone.
  "quote.card.notFound": "(삭제되었거나 찾을 수 없는 게시물입니다)",

  "settings.item.submitIcon.lucideUrl": "https://lucide.dev/icons/",

  "calendar.monthYearFormat": "YYYY[년] M[월]",

  "defaults.headerDateFormat": "YYYY년 MM월 DD일",

  "defaults.timestampFormat": "YYYY.MM.DD HH:mm:ss",
  "defaults.submitLabel": "게시",
  "defaults.updateLabel": "수정",
  "defaults.inputPlaceholder": "새로운 내용을 남겨보세요...",
} satisfies Translations;

export default ko;
