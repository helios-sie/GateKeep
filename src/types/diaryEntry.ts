import type { ContentSegment } from './content';

/**
 * A dated diary note. Belongs to the Diary page and lives in the
 * "diaryEntries" object store. Notes are just text — they are NOT
 * completable, so there is deliberately no `status` field.
 */
export interface DiaryEntry {
  id: string;
  /** ISO date, e.g. "2026-09-08" — the day this entry belongs to */
  date: string;
  /**
   * Plain-text rendering of `content`, kept in sync whenever the entry is
   * saved. Search reads this and doesn't need to know about segments.
   */
  text: string;
  /**
   * Ordered rich content — the authoritative shape for the Diary composer/
   * display. Entries saved before this existed have no `content` at all;
   * treat that as a single `{type:'text', value: text}` segment (see
   * getContent in src/lib/content.ts) rather than assuming it's set.
   */
  content?: ContentSegment[];
  createdAt: number;
}
