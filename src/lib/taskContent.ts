import type { Task, TaskSegment } from '../types/task';

/**
 * Old tasks (saved before inline media existed) only have `text` — no
 * `content` at all. Treat that as a single text segment so display/cleanup
 * code has one shape to work with regardless of when the task was created.
 */
export function getTaskContent(task: Task): TaskSegment[] {
  return task.content ?? [{ type: 'text', value: task.text }];
}

/**
 * Plain-text rendering of a segment list, stored alongside `content` as
 * `Task.text` so Reminders/search never need to know about segments. Falls
 * back to a short label when a task is media-only (no text typed at all).
 */
export function deriveText(content: TaskSegment[]): string {
  const plain = content
    .filter((s): s is Extract<TaskSegment, { type: 'text' }> => s.type === 'text')
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

/** Every photo/audio id referenced by a segment list — used to clean up
 *  taskPhotos/taskAudio when the task that owns them is deleted. */
export function extractMediaIds(content: TaskSegment[]): { photoIds: string[]; audioIds: string[] } {
  const photoIds: string[] = [];
  const audioIds: string[] = [];
  for (const segment of content) {
    if (segment.type === 'photo') photoIds.push(segment.id);
    else if (segment.type === 'audio') audioIds.push(segment.id);
  }
  return { photoIds, audioIds };
}
