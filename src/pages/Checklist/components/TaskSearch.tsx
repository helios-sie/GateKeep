import { useEffect, useState } from 'react';
import { navigateTo } from '../../../hooks/useHashRoute';
import { useTaskSearch } from '../../../hooks/useTaskSearch';
import type { SearchScope } from '../../../hooks/useTaskSearch';
import { formatDateHeading } from '../../../lib/dateUtils';
import './TaskSearch.css';

const SCOPE_LABELS: Record<SearchScope, string> = {
  month: 'This month',
  year: 'This year',
  all: 'Entire calendar',
};
const SCOPES = Object.keys(SCOPE_LABELS) as SearchScope[];

interface TaskSearchProps {
  /** Fires whenever the search box has a non-empty query, so the page can
   *  hide its normal single-date task list while results are showing. */
  onActiveChange?: (active: boolean) => void;
}

// Search bar + scope dropdown + results list, all in one place — kept out of
// TaskList/Editor entirely. When the query is empty this renders just the
// bar; the page below shows its normal current-date task list instead.
export function TaskSearch({ onActiveChange }: TaskSearchProps) {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('month');
  const { active, loading, results } = useTaskSearch(query, scope);

  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);

  function goToTask(date: string) {
    setQuery('');
    // Same deep-link mechanism Reminders uses to jump Checklist to a date.
    navigateTo('checklist', date);
  }

  return (
    <div className="task-search">
      <div className="task-search-bar">
        <input
          type="search"
          className="task-search-input"
          placeholder="Search tasks…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search tasks"
        />
        <select
          className="task-search-scope"
          value={scope}
          onChange={(e) => setScope(e.target.value as SearchScope)}
          aria-label="Search scope"
        >
          {SCOPES.map((key) => (
            <option key={key} value={key}>
              {SCOPE_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      {active && (
        <div className="task-search-results">
          {loading ? (
            <p className="task-search-status">Searching…</p>
          ) : results.length === 0 ? (
            <p className="task-search-status">No matching tasks.</p>
          ) : (
            <ul className="task-search-list">
              {results.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    className="task-search-result"
                    onClick={() => goToTask(task.date)}
                  >
                    <span className="task-search-result-text">{task.text}</span>
                    <span className="task-search-result-date">
                      {' '}
                      — {formatDateHeading(task.date)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
