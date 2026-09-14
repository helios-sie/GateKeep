import type { ReactNode } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../icons';
import './DateNav.css';

interface DateNavProps {
  onPrev: () => void;
  onNext: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  prevLabel: string;
  nextLabel: string;
  /** The current-value display — a day (Calendar) or a month/year picker
   *  (MonthSwitcher). The only thing that differs between pages. */
  children: ReactNode;
}

// Shared chrome for every page's date navigation header — Checklist/Diary's
// Calendar and Reminders' MonthSwitcher both render this, so the arrow
// buttons, spacing, fonts, and colors are pixel-identical everywhere; only
// the center content differs by page. Swiping the page's own main content
// (see useSwipeNavigate) is the primary way to move between dates/months
// now — these arrows remain as a secondary, always-discoverable fallback
// (useful on desktop, or for anyone who'd rather tap than swipe).
export function DateNav({
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
  prevLabel,
  nextLabel,
  children,
}: DateNavProps) {
  return (
    <div className="date-nav">
      <button
        type="button"
        className="date-nav-arrow"
        onClick={onPrev}
        disabled={prevDisabled}
        aria-label={prevLabel}
      >
        <ChevronLeftIcon />
      </button>

      <div className="date-nav-current">{children}</div>

      <button
        type="button"
        className="date-nav-arrow"
        onClick={onNext}
        disabled={nextDisabled}
        aria-label={nextLabel}
      >
        <ChevronRightIcon />
      </button>
    </div>
  );
}
