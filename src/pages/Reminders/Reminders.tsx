import { useState } from 'react';
import { useOpenTasksByMonth } from '../../hooks/useOpenTasksByMonth';
import { useSwipeNavigate } from '../../hooks/useSwipeNavigate';
import { shiftMonth } from '../../lib/dateUtils';
import { DateGroup } from './components/DateGroup/DateGroup';
import { MonthSwitcher } from './components/MonthSwitcher/MonthSwitcher';
import './Reminders.css';

const today = new Date();

// Reminders page — every open task, across all dates, for one calendar
// month at a time. Defaults to the current month; scrolling down moves from
// today backwards through earlier pending days. Read-only: tapping a task
// deep-links to the Checklist page for that date instead of toggling it here.
export function Reminders() {
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const { groups, loading } = useOpenTasksByMonth(year, month);

  // Swipe left/right anywhere on the list to step a month forward/back —
  // the MonthSwitcher arrows above do the same thing and stay as a
  // fallback. Nothing here is row-swipeable (this page is read-only; tap a
  // task to deep-link into Checklist instead), so unlike Checklist there's
  // no gesture to avoid conflicting with.
  const { dragX, dragging, handlers } = useSwipeNavigate({
    onSwipeLeft: () => {
      const next = shiftMonth(year, month, 1);
      setYear(next.year);
      setMonth(next.month);
    },
    onSwipeRight: () => {
      const next = shiftMonth(year, month, -1);
      setYear(next.year);
      setMonth(next.month);
    },
  });

  return (
    <section className="page">
      <MonthSwitcher
        year={year}
        month={month}
        onChange={(y, m) => {
          setYear(y);
          setMonth(m);
        }}
      />

      <div
        className={dragging ? 'swipe-content is-dragging' : 'swipe-content'}
        style={dragging ? { transform: `translateX(${Math.max(-32, Math.min(32, dragX * 0.4))}px)` } : undefined}
        {...handlers}
      >
        {loading ? (
          <p className="reminders-loading">Loading…</p>
        ) : groups.length === 0 ? (
          <div className="reminders-empty">
            <span className="reminders-empty-icon" aria-hidden="true">
              ✓
            </span>
            <p className="reminders-empty-title">Nothing pending</p>
            <p className="reminders-empty-hint">No open tasks this month.</p>
          </div>
        ) : (
          <div className="reminders-list">
            {groups.map((group) => (
              <DateGroup key={group.date} date={group.date} tasks={group.tasks} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
