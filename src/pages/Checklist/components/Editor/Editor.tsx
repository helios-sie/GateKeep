import { useLayoutEffect, useRef, useState } from 'react';
import { AudioCapture, canRecordAudio } from '../../../../components/AudioCapture/AudioCapture';
import type { AudioCaptureHandle } from '../../../../components/AudioCapture/AudioCapture';
import { PhotoCapture } from '../../../../components/PhotoCapture/PhotoCapture';
import type { PhotoCaptureHandle } from '../../../../components/PhotoCapture/PhotoCapture';
import { saveTaskAudio, saveTaskPhoto } from '../../../../lib/db';
import { generateId } from '../../../../lib/id';
import type { TaskSegment } from '../../../../types/task';
import { markerFor, parseComposerText } from './taskMarkers';
import './Editor.css';

interface EditorProps {
  onSubmit: (content: TaskSegment[]) => void;
}

// WhatsApp-style composer: a plain textarea with a camera and mic icon
// docked inside its bottom-right corner. Tapping one inserts a photo/audio
// attachment as a small marker right at the cursor, so it ends up exactly
// where the user was typing — not appended to the end or shown in a
// separate list. Text typed after it becomes its own segment; the whole
// thing is parsed into ordered segments on submit (see taskMarkers.ts).
export function Editor({ onSubmit }: EditorProps) {
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const photoRef = useRef<PhotoCaptureHandle>(null);
  const audioRef = useRef<AudioCaptureHandle>(null);
  const pendingCaret = useRef<number | null>(null);

  // After inserting a marker, the textarea's value changes and React
  // re-renders it — the browser would otherwise drop the caret at the end.
  // Restore it to right after the inserted marker once that render commits.
  useLayoutEffect(() => {
    if (pendingCaret.current !== null && textareaRef.current) {
      textareaRef.current.setSelectionRange(pendingCaret.current, pendingCaret.current);
      textareaRef.current.focus();
      pendingCaret.current = null;
    }
  }, [text]);

  function insertMarker(marker: string) {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    pendingCaret.current = start + marker.length;
    setText(text.slice(0, start) + marker + text.slice(end));
  }

  async function handlePhotoFile(file: File) {
    const id = generateId();
    await saveTaskPhoto({ id, blob: file, createdAt: Date.now() });
    insertMarker(markerFor('photo', id));
  }

  async function handleAudioBlob(blob: Blob) {
    const id = generateId();
    await saveTaskAudio({ id, blob, createdAt: Date.now() });
    insertMarker(markerFor('audio', id));
  }

  function handleSubmit() {
    const content = parseComposerText(text);
    const hasContent = content.some((s) => s.type !== 'text' || s.value.trim());
    if (!hasContent) return;
    onSubmit(content);
    setText('');
  }

  return (
    <div className="editor">
      <div className="editor-input-wrap">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a task…"
          rows={2}
        />

        <div className="editor-input-actions">
          <button
            type="button"
            className="editor-icon-btn"
            onClick={() => photoRef.current?.open()}
            aria-label="Attach photo"
          >
            📷
          </button>

          {canRecordAudio && (
            <button
              type="button"
              className={recording ? 'editor-icon-btn mic-active' : 'editor-icon-btn'}
              onClick={() => audioRef.current?.toggle()}
              aria-label={recording ? 'Stop recording' : 'Record audio note'}
            >
              🎤
            </button>
          )}
        </div>

        <PhotoCapture ref={photoRef} onCapture={handlePhotoFile} />
        <AudioCapture ref={audioRef} onCapture={handleAudioBlob} onRecordingChange={setRecording} />
      </div>

      <div className="editor-toolbar">
        <button type="button" className="primary" onClick={handleSubmit}>
          Add task
        </button>
      </div>
    </div>
  );
}
