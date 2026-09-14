import { useEffect, useRef } from 'react';
import quillIcon from '../../assets/quill-header-icon.png';
import './Splash.css';
import { FULL_MS, STATIC_MS, splashModeForThisLoad } from './splashMode';

interface Props {
  /** Fired when the splash has finished and should be unmounted. */
  onDone: () => void;
}

export function Splash({ onDone }: Props) {
  const isFull = splashModeForThisLoad() === 'full';
  const rootRef = useRef<HTMLDivElement>(null);

  /*
   * Unmounting is driven by the fade-out's own `animationend`, not by a timer.
   * This is what the hard cut was: a timer starts when the effect runs, which
   * is before the browser has painted, whereas the CSS animation's clock only
   * starts at that first paint. The timer therefore always fires *early* by at
   * least a frame — and by far more whenever the first paint is held up by the
   * app's own start-up work underneath (IndexedDB reads, the first list
   * render, decoding the quill PNG). The splash was being torn out of the DOM
   * while it was still part-way through fading, which reads as a cut no matter
   * how well the fade itself is written.
   *
   * The timer survives only as a fallback: under prefers-reduced-motion
   * index.css disables every animation, so no animationend will ever arrive
   * and something still has to dismiss the splash.
   */
  useEffect(() => {
    const el = rootRef.current;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      onDone();
    };

    const onAnimationEnd = (e: AnimationEvent) => {
      // Ignore the entrance animations bubbling up from the lockup.
      if (e.animationName === 'splash-out') finish();
    };

    el?.addEventListener('animationend', onAnimationEnd);
    const t = window.setTimeout(finish, isFull ? FULL_MS : STATIC_MS);

    return () => {
      el?.removeEventListener('animationend', onAnimationEnd);
      window.clearTimeout(t);
    };
  }, [isFull, onDone]);

  return (
    <div
      ref={rootRef}
      className={`splash ${isFull ? 'splash--full' : 'splash--static'}`}
      aria-hidden="true"
    >
      <div className="splash-lockup">
        <img className="splash-quill" src={quillIcon} alt="" />
        <span className="splash-wordmark">GateKeep</span>
      </div>
    </div>
  );
}
