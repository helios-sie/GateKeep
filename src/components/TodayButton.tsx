import { todayISO } from '../lib/dateUtils';
import './TodayButton.css';

interface TodayButtonProps {
  /** The currently viewed date. The button hides itself when this is today. */
  date: string;
  onToday: () => void;
}

// Shared by any page with its own date navigation (Checklist, Diary — both
// via Calendar). Renders nothing once the viewed date already is today.
export function TodayButton({ date, onToday }: TodayButtonProps) {
  if (date === todayISO()) return null;

  return (
    <button type="button" className="today-button" onClick={onToday}>
      Today
    </button>
  );
}
