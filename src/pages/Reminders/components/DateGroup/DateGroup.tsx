import { navigateTo } from '../../../../hooks/useHashRoute';
import { formatDateHeading } from '../../../../lib/dateUtils';
import type { Task } from '../../../../types/task';
import './DateGroup.css';

interface DateGroupProps {
  date: string;
  tasks: Task[];
}

// One date's worth of open tasks. Read-only here — tapping a task never
// toggles or edits it, it only deep-links to that date on the Checklist page.
export function DateGroup({ date, tasks }: DateGroupProps) {
  return (
    <div className="date-group">
      <h3 className="date-group-heading">{formatDateHeading(date)}</h3>

      <ul className="date-group-list">
        {tasks.map((task) => (
          <li key={task.id}>
            <button
              type="button"
              className="date-group-task"
              onClick={() => navigateTo('checklist', date)}
            >
              {task.text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
