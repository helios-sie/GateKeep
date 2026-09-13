import { addDays, formatDisplay, todayISO } from '../../lib/dateUtils';
import './Calendar.css';

interface CalendarProps {
  date: string;
  onChange: (date: string) => void;
  /** When provided, shows a "Today" quick-jump button — hidden whenever
   *  `date` already is today. Opt-in per page: Diary doesn't pass this, so
   *  it never renders there; only Checklist does. */
  onToday?: () => void;
}

export function Calendar({ date, onChange, onToday }: CalendarProps) {
  const isToday = date === todayISO();

  return (
    <div className="calendar">
      <button onClick={() => onChange(addDays(date, -1))} aria-label="Previous day">
        ←
      </button>

      <div className="calendar-current">
        <input
          type="date"
          value={date}
          max={todayISO()}
          onChange={(e) => {
            // Ignore a clear/incomplete edit (empty value) instead of
            // adopting it as the selected date — an empty string is not a
            // valid yyyy-MM-dd and would poison every date computed from it.
            if (e.target.value) onChange(e.target.value);
          }}
        />
        <span>{formatDisplay(date)}</span>

        {onToday && !isToday && (
          <button type="button" className="calendar-today" onClick={onToday}>
            Today
          </button>
        )}
      </div>

      <button
        onClick={() => onChange(addDays(date, 1))}
        disabled={date >= todayISO()}
        aria-label="Next day"
      >
        →
      </button>
    </div>
  );
}
