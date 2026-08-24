declare const moment: typeof import("moment");

type Moment = ReturnType<typeof moment>;

export interface DateDrumOptions {
  // Earliest day the drums may come to rest on, and the day they start on.
  earliest: Moment;
  // Last year the year drum reaches.
  lastYear: number;
  // Called with the day at 00:00 whenever the drums come to rest somewhere new.
  onChange: (date: Moment) => void;
}

// A drum settles by scroll snapping, and browsers report that through the same
// scroll events as the roll itself. This is the quiet spell that tells "still
// moving" from "come to rest".
const SETTLE_MS = 90;

/**
 * Three drums — year, month, day — rolled to a date. Built for a narrow shell: the
 * columns need no width to speak of, so the whole thing sits inside a menu, which is
 * what gives it its placement on each platform.
 *
 * Scroll snapping does the physical work; this only reads which row came to rest in
 * the middle. Days that are already gone stay on the drums, greyed: a drum that ends
 * where the allowed range ends reads as broken, and seeing the days roll past is part
 * of knowing where you are. Coming to rest on one is what is refused — the drum rolls
 * on to the nearest day it may stop at.
 */
export function buildDateDrum(host: HTMLElement, opts: DateDrumOptions): void {
  const { earliest, lastYear, onChange } = opts;

  const yearValues: number[] = [];
  for (let y = moment().year(); y <= lastYear; y++) yearValues.push(y);
  const monthValues = Array.from({ length: 12 }, (_, i) => i);

  let year = earliest.year();
  let month = earliest.month();
  let day = earliest.date();

  const drums = host.createDiv({ cls: "wr-drum-row" });
  const yearCol = drums.createDiv({ cls: "wr-drum-col wr-drum-col-year" });
  const monthCol = drums.createDiv({ cls: "wr-drum-col" });
  const dayCol = drums.createDiv({ cls: "wr-drum-col" });

  const monthNames = moment.localeData().monthsShort();

  const daysInMonth = (y: number, m: number): number =>
    moment({ year: y, month: m, day: 1 }).daysInMonth();

  const dayValues = (): number[] =>
    Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1);

  // A whole year or month counts as reachable while any day inside it still is.
  const yearAllowed = (y: number): boolean => y >= earliest.year();
  const monthAllowed = (m: number): boolean => year > earliest.year() || m >= earliest.month();
  const dayAllowed = (d: number): boolean =>
    year > earliest.year() ||
    month > earliest.month() ||
    d >= earliest.date();

  const rowHeight = (col: HTMLElement): number => {
    const first = col.querySelector<HTMLElement>(".wr-drum-item");
    return first?.offsetHeight || 1;
  };

  const scrollToIndex = (col: HTMLElement, index: number): void => {
    col.scrollTop = index * rowHeight(col);
  };

  const indexAt = (col: HTMLElement): number => Math.round(col.scrollTop / rowHeight(col));

  /**
   * Fills a column: the rows that are still reachable scroll, and the ones already
   * gone live inside the top padding instead. The padding is the run-up the first
   * row needs to reach the middle, and it does not scroll on its own, so those rows
   * show through above the band while the drum simply cannot roll on to them.
   */
  const fillColumn = (
    col: HTMLElement,
    pastLabels: string[],
    labels: string[],
    selectedIndex: number
  ): void => {
    col.empty();
    const pad = col.createDiv({ cls: "wr-drum-pad wr-drum-pad-top" });
    for (const label of pastLabels) {
      pad.createDiv({ cls: "wr-drum-item wr-drum-item-disabled", text: label });
    }
    for (const label of labels) {
      col.createDiv({ cls: "wr-drum-item", text: label });
    }
    col.createDiv({ cls: "wr-drum-pad" });
    // Layout has to exist before a row height can be measured, so placement waits a frame.
    window.setTimeout(() => scrollToIndex(col, selectedIndex), 0);
  };

  /** Splits values into the ones already gone and the ones still reachable. */
  const split = <T,>(values: T[], allowed: (v: T) => boolean): [T[], T[]] => [
    values.filter((v) => !allowed(v)),
    values.filter(allowed),
  ];

  const renderYears = (): void => {
    const [past, live] = split(yearValues, yearAllowed);
    fillColumn(yearCol, past.map(String), live.map(String), Math.max(0, live.indexOf(year)));
  };

  const renderMonths = (): void => {
    const [past, live] = split(monthValues, monthAllowed);
    fillColumn(
      monthCol,
      past.map((m) => monthNames[m]),
      live.map((m) => monthNames[m]),
      Math.max(0, live.indexOf(month))
    );
  };

  const renderDays = (): void => {
    const [past, live] = split(dayValues(), dayAllowed);
    // A short month cannot hold a day rolled to on a longer one; keep the last.
    if (day > live[live.length - 1]) day = live[live.length - 1];
    fillColumn(dayCol, past.map(String), live.map(String), Math.max(0, live.indexOf(day)));
  };

  const current = (): Moment => moment({ year, month, day }).startOf("day");

  // Fires once the drum has stopped, not on every frame of the roll.
  const onSettle = (col: HTMLElement, handle: (index: number) => void): void => {
    let timer = 0;
    col.addEventListener("scroll", () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => handle(indexAt(col)), SETTLE_MS);
    });
  };

  const pick = <T,>(values: T[], index: number): T =>
    values[Math.min(Math.max(index, 0), values.length - 1)];

  renderYears();
  renderMonths();
  renderDays();

  onSettle(yearCol, (index) => {
    year = pick(yearValues.filter(yearAllowed), index);
    // Rolling back to this year can strand the two drums below it — December of a
    // later year has no counterpart in a year that is already half spent. Pull them
    // up first, then redraw so both land on a row they are allowed to rest on.
    if (year === earliest.year() && month < earliest.month()) month = earliest.month();
    if (year === earliest.year() && month === earliest.month() && day < earliest.date()) {
      day = earliest.date();
    }
    renderMonths();
    renderDays();
    onChange(current());
  });
  onSettle(monthCol, (index) => {
    month = pick(monthValues.filter(monthAllowed), index);
    if (year === earliest.year() && month === earliest.month() && day < earliest.date()) {
      day = earliest.date();
    }
    renderDays();
    onChange(current());
  });
  onSettle(dayCol, (index) => {
    day = pick(dayValues().filter(dayAllowed), index);
    onChange(current());
  });

  onChange(current());
}
