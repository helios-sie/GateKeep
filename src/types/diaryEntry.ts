/**
 * A dated diary note. Belongs to the Diary page and lives in the
 * "diaryEntries" object store. Notes are just text — they are NOT
 * completable, so there is deliberately no `status` field.
 */
export interface DiaryEntry {
  id: string;
  /** ISO date, e.g. "2026-09-08" — the day this entry belongs to */
  date: string;
  text: string;
  createdAt: number;
}
