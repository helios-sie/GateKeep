import type { DiaryEntry } from '../../../../types/diaryEntry';
import './DiaryList.css';

interface DiaryListProps {
  entries: DiaryEntry[];
  loading?: boolean;
  onDelete: (id: string) => void;
}

export function DiaryList({ entries, loading, onDelete }: DiaryListProps) {
  if (loading) {
    return (
      <p className="diary-list-status" aria-busy="true">
        Loading notes…
      </p>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="diary-list-empty">
        <span className="diary-list-empty-icon" aria-hidden="true">
          ❧
        </span>
        <p className="diary-list-empty-title">No notes yet</p>
        <p className="diary-list-empty-hint">Write your first note for this day above.</p>
      </div>
    );
  }

  return (
    <ul className="diary-list">
      {entries.map((entry) => (
        <li key={entry.id} className="diary-item">
          <p className="diary-text">{entry.text}</p>
          <button
            className="diary-delete"
            onClick={() => onDelete(entry.id)}
            aria-label="Delete note"
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
