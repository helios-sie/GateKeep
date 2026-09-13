import type { TaskSegment } from '../../../../types/task';

// A plain <textarea> can't hold real inline images/widgets — there's no such
// thing as "rich content" in a textarea's value, only text. So a media
// attachment is represented, while composing, as a small marker token
// embedded directly in the text at the cursor position: ⟦photo:<id>⟧ or
// ⟦audio:<id>⟧. ⟦ ⟧ (U+27E6/27E7) are chosen because they're not characters
// a user would plausibly type themselves. The marker moves/deletes with the
// surrounding text like any other character (this is the accepted trade-off
// for "insert an icon inline" inside a plain textarea) and is parsed back
// into real segments only once, at submit time.

const MARKER_RE = /⟦(photo|audio):([^⟧]*)⟧/g;

export function markerFor(type: 'photo' | 'audio', id: string): string {
  return `⟦${type}:${id}⟧`;
}

/** Parses raw composer text (with embedded markers) into ordered segments. */
export function parseComposerText(raw: string): TaskSegment[] {
  const segments: TaskSegment[] = [];
  let lastIndex = 0;

  MARKER_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = MARKER_RE.exec(raw))) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: raw.slice(lastIndex, match.index) });
    }
    const [, type, id] = match;
    segments.push(type === 'photo' ? { type: 'photo', id } : { type: 'audio', id });
    lastIndex = MARKER_RE.lastIndex;
  }

  if (lastIndex < raw.length) {
    segments.push({ type: 'text', value: raw.slice(lastIndex) });
  }

  return segments;
}
