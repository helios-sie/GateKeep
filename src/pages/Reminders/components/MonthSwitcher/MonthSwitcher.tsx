import { useState } from 'react';
import { DateNav } from '../../../../components/DateNav/DateNav';
import { MonthYearPicker } from '../../../../components/MonthYearPicker/MonthYearPicker';
import { TodayButton } from '../../../../components/TodayButton';
import { CalendarIcon } from '../../../../components/icons';
import { MONTH_NAMES, shiftMonth } from '../../../../lib/dateUtils';

interface MonthSwitcherProps {
  year: number;
  /** 1-12 */
  month: number;
  onChange: (year: number, month: number) => void;
}

const today = new Date();
const THIS_YEAR = today.getFullYear();
const THIS_MONTH = today.getMonth() + 1;

// Reminders' equivalent of Checklist/Diary's Calendar: the same DateNav
// arrows/spacing/border, and a date-trigger button (calendar icon + label)
// that opens a picker overlay in the app's own aged-paper style instead of
// raw <select> dropdowns — MonthYearPicker, the month-grid analogue of
// MonthGridPicker. "This Month" is the shared TodayButton, just relabeled,
// since Reminders has no single "today" the way a day-scoped page does.
export function MonthSwitcher({ year, month, onChange }: MonthSwitcherProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  function shift(delta: number) {
    const next = shiftMonth(year, month, delta);
    onChange(next.year, next.month);
  }

  return (
    <>
      <DateNav
        onPrev={() => shift(-1)}
        onNext={() => shift(1)}
        prevLabel="Previous month"
        nextLabel="Next month"
      >
        <button
          type="button"
          className="date-nav-trigger"
          onClick={() => setPickerOpen(true)}
          aria-haspopup="dialog"
        >
          <CalendarIcon />
          <span className="date-nav-trigger-label">
            {MONTH_NAMES[month - 1]} {year}
          </span>
        </button>

        <TodayButton
          label="This Month"
          hidden={year === THIS_YEAR && month === THIS_MONTH}
          onClick={() => onChange(THIS_YEAR, THIS_MONTH)}
        />
      </DateNav>

      {pickerOpen && (
        <MonthYearPicker
          year={year}
          month={month}
          onSelect={onChange}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}
