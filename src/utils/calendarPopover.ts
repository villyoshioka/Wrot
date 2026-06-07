import { setIcon } from "obsidian";
import { t } from "../i18n";

declare const moment: typeof import("moment");

type Moment = ReturnType<typeof moment>;

export interface CalendarPopoverOptions {
  // ポップオーバーの位置を合わせる基準要素（カレンダーボタン）。
  anchor: HTMLElement;
  // ポップオーバーを実際に配置する親要素（ビュー本体 = wr-container）。
  // anchor の中に置くと、ボタンが右端にあるレイアウトで右基準に開いた際に
  // ビュー（サイドバー）外へはみ出すため、コンテナ内に収めて位置計算する。
  container: HTMLElement;
  // 初期表示・選択ハイライトの基準になる現在の日付。
  initialDate: Moment;
  // 日付マスがクリックされたときに呼ぶ。引数はその日の moment（00:00）。
  onSelect: (date: Moment) => void;
  // 閉じたとき（選択・外クリック・Esc いずれでも）に呼ぶ後始末。
  onClose: () => void;
}

// 開いているポップオーバーを外から閉じる/破棄するためのハンドル。
export interface CalendarPopoverHandle {
  close: () => void;
}

const GRID_CELLS = 6 * 7; // 6週固定。月によって高さが変わらずレイアウトが安定する

// 任意の日付へジャンプするための自作カレンダーポップオーバーを開く。
// OS 標準の input[type=date] ピッカーに代わり、全プラットフォームで同一の
// 見た目・操作感を提供する。日付計算は Obsidian 同梱の moment に委ねる。
export function openCalendarPopover(
  opts: CalendarPopoverOptions
): CalendarPopoverHandle {
  const { anchor, container, initialDate, onSelect, onClose } = opts;

  // 表示中の月（その月初に正規化）。月送りで前後する。
  let viewMonth = initialDate.clone().startOf("month");

  const popover = container.createDiv({ cls: "wr-calendar-popover" });

  // ボタンの真下・コンテナ内に収まる位置へ配置する。
  // 右端は anchor の右に揃えたいが、コンテナ左端を割り込まないようクランプする。
  const GAP = 4; // ボタンとカレンダーの間隔
  const EDGE = 8; // コンテナ端からの最小余白
  const positionPopover = () => {
    const a = anchor.getBoundingClientRect();
    const c = container.getBoundingClientRect();
    // 横幅がコンテナ（サイドバー）に収まりきらない場合は、カレンダー自体を
    // コンテナ幅 - 左右余白 まで縮める。マスは CSS のグリッド均等割りで伸縮する。
    popover.style.maxWidth = `${c.width - EDGE * 2}px`;
    const w = popover.offsetWidth;
    // 縦: ボタンの下に GAP だけ空けて出す（コンテナ内座標）。
    const top = a.bottom - c.top + GAP;
    // 横: ボタン右端に揃える → コンテナ内座標へ。左右どちらもはみ出さないよう収める。
    const maxLeft = c.width - w - EDGE;
    let left = a.right - c.left - w;
    if (left > maxLeft) left = maxLeft;
    if (left < EDGE) left = EDGE;
    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
  };
  // ポップオーバー内のクリックはアンカー(カレンダーボタン)まで伝播させない。
  // 伝播するとボタンのトグルハンドラが「すでに開いている → 閉じる」を誤発火し、
  // 月送り矢印を押しただけで閉じてしまう。閉じる契機は日付選択・外クリック・Esc のみ。
  popover.addEventListener("click", (e) => e.stopPropagation());

  // 表示モード: 月日のカレンダー or 年の一覧。月ラベルを押すと年モードへ、
  // 年を選ぶと月モードへ戻る (年だけジャンプ、月日は据え置き)。
  type Mode = "month" | "year";
  let mode: Mode = "month";
  const YEARS_PER_PAGE = 12; // 年一覧 1 ページの年数 (グリッドに収まる数)

  const header = popover.createDiv({ cls: "wr-calendar-header" });
  const prevBtn = header.createEl("button", { cls: "wr-calendar-nav-btn" });
  setIcon(prevBtn, "chevron-left");
  // 月ラベルはボタンとして押せる (押すと年モードへ切り替え)。
  const monthLabel = header.createEl("button", { cls: "wr-calendar-month-label" });
  const nextBtn = header.createEl("button", { cls: "wr-calendar-nav-btn" });
  setIcon(nextBtn, "chevron-right");

  const weekdaysRow = popover.createDiv({ cls: "wr-calendar-weekdays" });
  const grid = popover.createDiv({ cls: "wr-calendar-grid" });

  let closed = false;

  const close = () => {
    if (closed) return;
    closed = true;
    activeDocument.removeEventListener("pointerdown", onOutside, true);
    activeDocument.removeEventListener("keydown", onKeydown, true);
    popover.remove();
    onClose();
  };

  // ポップオーバー外を押したら閉じる。capture 段階で拾って、
  // 日付マスのクリックより先に閉じてしまわないよう内部判定で除外する。
  const onOutside = (e: PointerEvent) => {
    const target = e.target as Node | null;
    if (target && (popover.contains(target) || anchor.contains(target))) {
      return;
    }
    close();
  };

  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  };

  // 週開始曜日（ロケール追従。日本語=日曜始まり、欧州系=月曜始まり等）。
  const weekStart = moment.localeData().firstDayOfWeek();
  const weekdaysMin = moment.localeData().weekdaysMin(); // 日曜起点の7要素

  const renderWeekdays = () => {
    weekdaysRow.empty();
    for (let i = 0; i < 7; i++) {
      const dow = (weekStart + i) % 7;
      weekdaysRow.createSpan({
        cls: "wr-calendar-weekday",
        text: weekdaysMin[dow],
      });
    }
  };

  // 月モード: 月日のカレンダーを描画する。
  const renderMonth = () => {
    monthLabel.setText(viewMonth.format(t("calendar.monthYearFormat")));
    weekdaysRow.setCssStyles({ display: "" });
    grid.removeClass("wr-calendar-grid-years");
    grid.empty();

    const today = moment();
    const monthStart = viewMonth.clone().startOf("month");
    // グリッド先頭まで戻す日数（週開始曜日を起点に揃える）。
    const lead = (monthStart.day() - weekStart + 7) % 7;
    const gridStart = monthStart.clone().subtract(lead, "day");

    for (let i = 0; i < GRID_CELLS; i++) {
      const day = gridStart.clone().add(i, "day");
      const cell = grid.createEl("button", {
        cls: "wr-calendar-day",
        text: String(day.date()),
      });
      if (!day.isSame(viewMonth, "month")) {
        cell.addClass("wr-calendar-day-outside");
      }
      if (day.isSame(today, "day")) {
        cell.addClass("wr-calendar-day-today");
      }
      if (day.isSame(initialDate, "day")) {
        cell.addClass("wr-calendar-day-selected");
      }
      cell.addEventListener("click", () => {
        onSelect(day.clone().startOf("day"));
        close();
      });
    }
  };

  // 年モード: viewMonth の年を含むページの年一覧を描画する。
  const renderYears = () => {
    const today = moment();
    const cur = viewMonth.year();
    // viewMonth の年がページ内に収まるよう、ページ先頭年を算出する。
    const start = cur - (((cur % YEARS_PER_PAGE) + YEARS_PER_PAGE) % YEARS_PER_PAGE);
    monthLabel.setText(`${start} – ${start + YEARS_PER_PAGE - 1}`);
    weekdaysRow.setCssStyles({ display: "none" });
    grid.addClass("wr-calendar-grid-years");
    grid.empty();

    for (let i = 0; i < YEARS_PER_PAGE; i++) {
      const year = start + i;
      const cell = grid.createEl("button", {
        cls: "wr-calendar-year",
        text: String(year),
      });
      // タップ後、月モードへ戻って再描画した日付マスにフォーカスが移って
      // うっすら残るのを防ぐため、フォーカス移動自体を起こさせない。
      cell.addEventListener("pointerdown", (e) => e.preventDefault());
      if (year === today.year()) {
        cell.addClass("wr-calendar-day-today");
      }
      // 今いる年（今カレンダーで見ている年）をオレンジ四角でハイライトする。
      if (year === viewMonth.year()) {
        cell.addClass("wr-calendar-day-selected");
      }
      cell.addEventListener("click", () => {
        // 年だけ変更し、月日は据え置きで月モードに戻る。
        viewMonth = viewMonth.clone().year(year);
        mode = "month";
        render();
        positionPopover();
      });
    }
  };

  const render = () => {
    if (mode === "year") renderYears();
    else renderMonth();
  };

  // 矢印を押すとフォーカスが矢印 → アンカー(カレンダーボタン)へ一瞬移動し、
  // その focus 出入りで Obsidian 標準の focus 背景がチラッと出る。
  // pointerdown を preventDefault してフォーカス移動自体を起こさせない。
  prevBtn.addEventListener("pointerdown", (e) => e.preventDefault());
  nextBtn.addEventListener("pointerdown", (e) => e.preventDefault());
  monthLabel.addEventListener("pointerdown", (e) => e.preventDefault());

  // 矢印の意味はモードで変わる: 月モードは月送り、年モードは年ページ送り。
  prevBtn.addEventListener("click", () => {
    const unit = mode === "year" ? YEARS_PER_PAGE : 1;
    viewMonth = viewMonth.clone().subtract(unit, mode === "year" ? "year" : "month");
    render();
  });
  nextBtn.addEventListener("click", () => {
    const unit = mode === "year" ? YEARS_PER_PAGE : 1;
    viewMonth = viewMonth.clone().add(unit, mode === "year" ? "year" : "month");
    render();
  });

  // 月ラベルを押すと年モードへ切り替え (年モード中に押しても月モードへ戻る)。
  monthLabel.addEventListener("click", () => {
    mode = mode === "year" ? "month" : "year";
    render();
    positionPopover();
  });

  renderWeekdays();
  render();
  positionPopover();

  activeDocument.addEventListener("pointerdown", onOutside, true);
  activeDocument.addEventListener("keydown", onKeydown, true);

  return { close };
}
