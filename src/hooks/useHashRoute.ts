import { useCallback, useEffect, useState } from 'react';

// Lightweight hash-based routing. No dependency, works under any base path,
// and survives refresh / back-forward. Each view under src/pages/ is a real,
// independently-mounted component — only one is rendered at a time.
//
// A route can carry one optional extra path segment (e.g. "#/checklist/2026-09-05")
// used for deep-linking into a page at a specific date — Reminders uses this to
// jump the Checklist page to a task's date.

export type Route = 'checklist' | 'diary' | 'reminders';

export const ROUTES: Route[] = ['checklist', 'diary', 'reminders'];
export const DEFAULT_ROUTE: Route = 'checklist';

interface ParsedHash {
  route: Route;
  param?: string;
}

function parseHash(): ParsedHash {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [seg, param] = raw.split('/');
  const route = (ROUTES as string[]).includes(seg) ? (seg as Route) : DEFAULT_ROUTE;
  return { route, param: param || undefined };
}

/**
 * Sets the hash directly, without subscribing to route changes. Usable from
 * anywhere (e.g. a Reminders list item deep-linking into the Checklist page)
 * without needing to plumb a `navigate` callback down through props.
 */
export function navigateTo(route: Route, param?: string): void {
  window.location.hash = param ? `#/${route}/${param}` : `#/${route}`;
}

export function useHashRoute() {
  const [{ route, param }, setParsed] = useState<ParsedHash>(parseHash);

  useEffect(() => {
    const onChange = () => setParsed(parseHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((next: Route, nextParam?: string) => {
    navigateTo(next, nextParam);
  }, []);

  return { route, param, navigate };
}
