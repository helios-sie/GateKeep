import type { TaskSegment } from '../../../../types/task';

/**
 * Walks the composer's contentEditable DOM and turns it back into an
 * ordered TaskSegment[]. Text nodes become text segments; an inline media
 * node (marked with data-media-type/data-media-id — see Editor.tsx's
 * insertMediaNode) becomes a photo/audio segment, in whatever position it
 * appears. <br> and block-level wrapping (contentEditable's own <div>s from
 * pressing Enter) become '\n' so line breaks aren't lost.
 */
export function extractSegments(root: HTMLElement): TaskSegment[] {
  const segments: TaskSegment[] = [];
  let buffer = '';

  function flush() {
    if (buffer) {
      segments.push({ type: 'text', value: buffer });
      buffer = '';
    }
  }

  function walk(node: ChildNode) {
    if (node.nodeType === Node.TEXT_NODE) {
      buffer += node.textContent ?? '';
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as HTMLElement;
    const mediaType = el.dataset.mediaType;
    const mediaId = el.dataset.mediaId;
    if (mediaId && (mediaType === 'photo' || mediaType === 'audio')) {
      flush();
      segments.push({ type: mediaType, id: mediaId });
      return;
    }

    if (el.tagName === 'BR') {
      buffer += '\n';
      return;
    }

    const isBlock = el.tagName === 'DIV' || el.tagName === 'P';
    if (isBlock && (buffer.length > 0 || segments.length > 0)) {
      buffer += '\n';
    }
    el.childNodes.forEach(walk);
  }

  root.childNodes.forEach(walk);
  flush();

  return segments;
}
