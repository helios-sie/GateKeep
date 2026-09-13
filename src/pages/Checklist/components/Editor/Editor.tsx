import { useRef } from 'react';
import { InlineComposer } from '../../../../components/InlineComposer/InlineComposer';
import type { InlineComposerHandle, SegmentMediaStore } from '../../../../components/InlineComposer/InlineComposer';
import { deleteTaskAudio, deleteTaskPhoto, getTaskAudio, getTaskPhoto, saveTaskAudio, saveTaskPhoto } from '../../../../lib/db';
import type { ContentSegment } from '../../../../types/content';
import './Editor.css';

interface EditorProps {
  onSubmit: (content: ContentSegment[]) => void;
}

// Adapts the (id, blob, createdAt) taskPhotos/taskAudio API down to the
// (id, blob) shape InlineComposer expects — the only thing that makes this
// the *task* composer rather than any other page's.
const taskMediaStore: SegmentMediaStore = {
  savePhoto: (id, blob) => saveTaskPhoto({ id, blob, createdAt: Date.now() }),
  saveAudio: (id, blob) => saveTaskAudio({ id, blob, createdAt: Date.now() }),
  deletePhoto: deleteTaskPhoto,
  deleteAudio: deleteTaskAudio,
  getPhoto: getTaskPhoto,
  getAudio: getTaskAudio,
};

export function Editor({ onSubmit }: EditorProps) {
  const composerRef = useRef<InlineComposerHandle>(null);

  function handleSubmit() {
    const content = composerRef.current?.getContent() ?? [];
    const hasContent = content.some((s) => s.type !== 'text' || s.value.trim());
    if (!hasContent) return;
    onSubmit(content);
    composerRef.current?.clear();
  }

  return (
    <div className="editor">
      <InlineComposer ref={composerRef} placeholder="Add a task…" mediaStore={taskMediaStore} />

      <div className="editor-toolbar">
        <button type="button" className="primary" onClick={handleSubmit}>
          Add task
        </button>
      </div>
    </div>
  );
}
