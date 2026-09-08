import { useRef } from 'react';
import { savePhoto } from '../../lib/db';

interface PhotoCaptureProps {
  onCapture: (photoId: string) => void;
}

// Uses a plain file input with capture="environment": on mobile browsers
// this opens the camera directly; on desktop it falls back to a file picker.
// This works reliably as a real hosted page (unlike inside a sandboxed
// iframe), since it's a standard browser permission, not a restricted one.
export function PhotoCapture({ onCapture }: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const id = crypto.randomUUID();
    await savePhoto({ id, blob: file, createdAt: Date.now() });
    onCapture(id);
    e.target.value = '';
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handleChange}
      />
      <button type="button" onClick={() => inputRef.current?.click()}>
        📷 Photo
      </button>
    </>
  );
}
