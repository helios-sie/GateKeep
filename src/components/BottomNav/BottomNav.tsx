import type { Route } from '../../hooks/useHashRoute';
import { ChecklistIcon, ClockIcon, NotebookIcon } from './icons';
import './BottomNav.css';

interface BottomNavProps {
  active: Route;
  onNavigate: (route: Route) => void;
}

const ITEMS = [
  { route: 'reminders' as const, label: 'Reminders', Icon: ClockIcon },
  { route: 'checklist' as const, label: 'Checklist', Icon: ChecklistIcon },
  { route: 'diary' as const, label: 'Diary', Icon: NotebookIcon },
];

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {ITEMS.map(({ route, label, Icon }) => {
        const isActive = active === route;
        return (
          <button
            key={route}
            type="button"
            className={isActive ? 'bottom-nav-item active' : 'bottom-nav-item'}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onNavigate(route)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
