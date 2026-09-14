import { useEffect, useState } from 'react';
import { SearchResultsList } from '../../../../components/SearchResultsList';
import { CloseIcon, SearchIcon } from '../../../../components/icons';
import { navigateTo } from '../../../../hooks/useHashRoute';
import { SEARCH_SCOPE_LABELS, SEARCH_SCOPES } from '../../../../hooks/useDatedSearch';
import type { SearchScope } from '../../../../hooks/useDatedSearch';
import { useDiaryEntrySearch } from '../../../../hooks/useDiaryEntrySearch';
import './DiarySearch.css';

/** Must match the collapse animation's length in DiarySearch.css. */
const COLLAPSE_MS = 200;

/* Read per call rather than cached: this is only consulted on a tap, so there
 * is no benefit to holding a stale answer if the setting changes mid-session. */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

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
  const [closing, setClosing] = useState(false);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('month');
  const { active, loading, results } = useDiaryEntrySearch(query, scope);

  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);

  /*
   * Collapsing keeps the panel mounted for one animation's length so it can
   * play the reveal in reverse; opening needs no such trick, since a CSS
   * animation runs on mount. The query is cleared immediately on the way out
   * rather than at the end, so results disappear with the panel instead of
   * lingering inside it as it closes.
   */
  useEffect(() => {
    if (!closing) return;
    const t = window.setTimeout(() => {
      setExpanded(false);
      setClosing(false);
    }, COLLAPSE_MS);
    return () => window.clearTimeout(t);
  }, [closing]);

  function toggle() {
    if (expanded && !closing) {
      setQuery('');
      // index.css disables the collapse animation under reduced motion, so
      // holding the panel mounted for its length would just be 200ms of the
      // close doing nothing. Drop it straight out instead.
      if (prefersReducedMotion()) setExpanded(false);
      else setClosing(true);
      return;
    }
    setClosing(false);
    setExpanded(true);
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
        {expanded ? <CloseIcon /> : <SearchIcon />}
      </button>

      {expanded && (
        <div className={closing ? 'diary-search-reveal is-closing' : 'diary-search-reveal'}>
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
        </div>
      )}
    </div>
  );
}
