/**
 * Media attached to a task, stored in the "taskPhotos" / "taskAudio" object
 * stores (src/lib/db.ts). These are scoped to tasks only — completely
 * separate from any media a future Diary attachment feature adds; nothing
 * here is shared with or read by the diaryEntries store.
 */

export interface TaskPhoto {
  id: string;
  blob: Blob;
  createdAt: number;
}

export interface TaskAudio {
  id: string;
  blob: Blob;
  createdAt: number;
}
