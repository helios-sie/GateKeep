import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '../icons';
import { MONTH_NAMES } from '../../lib/dateUtils';
import '../TornPanel.css';
import './MonthYearPicker.css';

interface MonthYearPickerProps {
  /** 1-12 */
  month: number;
  year: number;
  onSelect: (year: number, month: number) => void;
  onClose: () => void;
}

const MONTH_ABBR = MONTH_NAMES.map((name) => name.slice(0, 3));

// Reminders' equivalent of MonthGridPicker — same torn desk-calendar-page
// panel (shared via ../TornPanel.css), but picking a month+year instead of
// a day: a year stepper up top, a 4x3 grid of month names below. The
// browsed month/year gets the same solid ink-stamp treatment as a selected
// day elsewhere; the real current month (if its year is the one showing)
// gets the same thin open ring "today" gets on the day grid.
export function MonthYearPicker({ month, year, onSelect, onClose }: MonthYearPickerProps) {
  const [viewYear, setViewYear] = useState(year);

  const now = new Date();
  const realYear = now.getFullYear();
  const realMonth = now.getMonth() + 1;

  return (
    <div className="torn-panel-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="torn-panel" onClick={(e) => e.stopPropagation()}>
        <div className="torn-panel-header">
          <button type="button" onClick={() => setViewYear((y) => y - 1)} aria-label="Previous year">
            <ChevronLeftIcon />
          </button>
          <span className="torn-panel-title">{viewYear}</span>
          <button type="button" onClick={() => setViewYear((y) => y + 1)} aria-label="Next year">
            <ChevronRightIcon />
          </button>
          <button type="button" className="torn-panel-close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="month-year-grid">
          {MONTH_ABBR.map((label, i) => {
            const m = i + 1;
            const isSelected = viewYear === year && m === month;
            const isRealCurrent = viewYear === realYear && m === realMonth;
            return (
              <button
                key={label}
                type="button"
                className={
                  'month-year-cell' +
                  (isSelected ? ' is-selected' : '') +
                  (isRealCurrent ? ' is-current' : '')
                }
                onClick={() => {
                  onSelect(viewYear, m);
                  onClose();
                }}
                aria-current={isSelected ? 'date' : undefined}
              >
                <span className="month-year-cell-label">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
