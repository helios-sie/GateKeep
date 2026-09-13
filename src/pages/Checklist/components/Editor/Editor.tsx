import { useRef, useState } from 'react';
import { AudioPlayer } from '../../../../components/MediaViewer/AudioPlayer';
import { ImageLightbox } from '../../../../components/MediaViewer/ImageLightbox';
import { AudioCapture } from '../../../../components/AudioCapture/AudioCapture';
import type { AudioCaptureHandle } from '../../../../components/AudioCapture/AudioCapture';
import { PhotoCapture } from '../../../../components/PhotoCapture/PhotoCapture';
import type { PhotoCaptureHandle } from '../../../../components/PhotoCapture/PhotoCapture';
import { deleteTaskAudio, deleteTaskPhoto, saveTaskAudio, saveTaskPhoto } from '../../../../lib/db';
import { generateId } from '../../../../lib/id';
import type { TaskSegment } from '../../../../types/task';
import { extractSegments } from './extractSegments';
import './Editor.css';

interface EditorProps {
  onSubmit: (content: TaskSegment[]) => void;
}

type MediaKind = 'photo' | 'audio';

// WhatsApp-style composer: a contentEditable box (not a plain <textarea> —
// a textarea can't hold real inline content) with a camera and mic icon
// docked in its bottom-right corner. Tapping one saves the attachment
// immediately and inserts a real inline icon — with its own small ✕ discard
// badge — right at the cursor, live, exactly as it will look once the task
// is saved. Text typed after it becomes its own segment; more media can be
// inserted further along the same way, as many times as needed.
export function Editor({ onSubmit }: EditorProps) {
  const editableRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<PhotoCaptureHandle>(null);
  const audioRef = useRef<AudioCaptureHandle>(null);
  // The contentEditable's own selection is lost the instant focus moves to
  // the camera/mic icon button; remember where the caret was so media still
  // gets inserted there instead of always at the end.
  const savedRangeRef = useRef<Range | null>(null);

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

  function insertMediaNode(kind: MediaKind, id: string, previewUrl: string) {
    const el = editableRef.current;
    if (!el) return;
    el.focus();

    const range = getInsertionRange();
    range.deleteContents();

    const wrapper = document.createElement('span');
    wrapper.className = 'composer-media';
    wrapper.contentEditable = 'false';
    wrapper.dataset.mediaType = kind;
    wrapper.dataset.mediaId = id;

    const iconBtn = document.createElement('button');
    iconBtn.type = 'button';
    iconBtn.className = 'composer-media-icon';
    iconBtn.setAttribute('aria-label', kind === 'photo' ? 'View photo' : 'Play audio note');
    if (kind === 'photo') {
      const img = document.createElement('img');
      img.src = previewUrl;
      img.alt = '';
      iconBtn.appendChild(img);
    } else {
      iconBtn.textContent = '🎤';
    }
    iconBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setPreview({ kind, url: previewUrl });
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
      // Never actually submitted as part of a task — delete the blob too,
      // rather than leaving it orphaned in taskPhotos/taskAudio.
      if (kind === 'photo') deleteTaskPhoto(id);
      else deleteTaskAudio(id);
      updateEmpty();
    });

    wrapper.append(iconBtn, removeBtn);
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
    await saveTaskPhoto({ id, blob: file, createdAt: Date.now() });
    insertMediaNode('photo', id, URL.createObjectURL(file));
  }

  async function handleAudioBlob(blob: Blob) {
    const id = generateId();
    await saveTaskAudio({ id, blob, createdAt: Date.now() });
    insertMediaNode('audio', id, URL.createObjectURL(blob));
  }

  function handleSubmit() {
    const el = editableRef.current;
    if (!el) return;
    const content = extractSegments(el);
    const hasContent = content.some((s) => s.type !== 'text' || s.value.trim());
    if (!hasContent) return;
    onSubmit(content);
    el.innerHTML = '';
    savedRangeRef.current = null;
    setEmpty(true);
  }

  return (
    <div className="editor">
      <div className="editor-input-wrap">
        <div
          ref={editableRef}
          className={empty ? 'editor-input is-empty' : 'editor-input'}
          contentEditable
          data-placeholder="Add a task…"
          role="textbox"
          aria-multiline="true"
          aria-label="Task text"
          suppressContentEditableWarning
          onInput={updateEmpty}
          onKeyUp={rememberSelection}
          onMouseUp={rememberSelection}
          onTouchEnd={rememberSelection}
          onSelect={rememberSelection}
          onFocus={rememberSelection}
        />

        <div className="editor-input-actions">
          <button
            type="button"
            className="editor-icon-btn"
            onClick={() => {
              setError(null);
              photoRef.current?.open();
            }}
            aria-label="Attach photo"
          >
            📷
          </button>

          <button
            type="button"
            className={recording ? 'editor-icon-btn mic-active' : 'editor-icon-btn'}
            onClick={() => {
              setError(null);
              audioRef.current?.toggle();
            }}
            aria-label={recording ? 'Stop recording' : 'Record audio note'}
          >
            🎤
          </button>
        </div>

        <PhotoCapture ref={photoRef} onCapture={handlePhotoFile} />
        <AudioCapture
          ref={audioRef}
          onCapture={handleAudioBlob}
          onRecordingChange={setRecording}
          onError={setError}
        />
      </div>

      {error && <p className="editor-error">{error}</p>}

      <div className="editor-toolbar">
        <button type="button" className="primary" onClick={handleSubmit}>
          Add task
        </button>
      </div>

      {preview &&
        (preview.kind === 'photo' ? (
          <ImageLightbox src={preview.url} onClose={() => setPreview(null)} />
        ) : (
          <AudioPlayer src={preview.url} onClose={() => setPreview(null)} />
        ))}
    </div>
  );
}
