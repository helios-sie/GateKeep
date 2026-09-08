import { useState } from 'react';
import { Calendar } from './components/Calendar/Calendar';
import { Editor } from './components/Editor/Editor';
import { FilterBar } from './components/FilterBar/FilterBar';
import { TaskList } from './components/TaskList/TaskList';
import { useEntries } from './hooks/useEntries';
import { todayISO } from './lib/dateUtils';

export function App() {
  const [date, setDate] = useState(todayISO());
  const { entries, filter, setFilter, loading, addEntry, updateStatus, removeEntry } =
    useEntries(date);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Gatekeep</h1>
      </header>

      <Calendar date={date} onChange={setDate} />
      <Editor onSubmit={addEntry} />
      <FilterBar value={filter} onChange={setFilter} />
      <TaskList
        entries={entries}
        loading={loading}
        onToggleStatus={updateStatus}
        onDelete={removeEntry}
      />
    </div>
  );
}
