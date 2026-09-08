import { useState } from 'react';
import { Calendar } from '../../components/Calendar/Calendar';
import { useDiaryEntries } from '../../hooks/useDiaryEntries';
import { todayISO } from '../../lib/dateUtils';
import { DiaryComposer } from './components/DiaryComposer/DiaryComposer';
import { DiaryList } from './components/DiaryList/DiaryList';

// Diary page — day-scoped notes backed by the "diaryEntries" store.
// Intentionally minimal for now: a text box and a list. To be enhanced later.
export function Diary() {
  const [date, setDate] = useState(todayISO());
  const { entries, loading, addEntry, removeEntry } = useDiaryEntries(date);

  return (
    <section className="page">
      <Calendar date={date} onChange={setDate} />
      <DiaryComposer onSubmit={addEntry} />
      <DiaryList entries={entries} loading={loading} onDelete={removeEntry} />
    </section>
  );
}
