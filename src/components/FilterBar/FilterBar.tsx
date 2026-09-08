import type { StatusFilter } from '../../types/entry';
import './FilterBar.css';

interface FilterBarProps {
  value: StatusFilter;
  onChange: (filter: StatusFilter) => void;
}

const OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'done', label: 'Done' },
];

export function FilterBar({ value, onChange }: FilterBarProps) {
  return (
    <div className="filter-bar">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          className={value === opt.value ? 'active' : ''}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
