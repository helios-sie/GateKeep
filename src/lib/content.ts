import type { ContentSegment } from '../types/content';

/**
 * Old records (saved before inline media existed) only have `text` — no
 * `content` at all. Treat that as a single text segment so display/cleanup
 * code has one shape to work with regardless of when the record was
 * created. Works for both Task and DiaryEntry — anything shaped
 * `{ text, content? }`.
 */
export function getContent<T extends { text: string; content?: ContentSegment[] }>(item: T): ContentSegment[] {
  return item.content ?? [{ type: 'text', value: item.text }];
}

/**
 * Plain-text rendering of a segment list, stored alongside `content` as
 * `text` so Reminders/search never need to know about segments. Falls back
 * to a short label when an item is media-only (no text typed at all).
 */
export function deriveText(content: ContentSegment[]): string {
  const plain = content
    .filter((s): s is Extract<ContentSegment, { type: 'text' }> => s.type === 'text')
    .map((s) => s.value)
    .join('')
    .trim();

  if (plain) return plain;

  const hasPhoto = content.some((s) => s.type === 'photo');
  const hasAudio = content.some((s) => s.type === 'audio');
  if (hasPhoto && hasAudio) return '📷🎤 Attachment';
  if (hasPhoto) return '📷 Photo';
  if (hasAudio) return '🎤 Audio note';
  return '';
}

/** Every photo/audio id referenced by a segment list — used to clean up a
 *  media store when the record that owns them is deleted. */
export function extractMediaIds(content: ContentSegment[]): { photoIds: string[]; audioIds: string[] } {
  const photoIds: string[] = [];
  const audioIds: string[] = [];
  for (const segment of content) {
    if (segment.type === 'photo') photoIds.push(segment.id);
    else if (segment.type === 'audio') audioIds.push(segment.id);
  }
  return { photoIds, audioIds };
}
