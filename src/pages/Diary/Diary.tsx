import { useEffect, useState } from 'react';
import { Calendar } from '../../components/Calendar/Calendar';
import { useDiaryEntry } from '../../hooks/useDiaryEntry';
import { todayISO } from '../../lib/dateUtils';
import { DiaryEntryEditor } from './components/DiaryEntryEditor/DiaryEntryEditor';
import { DiaryEntryView } from './components/DiaryEntryView/DiaryEntryView';
import { DiarySearch } from './components/DiarySearch/DiarySearch';
import './Diary.css';

interface DiaryProps {
  /** Deep-linked date (e.g. from a search result), used instead of today on
   *  mount — and adopted if it changes while already mounted. */
  initialDate?: string;
}

// Diary page — one entry per date. An existing entry shows read-only (view
// mode) until the pencil is tapped; a date with no entry opens straight in
// edit mode.
export function Diary({ initialDate }: DiaryProps) {
  const [date, setDate] = useState(initialDate ?? todayISO());
  const { entry, loading, saveEntry } = useDiaryEntry(date);
  const [editing, setEditing] = useState(false);
  const [searching, setSearching] = useState(false);

  // Tapping a search result sets a new deep-link date while this page is
  // already mounted (route doesn't change, so nothing remounts it) — pick
  // that up explicitly instead of only reading it as an initial value.
  useEffect(() => {
    if (initialDate) setDate(initialDate);
  }, [initialDate]);

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
      <DiarySearch onActiveChange={setSearching} />

      {!searching &&
        (loading ? (
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
        ))}
    </section>
  );
}
