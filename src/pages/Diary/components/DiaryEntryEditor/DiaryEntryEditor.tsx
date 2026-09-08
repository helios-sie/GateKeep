import { useState } from 'react';
import { userName } from '../../../../lib/userProfile';
import './DiaryEntryEditor.css';

interface DiaryEntryEditorProps {
  /** The saved entry text for this date, or null if no entry exists yet. */
  value: string | null;
  onSave: (text: string) => void;
  /** When provided, a Cancel action returns to view mode without saving.
   *  Omitted for the initial empty state (there is nothing to go back to). */
  onCancel?: () => void;
}

export function DiaryEntryEditor({ value, onSave, onCancel }: DiaryEntryEditorProps) {
  const hasEntry = value !== null;
  const [text, setText] = useState(value ?? '');

  const prompt = userName ? `How was your day, ${userName}...` : 'How was your day?';

  return (
    <div className="diary-entry-editor">
      <p className="diary-prompt">{prompt}</p>

      <textarea
        className="diary-entry-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write about your day…"
      />

      <div className="diary-entry-actions">
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="button" className="primary" onClick={() => onSave(text)}>
          {hasEntry ? 'Update entry' : 'Save entry'}
        </button>
      </div>
    </div>
  );
}
