import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { AudioCapture } from '../AudioCapture/AudioCapture';
import type { AudioCaptureHandle } from '../AudioCapture/AudioCapture';
import { PhotoCapture } from '../PhotoCapture/PhotoCapture';
import type { PhotoCaptureHandle } from '../PhotoCapture/PhotoCapture';
import { AudioPlayer } from '../MediaViewer/AudioPlayer';
import { ImageLightbox } from '../MediaViewer/ImageLightbox';
import { CAMERA_ICON_SVG, CameraIcon, MicIcon, MIC_ICON_SVG } from '../icons';
import { generateId } from '../../lib/id';
import type { ContentSegment } from '../../types/content';
import { extractSegments } from './extractSegments';
import './InlineComposer.css';

type MediaKind = 'photo' | 'audio';

/**
 * The storage this composer instance writes to/reads from — the *only*
 * thing that differs between "compose a task" and "compose a diary entry".
 * Callers adapt their own save* functions (which usually also take a
 * createdAt) down to this (id, blob) shape.
 */
export interface SegmentMediaStore {
  savePhoto: (id: string, blob: Blob) => Promise<void>;
  saveAudio: (id: string, blob: Blob) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
  deleteAudio: (id: string) => Promise<void>;
  getPhoto: (id: string) => Promise<{ blob: Blob } | undefined>;
  getAudio: (id: string) => Promise<{ blob: Blob } | undefined>;
}

export interface InlineComposerHandle {
  /** Current content, parsed from the live DOM. Does not clear anything. */
  getContent: () => ContentSegment[];
  /** Resets the box to empty. Call after a caller successfully submits. */
  clear: () => void;
}

interface InlineComposerProps {
  placeholder: string;
  /** Pre-fills existing content (photo/audio segments load their real
   *  thumbnail via mediaStore.getPhoto/getAudio) — used when editing an
   *  existing entry. Read once, on mount; the parent should remount the
   *  composer (e.g. a `key`) to start a fresh editing session. */
  initialContent?: ContentSegment[];
  mediaStore: SegmentMediaStore;
}

// WhatsApp-style composer: a contentEditable box (not a plain <textarea> —
// a textarea can't hold real inline content) with a camera and mic icon
// docked in its bottom-right corner. Tapping one saves the attachment
// immediately (via the given mediaStore) and inserts a real inline icon —
// with its own small ✕ discard badge — right at the cursor, live, exactly
// as it will look once saved. Text typed after it becomes its own segment;
// more media can be inserted further along the same way, as many times as
// needed. Shared by Checklist's task composer and Diary's entry composer —
// only `mediaStore` (and `initialContent`, for editing) differs between them.
export const InlineComposer = forwardRef<InlineComposerHandle, InlineComposerProps>(function InlineComposer(
  { placeholder, initialContent, mediaStore },
  ref
) {
  const editableRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<PhotoCaptureHandle>(null);
  const audioRef = useRef<AudioCaptureHandle>(null);
  // The contentEditable's own selection is lost the instant focus moves to
  // the camera/mic icon button; remember where the caret was so media still
  // gets inserted there instead of always at the end.
  const savedRangeRef = useRef<Range | null>(null);
  const objectUrlsRef = useRef<string[]>([]);

  const [empty, setEmpty] = useState(true);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ kind: MediaKind; url: string } | null>(null);

  function updateEmpty() {
    const el = editableRef.current;
    if (!el) return;
    const hasMedia = el.querySelector('[data-media-id]') !== null;
    setEmpty(!hasMedia && (el.textContent ?? '').trim() === '');
  }

  function rememberSelection() {
    const el = editableRef.current;
    const sel = window.getSelection();
    if (el && sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }

  function getInsertionRange(): Range {
    const el = editableRef.current!;
    if (savedRangeRef.current && el.contains(savedRangeRef.current.startContainer)) {
      return savedRangeRef.current.cloneRange();
    }
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    return range;
  }

  function buildMediaNode(kind: MediaKind, id: string, previewUrl: string | null): HTMLSpanElement {
    const wrapper = document.createElement('span');
    wrapper.className = 'composer-media';
    wrapper.contentEditable = 'false';
    wrapper.dataset.mediaType = kind;
    wrapper.dataset.mediaId = id;

    const iconBtn = document.createElement('button');
    iconBtn.type = 'button';
    iconBtn.className = 'composer-media-icon';
    iconBtn.setAttribute('aria-label', kind === 'photo' ? 'View photo' : 'Play audio note');
    if (kind === 'photo' && previewUrl) {
      const img = document.createElement('img');
      img.src = previewUrl;
      img.alt = '';
      iconBtn.appendChild(img);
    } else {
      // A vanilla-DOM node (outside React), so an innerHTML SVG string
      // rather than JSX — same currentColor-based icons as everywhere else.
      iconBtn.innerHTML = kind === 'photo' ? CAMERA_ICON_SVG : MIC_ICON_SVG;
    }
    iconBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (previewUrl) setPreview({ kind, url: previewUrl });
    });

    // Small badge in the icon's corner, deliberately its own separate
    // element outside the icon's own box — not overlapping its tap target —
    // so tapping the icon (preview) and tapping ✕ (discard) can't be mixed up.
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'composer-media-remove';
    removeBtn.setAttribute('aria-label', 'Remove attachment');
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      wrapper.remove();
      // Never actually submitted, so delete the blob too rather than
      // leaving it orphaned in the media store.
      if (kind === 'photo') mediaStore.deletePhoto(id);
      else mediaStore.deleteAudio(id);
      updateEmpty();
    });

    wrapper.append(iconBtn, removeBtn);
    return wrapper;
  }

  function insertMediaNode(kind: MediaKind, id: string, previewUrl: string) {
    const el = editableRef.current;
    if (!el) return;
    el.focus();

    const range = getInsertionRange();
    range.deleteContents();

    const wrapper = buildMediaNode(kind, id, previewUrl);
    range.insertNode(wrapper);

    // Caret right after the inserted node, so typing continues there.
    const after = document.createRange();
    after.setStartAfter(wrapper);
    after.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(after);
    savedRangeRef.current = after.cloneRange();

    updateEmpty();
  }

  async function handlePhotoFile(file: File) {
    setError(null);
    const id = generateId();
    await mediaStore.savePhoto(id, file);
    insertMediaNode('photo', id, URL.createObjectURL(file));
  }

  async function handleAudioBlob(blob: Blob) {
    const id = generateId();
    await mediaStore.saveAudio(id, blob);
    insertMediaNode('audio', id, URL.createObjectURL(blob));
  }

  // Build the initial DOM from initialContent once on mount (e.g. editing an
  // existing diary entry). Checklist's task composer never passes this, so
  // it just starts empty.
  useEffect(() => {
    const el = editableRef.current;
    if (!el) return;
    let cancelled = false;

    async function build() {
      // Idempotent: React StrictMode double-invokes effects in dev (mount ->
      // cleanup -> mount again), and the contentEditable's own DOM persists
      // across that, unlike component state. Clearing first means a second
      // invocation rebuilds cleanly instead of duplicating everything.
      el!.innerHTML = '';
      if (!initialContent || initialContent.length === 0) {
        updateEmpty();
        return;
      }
      for (const segment of initialContent) {
        if (cancelled) return;
        if (segment.type === 'text') {
          el!.appendChild(document.createTextNode(segment.value));
        } else {
          const media = segment.type === 'photo' ? await mediaStore.getPhoto(segment.id) : await mediaStore.getAudio(segment.id);
          if (cancelled) return;
          const url = media ? URL.createObjectURL(media.blob) : null;
          if (url) objectUrlsRef.current.push(url);
          el!.appendChild(buildMediaNode(segment.type, segment.id, url));
        }
      }
      updateEmpty();
    }

    build();

    return () => {
      cancelled = true;
    };
    // initialContent is intentionally read once, not re-synced on change —
    // remount (e.g. a `key`) to start a fresh editing session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Revoke any object URLs created for the initial content on unmount.
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useImperativeHandle(ref, () => ({
    getContent: () => (editableRef.current ? extractSegments(editableRef.current) : []),
    clear: () => {
      if (editableRef.current) editableRef.current.innerHTML = '';
      savedRangeRef.current = null;
      setEmpty(true);
    },
  }));

  return (
    <div className="inline-composer">
      <div
        ref={editableRef}
        className={empty ? 'inline-composer-input is-empty' : 'inline-composer-input'}
        contentEditable
        data-placeholder={placeholder}
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        suppressContentEditableWarning
        onInput={updateEmpty}
        onKeyUp={rememberSelection}
        onMouseUp={rememberSelection}
        onTouchEnd={rememberSelection}
        onSelect={rememberSelection}
        onFocus={rememberSelection}
      />

      <div className="inline-composer-actions">
        <button
          type="button"
          className="inline-composer-icon-btn"
          onClick={() => {
            setError(null);
            photoRef.current?.open();
          }}
          aria-label="Attach photo"
        >
          <CameraIcon />
        </button>

        <button
          type="button"
          className={recording ? 'inline-composer-icon-btn mic-active' : 'inline-composer-icon-btn'}
          onClick={() => {
            setError(null);
            audioRef.current?.toggle();
          }}
          aria-label={recording ? 'Stop recording' : 'Record audio note'}
        >
          <MicIcon />
        </button>
      </div>

      <PhotoCapture ref={photoRef} onCapture={handlePhotoFile} />
      <AudioCapture ref={audioRef} onCapture={handleAudioBlob} onRecordingChange={setRecording} onError={setError} />

      {error && <p className="inline-composer-error">{error}</p>}

      {preview &&
        (preview.kind === 'photo' ? (
          <ImageLightbox src={preview.url} onClose={() => setPreview(null)} />
        ) : (
          <AudioPlayer src={preview.url} onClose={() => setPreview(null)} />
        ))}
    </div>
  );
});
