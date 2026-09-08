import { useCallback, useEffect, useState } from 'react';
import { deleteDiaryEntry, getDiaryEntriesByDate, saveDiaryEntry } from '../lib/db';
import type { DiaryEntry } from '../types/diaryEntry';

// Bridges the "diaryEntries" store (src/lib/db.ts) to React state for the
// Diary page. Knows nothing about tasks or their status.
export function useDiaryEntries(date: string) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const rows = await getDiaryEntriesByDate(date);
    rows.sort((a, b) => a.createdAt - b.createdAt);
    setEntries(rows);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addEntry = useCallback(
    async (text: string) => {
      const entry: DiaryEntry = {
        id: crypto.randomUUID(),
        date,
        text,
        createdAt: Date.now(),
      };
      await saveDiaryEntry(entry);
      await reload();
    },
    [date, reload]
  );

  const removeEntry = useCallback(
    async (id: string) => {
      await deleteDiaryEntry(id);
      await reload();
    },
    [reload]
  );

  return { entries, loading, addEntry, removeEntry };
}
