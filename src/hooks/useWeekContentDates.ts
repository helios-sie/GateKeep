import { useCallback, useEffect, useState } from 'react';

/**
 * Which of the 7 dates in [startDate, endDate] have at least one row —
 * drives the week-strip's small content dot. `fetchRange` is whichever of
 * db.ts's getTasksInRange/getDiaryEntriesInRange fits the caller; `onChange`
 * is the matching taskEvents/diaryEvents subscribe function, so the dots
 * update live if something elsewhere in the app writes to the same store
 * (e.g. Reminders' week-strip reacting to a task added on Checklist).
 */
export function useWeekContentDates<T extends { date: string }>(
  startDate: string,
  endDate: string,
  fetchRange: (start: string, end: string) => Promise<T[]>,
  onChange: (listener: () => void) => () => void,
  /** Only rows passing this also count — e.g. Reminders only cares about
   *  open tasks, not done ones. Defaults to "every row counts". */
  filter: (row: T) => boolean = () => true
): Set<string> {
  const [dates, setDates] = useState<Set<string>>(new Set());

  const reload = useCallback(async () => {
    const rows = await fetchRange(startDate, endDate);
    setDates(new Set(rows.filter(filter).map((r) => r.date)));
    // fetchRange/filter are recreated each render by callers (inline
    // closures) — depending only on the date bounds avoids refetching every
    // render while still refetching whenever the visible week actually
    // changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => onChange(reload), [onChange, reload]);

  return dates;
}
