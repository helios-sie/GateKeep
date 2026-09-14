import './TodayButton.css';

interface TodayButtonProps {
  /** Text shown on the pill — "Today" (Checklist/Diary) or "This Month"
   *  (Reminders), whatever "jump back to the current thing" means on that
   *  page. Defaults to "Today". */
  label?: string;
  /** Caller decides when there's nothing to jump back to — e.g. the viewed
   *  date already is today, or the browsed month/year already is this one. */
  hidden: boolean;
  onClick: () => void;
}

// Shared "jump back to now" pill — Checklist/Diary's Calendar uses it as
// "Today"; Reminders reuses the same component/style as "This Month", so
// both read as the same affordance despite operating on different
// granularities (a day vs. a month).
export function TodayButton({ label = 'Today', hidden, onClick }: TodayButtonProps) {
  if (hidden) return null;

  return (
    <button type="button" className="today-button" onClick={onClick}>
      {label}
    </button>
  );
}
