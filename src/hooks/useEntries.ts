import { useCallback, useEffect, useState } from 'react';
import { deleteEntry, getEntriesByDate, saveEntry } from '../lib/db';
import type { DiaryEntry, StatusFilter, TaskStatus } from '../types/entry';

export function useEntries(date: string) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const rows = await getEntriesByDate(date);
    rows.sort((a, b) => a.createdAt - b.createdAt);
    setEntries(rows);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addEntry = useCallback(
    async (text: string, photoIds: string[] = []) => {
      const now = Date.now();
      const entry: DiaryEntry = {
        id: crypto.randomUUID(),
        date,
        text,
        status: 'open',
        photoIds,
        createdAt: now,
        updatedAt: now,
      };
      await saveEntry(entry);
      await reload();
    },
    [date, reload]
  );

  const updateStatus = useCallback(
    async (id: string, status: TaskStatus) => {
      const target = entries.find((e) => e.id === id);
      if (!target) return;
      await saveEntry({ ...target, status, updatedAt: Date.now() });
      await reload();
    },
    [entries, reload]
  );

  const removeEntry = useCallback(
    async (id: string) => {
      await deleteEntry(id);
      await reload();
    },
    [reload]
  );

  const visibleEntries = entries.filter((e) => filter === 'all' || e.status === filter);

  return { entries: visibleEntries, allEntries: entries, filter, setFilter, loading, addEntry, updateStatus, removeEntry };
}
