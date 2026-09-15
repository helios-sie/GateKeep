// Export/import of everything the app has stored on this device.
//
// This is the one place in the app that deliberately works ACROSS all six
// object stores at once. db.ts keeps tasks, diary entries and their media
// strictly independent — that separation is a domain rule, and it still
// holds here: nothing in this file mixes a task's media with a diary entry's,
// it only carries each store's rows out to a file and back again unchanged.
//
// It is also the only file besides db.ts that opens IndexedDB, for two things
// db.ts's per-record API genuinely cannot cover: reading a media store whole
// (it only ever exposes get-by-id, since a page only ever needs the one blob
// a segment points at), and clearing + refilling every store inside a single
// transaction so a restore is all-or-nothing. It opens with NO version
// number, which attaches to whatever version already exists and so can never
// trigger an upgrade — db.ts stays the only definition of the schema. The
// getAllTasks() call below is what guarantees that schema exists first, on a
// browser that has never run the app before.
//
// File format: one JSON document with media blobs base64-encoded inline, so a
// backup is a single self-contained file the user can email or drop in a
// cloud folder, with no zip library to pull in.

import { getAllTasks } from './db';
import { notifyDiaryChanged } from './diaryEvents';
import { notifyTasksChanged } from './taskEvents';
import type { DiaryEntry } from '../types/diaryEntry';
import type { Task } from '../types/task';

const DB_NAME = 'gatekeep-db';

export const FORMAT = 'gatekeep-backup';
export const FORMAT_VERSION = 1;

/** Stores whose rows are plain JSON already and travel as-is. */
const RECORD_STORES = ['tasks', 'diaryEntries'] as const;

/** Stores whose rows carry a Blob, which has to be encoded to travel. */
const MEDIA_STORES = ['taskPhotos', 'taskAudio', 'diaryPhotos', 'diaryAudio'] as const;

const ALL_STORES: string[] = [...RECORD_STORES, ...MEDIA_STORES];

type MediaStore = (typeof MEDIA_STORES)[number];

/** A media row as it exists in IndexedDB (TaskPhoto/TaskAudio/DiaryPhoto/
 *  DiaryAudio are all this shape). */
interface StoredMedia {
  id: string;
  blob: Blob;
  createdAt: number;
}

/** A media row as it travels in the file: the blob flattened to base64. */
interface EncodedMedia {
  id: string;
  createdAt: number;
  /** MIME type, so the blob is rebuilt as the same kind it went in as —
   *  without it an audio blob comes back typeless and will not play. */
  mime: string;
  data: string;
}

interface BackupStores extends Record<MediaStore, EncodedMedia[]> {
  tasks: Task[];
  diaryEntries: DiaryEntry[];
}

export interface BackupFile {
  format: typeof FORMAT;
  version: number;
  exportedAt: string;
  stores: BackupStores;
}

/** What a backup holds, for showing the user before restoring and after
 *  backing up. Photos and audio are totalled across the task and diary
 *  stores — the split matters to the code, not to the person reading it. */
export interface BackupSummary {
  tasks: number;
  diaryEntries: number;
  photos: number;
  audio: number;
}

// --- storage plumbing -------------------------------------------------------

async function openBulk(): Promise<IDBDatabase> {
  // Forces db.ts to run its own open (and, on a first-ever load or an older
  // database, its onupgradeneeded) so every store exists before the
  // versionless open below attaches to it. Cheap: the result is discarded.
  await getAllTasks();

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAll<T>(db: IDBDatabase, store: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

// --- base64 <-> Blob --------------------------------------------------------

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // readAsDataURL rather than hand-rolling over a Uint8Array: the native
    // encoder handles multi-megabyte photos without the per-chunk
    // String.fromCharCode juggling a manual encoder needs in order not to
    // blow the argument limit.
    reader.onload = () => {
      const url = reader.result as string;
      resolve(url.slice(url.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(data: string, mime: string): Blob {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// --- export -----------------------------------------------------------------

function summarise(stores: BackupStores): BackupSummary {
  return {
    tasks: stores.tasks.length,
    diaryEntries: stores.diaryEntries.length,
    photos: stores.taskPhotos.length + stores.diaryPhotos.length,
    audio: stores.taskAudio.length + stores.diaryAudio.length,
  };
}

/** Everything on this device, as one JSON blob plus a dated filename. */
export async function createBackup(): Promise<{
  blob: Blob;
  filename: string;
  summary: BackupSummary;
}> {
  const db = await openBulk();

  const [tasks, diaryEntries] = await Promise.all([
    getAll<Task>(db, 'tasks'),
    getAll<DiaryEntry>(db, 'diaryEntries'),
  ]);

  const media = await Promise.all(
    MEDIA_STORES.map(async (store) => {
      const rows = await getAll<StoredMedia>(db, store);
      const encoded = await Promise.all(
        rows.map(async (row) => ({
          id: row.id,
          createdAt: row.createdAt,
          mime: row.blob.type,
          data: await blobToBase64(row.blob),
        }))
      );
      return [store, encoded] as const;
    })
  );

  db.close();

  const stores: BackupStores = {
    tasks,
    diaryEntries,
    ...(Object.fromEntries(media) as Record<MediaStore, EncodedMedia[]>),
  };

  const file: BackupFile = {
    format: FORMAT,
    version: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    stores,
  };

  return {
    blob: new Blob([JSON.stringify(file)], { type: 'application/json' }),
    filename: `gatekeep-backup-${new Date().toISOString().slice(0, 10)}.json`,
    summary: summarise(stores),
  };
}

/** Hands a blob to the browser as a download. Kept apart from createBackup so
 *  the gathering never has to touch the DOM. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Not revoked synchronously: Safari in particular has not finished reading
  // the URL by the time click() returns.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// --- import -----------------------------------------------------------------

function isMediaArray(value: unknown): value is EncodedMedia[] {
  return (
    Array.isArray(value) &&
    value.every(
      (row) =>
        row !== null &&
        typeof row === 'object' &&
        typeof (row as EncodedMedia).id === 'string' &&
        typeof (row as EncodedMedia).data === 'string'
    )
  );
}

/** Reads and validates a file the user picked, WITHOUT writing anything — so
 *  the confirmation step can show what is actually in it first. */
export async function readBackupFile(file: File): Promise<{
  backup: BackupFile;
  summary: BackupSummary;
}> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error('That file could not be read as a GateKeep backup.');
  }

  const backup = parsed as BackupFile;
  if (!backup || typeof backup !== 'object' || backup.format !== FORMAT) {
    throw new Error('That is not a GateKeep backup file.');
  }
  if (typeof backup.version !== 'number' || backup.version > FORMAT_VERSION) {
    throw new Error('That backup was made by a newer version of GateKeep.');
  }
  if (!backup.stores || typeof backup.stores !== 'object') {
    throw new Error('That backup file is incomplete.');
  }
  for (const store of RECORD_STORES) {
    if (!Array.isArray(backup.stores[store])) {
      throw new Error('That backup file is incomplete.');
    }
  }
  for (const store of MEDIA_STORES) {
    if (!isMediaArray(backup.stores[store])) {
      throw new Error('That backup file is incomplete.');
    }
  }

  return { backup, summary: summarise(backup.stores) };
}

/**
 * REPLACES everything on this device with the contents of the backup: every
 * store is cleared and refilled inside one transaction, so the app is never
 * left holding half of one backup and half of another.
 *
 * Merging was the other option and was rejected deliberately. Rows are keyed
 * by a random id, so a merge can only ever re-add anything the user has since
 * deleted, next to whatever they have written since — with no way to tell the
 * two apart afterwards. Replace is exactly what the confirmation text in
 * BackupPanel promises; keep the two in step if this ever changes.
 */
export async function restoreBackup(backup: BackupFile): Promise<BackupSummary> {
  const db = await openBulk();

  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(ALL_STORES, 'readwrite');
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error ?? new Error('The restore was interrupted.'));

    for (const store of RECORD_STORES) {
      const objectStore = t.objectStore(store);
      objectStore.clear();
      for (const row of backup.stores[store]) objectStore.put(row);
    }

    for (const store of MEDIA_STORES) {
      const objectStore = t.objectStore(store);
      objectStore.clear();
      for (const row of backup.stores[store]) {
        const stored: StoredMedia = {
          id: row.id,
          createdAt: row.createdAt,
          blob: base64ToBlob(row.data, row.mime ?? ''),
        };
        objectStore.put(stored);
      }
    }
  });

  db.close();

  // Every page reading either store is now looking at stale data.
  notifyTasksChanged();
  notifyDiaryChanged();

  return summarise(backup.stores);
}
