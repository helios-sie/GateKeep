import { type AnimationEvent, useCallback, useEffect, useState } from 'react';
import quillIcon from './assets/quill-header-icon.png';
import { BottomNav } from './components/BottomNav/BottomNav';
import { ProfileMenu } from './components/ProfileMenu/ProfileMenu';
import { Splash } from './components/Splash/Splash';
import { splashModeForThisLoad } from './components/Splash/splashMode';
import { useHashRoute } from './hooks/useHashRoute';
import { Checklist } from './pages/Checklist/Checklist';
import { Diary } from './pages/Diary/Diary';
import { Reminders } from './pages/Reminders/Reminders';

/*
 * Profile menu temporarily disabled — re-enable when ready by flipping this
 * to true. Nothing else has to change: the component, its styles and its
 * icons are all still here and still built.
 *
 * A flag rather than commenting out the JSX because tsconfig sets
 * `noUnusedLocals`, which would fail the build on the then-unused import —
 * this way the import stays genuinely referenced and the whole switch is one
 * word.
 */
const SHOW_PROFILE_MENU = false;

/** Generous upper bound on the shell entrance (longest keyframe ends at
 *  2020ms); only reached when no animationend arrives. */
const ENTRANCE_FALLBACK_MS = 2400;

export function App() {
  const { route, param, navigate } = useHashRoute();
  const [splashDone, setSplashDone] = useState(false);
  const dismissSplash = useCallback(() => setSplashDone(true), []);

  /*
   * The shell's entrance overlaps the splash's exit rather than following it.
   * It is dropped once finished so that no `transform` is left on the shell —
   * even `scale(1)` makes an element a containing block for absolutely and
   * fixed-positioned descendants, which would quietly change what the media
   * overlays and the profile panel position themselves against.
   */
  const [entranceDone, setEntranceDone] = useState(false);

  // Keyed off the scale, not the fade: it is the longer of the two, and it is
  // the one whose removal would be visible if the class were dropped early.
  const endEntrance = useCallback((e: AnimationEvent<HTMLDivElement>) => {
    if (e.animationName === 'shell-settle') setEntranceDone(true);
  }, []);

  // The entrance has to start relative to whichever exit the splash is
  // playing — the static splash is gone by 640ms, so holding the shell at
  // opacity 0 until the full timeline's 1400ms would leave a blank screen in
  // between.
  const entering = splashModeForThisLoad() === 'full' ? 'app-shell--entering' : 'app-shell--entering-quick';

  // Same fallback the splash keeps, for the same reason: under
  // prefers-reduced-motion no animationend is ever dispatched, and the class
  // would otherwise stay on forever with its `scale(1)` containing block.
  useEffect(() => {
    if (entranceDone) return;
    const t = window.setTimeout(() => setEntranceDone(true), ENTRANCE_FALLBACK_MS);
    return () => window.clearTimeout(t);
  }, [entranceDone]);

  return (
    <div className="app">
      {!splashDone && <Splash onDone={dismissSplash} />}

      <div
        className={entranceDone ? 'app-shell' : `app-shell ${entering}`}
        onAnimationEnd={endEntrance}
      >
        <header className="app-header">
          <h1>GateKeep</h1>
          {/* Sits after the wordmark so the title stays flush with the left
            edge exactly as before, and the quill leans up-and-right into the
            space beside it rather than pushing it inward. Decorative only —
            the <h1> already says "GateKeep" to a screen reader. */}
          <img className="app-header-quill" src={quillIcon} alt="" aria-hidden="true" />
          {SHOW_PROFILE_MENU && <ProfileMenu />}
        </header>

        <main className="app-main">
          {route === 'checklist' && <Checklist initialDate={param} />}
          {route === 'diary' && <Diary initialDate={param} />}
          {route === 'reminders' && <Reminders />}
        </main>

        <BottomNav active={route} onNavigate={navigate} />
      </div>
    </div>
  );
}
