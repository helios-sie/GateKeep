import { BottomNav } from './components/BottomNav/BottomNav';
import { useHashRoute } from './hooks/useHashRoute';
import { Checklist } from './pages/Checklist/Checklist';
import { Diary } from './pages/Diary/Diary';
import { Reminders } from './pages/Reminders/Reminders';

export function App() {
  const { route, param, navigate } = useHashRoute();

  return (
    <div className="app">
      <header className="app-header">
        <h1>Gatekeep</h1>
      </header>

      <main className="app-main">
        {route === 'checklist' && <Checklist initialDate={param} />}
        {route === 'diary' && <Diary initialDate={param} />}
        {route === 'reminders' && <Reminders />}
      </main>

      <BottomNav active={route} onNavigate={navigate} />
    </div>
  );
}
