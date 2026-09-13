import { useEffect, useMemo, useState } from 'react';
import { getAllTasks } from '../lib/db';
import type { Task } from '../types/task';

export type SearchScope = 'month' | 'year' | 'all';

function inScope(dateISO: string, scope: SearchScope, today: Date): boolean {
  if (scope === 'all') return true;
  const year = Number(dateISO.slice(0, 4));
  if (scope === 'year') return year === today.getFullYear();
  const month = Number(dateISO.slice(5, 7));
  return year === today.getFullYear() && month === today.getMonth() + 1;
}

// Backs the Checklist search bar. Fetches the whole "tasks" store only once
// a query is actually typed (not on every keystroke), then filters/sorts
// in-memory as the query or scope changes. Any status matches — search finds
// tasks regardless of open/done.
export function useTaskSearch(query: string, scope: SearchScope) {
  const active = query.trim().length > 0;
  const [allTasks, setAllTasks] = useState<Task[] | null>(null);

  useEffect(() => {
    if (!active) {
      setAllTasks(null); // drop the cache so re-opening search re-fetches
      return;
    }
    let cancelled = false;
    getAllTasks().then((rows) => {
      if (!cancelled) setAllTasks(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [active]);

  const results = useMemo(() => {
    if (!active || !allTasks) return [];
    const needle = query.trim().toLowerCase();
    const today = new Date();
    return allTasks
      .filter((task) => inScope(task.date, scope, today) && task.text.toLowerCase().includes(needle))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));
  }, [active, allTasks, query, scope]);

  return { active, loading: active && allTasks === null, results };
}
