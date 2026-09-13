import { useEffect, useState } from 'react';
import { SearchResultsList } from '../../../../components/SearchResultsList';
import { navigateTo } from '../../../../hooks/useHashRoute';
import { SEARCH_SCOPE_LABELS, SEARCH_SCOPES } from '../../../../hooks/useDatedSearch';
import type { SearchScope } from '../../../../hooks/useDatedSearch';
import { useDiaryEntrySearch } from '../../../../hooks/useDiaryEntrySearch';
import './DiarySearch.css';

interface DiarySearchProps {
  /** Fires whenever the search box has a non-empty query, so the page can
   *  hide the current entry while results are showing. */
  onActiveChange?: (active: boolean) => void;
}

// Same matching/scoping logic and results list as Checklist's TaskSearch
// (shared via useDatedSearch + SearchResultsList) — only the trigger UI and
// the data source differ: a plain magnifying-glass icon that reveals the
// bar on tap, kept collapsed by default so the normal Diary view stays
// uncluttered, searching diaryEntries instead of tasks.
export function DiarySearch({ onActiveChange }: DiarySearchProps) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('month');
  const { active, loading, results } = useDiaryEntrySearch(query, scope);

  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);

  function toggle() {
    setExpanded((wasExpanded) => {
      if (wasExpanded) setQuery(''); // collapsing clears any in-progress search
      return !wasExpanded;
    });
  }

  function goToEntry(date: string) {
    setQuery('');
    setExpanded(false);
    // Same deep-link mechanism Reminders/TaskSearch use to jump a page to a date.
    navigateTo('diary', date);
  }

  return (
    <div className="diary-search">
      <button
        type="button"
        className="diary-search-toggle"
        onClick={toggle}
        aria-expanded={expanded}
        aria-label={expanded ? 'Close search' : 'Search entries'}
      >
        {expanded ? '✕' : '🔍'}
      </button>

      {expanded && (
        <div className="diary-search-panel">
          <div className="diary-search-bar">
            <input
              type="search"
              className="diary-search-input"
              placeholder="Search entries…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search diary entries"
              autoFocus
            />
            <select
              className="diary-search-scope"
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
            <SearchResultsList
              loading={loading}
              results={results}
              onSelect={goToEntry}
              emptyLabel="No matching entries."
            />
          )}
        </div>
      )}
    </div>
  );
}
