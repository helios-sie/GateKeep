import { Overlay, stopOverlayEvent } from '../Overlay/Overlay';
import { useMediaDownload } from './useMediaDownload';
import './ImageLightbox.css';

interface ImageLightboxProps {
  src: string;
  onClose: () => void;
  alt?: string;
  /** Base name for the Download button; the extension comes from the
   *  photo's real MIME type, not from here. */
  downloadName?: string;
}

// In-app modal for viewing an attached photo full-size — tapping a thumbnail
// opens this instead of a new tab or the OS's own image viewer. Reusable
// wherever a page shows photo attachments.
//
// Everything about escaping the page (portal, backdrop, event isolation,
// making the app behind inert) belongs to Overlay; see the comment there for
// the three bugs that came of this being a plain inline <div>.
export function ImageLightbox({ src, onClose, alt = 'Attached photo', downloadName = 'photo' }: ImageLightboxProps) {
  const { filename, save, error, busy, needsNativeSave } = useMediaDownload(src, 'photo', downloadName);

  return (
    <Overlay variant="media" label="Attached photo" onClose={onClose}>
      <div className="overlay-toolbar overlay-toolbar--floating">
        <a
          className="overlay-btn overlay-btn--onDark"
          href={src}
          download={filename}
          aria-label="Download photo"
          onClick={(e) => {
            stopOverlayEvent(e);
            // On the web the anchor is left to do its own job. In the
            // WebView it silently does nothing, so the save is taken over
            // by Filesystem + Share instead.
            if (!needsNativeSave) return;
            e.preventDefault();
            void save();
          }}
        >
          {busy ? '…' : '⬇'}
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

      {error && (
        <p className="overlay-error" role="status" onClick={stopOverlayEvent}>
          {error}
        </p>
      )}

      <img className="image-lightbox-img" src={src} alt={alt} onClick={stopOverlayEvent} />
    </Overlay>
  );
}
