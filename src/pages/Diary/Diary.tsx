import { useEffect, useState } from 'react';
import { Calendar } from '../../components/Calendar/Calendar';
import { useDiaryEntry } from '../../hooks/useDiaryEntry';
import { todayISO } from '../../lib/dateUtils';
import { DiaryEntryEditor } from './components/DiaryEntryEditor/DiaryEntryEditor';
import { DiaryEntryView } from './components/DiaryEntryView/DiaryEntryView';
import './Diary.css';

// Diary page — one entry per date. An existing entry shows read-only (view
// mode) until the pencil is tapped; a date with no entry opens straight in
// edit mode.
export function Diary() {
  const [date, setDate] = useState(todayISO());
  const { entry, loading, saveEntry } = useDiaryEntry(date);
  const [editing, setEditing] = useState(false);

  // Changing the date always returns to view mode for the new day.
  useEffect(() => {
    setEditing(false);
  }, [date]);

  async function handleSave(text: string) {
    await saveEntry(text);
    setEditing(false);
  }

  const showEditor = !entry || editing;

  return (
    <section className="page">
      <Calendar date={date} onChange={setDate} onToday={() => setDate(todayISO())} />

      {loading ? (
        <p className="diary-loading">Loading…</p>
      ) : showEditor ? (
        <DiaryEntryEditor
          key={date}
          value={entry ? entry.text : null}
          onSave={handleSave}
          onCancel={entry ? () => setEditing(false) : undefined}
        />
      ) : (
        <DiaryEntryView text={entry.text} onEdit={() => setEditing(true)} />
      )}
    </section>
  );
}
