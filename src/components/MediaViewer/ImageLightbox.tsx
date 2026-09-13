import './ImageLightbox.css';

interface ImageLightboxProps {
  src: string;
  onClose: () => void;
  alt?: string;
}

// In-app modal for viewing an attached photo full-size — tapping a thumbnail
// opens this instead of a new tab or the OS's own image viewer. Reusable
// wherever a page shows photo attachments (Checklist now; Diary later).
export function ImageLightbox({ src, onClose, alt = 'Attached photo' }: ImageLightboxProps) {
  return (
    <div className="image-lightbox" role="dialog" aria-modal="true" onClick={onClose}>
      <button type="button" className="image-lightbox-close" onClick={onClose} aria-label="Close">
        ✕
      </button>
      <img className="image-lightbox-img" src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
