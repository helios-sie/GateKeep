import type { DiaryEntry, TaskStatus } from '../../types/entry';
import { EntryPhotos } from './EntryPhotos';
import './TaskList.css';

interface TaskListProps {
  entries: DiaryEntry[];
  loading?: boolean;
  onToggleStatus: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
}

export function TaskList({ entries, loading, onToggleStatus, onDelete }: TaskListProps) {
  if (loading) {
    return (
      <ul className="task-list" aria-busy="true" aria-label="Loading entries">
        {[0, 1, 2].map((i) => (
          <li key={i} className="task-item task-item-skeleton">
            <span className="skeleton-box" />
            <span className="skeleton-line" />
          </li>
        ))}
      </ul>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="task-list-empty">
        <span className="task-list-empty-icon" aria-hidden="true">
          ✎
        </span>
        <p className="task-list-empty-title">Nothing here yet</p>
        <p className="task-list-empty-hint">Add your first entry for this day above.</p>
      </div>
    );
  }

  return (
    <ul className="task-list">
      {entries.map((entry) => (
        <li key={entry.id} className={`task-item ${entry.status}`}>
          <label>
            <input
              type="checkbox"
              checked={entry.status === 'done'}
              onChange={(e) => onToggleStatus(entry.id, e.target.checked ? 'done' : 'open')}
            />
            <span className="task-text">{entry.text}</span>
          </label>

          {entry.photoIds.length > 0 && <EntryPhotos photoIds={entry.photoIds} />}

          <button className="task-delete" onClick={() => onDelete(entry.id)} aria-label="Delete entry">
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
