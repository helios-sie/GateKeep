import { useState } from 'react';
import { Calendar } from '../../components/Calendar/Calendar';
import { useDiaryEntry } from '../../hooks/useDiaryEntry';
import { todayISO } from '../../lib/dateUtils';
import { DiaryEntryEditor } from './components/DiaryEntryEditor/DiaryEntryEditor';
import './Diary.css';

// Diary page — one entry per date, edited in place. No list of notes.
export function Diary() {
  const [date, setDate] = useState(todayISO());
  const { entry, loading, saveEntry } = useDiaryEntry(date);

  return (
    <section className="page">
      <Calendar date={date} onChange={setDate} />

      {loading ? (
        <p className="diary-loading">Loading…</p>
      ) : (
        <DiaryEntryEditor
          key={date}
          value={entry ? entry.text : null}
          onSave={saveEntry}
        />
      )}
    </section>
  );
}
