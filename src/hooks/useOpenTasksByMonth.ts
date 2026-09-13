import { useCallback, useEffect, useState } from 'react';
import { getOpenTasksByMonth } from '../lib/db';
import type { Task } from '../types/task';

export interface TaskDateGroup {
  date: string;
  tasks: Task[];
}

// Bridges "tasks" (open-only, one calendar month) to React state for the
// Reminders page. Read-only — no save/update/delete here.
export function useOpenTasksByMonth(year: number, month: number) {
  const [groups, setGroups] = useState<TaskDateGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const rows = await getOpenTasksByMonth(year, month);

    const byDate = new Map<string, Task[]>();
    for (const task of rows) {
      const list = byDate.get(task.date);
      if (list) list.push(task);
      else byDate.set(task.date, [task]);
    }

    // Most recent date first; within a date, oldest-created first (same
    // order the Checklist page shows them in).
    const sorted = [...byDate.entries()]
      .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
      .map(([date, tasks]) => ({
        date,
        tasks: [...tasks].sort((a, b) => a.createdAt - b.createdAt),
      }));

    setGroups(sorted);
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { groups, loading };
}
