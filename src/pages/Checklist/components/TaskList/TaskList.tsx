import type { Task, TaskStatus } from '../../../../types/task';
import { TaskRow } from './TaskRow';
import './TaskList.css';

interface TaskListProps {
  tasks: Task[];
  loading?: boolean;
  onToggleStatus: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
}

export function TaskList({ tasks, loading, onToggleStatus, onDelete }: TaskListProps) {
  if (loading) {
    return (
      <ul className="task-list" aria-busy="true" aria-label="Loading tasks">
        {[0, 1, 2].map((i) => (
          <li key={i} className="task-item task-item-skeleton">
            <span className="skeleton-box" />
            <span className="skeleton-line" />
          </li>
        ))}
      </ul>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="task-list-empty">
        <span className="task-list-empty-icon" aria-hidden="true">
          ✎
        </span>
        <p className="task-list-empty-title">Nothing here yet</p>
        <p className="task-list-empty-hint">Add your first task for this day above.</p>
      </div>
    );
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} onToggleStatus={onToggleStatus} onDelete={onDelete} />
      ))}
    </ul>
  );
}
