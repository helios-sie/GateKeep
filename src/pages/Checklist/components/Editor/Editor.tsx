import { useState } from 'react';
import { AudioCapture } from '../../../../components/AudioCapture/AudioCapture';
import { PhotoCapture } from '../../../../components/PhotoCapture/PhotoCapture';
import { useVoiceInput } from '../../../../hooks/useVoiceInput';
import { saveTaskAudio, saveTaskPhoto } from '../../../../lib/db';
import { generateId } from '../../../../lib/id';
import './Editor.css';

interface EditorProps {
  onSubmit: (text: string, photoIds: string[], audioIds: string[]) => void;
}

export function Editor({ onSubmit }: EditorProps) {
  const [text, setText] = useState('');
  const [photoIds, setPhotoIds] = useState<string[]>([]);
  const [audioIds, setAudioIds] = useState<string[]>([]);

  const voice = useVoiceInput((transcript) =>
    setText((prev) => (prev ? `${prev} ${transcript}` : transcript))
  );

  async function handlePhotoCapture(file: File) {
    const id = generateId();
    await saveTaskPhoto({ id, blob: file, createdAt: Date.now() });
    setPhotoIds((prev) => [...prev, id]);
  }

  async function handleAudioCapture(blob: Blob) {
    const id = generateId();
    await saveTaskAudio({ id, blob, createdAt: Date.now() });
    setAudioIds((prev) => [...prev, id]);
  }

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed && photoIds.length === 0 && audioIds.length === 0) return;
    onSubmit(trimmed, photoIds, audioIds);
    setText('');
    setPhotoIds([]);
    setAudioIds([]);
  }

  const attachmentCount = photoIds.length + audioIds.length;

  return (
    <div className="editor">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a task…"
        rows={2}
      />

      <div className="editor-toolbar">
        <PhotoCapture onCapture={handlePhotoCapture} />
        <AudioCapture onCapture={handleAudioCapture} />

        {voice.isSupported && (
          <button
            type="button"
            className={voice.isListening ? 'mic-active' : ''}
            onClick={voice.isListening ? voice.stop : voice.start}
          >
            {voice.isListening ? '● Listening…' : '🎤 Voice'}
          </button>
        )}

        <button type="button" className="primary" onClick={handleSubmit}>
          Add task
        </button>
      </div>

      {attachmentCount > 0 && (
        <div className="editor-attachment-count">
          {photoIds.length > 0 && <span>{photoIds.length} photo(s)</span>}
          {audioIds.length > 0 && <span>{audioIds.length} audio note(s)</span>}
        </div>
      )}
    </div>
  );
}
