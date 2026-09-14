import { useState } from 'react';
import { DateNav } from '../DateNav/DateNav';
import { MonthGridPicker } from '../MonthGridPicker/MonthGridPicker';
import { TodayButton } from '../TodayButton';
import { CalendarIcon } from '../icons';
import { addDays, formatDisplay, todayISO } from '../../lib/dateUtils';

interface CalendarProps {
  date: string;
  onChange: (date: string) => void;
  /** When provided, shows the shared TodayButton (hidden whenever `date`
   *  already is today). Opt-in per page — pass it wherever a "jump back to
   *  today" shortcut makes sense. */
  onToday?: () => void;
  /** For the month-grid picker's content dots — whichever of db.ts's
   *  getTasksInRange/getDiaryEntriesInRange fits the caller, plus the
   *  matching taskEvents/diaryEvents subscribe function so the dots update
   *  live. Both optional: omit to show no dots. */
  fetchContentInRange?: (start: string, end: string) => Promise<{ date: string }[]>;
  onContentChanged?: (listener: () => void) => () => void;
}

// experiment 2: back to a simple single-date + arrows display (DateNav) —
// the always-visible week-strip is gone. Tapping the date (or its calendar
// icon) opens MonthGridPicker, an in-app "torn desk-calendar page" grid, in
// place of the browser's native date-picker popup.
export function Calendar({ date, onChange, onToday, fetchContentInRange, onContentChanged }: CalendarProps) {
  const [gridOpen, setGridOpen] = useState(false);

  return (
    <>
      <DateNav
        onPrev={() => onChange(addDays(date, -1))}
        onNext={() => onChange(addDays(date, 1))}
        nextDisabled={date >= todayISO()}
        prevLabel="Previous day"
        nextLabel="Next day"
      >
        <button
          type="button"
          className="date-nav-trigger"
          onClick={() => setGridOpen(true)}
          aria-haspopup="dialog"
        >
          <CalendarIcon />
          <span className="date-nav-trigger-label">{formatDisplay(date)}</span>
        </button>

        {onToday && <TodayButton hidden={date === todayISO()} onClick={onToday} />}
      </DateNav>

      {gridOpen && (
        <MonthGridPicker
          selectedDate={date}
          onSelectDate={(d) => {
            onChange(d);
            setGridOpen(false);
          }}
          onClose={() => setGridOpen(false)}
          maxDate={todayISO()}
          fetchContentInRange={fetchContentInRange}
          onContentChanged={onContentChanged}
        />
      )}
    </>
  );
}
