// This is the single boundary between the app and on-device storage.
// Nothing outside this file should call indexedDB directly — components
// and hooks only ever talk to the functions exported here.

import type { DiaryEntry, PhotoAttachment } from '../types/entry';

const DB_NAME = 'diary-db';
const DB_VERSION = 1;
const ENTRIES_STORE = 'entries';
const PHOTOS_STORE = 'photos';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ENTRIES_STORE)) {
        const store = db.createObjectStore(ENTRIES_STORE, { keyPath: 'id' });
        store.createIndex('by_date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
        db.createObjectStore(PHOTOS_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx<T>(
  db: IDBDatabase,
  store: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveEntry(entry: DiaryEntry): Promise<void> {
  const db = await openDB();
  await tx(db, ENTRIES_STORE, 'readwrite', (s) => s.put(entry));
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await openDB();
  await tx(db, ENTRIES_STORE, 'readwrite', (s) => s.delete(id));
}

export async function getEntriesByDate(date: string): Promise<DiaryEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(ENTRIES_STORE, 'readonly');
    const index = t.objectStore(ENTRIES_STORE).index('by_date');
    const req = index.getAll(date);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllEntries(): Promise<DiaryEntry[]> {
  const db = await openDB();
  return tx(db, ENTRIES_STORE, 'readonly', (s) => s.getAll());
}

export async function savePhoto(photo: PhotoAttachment): Promise<void> {
  const db = await openDB();
  await tx(db, PHOTOS_STORE, 'readwrite', (s) => s.put(photo));
}

export async function getPhoto(id: string): Promise<PhotoAttachment | undefined> {
  const db = await openDB();
  return tx(db, PHOTOS_STORE, 'readonly', (s) => s.get(id));
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await openDB();
  await tx(db, PHOTOS_STORE, 'readwrite', (s) => s.delete(id));
}
