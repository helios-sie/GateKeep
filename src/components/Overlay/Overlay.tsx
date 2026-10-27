import { useEffect, useRef } from 'react';
import type { ReactNode, SyntheticEvent } from 'react';
import { createPortal } from 'react-dom';
import { registerOverlay } from './overlayStack';
import './Overlay.css';

/*
 * The shared shell for every full-screen overlay — the media viewers and the
 * backup panel. It exists because of a specific, verified bug class rather
 * than for tidiness.
 *
 * ImageLightbox and AudioPlayer were rendered inline by SegmentContent, which
 * on the Checklist put them *inside* the task row's <label>, inside the <li>
 * that carries the swipe-to-delete gesture:
 *
 *   div.image-lightbox > span.segment-content > label > div.task-row-content
 *     > li.task-item
 *
 * Three separate failures followed from that one fact, all reproduced before
 * this was written:
 *
 *   - A tap on the dark backdrop is a tap inside the <label>, so the browser
 *     forwarded it to the labelled control and silently ticked the task off.
 *     (The ✕ escaped this only because HTML skips label-forwarding when the
 *     target is itself interactive — the click still propagated.)
 *   - Dragging the audio scrubber reached the <li>'s pointer handlers and put
 *     the row into a swipe-to-delete drag: 162px of travel, past the 88px
 *     threshold, so letting go deleted the task.
 *   - That drag puts a `transform` on the <li>, which makes it the containing
 *     block for `position: fixed` descendants. The "full-screen" overlay
 *     collapsed to a 431x50 box partway down the page.
 *
 * Two things fix all of it. The portal moves the overlay out of that subtree
 * so no native DOM behaviour (label forwarding, containing blocks) can reach
 * it. The backdrop then stops propagation, because React events bubble
 * through a portal along the REACT tree, not the DOM tree — SegmentContent is
 * still rendered inside that <label>, so the <li>'s React pointer handlers
 * would otherwise go on receiving every event from inside the viewer.
 */

interface OverlayProps {
  onClose: () => void;
  /** Accessible name for the dialog. */
  label: string;
  /**
   * `media` dims the whole screen and centres its child (photo, audio card).
   * `panel` hosts a side panel against the edge of the app's own column
   * rather than the far side of a wide window — the behaviour BackupPanel
   * had when it was positioned inside .app, preserved now that it is not.
   */
  variant: 'media' | 'panel';
  /** Extra class on the backdrop, for a caller running its own exit
   *  animation (BackupPanel's slide-out). */
  className?: string;
  children: ReactNode;
}

/** Exported so controls inside an overlay can be explicit about not letting
 *  their events escape, even though the backdrop already stops them. */
export const stopOverlayEvent = (e: SyntheticEvent) => e.stopPropagation();

export function Overlay({ onClose, label, variant, className, children }: OverlayProps) {
  // Kept in a ref so registering with the stack and binding Escape happen
  // exactly once, rather than re-running every time a parent re-render hands
  // down a fresh closure.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => registerOverlay(() => onCloseRef.current()), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    // Only a tap on the backdrop ITSELF closes. A tap that started on the
    // photo or inside the audio card bubbles to here, and must not.
    if (e.target === e.currentTarget) onCloseRef.current();
  }

  return createPortal(
    <div
      className={['overlay', `overlay--${variant}`, className].filter(Boolean).join(' ')}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={handleClick}
      /*
       * The pointer and touch families are stopped as well as click. Click
       * alone is not enough: the swipe gesture on a task row is driven
       * entirely by pointerdown/move/up, so without these a scrub or a drag
       * inside the viewer still reaches it through the React tree.
       */
      onPointerDown={stopOverlayEvent}
      onPointerMove={stopOverlayEvent}
      onPointerUp={stopOverlayEvent}
      onPointerCancel={stopOverlayEvent}
      onTouchStart={stopOverlayEvent}
      onTouchMove={stopOverlayEvent}
      onTouchEnd={stopOverlayEvent}
    >
      {children}
    </div>,
    document.body
  );
}
