import { useCallback, useEffect, useState } from 'react';
import { getOpenTasksByMonth } from '../lib/db';
import { onTasksChanged } from '../lib/taskEvents';
import type { Task } from '../types/task';

export interface TaskDateGroup {
  date: string;
  tasks: Task[];
}

function groupOpenTasks(rows: Task[]): TaskDateGroup[] {
  const byDate = new Map<string, Task[]>();
  for (const task of rows) {
    const list = byDate.get(task.date);
    if (list) list.push(task);
    else byDate.set(task.date, [task]);
  }

  // Most recent date first; within a date, oldest-created first (same
  // order the Checklist page shows them in).
  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([date, tasks]) => ({
      date,
      tasks: [...tasks].sort((a, b) => a.createdAt - b.createdAt),
    }));
}

// Bridges "tasks" (open-only, one calendar month) to React state for the
// Reminders page. Read-only — no save/update/delete here.
export function useOpenTasksByMonth(year: number, month: number) {
  const [groups, setGroups] = useState<TaskDateGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    const rows = await getOpenTasksByMonth(year, month);
    setGroups(groupOpenTasks(rows));
  }, [year, month]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchGroups().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchGroups]);

  // The "tasks" store can change from elsewhere (a task swipe-deleted on the
  // Checklist page) while this page is showing stale results. Re-fetch as
  // soon as that happens — no loading flash, just a quiet background
  // refresh — instead of waiting for a remount to notice.
  useEffect(() => onTasksChanged(fetchGroups), [fetchGroups]);

  return { groups, loading };
}
