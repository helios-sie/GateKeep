import { useCallback, useEffect, useState } from 'react';
import { deleteTask, deleteTaskAudio, deleteTaskPhoto, getTasksByDate, saveTask } from '../lib/db';
import { generateId } from '../lib/id';
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
    async (text: string, photoIds: string[] = [], audioIds: string[] = []) => {
      const task: Task = {
        id: generateId(),
        date,
        text,
        status: 'open',
        createdAt: Date.now(),
        photoIds,
        audioIds,
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
      const target = tasks.find((t) => t.id === id);
      await deleteTask(id);
      // A task owns its attached media — clean it up so it doesn't linger
      // orphaned in taskPhotos/taskAudio forever.
      if (target) {
        await Promise.all([
          ...(target.photoIds ?? []).map((photoId) => deleteTaskPhoto(photoId)),
          ...(target.audioIds ?? []).map((audioId) => deleteTaskAudio(audioId)),
        ]);
      }
      await reload();
    },
    [tasks, reload]
  );

  return { tasks, loading, addTask, updateStatus, removeTask };
}
