import { DateNav } from '../DateNav/DateNav';
import { TodayButton } from '../TodayButton';
import { addDays, formatDisplay, todayISO } from '../../lib/dateUtils';
import './Calendar.css';

interface CalendarProps {
  date: string;
  onChange: (date: string) => void;
  /** When provided, shows the shared TodayButton (hidden whenever `date`
   *  already is today). Opt-in per page — pass it wherever a "jump back to
   *  today" shortcut makes sense. */
  onToday?: () => void;
}

export function Calendar({ date, onChange, onToday }: CalendarProps) {
  return (
    <DateNav
      onPrev={() => onChange(addDays(date, -1))}
      onNext={() => onChange(addDays(date, 1))}
      nextDisabled={date >= todayISO()}
      prevLabel="Previous day"
      nextLabel="Next day"
    >
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
      <span className="calendar-display-label">{formatDisplay(date)}</span>

      {onToday && <TodayButton date={date} onToday={onToday} />}
    </DateNav>
  );
}
