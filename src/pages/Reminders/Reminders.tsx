import { useState } from 'react';
import { useOpenTasksByMonth } from '../../hooks/useOpenTasksByMonth';
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
    </section>
  );
}
