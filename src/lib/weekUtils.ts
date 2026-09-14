import { addDays } from './dateUtils';

/** Sunday-first day-of-week letters, matching getWeekDates' order. */
export const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** The 7 ISO dates (Sunday-Saturday) of the calendar week containing
 *  `dateISO`, in order. */
export function getWeekDates(dateISO: string): string[] {
  const dayOfWeek = new Date(dateISO + 'T00:00:00').getDay(); // 0=Sun..6=Sat
  const weekStart = addDays(dateISO, -dayOfWeek);
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export interface MonthGridCell {
  date: string;
  /** false for the leading/trailing days from adjacent months shown to
   *  fill out a full 6-row grid — still a real, selectable date, just
   *  rendered dimmer since it's outside the viewed month. */
  inMonth: boolean;
}

/** 42 cells (6 rows x 7 cols, Sunday-first) covering every calendar week
 *  that touches (year, month) — the leading/trailing adjacent-month days
 *  included so the grid is always a clean rectangle. `month` is 1-12. */
export function getMonthGridCells(year: number, month: number): MonthGridCell[] {
  const firstOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
  const firstDow = new Date(firstOfMonth + 'T00:00:00').getDay();
  const gridStart = addDays(firstOfMonth, -firstDow);
  return Array.from({ length: 42 }, (_, i) => {
    const date = addDays(gridStart, i);
    return { date, inMonth: Number(date.slice(5, 7)) === month };
  });
}

/** Last day-of-month's date string for (year, month), e.g. "2026-02-28". */
export function getMonthEndDate(year: number, month: number): string {
  const daysInMonth = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
}
