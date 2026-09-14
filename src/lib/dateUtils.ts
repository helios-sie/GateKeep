export function todayISO(): string {
  return toISO(new Date());
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Parses an ISO date string, falling back to today for anything that isn't
// one — e.g. "" from a cleared <input type="date">, or any other malformed
// value. Without this, an invalid date silently produces a Date whose fields
// are all NaN, which then serializes to the literal string "NaN-NaN-NaN" and
// gets fed right back into a date input as its `value`.
function parseISO(dateISO: string): Date {
  const d = new Date(dateISO + 'T00:00:00');
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export function addDays(dateISO: string, delta: number): string {
  const d = parseISO(dateISO);
  d.setDate(d.getDate() + delta);
  return toISO(d);
}

export function formatDisplay(dateISO: string): string {
  return parseISO(dateISO).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** e.g. "September 9, 2026" — used for Reminders' date-group headings. */
export function formatDateHeading(dateISO: string): string {
  return parseISO(dateISO).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Shifts (year, month) by `delta` months, wrapping/carrying the year as
 *  needed. `month` is 1-12 in and out. Shared by MonthSwitcher's arrows and
 *  Reminders' swipe-to-change-month gesture, so both agree on the math. */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (((total % 12) + 12) % 12) + 1 };
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
