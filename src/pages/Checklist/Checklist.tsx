import { useEffect, useState } from 'react';
import { Calendar } from '../../components/Calendar/Calendar';
import { useTasks } from '../../hooks/useTasks';
import { todayISO } from '../../lib/dateUtils';
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

  return (
    <section className="page">
      <Calendar date={date} onChange={setDate} />
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
    </section>
  );
}
