import type { CSSProperties } from 'react';
import type { Task, TaskStatus } from '../../../../types/task';
import { TaskContent } from './TaskContent';
import type { Particle } from './useSwipeToDelete';
import { useSwipeToDelete } from './useSwipeToDelete';
import './TaskRow.css';

interface TaskRowProps {
  task: Task;
  onToggleStatus: (id: string, status: TaskStatus) => void;
  /** Called once the swipe-to-delete animation finishes. Swiping is the only
   *  way to delete a task — there is no button for it. */
  onDelete: (id: string) => void;
}

type ParticleStyle = CSSProperties & {
  '--dx': string;
  '--dy': string;
  '--rot': string;
  '--delay': string;
};

function particleStyle(p: Particle): ParticleStyle {
  return {
    left: `${p.x}%`,
    top: `${p.y}%`,
    width: p.size,
    height: p.size,
    '--dx': `${p.dx}px`,
    '--dy': `${p.dy}px`,
    '--rot': `${p.rotate}deg`,
    '--delay': `${p.delay}ms`,
  };
}

export function TaskRow({ task, onToggleStatus, onDelete }: TaskRowProps) {
  const { phase, dragX, particles, handlers } = useSwipeToDelete(() => onDelete(task.id));

  const isOffset = phase === 'dragging' || phase === 'disintegrating';
  const className = [
    'task-item',
    task.status,
    phase === 'dragging' && 'task-item-dragging',
    phase === 'disintegrating' && 'task-item-disintegrating',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li
      className={className}
      style={isOffset ? { transform: `translateX(${dragX}px)` } : undefined}
      {...handlers}
    >
      <div className="task-row-content">
        <label>
          <input
            type="checkbox"
            checked={task.status === 'done'}
            onChange={(e) => onToggleStatus(task.id, e.target.checked ? 'done' : 'open')}
          />
          <TaskContent task={task} />
        </label>
      </div>

      {particles.length > 0 && (
        <div className="task-particles" aria-hidden="true">
          {particles.map((p) => (
            <span key={p.id} className="task-particle" style={particleStyle(p)} />
          ))}
        </div>
      )}
    </li>
  );
}
