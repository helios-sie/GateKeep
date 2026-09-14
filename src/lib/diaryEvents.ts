// Same pattern as taskEvents.ts — lets anything reading "diaryEntries" react
// immediately when it's written to elsewhere (e.g. a week-strip's content
// dots updating right after an entry is saved), instead of only picking up
// fresh data on its next mount. Touches no storage itself.

type Listener = () => void;

const listeners = new Set<Listener>();

/** Subscribe to diaryEntries-store writes. Returns an unsubscribe function. */
export function onDiaryChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Called by db.ts after a diary entry is saved or deleted. */
export function notifyDiaryChanged(): void {
  listeners.forEach((listener) => listener());
}
