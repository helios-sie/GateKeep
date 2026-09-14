import { WeekStrip } from '../WeekStrip/WeekStrip';
import { todayISO } from '../../lib/dateUtils';

interface CalendarProps {
  date: string;
  onChange: (date: string) => void;
  /** When provided, shows the shared TodayButton (hidden whenever `date`
   *  already is today). Opt-in per page — pass it wherever a "jump back to
   *  today" shortcut makes sense. */
  onToday?: () => void;
  /** Dates (yyyy-MM-dd) in the visible week that should show a content dot
   *  — the caller knows whether that's "has a task" or "has a diary entry".
   *  Defaults to none. */
  contentDates?: Set<string>;
}

// experiment: week-strip in place of the old arrows + single date display.
export function Calendar({ date, onChange, onToday, contentDates }: CalendarProps) {
  return (
    <WeekStrip
      selectedDate={date}
      onSelectDate={onChange}
      contentDates={contentDates ?? new Set()}
      maxDate={todayISO()}
      onToday={onToday}
    />
  );
}
