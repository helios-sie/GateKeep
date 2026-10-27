import { Overlay, stopOverlayEvent } from '../Overlay/Overlay';
import './ImageLightbox.css';

interface ImageLightboxProps {
  src: string;
  onClose: () => void;
  alt?: string;
  /** Suggested filename for the Download button. */
  downloadName?: string;
}

// In-app modal for viewing an attached photo full-size — tapping a thumbnail
// opens this instead of a new tab or the OS's own image viewer. Reusable
// wherever a page shows photo attachments.
//
// Everything about escaping the page (portal, backdrop, event isolation,
// making the app behind inert) belongs to Overlay; see the comment there for
// the three bugs that came of this being a plain inline <div>.
export function ImageLightbox({ src, onClose, alt = 'Attached photo', downloadName = 'photo.jpg' }: ImageLightboxProps) {
  return (
    <Overlay variant="media" label="Attached photo" onClose={onClose}>
      <div className="overlay-toolbar overlay-toolbar--floating">
        <a
          className="overlay-btn overlay-btn--onDark"
          href={src}
          download={downloadName}
          aria-label="Download photo"
          onClick={stopOverlayEvent}
        >
          ⬇
        </a>
        <button
          type="button"
          className="overlay-btn overlay-btn--onDark"
          aria-label="Close"
          // Explicit, even though the backdrop only closes on a tap that
          // lands on itself: a control should never depend on an ancestor's
          // target check to behave.
          onClick={(e) => {
            stopOverlayEvent(e);
            onClose();
          }}
        >
          ✕
        </button>
      </div>

      <img className="image-lightbox-img" src={src} alt={alt} onClick={stopOverlayEvent} />
    </Overlay>
  );
}
