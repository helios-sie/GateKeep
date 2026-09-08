import { useCallback, useEffect, useState } from 'react';

// Lightweight hash-based routing. No dependency, works under any base path,
// and survives refresh / back-forward. Each view under src/pages/ is a real,
// independently-mounted component — only one is rendered at a time.

export type Route = 'checklist' | 'diary' | 'reminders';

export const ROUTES: Route[] = ['checklist', 'diary', 'reminders'];
export const DEFAULT_ROUTE: Route = 'checklist';

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#\/?/, '');
  return (ROUTES as string[]).includes(raw) ? (raw as Route) : DEFAULT_ROUTE;
}

export function useHashRoute() {
  const [route, setRoute] = useState<Route>(parseHash);

  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((next: Route) => {
    window.location.hash = `#/${next}`;
  }, []);

  return { route, navigate };
}
