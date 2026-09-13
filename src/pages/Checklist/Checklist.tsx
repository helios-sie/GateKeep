import { useState } from 'react';
import { Calendar } from '../../components/Calendar/Calendar';
import { useTasks } from '../../hooks/useTasks';
import { todayISO } from '../../lib/dateUtils';
import { Editor } from './components/Editor/Editor';
import { FilterBar } from './components/FilterBar/FilterBar';
import { TaskList } from './components/TaskList/TaskList';

interface ChecklistProps {
  /** Deep-linked date (e.g. from Reminders), used instead of today on mount. */
  initialDate?: string;
}

// Checklist page — day-scoped tasks backed by the "tasks" store.
export function Checklist({ initialDate }: ChecklistProps) {
  const [date, setDate] = useState(initialDate ?? todayISO());
  const { tasks, filter, setFilter, loading, addTask, updateStatus, removeTask } = useTasks(date);

  return (
    <section className="page">
      <Calendar date={date} onChange={setDate} />
      <Editor onSubmit={addTask} />
      <FilterBar value={filter} onChange={setFilter} />
      <TaskList
        tasks={tasks}
        loading={loading}
        onToggleStatus={updateStatus}
        onDelete={removeTask}
      />
    </section>
  );
}
