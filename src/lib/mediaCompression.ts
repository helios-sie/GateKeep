/**
 * Client-side compression applied to every photo/audio attachment before it
 * is handed to db.ts to be written into IndexedDB — this app has no server,
 * so whatever gets attached lives on the user's own device storage
 * indefinitely. Used by InlineComposer/AudioCapture, which are shared by
 * both Checklist and Diary, so this one module covers task photos, task
 * audio, diary photos, and diary audio uniformly.
 */

const MAX_IMAGE_DIMENSION = 1280;
const JPEG_QUALITY = 0.75;

/** Inline attachment icons only ever render at ~22-36 CSS px — decoding the
 *  full 1280px stored photo just to paint that is what was blowing up
 *  memory on Diary entries with several photos already attached (each
 *  decoded bitmap is several MB, and they all stay resident at once while
 *  the composer/view is mounted). A tiny dedicated thumbnail keeps the
 *  resident decode small; the full photo is only ever fetched again, once,
 *  when the user actually opens the lightbox. */
const THUMBNAIL_MAX_DIMENSION = 96;
const THUMBNAIL_QUALITY = 0.6;

/** ~48kbps mono opus — small files, still clear for spoken voice notes. */
const AUDIO_BITS_PER_SECOND = 48_000;

async function decodeImage(source: Blob): Promise<ImageBitmap | HTMLImageElement | null> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(source);
    } catch {
      // Some formats (e.g. HEIC on non-Safari) can fail createImageBitmap —
      // fall through to the <img> path below before giving up entirely.
    }
  }

  const url = URL.createObjectURL(source);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('image decode failed'));
      img.src = url;
    });
    return img;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function dimensionsOf(source: ImageBitmap | HTMLImageElement): { width: number; height: number } {
  return { width: source.width, height: source.height };
}

/**
 * Downscales to at most `maxDimension` on the longest side and re-encodes as
 * JPEG at `quality`. Never upscales. Falls back to returning the original
 * blob untouched if decoding fails (e.g. an unsupported format) or if the
 * re-encode somehow comes out larger — an attachment should never get
 * bigger for having gone through this.
 */
export async function compressImage(
  file: Blob,
  { maxDimension = MAX_IMAGE_DIMENSION, quality = JPEG_QUALITY }: { maxDimension?: number; quality?: number } = {}
): Promise<Blob> {
  const source = await decodeImage(file);
  if (!source) return file;

  const { width, height } = dimensionsOf(source);
  if (!width || !height) return file;

  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  if ('close' in source) source.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) return file;

  return blob.size < file.size ? blob : file;
}

/**
 * A small (~96px) preview JPEG for inline attachment icons — see the
 * THUMBNAIL_MAX_DIMENSION comment above for why this exists as its own
 * function rather than callers reusing compressImage's defaults directly.
 */
export function createPhotoThumbnail(blob: Blob): Promise<Blob> {
  return compressImage(blob, { maxDimension: THUMBNAIL_MAX_DIMENSION, quality: THUMBNAIL_QUALITY });
}

/**
 * MediaRecorder construction options that keep voice-note recordings small:
 * an opus-codec container where the browser supports picking one, plus a
 * modest explicit bitrate (browsers that honor audioBitsPerSecond will
 * otherwise default to a much higher, needlessly large-for-speech bitrate).
 */
export function getAudioRecorderOptions(): MediaRecorderOptions {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4;codecs=mp4a.40.2', 'audio/mp4'];
  const mimeType =
    typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function'
      ? candidates.find((type) => MediaRecorder.isTypeSupported(type))
      : undefined;

  const options: MediaRecorderOptions = { audioBitsPerSecond: AUDIO_BITS_PER_SECOND };
  if (mimeType) options.mimeType = mimeType;
  return options;
}
