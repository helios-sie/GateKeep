import { todayISO } from '../../lib/dateUtils';

/** 'full' plays the entrance animation; 'static' shows the finished lockup
 *  for a beat with no motion. */
export type SplashMode = 'full' | 'static';

/*
 * Fallback dismissal only. The splash normally unmounts on its fade-out's
 * `animationend` (see Splash.tsx); these are the safety net for
 * prefers-reduced-motion, where index.css disables every animation and no
 * animationend is ever dispatched. Kept a little longer than the animated
 * timeline so they never pre-empt it.
 */
export const FULL_MS = 1980;
export const STATIC_MS = 700;

const STORAGE_KEY = 'gatekeep:splash-last-played';

/*
 * DEVELOPMENT/TESTING AID — `?splash=force` replays the animation on every
 * load, bypassing the once-per-day check, so it can be previewed repeatedly
 * while being worked on. It deliberately does NOT record a play, so a forced
 * preview can't consume the real one for that day.
 *
 * TODO(before production deploy): remove this, or gate it behind
 * `import.meta.env.DEV` so it can't be triggered on the live site.
 */
function isForced(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('splash') === 'force';
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function readLastPlayed(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private browsing / blocked storage: fall through to playing it. Showing
    // the splash more often than intended is a far better failure than the
    // app refusing to start.
    return null;
  }
}

function markPlayed(): void {
  try {
    localStorage.setItem(STORAGE_KEY, todayISO());
  } catch {
    // See readLastPlayed.
  }
}

/*
 * Decided once per page load rather than per mount. React StrictMode mounts,
 * unmounts and remounts every component in development — without this cache
 * the first mount would record today's play and the immediate remount would
 * read it back and downgrade itself to 'static', so the animation could never
 * be seen in a dev build.
 */
let cached: SplashMode | null = null;

export function splashModeForThisLoad(): SplashMode {
  if (cached !== null) return cached;

  if (isForced()) {
    cached = 'full';
  } else if (prefersReducedMotion() || readLastPlayed() === todayISO()) {
    cached = 'static';
  } else {
    cached = 'full';
    markPlayed();
  }

  return cached;
}
