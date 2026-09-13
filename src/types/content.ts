/**
 * One piece of an entry's inline content — a run of plain text, or a
 * reference to a photo/audio attachment. Segments render in order, so media
 * appears exactly where it was inserted in the text, not in a separate list.
 *
 * Shared shape for both Checklist tasks (types/task.ts, taskPhotos/taskAudio
 * stores) and Diary entries (types/diaryEntry.ts, diaryPhotos/diaryAudio
 * stores) — the segment shape is identical, but which store a photo/audio id
 * points into always depends on which entity you're looking at. The two
 * media stores are never shared or mixed.
 */
export type ContentSegment =
  | { type: 'text'; value: string }
  | { type: 'photo'; id: string }
  | { type: 'audio'; id: string };
