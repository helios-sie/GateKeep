export type TaskStatus = 'open' | 'done';

/**
 * One piece of a task's inline content — a run of plain text, or a
 * reference to a photo/audio attachment stored in the "taskPhotos" /
 * "taskAudio" stores (src/lib/db.ts). Segments render in order, so media
 * appears exactly where it was inserted in the text, not in a separate list.
 */
export type TaskSegment =
  | { type: 'text'; value: string }
  | { type: 'photo'; id: string }
  | { type: 'audio'; id: string };

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
   * getTaskContent in src/lib/taskContent.ts) rather than assuming it's set.
   */
  content?: TaskSegment[];
  status: TaskStatus;
  createdAt: number;
}
