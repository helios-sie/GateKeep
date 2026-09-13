import { useCallback, useEffect, useState } from 'react';
import { deleteTask, getTasksByDate, saveTask } from '../lib/db';
import type { Task, TaskStatus } from '../types/task';

// Bridges the "tasks" store (src/lib/db.ts) to React state for the Checklist
// page. Knows nothing about diary entries.
export function useTasks(date: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const rows = await getTasksByDate(date);
    rows.sort((a, b) => a.createdAt - b.createdAt);
    setTasks(rows);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addTask = useCallback(
    async (text: string) => {
      const task: Task = {
        id: crypto.randomUUID(),
        date,
        text,
        status: 'open',
        createdAt: Date.now(),
      };
      await saveTask(task);
      await reload();
    },
    [date, reload]
  );

  const updateStatus = useCallback(
    async (id: string, status: TaskStatus) => {
      const target = tasks.find((t) => t.id === id);
      if (!target) return;
      await saveTask({ ...target, status });
      await reload();
    },
    [tasks, reload]
  );

  const removeTask = useCallback(
    async (id: string) => {
      await deleteTask(id);
      await reload();
    },
    [reload]
  );

  return { tasks, loading, addTask, updateStatus, removeTask };
}
