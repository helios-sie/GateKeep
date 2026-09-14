import { useEffect, useState } from 'react';
import { Calendar } from '../../components/Calendar/Calendar';
import { useDiaryEntry } from '../../hooks/useDiaryEntry';
import { useSwipeNavigate } from '../../hooks/useSwipeNavigate';
import { getContent } from '../../lib/content';
import { addDays, todayISO } from '../../lib/dateUtils';
import type { ContentSegment } from '../../types/content';
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

  async function handleSave(content: ContentSegment[]) {
    await saveEntry(content);
    setEditing(false);
  }

  const showEditor = !entry || editing;

  // Swipe left/right anywhere on the entry to move a day forward/back — the
  // Calendar arrows above do the same thing and stay as a fallback. Off
  // while the composer is showing (a new empty entry, or editing an
  // existing one): swiping there could too easily read as an accidental
  // page-turn and silently abandon an in-progress edit instead.
  const { dragX, dragging, handlers } = useSwipeNavigate({
    onSwipeLeft: () => setDate((d) => (d < todayISO() ? addDays(d, 1) : d)),
    onSwipeRight: () => setDate((d) => addDays(d, -1)),
    enabled: !searching && !showEditor,
  });

  return (
    <section className="page">
      <Calendar date={date} onChange={setDate} onToday={() => setDate(todayISO())} />
      <DiarySearch onActiveChange={setSearching} />

      <div
        className={dragging ? 'swipe-content is-dragging' : 'swipe-content'}
        style={dragging ? { transform: `translateX(${Math.max(-32, Math.min(32, dragX * 0.4))}px)` } : undefined}
        {...handlers}
      >
        {!searching &&
          (loading ? (
            <p className="diary-loading">Loading…</p>
          ) : showEditor ? (
            <DiaryEntryEditor
              key={date}
              initialContent={entry ? getContent(entry) : null}
              onSave={handleSave}
              onCancel={entry ? () => setEditing(false) : undefined}
            />
          ) : (
            <DiaryEntryView content={getContent(entry)} onEdit={() => setEditing(true)} />
          ))}
      </div>
    </section>
  );
}
