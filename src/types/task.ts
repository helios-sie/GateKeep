export type TaskStatus = 'open' | 'done';

/**
 * A checklist item for a given day. Belongs to the Checklist page and lives
 * in the "tasks" object store. Tasks are completable — hence `status`.
 */
export interface Task {
  id: string;
  /** ISO date, e.g. "2026-09-08" — the day this task belongs to */
  date: string;
  text: string;
  status: TaskStatus;
  createdAt: number;
}
