import { addDays, formatDisplay, todayISO } from '../../lib/dateUtils';
import './Calendar.css';

interface CalendarProps {
  date: string;
  onChange: (date: string) => void;
}

export function Calendar({ date, onChange }: CalendarProps) {
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
