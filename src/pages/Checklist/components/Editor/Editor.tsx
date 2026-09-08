import { useState } from 'react';
import { useVoiceInput } from '../../../../hooks/useVoiceInput';
import './Editor.css';

interface EditorProps {
  onSubmit: (text: string) => void;
}

export function Editor({ onSubmit }: EditorProps) {
  const [text, setText] = useState('');

  const voice = useVoiceInput((transcript) =>
    setText((prev) => (prev ? `${prev} ${transcript}` : transcript))
  );

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText('');
  }

  return (
    <div className="editor">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a task…"
        rows={2}
      />

      <div className="editor-toolbar">
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
    </div>
  );
}
