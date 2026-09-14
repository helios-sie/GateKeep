import { DateNav } from '../../../../components/DateNav/DateNav';
import { MONTH_NAMES, shiftMonth } from '../../../../lib/dateUtils';
import './MonthSwitcher.css';

interface MonthSwitcherProps {
  year: number;
  /** 1-12 */
  month: number;
  onChange: (year: number, month: number) => void;
}

// Lets the user jump directly to any month/year (the two <select>s), or step
// one month at a time with the shared DateNav arrows (same chrome Calendar
// uses for Checklist/Diary).
export function MonthSwitcher({ year, month, onChange }: MonthSwitcherProps) {
  const thisYear = new Date().getFullYear();
  const yearOptions = Array.from(
    new Set([...Array.from({ length: 8 }, (_, i) => thisYear - 6 + i), year])
  ).sort((a, b) => a - b);

  function shift(delta: number) {
    const next = shiftMonth(year, month, delta);
    onChange(next.year, next.month);
  }

  return (
    <DateNav
      onPrev={() => shift(-1)}
      onNext={() => shift(1)}
      prevLabel="Previous month"
      nextLabel="Next month"
    >
      <div className="month-switcher-selects">
        <select
          value={month}
          onChange={(e) => onChange(year, Number(e.target.value))}
          aria-label="Month"
        >
          {MONTH_NAMES.map((name, i) => (
            <option key={name} value={i + 1}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => onChange(Number(e.target.value), month)}
          aria-label="Year"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </DateNav>
  );
}
