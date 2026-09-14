import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

// Swipe-to-delete for a single task row: drag horizontally past `threshold`
// in either direction and release to delete it, with a brief "disintegrate
// into particles" animation before it's actually removed. Kept out of
// TaskList.tsx / TaskRow.tsx so the gesture + animation logic lives in one
// place.
//
// A vertical drag is treated as the page scrolling, not a swipe: nothing is
// captured or blocked until a handful of pixels of movement confirm the
// gesture is more horizontal than vertical (see LOCK_THRESHOLD below).

export type SwipePhase = 'idle' | 'dragging' | 'disintegrating';

export interface Particle {
  id: number;
  /** Starting position, as a percentage of the row's box. */
  x: number;
  y: number;
  /** Travel distance in px by the end of the animation. */
  dx: number;
  dy: number;
  rotate: number;
  delay: number;
  size: number;
}

const LOCK_THRESHOLD = 8; // px of movement before we decide swipe vs. scroll
const PARTICLE_COUNT = 16;
const DISINTEGRATE_MS = 560;
// Kept short rather than zero: index.css already disables all CSS
// animation/transition under prefers-reduced-motion, so no particles or
// dissolve actually render for these users — this is just how long the row
// waits before it's removed, so deletion doesn't feel instantaneous/jarring.
const REDUCED_MOTION_MS = 160;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function generateParticles(direction: 1 | -1): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, id) => {
    const spreadDeg = (Math.random() - 0.5) * 140; // fan out around the swipe direction
    const rad = (spreadDeg * Math.PI) / 180;
    const distance = 40 + Math.random() * 90;
    return {
      id,
      x: Math.random() * 100,
      y: Math.random() * 100,
      dx: Math.cos(rad) * distance * direction,
      dy: Math.sin(rad) * distance,
      rotate: (Math.random() - 0.5) * 240,
      delay: Math.random() * 120,
      size: 3 + Math.random() * 4,
    };
  });
}

export function useSwipeToDelete(onDelete: () => void, threshold = 88) {
  const [dragX, setDragX] = useState(0);
  const [phase, setPhase] = useState<SwipePhase>('idle');
  const [direction, setDirection] = useState<1 | -1>(1);

  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const activePointerId = useRef<number | null>(null);
  const lockRef = useRef<'none' | 'horizontal' | 'vertical'>('none');

  // Read once; a live toggle mid-session is not worth subscribing to here.
  const reducedMotion = useRef(prefersReducedMotion()).current;

  // Always call the *latest* onDelete, without making the removal timer
  // restart every time a parent re-render hands us a new closure.
  const onDeleteRef = useRef(onDelete);
  useEffect(() => {
    onDeleteRef.current = onDelete;
  }, [onDelete]);

  const reset = useCallback(() => {
    startX.current = null;
    startY.current = null;
    activePointerId.current = null;
    lockRef.current = 'none';
    setDragX(0);
    setPhase('idle');
  }, []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (phase !== 'idle') return;
      startX.current = e.clientX;
      startY.current = e.clientY;
      activePointerId.current = e.pointerId;
      lockRef.current = 'none';
    },
    [phase]
  );

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    if (
      startX.current === null ||
      startY.current === null ||
      e.pointerId !== activePointerId.current ||
      lockRef.current === 'vertical'
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
        // A fast flick's pointerup can land before this move handler does,
        // which makes this throw NotFoundError on some browsers — harmless
        // to ignore, capture is just an optimization here.
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setPhase('dragging');
    }

    setDragX(dx);
  }, []);

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerId !== activePointerId.current) return;
      if (lockRef.current !== 'horizontal') {
        reset();
        return;
      }
      if (Math.abs(dragX) >= threshold) {
        setDirection(dragX >= 0 ? 1 : -1);
        startX.current = null;
        startY.current = null;
        activePointerId.current = null;
        lockRef.current = 'none';
        setPhase('disintegrating');
      } else {
        reset();
      }
    },
    [dragX, threshold, reset]
  );

  const particles = useMemo(
    () => (phase === 'disintegrating' && !reducedMotion ? generateParticles(direction) : []),
    [phase, direction, reducedMotion]
  );

  useEffect(() => {
    if (phase !== 'disintegrating') return;
    const duration = reducedMotion ? REDUCED_MOTION_MS : DISINTEGRATE_MS;
    const timer = setTimeout(() => onDeleteRef.current(), duration);
    return () => clearTimeout(timer);
  }, [phase, reducedMotion]);

  return {
    phase,
    dragX,
    particles,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: reset,
    },
  };
}
