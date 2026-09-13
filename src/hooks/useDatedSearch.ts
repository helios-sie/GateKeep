import { useEffect, useMemo, useState } from 'react';

// Shared keyword + scope search over any dated, text-bearing store (tasks,
// diary entries, ...). This is the one place the matching/scoping logic
// lives — useTaskSearch and useDiaryEntrySearch are thin wrappers around it
// that only supply *which* store to read.

export type SearchScope = 'month' | 'year' | 'all';

export const SEARCH_SCOPE_LABELS: Record<SearchScope, string> = {
  month: 'This month',
  year: 'This year',
  all: 'Entire calendar',
};

export const SEARCH_SCOPES = Object.keys(SEARCH_SCOPE_LABELS) as SearchScope[];

interface Dated {
  date: string;
  text: string;
  createdAt: number;
}

function inScope(dateISO: string, scope: SearchScope, today: Date): boolean {
  if (scope === 'all') return true;
  const year = Number(dateISO.slice(0, 4));
  if (scope === 'year') return year === today.getFullYear();
  const month = Number(dateISO.slice(5, 7));
  return year === today.getFullYear() && month === today.getMonth() + 1;
}

/**
 * Fetches the whole store only once a query is actually typed (not on every
 * keystroke), then filters/sorts in-memory as the query or scope changes.
 * `fetchAll` should be a stable function reference (e.g. a plain export from
 * db.ts) — its identity is a hook dependency.
 */
export function useDatedSearch<T extends Dated>(
  query: string,
  scope: SearchScope,
  fetchAll: () => Promise<T[]>
) {
  const active = query.trim().length > 0;
  const [all, setAll] = useState<T[] | null>(null);

  useEffect(() => {
    if (!active) {
      setAll(null); // drop the cache so re-opening search re-fetches
      return;
    }
    let cancelled = false;
    fetchAll().then((rows) => {
      if (!cancelled) setAll(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [active, fetchAll]);

  const results = useMemo(() => {
    if (!active || !all) return [];
    const needle = query.trim().toLowerCase();
    const today = new Date();
    return all
      .filter((item) => inScope(item.date, scope, today) && item.text.toLowerCase().includes(needle))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));
  }, [active, all, query, scope]);

  return { active, loading: active && all === null, results };
}
