import './DiaryEntryView.css';

interface DiaryEntryViewProps {
  text: string;
  onEdit: () => void;
}

// Read-only view of an existing entry. The text is plain flowing content — it
// grows with its length and the page scrolls; there is no fixed-height box and
// no internal scrollbar. Tapping the pencil switches the page to edit mode.
export function DiaryEntryView({ text, onEdit }: DiaryEntryViewProps) {
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

      <p className="diary-entry-body">{text}</p>
    </div>
  );
}
