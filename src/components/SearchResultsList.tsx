import { formatDateHeading } from '../lib/dateUtils';
import './SearchResultsList.css';

const SNIPPET_LIMIT = 90;

function snippet(text: string): string {
  const trimmed = text.trim();
  return trimmed.length > SNIPPET_LIMIT ? `${trimmed.slice(0, SNIPPET_LIMIT)}…` : trimmed;
}

interface SearchResultItem {
  id: string;
  date: string;
  text: string;
}

interface SearchResultsListProps {
  loading: boolean;
  results: SearchResultItem[];
  onSelect: (date: string) => void;
  /** Shown when there's a query but nothing matched. */
  emptyLabel?: string;
}

// Shared by Checklist's and Diary's search: "<snippet> — <date>" rows,
// tapping one hands the date back to the caller to deep-link with.
export function SearchResultsList({
  loading,
  results,
  onSelect,
  emptyLabel = 'No matches.',
}: SearchResultsListProps) {
  if (loading) {
    return <p className="search-results-status">Searching…</p>;
  }

  if (results.length === 0) {
    return <p className="search-results-status">{emptyLabel}</p>;
  }

  return (
    <ul className="search-results-list">
      {results.map((item) => (
        <li key={item.id}>
          <button type="button" className="search-result" onClick={() => onSelect(item.date)}>
            <span className="search-result-text">{snippet(item.text)}</span>
            <span className="search-result-date"> — {formatDateHeading(item.date)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
