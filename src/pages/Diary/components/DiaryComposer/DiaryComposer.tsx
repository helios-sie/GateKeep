import { useState } from 'react';
import './DiaryComposer.css';

interface DiaryComposerProps {
  onSubmit: (text: string) => void;
}

export function DiaryComposer({ onSubmit }: DiaryComposerProps) {
  const [text, setText] = useState('');

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText('');
  }

  return (
    <div className="diary-composer">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write about your day…"
        rows={3}
      />
      <button type="button" className="primary" onClick={handleSubmit}>
        Add note
      </button>
    </div>
  );
}
