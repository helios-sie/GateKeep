import { useEffect, useState } from 'react';
import { SearchResultsList } from '../../../components/SearchResultsList';
import { navigateTo } from '../../../hooks/useHashRoute';
import { SEARCH_SCOPE_LABELS, SEARCH_SCOPES } from '../../../hooks/useDatedSearch';
import type { SearchScope } from '../../../hooks/useDatedSearch';
import { useTaskSearch } from '../../../hooks/useTaskSearch';
import './TaskSearch.css';

interface TaskSearchProps {
  /** Fires whenever the search box has a non-empty query, so the page can
   *  hide its normal single-date task list while results are showing. */
  onActiveChange?: (active: boolean) => void;
}

// Search bar + scope dropdown + results list, all in one place — kept out of
// TaskList/Editor entirely. When the query is empty this renders just the
// bar; the page below shows its normal current-date task list instead.
// The matching/scoping/results-list pieces are shared with Diary's search.
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
          {SEARCH_SCOPES.map((key) => (
            <option key={key} value={key}>
              {SEARCH_SCOPE_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      {active && (
        <div className="task-search-results">
          <SearchResultsList
            loading={loading}
            results={results}
            onSelect={goToTask}
            emptyLabel="No matching tasks."
          />
        </div>
      )}
    </div>
  );
}
