import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { downloadBlob } from '../../lib/backup';
import { DEFAULT_EXTENSION, mediaFilename, type MediaKind } from '../../lib/mediaTypes';

/*
 * Saving an attachment out of a viewer, on both platforms. Shared by
 * ImageLightbox and AudioPlayer so the extension logic and the native path
 * exist once.
 *
 * The web path is still a plain <a download>, which the WebView has no
 * download manager for — the anchor click there is silently a no-op, the
 * same failure that made the backup export look like it had worked. On
 * native the bytes go to the app's cache directory and then to the share
 * sheet, exactly as saveBackup does.
 *
 * The one thing that must differ from saveBackup: that writes JSON as
 * Encoding.UTF8 text, which would corrupt a photo. These are binary, so the
 * blob is base64-encoded and written with NO encoding option, which is what
 * tells Filesystem to decode base64 and write raw bytes.
 */

/** Outcome of a save. 'cancelled' is a user decision, not a failure — the
 *  share sheet was dismissed, and nothing should be reported. */
export type SaveOutcome = 'downloaded' | 'shared' | 'cancelled';

/** Reads the blob's MIME type WITHOUT pulling its bytes into memory: the
 *  response body is left unread and cancelled, so a multi-megabyte photo is
 *  not copied just to name the file. */
async function mimeTypeOf(objectUrl: string): Promise<string> {
  const response = await fetch(objectUrl);
  const type = response.headers.get('content-type') ?? '';
  response.body?.cancel().catch(() => {
    // Already consumed or unsupported; nothing to release.
  });
  return type;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      resolve(url.slice(url.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** The Share plugin rejects with exactly this when the sheet is dismissed
 *  (SharePlugin.java, RESULT_CANCELED). Matched exactly rather than with a
 *  loose /cancel/ test, which would also swallow a genuine failure. */
function isShareDismissal(error: unknown): boolean {
  return error instanceof Error && error.message.trim() === 'Share canceled';
}

async function saveToDevice(objectUrl: string, filename: string): Promise<SaveOutcome> {
  const blob = await (await fetch(objectUrl)).blob();

  if (!Capacitor.isNativePlatform()) {
    downloadBlob(blob, filename);
    return 'downloaded';
  }

  // Dynamic so the web bundle never pulls the native plugins in.
  const [{ Directory, Filesystem }, { Share }] = await Promise.all([
    import('@capacitor/filesystem'),
    import('@capacitor/share'),
  ]);

  await Filesystem.writeFile({
    path: filename,
    data: await blobToBase64(blob),
    directory: Directory.Cache,
    // No `encoding` on purpose — see the file header.
  });

  const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache });

  try {
    await Share.share({
      title: filename,
      // `files`, not `url`: a raw file:// path is rejected by Android 7+
      // (FileUriExposedException). Capacitor serves this through its
      // FileProvider instead.
      files: [uri],
      dialogTitle: 'Save or send',
    });
  } catch (error) {
    if (isShareDismissal(error)) return 'cancelled';
    throw error;
  }

  return 'shared';
}

/** How long a failure message stays up before clearing itself. */
const ERROR_MS = 5000;

/**
 * `filename` is resolved from the blob's real type, so the web <a download>
 * gets the right extension too rather than a hard-coded one. `save` is for
 * the native path, where the anchor does nothing.
 */
export function useMediaDownload(objectUrl: string, kind: MediaKind, baseName: string) {
  const [filename, setFilename] = useState(`${baseName}.${DEFAULT_EXTENSION[kind]}`);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const errorTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    mimeTypeOf(objectUrl)
      .then((type) => {
        if (!cancelled) setFilename(mediaFilename(baseName, type, kind));
      })
      .catch(() => {
        // Keep the default name; failing to read a type is not worth
        // bothering the user about when they have not asked for anything.
      });
    return () => {
      cancelled = true;
    };
  }, [objectUrl, kind, baseName]);

  useEffect(
    () => () => {
      if (errorTimer.current !== null) window.clearTimeout(errorTimer.current);
    },
    []
  );

  const save = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      await saveToDevice(objectUrl, filename);
    } catch (err) {
      // Surfaced, not swallowed: on native a silent failure is
      // indistinguishable from success, which is the whole problem this
      // replaces.
      setError(err instanceof Error ? err.message : "That couldn't be saved.");
      if (errorTimer.current !== null) window.clearTimeout(errorTimer.current);
      errorTimer.current = window.setTimeout(() => setError(null), ERROR_MS);
    } finally {
      setBusy(false);
    }
  }, [objectUrl, filename]);

  /** True when the anchor cannot do the job and `save` must run instead. */
  const needsNativeSave = Capacitor.isNativePlatform();

  return { filename, save, error, busy, needsNativeSave };
}
