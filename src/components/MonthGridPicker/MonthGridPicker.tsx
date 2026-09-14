import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '../icons';
import { useWeekContentDates } from '../../hooks/useWeekContentDates';
import { MONTH_NAMES } from '../../lib/dateUtils';
import { DAY_LETTERS, getMonthEndDate, getMonthGridCells } from '../../lib/weekUtils';
import '../TornPanel.css';
import './MonthGridPicker.css';

interface MonthGridPickerProps {
  /** The day to open showing (and to circle, if its month is the one
   *  displayed) — the grid always starts on this date's month. */
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onClose: () => void;
  /** Days after this are shown greyed-out and unpickable. */
  maxDate?: string;
  /** Whichever of db.ts's getTasksInRange/getDiaryEntriesInRange fits the
   *  caller, for the content dots — plus the matching taskEvents/
   *  diaryEvents subscribe function so dots update live. Both optional:
   *  omit to show no dots. */
  fetchContentInRange?: (start: string, end: string) => Promise<{ date: string }[]>;
  onContentChanged?: (listener: () => void) => () => void;
}

const noContent = async () => [];
const noSubscribe = () => () => {};

// A full month grid styled like a page torn from an antique desk calendar —
// opened from Calendar's date trigger in place of the browser's own native
// date-picker popup, so the "jump to any date" flow stays in the app's own
// aged-paper visual language instead of breaking out to OS chrome.
export function MonthGridPicker({
  selectedDate,
  onSelectDate,
  onClose,
  maxDate,
  fetchContentInRange,
  onContentChanged,
}: MonthGridPickerProps) {
  const [viewYear, setViewYear] = useState(Number(selectedDate.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(Number(selectedDate.slice(5, 7))); // 1-12

  const monthStart = `${viewYear}-${String(viewMonth).padStart(2, '0')}-01`;
  const monthEnd = getMonthEndDate(viewYear, viewMonth);
  const contentDates = useWeekContentDates(
    monthStart,
    monthEnd,
    fetchContentInRange ?? noContent,
    onContentChanged ?? noSubscribe
  );

  const cells = getMonthGridCells(viewYear, viewMonth);
  const todayStr = new Date();
  const today = `${todayStr.getFullYear()}-${String(todayStr.getMonth() + 1).padStart(2, '0')}-${String(todayStr.getDate()).padStart(2, '0')}`;

  function shiftMonth(delta: number) {
    const total = viewYear * 12 + (viewMonth - 1) + delta;
    setViewYear(Math.floor(total / 12));
    setViewMonth((((total % 12) + 12) % 12) + 1);
  }

  return (
    <div className="torn-panel-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="torn-panel" onClick={(e) => e.stopPropagation()}>
        <div className="torn-panel-header">
          <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <ChevronLeftIcon />
          </button>
          <span className="torn-panel-title">
            {MONTH_NAMES[viewMonth - 1]} {viewYear}
          </span>
          <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month">
            <ChevronRightIcon />
          </button>
          <button type="button" className="torn-panel-close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="month-grid-weekdays" aria-hidden="true">
          {DAY_LETTERS.map((letter, i) => (
            <span key={i}>{letter}</span>
          ))}
        </div>

        <div className="month-grid-days">
          {cells.map((cell) => {
            const isSelected = cell.date === selectedDate;
            const isToday = cell.date === today;
            const isDisabled = maxDate !== undefined && cell.date > maxDate;
            return (
              <button
                key={cell.date}
                type="button"
                className={
                  'month-grid-day' +
                  (cell.inMonth ? '' : ' is-outside') +
                  (isSelected ? ' is-selected' : '') +
                  (isToday ? ' is-today' : '')
                }
                disabled={isDisabled}
                onClick={() => onSelectDate(cell.date)}
                aria-label={cell.date}
                aria-current={isSelected ? 'date' : undefined}
              >
                <span className="month-grid-day-number">{Number(cell.date.slice(8, 10))}</span>
                {contentDates.has(cell.date) && <span className="month-grid-day-dot" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
