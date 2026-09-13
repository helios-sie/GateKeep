import type { ContentSegment } from './content';

export type TaskStatus = 'open' | 'done';

/**
 * A checklist item for a given day. Belongs to the Checklist page and lives
 * in the "tasks" object store. Tasks are completable — hence `status`.
 */
export interface Task {
  id: string;
  /** ISO date, e.g. "2026-09-08" — the day this task belongs to */
  date: string;
  /**
   * Plain-text rendering of `content`, kept in sync whenever a task is
   * saved. Reminders and search only ever need to read/match text, so they
   * work against this and don't need to know about the rich `content` shape.
   */
  text: string;
  /**
   * Ordered rich content — the authoritative shape for the Checklist
   * composer/display. Tasks saved before this existed have no `content` at
   * all; treat that as a single `{type:'text', value: text}` segment (see
   * getContent in src/lib/content.ts) rather than assuming it's set.
   */
  content?: ContentSegment[];
  status: TaskStatus;
  createdAt: number;
}
