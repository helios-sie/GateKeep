/**
 * Media attached to a diary entry, stored in the "diaryPhotos" /
 * "diaryAudio" object stores (src/lib/db.ts). Scoped to diary entries
 * only — completely separate from the "taskPhotos" / "taskAudio" stores;
 * nothing here is shared with or read by the tasks store.
 */

export interface DiaryPhoto {
  id: string;
  blob: Blob;
  createdAt: number;
}

export interface DiaryAudio {
  id: string;
  blob: Blob;
  createdAt: number;
}
