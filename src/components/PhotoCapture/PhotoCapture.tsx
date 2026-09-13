import { forwardRef, useImperativeHandle, useRef } from 'react';

interface PhotoCaptureProps {
  /** Handed the raw captured/picked file — the caller decides where and how
   *  to persist it (e.g. saveTaskPhoto for Checklist, a future diary-media
   *  store for Diary). This component only knows how to get a photo file. */
  onCapture: (file: File) => void;
}

export interface PhotoCaptureHandle {
  /** Opens the camera (mobile) / file picker (desktop). */
  open: () => void;
}

// Headless: renders only a hidden file input with capture="environment" —
// on mobile browsers this opens the camera directly, on desktop it falls
// back to a file picker. No visible UI of its own; the caller supplies its
// own trigger button and calls ref.current.open(). This works reliably as a
// real hosted page (unlike inside a sandboxed iframe), since it's a
// standard browser permission, not a restricted one.
export const PhotoCapture = forwardRef<PhotoCaptureHandle, PhotoCaptureProps>(function PhotoCapture(
  { onCapture },
  ref
) {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    open: () => inputRef.current?.click(),
  }));

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onCapture(file);
    e.target.value = '';
  }

  return (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      capture="environment"
      hidden
      onChange={handleChange}
    />
  );
});
