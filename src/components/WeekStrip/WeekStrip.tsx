import { useRef } from 'react';
import { TodayButton } from '../TodayButton';
import { CalendarIcon } from '../icons';
import { formatDisplay, todayISO } from '../../lib/dateUtils';
import { DAY_LETTERS, getWeekDates } from '../../lib/weekUtils';
import './WeekStrip.css';

interface WeekStripProps {
  /** The day this strip shows as "current" — determines which Sun-Sat week
   *  is displayed and which day-tab gets the selected stamp. */
  selectedDate: string;
  onSelectDate: (date: string) => void;
  /** Dates (yyyy-MM-dd) that should show a small content dot. */
  contentDates: Set<string>;
  /** Days after this are shown greyed-out and unpickable — mirrors the old
   *  Calendar's `max` on its date input. Omit to allow any date. */
  maxDate?: string;
  /** When provided, shows the shared TodayButton (hidden once `selectedDate`
   *  already is today) — same opt-in convention Calendar used. */
  onToday?: () => void;
}

// Horizontal week-strip replacing Calendar's arrows + single date display.
// Shows the Sunday-Saturday week containing `selectedDate` as day-tabs
// (letter + number); tapping one jumps straight to that date. The
// currently-selected day gets a hand-stamped ring in the accent color
// rather than a flat fill, and any day with content (a task or diary entry,
// per whatever `contentDates` the caller computed) gets a small dot. The
// calendar-icon button still opens the native date-picker for jumping
// outside the visible week, exactly like Calendar did.
export function WeekStrip({ selectedDate, onSelectDate, contentDates, maxDate, onToday }: WeekStripProps) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const days = getWeekDates(selectedDate);

  function openPicker() {
    const el = pickerRef.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') el.showPicker();
    else el.focus();
  }

  return (
    <div className="week-strip">
      <div className="week-strip-header">
        <span className="week-strip-label">{formatDisplay(selectedDate)}</span>
        <div className="week-strip-header-actions">
          {onToday && <TodayButton hidden={selectedDate === todayISO()} onClick={onToday} />}
          <button
            type="button"
            className="week-strip-calendar-btn"
            onClick={openPicker}
            aria-label="Pick a date"
          >
            <CalendarIcon />
          </button>
          <input
            ref={pickerRef}
            type="date"
            className="week-strip-hidden-input"
            value={selectedDate}
            max={maxDate}
            onChange={(e) => {
              if (e.target.value) onSelectDate(e.target.value);
            }}
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="week-strip-days">
        {days.map((date, i) => {
          const isSelected = date === selectedDate;
          const isToday = date === todayISO();
          const isDisabled = maxDate !== undefined && date > maxDate;
          return (
            <button
              key={date}
              type="button"
              className={
                'week-strip-day' +
                (isSelected ? ' is-selected' : '') +
                (isToday ? ' is-today' : '')
              }
              disabled={isDisabled}
              onClick={() => onSelectDate(date)}
              aria-label={formatDisplay(date)}
              aria-current={isSelected ? 'date' : undefined}
            >
              <span className="week-strip-day-letter">{DAY_LETTERS[i]}</span>
              <span className="week-strip-day-number">{Number(date.slice(8, 10))}</span>
              {contentDates.has(date) && <span className="week-strip-day-dot" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
