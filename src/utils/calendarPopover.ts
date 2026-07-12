import { setIcon } from "obsidian";
import { t } from "../i18n";

declare const moment: typeof import("moment");

type Moment = ReturnType<typeof moment>;

export interface CalendarPopoverOptions {
  // Element the popover aligns to (the calendar button).
  anchor: HTMLElement;
  // Parent that actually hosts the popover (view body = wr-container). Placed inside
  // the anchor it would overflow the sidebar when the button sits at the right edge.
  container: HTMLElement;
  // Date used for the initial view and the selected-day highlight.
  initialDate: Moment;
  // Called with the tapped day as a moment at 00:00.
  onSelect: (date: Moment) => void;
  // Cleanup, called on any close (select, outside click, Esc).
  onClose: () => void;
}

export interface CalendarPopoverHandle {
  close: () => void;
}

const GRID_CELLS = 6 * 7; // fixed 6 weeks so the height never changes per month

// Custom calendar popover for jumping to a date. Replaces the OS input[type=date]
// picker for a consistent look on all platforms; date math uses Obsidian's bundled moment.
export function openCalendarPopover(
  opts: CalendarPopoverOptions
): CalendarPopoverHandle {
  const { anchor, container, initialDate, onSelect, onClose } = opts;

  // Month being shown, normalized to its first day.
  let viewMonth = initialDate.clone().startOf("month");

  const popover = container.createDiv({ cls: "wr-calendar-popover" });

  // Place below the button, inside the container: right edge aligns to the anchor
  // but is clamped so it never crosses the container's left edge.
  const GAP = 4; // gap between button and calendar
  const EDGE = 8; // min margin from container edges
  const positionPopover = () => {
    const a = anchor.getBoundingClientRect();
    const c = container.getBoundingClientRect();
    // If wider than the container, shrink the popover itself; cells stretch via CSS grid.
    popover.style.maxWidth = `${c.width - EDGE * 2}px`;
    const w = popover.offsetWidth;
    const top = a.bottom - c.top + GAP;
    const maxLeft = c.width - w - EDGE;
    let left = a.right - c.left - w;
    if (left > maxLeft) left = maxLeft;
    if (left < EDGE) left = EDGE;
    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
  };
  // Don't let clicks bubble to the anchor: its toggle handler would see "already
  // open → close", so pressing a nav arrow would close the popover.
  popover.addEventListener("click", (e) => e.stopPropagation());

  // Display modes: month grid or year list. The month label toggles year mode;
  // picking a year returns to month mode (year jumps, month/day preserved).
  type Mode = "month" | "year";
  let mode: Mode = "month";
  const YEARS_PER_PAGE = 12; // years per page in year mode (fits the grid)

  const header = popover.createDiv({ cls: "wr-calendar-header" });
  const prevBtn = header.createEl("button", { cls: "wr-calendar-nav-btn" });
  setIcon(prevBtn, "chevron-left");
  // The month label is a button: pressing it opens year mode.
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

  // Close on outside press. Captured early, so exclude inside targets to avoid
  // closing before a day cell's click lands.
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

  // Week start follows locale (e.g. ja = Sunday, most of Europe = Monday).
  const weekStart = moment.localeData().firstDayOfWeek();
  const weekdaysMin = moment.localeData().weekdaysMin(); // 7 entries, Sunday-first

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

  const renderMonth = () => {
    monthLabel.setText(viewMonth.format(t("calendar.monthYearFormat")));
    weekdaysRow.setCssStyles({ display: "" });
    grid.removeClass("wr-calendar-grid-years");
    grid.empty();

    const today = moment();
    const monthStart = viewMonth.clone().startOf("month");
    // Days to rewind so the grid starts on the locale's first weekday.
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

  // Year mode: the page of years containing viewMonth's year.
  const renderYears = () => {
    const today = moment();
    const cur = viewMonth.year();
    // Page start year such that viewMonth's year falls within the page.
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
      // Prevent the focus move: after returning to month mode, focus would land on a
      // re-rendered day cell and leave a faint highlight.
      cell.addEventListener("pointerdown", (e) => e.preventDefault());
      if (year === today.year()) {
        cell.addClass("wr-calendar-day-today");
      }
      // Highlight the year currently being viewed in the calendar.
      if (year === viewMonth.year()) {
        cell.addClass("wr-calendar-day-selected");
      }
      cell.addEventListener("click", () => {
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

  // Pressing an arrow briefly moves focus arrow → anchor, flashing Obsidian's focus
  // background; preventDefault on pointerdown stops the focus move entirely.
  prevBtn.addEventListener("pointerdown", (e) => e.preventDefault());
  nextBtn.addEventListener("pointerdown", (e) => e.preventDefault());
  monthLabel.addEventListener("pointerdown", (e) => e.preventDefault());

  // Arrows page by month in month mode, by YEARS_PER_PAGE years in year mode.
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
