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
