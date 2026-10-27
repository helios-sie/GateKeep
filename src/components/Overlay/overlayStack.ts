// The one registry of open full-screen overlays.
//
// Two jobs, both of which were previously nobody's:
//
//   1. While anything is open, the rest of the app is made inert and body
//      scroll is locked. Before this, a viewer was a plain <div> sitting in
//      the middle of the page: everything behind it stayed tappable, and on
//      Checklist that included the task's own checkbox and the swipe-to-
//      delete gesture on its row.
//   2. It knows which overlay is on top. Nothing uses that yet; the Android
//      hardware back button will (step 2), and it is the reason this is a
//      stack rather than a counter.
//
// Deliberately a module-level store rather than React context: overlays are
// opened from several unrelated places (a task row, a diary entry, the
// header), and threading a provider through all of them would be a lot of
// plumbing to answer one global question — "is anything open?".

type CloseFn = () => void;

interface Entry {
  id: number;
  close: CloseFn;
}

let nextId = 1;
const stack: Entry[] = [];
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((l) => l());
}

/**
 * How long the app stays unreachable AFTER the last overlay closes.
 *
 * This is the part that actually fixes "closing a photo opens the treasure
 * chest", and it is not the same fix as moving the toolbar. Repositioning
 * the ✕ only changes WHICH control sits underneath it — measured directly:
 * once the ✕ cleared the header chest, the point it vacated was occupied by
 * the week strip's date-picker button instead. In a UI this dense there is
 * no safe pixel, so position cannot be the guarantee.
 *
 * What is left is the timing. The second tap of a quick double-tap on ✕, and
 * the synthetic click a touchscreen fires after the real one, both arrive
 * within a few hundred milliseconds of the overlay unmounting and land on
 * whatever has just been revealed. Holding the isolation briefly means they
 * land on nothing at all, which is the correct outcome: the user meant to
 * close something that is already closed.
 *
 * Short enough to be imperceptible if they genuinely did mean to tap next.
 */
const ISOLATION_RELEASE_MS = 350;

let releaseTimer: number | null = null;

function setIsolation(active: boolean): void {
  const app = document.querySelector('.app');
  if (app) {
    if (active) {
      app.setAttribute('inert', '');
      app.setAttribute('aria-hidden', 'true');
    } else {
      app.removeAttribute('inert');
      app.removeAttribute('aria-hidden');
    }
  }
  document.body.classList.toggle('overlay-open', active);
}

/**
 * Makes everything behind the overlays unreachable — by pointer, by
 * keyboard, and to a screen reader — and stops the page scrolling under
 * them.
 *
 * `inert` does all three in one attribute, but it is recent enough that an
 * older Android System WebView may not honour it, so `aria-hidden` and a
 * `pointer-events: none` rule keyed off `[inert]` (Overlay.css) back it up.
 * Those two cover the cases that actually bite on a phone.
 */
function applyIsolation(active: boolean): void {
  if (releaseTimer !== null) {
    window.clearTimeout(releaseTimer);
    releaseTimer = null;
  }

  if (active) {
    setIsolation(true);
    return;
  }

  // Released on a delay; see ISOLATION_RELEASE_MS. Re-opening an overlay in
  // the meantime cancels it via the clearTimeout above, so a reopen can
  // never be left with the isolation torn down underneath it.
  releaseTimer = window.setTimeout(() => {
    releaseTimer = null;
    setIsolation(false);
  }, ISOLATION_RELEASE_MS);
}

/**
 * Called by Overlay on mount. Returns the unregister function, so the whole
 * thing is one line in an effect.
 */
export function registerOverlay(close: CloseFn): () => void {
  const entry: Entry = { id: nextId++, close };
  stack.push(entry);
  if (stack.length === 1) applyIsolation(true);
  notify();

  return () => {
    const i = stack.findIndex((e) => e.id === entry.id);
    if (i !== -1) stack.splice(i, 1);
    if (stack.length === 0) applyIsolation(false);
    notify();
  };
}

/** Closes the overlay on top. Returns false if there was nothing to close,
 *  which is how the back-button handler will know to let the OS have the
 *  event instead. */
export function closeTopOverlay(): boolean {
  const top = stack[stack.length - 1];
  if (!top) return false;
  top.close();
  return true;
}

export function hasOpenOverlay(): boolean {
  return stack.length > 0;
}

export function subscribeToOverlays(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
