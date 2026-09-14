import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

// Swipe left/right on a page's main content to move to the next/previous
// day (Checklist, Diary) or month (Reminders) — the DateNav arrows stay as
// a secondary, always-discoverable fallback for the same action.
//
// Deliberately mirrors useSwipeToDelete's "vertical drag = let it scroll"
// lock, but adds one more rule: a gesture that *starts* on a task row (or
// any interactive control — a button, an input, the composer, an inline
// photo/audio icon) is left alone entirely, untouched, so it can't fight
// with that row's own swipe-to-delete or with normal taps/typing/selection.
// Swiping the empty space around/between rows (or anywhere on Diary, which
// has no per-row gesture of its own) is what triggers navigation.

const LOCK_THRESHOLD = 10; // px of movement before deciding swipe vs. scroll
const COMMIT_THRESHOLD = 45; // px of horizontal drag to actually navigate

const IGNORE_SELECTOR = [
  'button',
  'input',
  'select',
  'textarea',
  'a',
  '[contenteditable="true"]',
  '.task-item',
  '.composer-media',
  '.segment-inline-photo',
  '.segment-inline-audio',
].join(', ');

interface UseSwipeNavigateOptions {
  /** Swiped right-to-left — conventionally "forward" (next day/month). */
  onSwipeLeft: () => void;
  /** Swiped left-to-right — "back" (previous day/month). */
  onSwipeRight: () => void;
  /** Set false to disable entirely (e.g. while a search overlay is showing
   *  a different, unrelated list). Defaults to true. */
  enabled?: boolean;
}

export function useSwipeNavigate({ onSwipeLeft, onSwipeRight, enabled = true }: UseSwipeNavigateOptions) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const activePointerId = useRef<number | null>(null);
  const lockRef = useRef<'none' | 'horizontal' | 'vertical' | 'ignored'>('none');

  const reset = useCallback(() => {
    startX.current = null;
    startY.current = null;
    activePointerId.current = null;
    lockRef.current = 'none';
    setDragX(0);
    setDragging(false);
  }, []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!enabled) {
        lockRef.current = 'ignored';
        return;
      }
      // Started on a task row, a button, a text field, an inline media
      // icon, etc. — that control (or the row's own swipe-to-delete) owns
      // this gesture instead; don't even start tracking it here.
      if ((e.target as HTMLElement).closest(IGNORE_SELECTOR)) {
        lockRef.current = 'ignored';
        return;
      }
      startX.current = e.clientX;
      startY.current = e.clientY;
      activePointerId.current = e.pointerId;
      lockRef.current = 'none';
    },
    [enabled]
  );

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    if (
      lockRef.current === 'ignored' ||
      lockRef.current === 'vertical' ||
      startX.current === null ||
      startY.current === null ||
      e.pointerId !== activePointerId.current
    ) {
      return;
    }

    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (lockRef.current === 'none') {
      if (Math.abs(dx) < LOCK_THRESHOLD && Math.abs(dy) < LOCK_THRESHOLD) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        // Vertical intent — let the page scroll normally, stop tracking.
        lockRef.current = 'vertical';
        return;
      }
      lockRef.current = 'horizontal';
      try {
        // On some browsers (notably seen with touch input) the pointer can
        // already be gone by the time this runs — a fast flick's pointerup
        // can land before this move handler does — which throws
        // NotFoundError. That's fine to ignore: capture is just an
        // optimization to keep tracking the same pointer if it drifts off
        // this element; the gesture still completes correctly without it.
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setDragging(true);
    }

    setDragX(dx);
  }, []);

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (lockRef.current !== 'horizontal' || e.pointerId !== activePointerId.current) {
        reset();
        return;
      }
      const dx = e.clientX - (startX.current ?? e.clientX);
      if (Math.abs(dx) >= COMMIT_THRESHOLD) {
        if (dx < 0) onSwipeLeft();
        else onSwipeRight();
      }
      reset();
    },
    [onSwipeLeft, onSwipeRight, reset]
  );

  return {
    dragX,
    dragging,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: reset,
    },
  };
}
