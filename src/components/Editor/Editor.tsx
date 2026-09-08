import { useState } from 'react';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { PhotoCapture } from '../PhotoCapture/PhotoCapture';
import './Editor.css';

interface EditorProps {
  onSubmit: (text: string, photoIds: string[]) => void;
}

export function Editor({ onSubmit }: EditorProps) {
  const [text, setText] = useState('');
  const [photoIds, setPhotoIds] = useState<string[]>([]);

  const voice = useVoiceInput((transcript) =>
    setText((prev) => (prev ? `${prev} ${transcript}` : transcript))
  );

  function handleSubmit() {
    if (!text.trim() && photoIds.length === 0) return;
    onSubmit(text.trim(), photoIds);
    setText('');
    setPhotoIds([]);
  }

  return (
    <div className="editor">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write about your day…"
        rows={3}
      />

      <div className="editor-toolbar">
        <PhotoCapture onCapture={(id) => setPhotoIds((prev) => [...prev, id])} />

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
          Add entry
        </button>
      </div>

      {photoIds.length > 0 && (
        <div className="editor-photo-count">{photoIds.length} photo(s) attached</div>
      )}
    </div>
  );
}
