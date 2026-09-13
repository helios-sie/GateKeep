// Tiny pub-sub so anything reading the "tasks" store can react immediately
// when it's written to elsewhere in the app (e.g. Reminders re-fetching the
// instant a task is swipe-deleted on the Checklist page), instead of only
// picking up fresh data on its next mount/remount. This file touches no
// storage itself — db.ts is still the only place that calls indexedDB.

type Listener = () => void;

const listeners = new Set<Listener>();

/** Subscribe to task-store writes. Returns an unsubscribe function. */
export function onTasksChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Called by db.ts after a task is saved or deleted. */
export function notifyTasksChanged(): void {
  listeners.forEach((listener) => listener());
}
