import { useEffect, useState } from 'react';
import { Calendar } from '../../components/Calendar/Calendar';
import { getTasksInRange } from '../../lib/db';
import { onTasksChanged } from '../../lib/taskEvents';
import { useSwipeNavigate } from '../../hooks/useSwipeNavigate';
import { useTasks } from '../../hooks/useTasks';
import { addDays, todayISO } from '../../lib/dateUtils';
import { Editor } from './components/Editor/Editor';
import { TaskList } from './components/TaskList/TaskList';
import { TaskSearch } from './components/TaskSearch';

interface ChecklistProps {
  /** Deep-linked date (e.g. from Reminders or a search result), used instead
   *  of today on mount — and adopted if it changes while already mounted. */
  initialDate?: string;
}

// Checklist page — day-scoped tasks backed by the "tasks" store.
export function Checklist({ initialDate }: ChecklistProps) {
  const [date, setDate] = useState(initialDate ?? todayISO());
  const [searching, setSearching] = useState(false);
  const { tasks, loading, addTask, updateStatus, removeTask } = useTasks(date);

  // Tapping a search result sets a new deep-link date while this page is
  // already mounted (route doesn't change, so nothing remounts it) — pick
  // that up explicitly instead of only reading it as an initial value.
  useEffect(() => {
    if (initialDate) setDate(initialDate);
  }, [initialDate]);

  // Swipe left/right anywhere on the task list to move a day forward/back —
  // the Calendar arrows above do the same thing and stay as a fallback. A
  // swipe starting ON a task row is left to that row's own swipe-to-delete
  // instead (see useSwipeNavigate's IGNORE_SELECTOR), so the two gestures
  // never fight over the same touch.
  const { dragX, dragging, handlers } = useSwipeNavigate({
    onSwipeLeft: () => setDate((d) => (d < todayISO() ? addDays(d, 1) : d)),
    onSwipeRight: () => setDate((d) => addDays(d, -1)),
    enabled: !searching,
  });

  return (
    <section className="page">
      <Calendar
        date={date}
        onChange={setDate}
        onToday={() => setDate(todayISO())}
        fetchContentInRange={getTasksInRange}
        onContentChanged={onTasksChanged}
      />
      <div
        className={dragging ? 'swipe-content is-dragging' : 'swipe-content'}
        style={dragging ? { transform: `translateX(${Math.max(-32, Math.min(32, dragX * 0.4))}px)` } : undefined}
        {...handlers}
      >
        <Editor onSubmit={addTask} />
        <TaskSearch onActiveChange={setSearching} />
        {!searching && (
          <TaskList
            tasks={tasks}
            loading={loading}
            onToggleStatus={updateStatus}
            onDelete={removeTask}
          />
        )}
      </div>
    </section>
  );
}
