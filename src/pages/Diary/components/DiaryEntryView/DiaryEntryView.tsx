import { SegmentContent } from '../../../../components/SegmentContent/SegmentContent';
import { getDiaryAudio, getDiaryPhoto } from '../../../../lib/db';
import type { ContentSegment } from '../../../../types/content';
import './DiaryEntryView.css';

interface DiaryEntryViewProps {
  content: ContentSegment[];
  onEdit: () => void;
}

// Read-only view of an existing entry. The content flows like a normal
// paragraph — it grows with its length and the page scrolls; there is no
// fixed-height box and no internal scrollbar. Inline photo/audio icons are
// tappable, same as Checklist's, opening the shared ImageLightbox/
// AudioPlayer. Tapping the pencil switches the page to edit mode.
export function DiaryEntryView({ content, onEdit }: DiaryEntryViewProps) {
  return (
    <div className="diary-entry-view">
      <button
        type="button"
        className="diary-entry-edit-btn"
        onClick={onEdit}
        aria-label="Edit entry"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>

      <div className="diary-entry-body">
        <SegmentContent content={content} getPhoto={getDiaryPhoto} getAudio={getDiaryAudio} />
      </div>
    </div>
  );
}
