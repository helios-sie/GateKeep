import { useCallback, useEffect, useState } from 'react';
import { getDiaryEntriesByDate, saveDiaryEntry } from '../lib/db';
import type { DiaryEntry } from '../types/diaryEntry';

// The Diary page is one-entry-per-date, like a real journal page. This hook
// bridges the "diaryEntries" store to that model: at most one entry per date,
// keyed by the date itself so a second entry for the same day is impossible.
export function useDiaryEntry(date: string) {
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const rows = await getDiaryEntriesByDate(date);
    setEntry(rows[0] ?? null);
  }, [date]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    reload().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const saveEntry = useCallback(
    async (text: string) => {
      const existing = (await getDiaryEntriesByDate(date))[0];
      if (!existing && text.trim() === '') return;

      const record: DiaryEntry = existing
        ? { ...existing, text }
        : { id: date, date, text, createdAt: Date.now() };

      await saveDiaryEntry(record);
      await reload();
    },
    [date, reload]
  );

  return { entry, loading, saveEntry };
}
