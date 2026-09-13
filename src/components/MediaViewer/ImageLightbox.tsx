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
// wherever a page shows photo attachments (Checklist now; Diary later).
export function ImageLightbox({ src, onClose, alt = 'Attached photo', downloadName = 'photo.jpg' }: ImageLightboxProps) {
  return (
    <div className="image-lightbox" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="image-lightbox-actions">
        <a
          className="image-lightbox-btn"
          href={src}
          download={downloadName}
          aria-label="Download photo"
          onClick={(e) => e.stopPropagation()}
        >
          ⬇
        </a>
        <button type="button" className="image-lightbox-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <img className="image-lightbox-img" src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
