// Naming a media file from its MIME type.
//
// Pure lookup, kept here rather than in the viewer hook that uses it for the
// usual reason the rest of lib/ exists: it has no React and no Capacitor in
// it, so it can be unit-tested directly (mediaTypes.test.ts) instead of only
// through a rendered overlay.

export type MediaKind = 'photo' | 'audio';

/**
 * Covers what this app can actually produce or accept: photos from
 * mediaCompression (always re-encoded to image/jpeg) or straight off the
 * camera roll, audio from MediaRecorder, which getAudioRecorderOptions asks
 * for as webm/opus and falls back to mp4.
 *
 * audio/mp4 maps to .m4a rather than .mp4 because the file is audio-only;
 * players and file managers treat .mp4 as video and some refuse to open it.
 */
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/opus': 'opus',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/aac': 'aac',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/wave': 'wav',
};

/*
 * Used when the blob carries no type at all, or one not in the table above.
 * A blob can genuinely have an empty `type` — one rebuilt from a backup
 * taken before media MIME types were preserved, for instance.
 *
 * These are not arbitrary: they are what this app's own capture paths
 * produce, so an unlabelled file is overwhelmingly likely to be one of them.
 * A plausible extension beats '.bin', which no gallery or player will open.
 */
export const DEFAULT_EXTENSION: Record<MediaKind, string> = { photo: 'jpg', audio: 'webm' };

/** Extension (no dot) for a blob's `type`, falling back by kind. */
export function extensionFor(type: string, kind: MediaKind): string {
  // MediaRecorder reports the codec too, e.g. "audio/webm;codecs=opus".
  const base = type.split(';')[0].trim().toLowerCase();
  return EXTENSIONS[base] ?? DEFAULT_EXTENSION[kind];
}

/** `baseName` plus the extension the blob's type implies. */
export function mediaFilename(baseName: string, type: string, kind: MediaKind): string {
  return `${baseName}.${extensionFor(type, kind)}`;
}
