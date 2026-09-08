export type TaskStatus = 'open' | 'done';

export interface PhotoAttachment {
  id: string;
  blob: Blob;
  createdAt: number;
}

export interface DiaryEntry {
  id: string;
  /** ISO date, e.g. "2026-09-08" — the day this entry belongs to */
  date: string;
  text: string;
  status: TaskStatus;
  photoIds: string[];
  createdAt: number;
  updatedAt: number;
}

export type StatusFilter = 'all' | TaskStatus;
