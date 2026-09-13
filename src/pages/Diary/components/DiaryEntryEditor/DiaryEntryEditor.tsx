import { useRef } from 'react';
import { InlineComposer } from '../../../../components/InlineComposer/InlineComposer';
import type { InlineComposerHandle, SegmentMediaStore } from '../../../../components/InlineComposer/InlineComposer';
import {
  deleteDiaryAudio,
  deleteDiaryPhoto,
  getDiaryAudio,
  getDiaryPhoto,
  saveDiaryAudio,
  saveDiaryPhoto,
} from '../../../../lib/db';
import { userName } from '../../../../lib/userProfile';
import type { ContentSegment } from '../../../../types/content';
import './DiaryEntryEditor.css';

// Adapts the (id, blob, createdAt) diaryPhotos/diaryAudio API down to the
// (id, blob) shape InlineComposer expects — completely separate stores from
// the task composer's, even though the composer logic itself is identical.
const diaryMediaStore: SegmentMediaStore = {
  savePhoto: (id, blob) => saveDiaryPhoto({ id, blob, createdAt: Date.now() }),
  saveAudio: (id, blob) => saveDiaryAudio({ id, blob, createdAt: Date.now() }),
  deletePhoto: deleteDiaryPhoto,
  deleteAudio: deleteDiaryAudio,
  getPhoto: getDiaryPhoto,
  getAudio: getDiaryAudio,
};

interface DiaryEntryEditorProps {
  /** The saved entry's content for this date, or null if no entry exists yet. */
  initialContent: ContentSegment[] | null;
  onSave: (content: ContentSegment[]) => void;
  /** When provided, a Cancel action returns to view mode without saving.
   *  Omitted for the initial empty state (there is nothing to go back to). */
  onCancel?: () => void;
}

export function DiaryEntryEditor({ initialContent, onSave, onCancel }: DiaryEntryEditorProps) {
  const hasEntry = initialContent !== null;
  const composerRef = useRef<InlineComposerHandle>(null);

  const prompt = userName ? `How was your day, ${userName}...` : 'How was your day?';

  function handleSave() {
    onSave(composerRef.current?.getContent() ?? []);
  }

  return (
    <div className="diary-entry-editor">
      <p className="diary-prompt">{prompt}</p>

      <InlineComposer
        ref={composerRef}
        placeholder="Write about your day…"
        initialContent={initialContent ?? undefined}
        mediaStore={diaryMediaStore}
      />

      <div className="diary-entry-actions">
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="button" className="primary" onClick={handleSave}>
          {hasEntry ? 'Update entry' : 'Save entry'}
        </button>
      </div>
    </div>
  );
}
