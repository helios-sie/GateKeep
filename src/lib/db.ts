// This is the single boundary between the app and on-device storage.
// Nothing outside this file should call indexedDB directly — components and
// hooks only ever talk to the functions exported here.
//
// Three unrelated concepts, three unrelated object stores. The task functions
// and the diary functions are deliberately independent — they share no domain
// logic and no domain function, so the two features can evolve separately:
//
//   tasks        -> Checklist page   saveTask / getTasksByDate / deleteTask / getAllTasks (search)
//                -> Reminders page   getOpenTasksByMonth (read-only)
//   diaryEntries -> Diary page       saveDiaryEntry / getDiaryEntriesByDate / deleteDiaryEntry
//   photos       -> attachments      savePhoto / getPhoto / deletePhoto  (not yet wired to a page)
//
// `openDB` and `tx` below are storage plumbing only (connection + transaction
// wrappers); they carry no knowledge of tasks or diary entries.

import { notifyTasksChanged } from './taskEvents';
import type { DiaryEntry } from '../types/diaryEntry';
import type { PhotoAttachment } from '../types/photo';
import type { Task } from '../types/task';

const DB_NAME = 'gatekeep-db';
const DB_VERSION = 1;

const TASKS_STORE = 'tasks';
const DIARY_STORE = 'diaryEntries';
const PHOTOS_STORE = 'photos';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(TASKS_STORE)) {
        const store = db.createObjectStore(TASKS_STORE, { keyPath: 'id' });
        store.createIndex('by_date', 'date', { unique: false });
      }

      if (!db.objectStoreNames.contains(DIARY_STORE)) {
        const store = db.createObjectStore(DIARY_STORE, { keyPath: 'id' });
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

// --- Tasks (Checklist page) -------------------------------------------------

export async function saveTask(task: Task): Promise<void> {
  const db = await openDB();
  await tx(db, TASKS_STORE, 'readwrite', (s) => s.put(task));
  notifyTasksChanged();
}

export async function deleteTask(id: string): Promise<void> {
  const db = await openDB();
  await tx(db, TASKS_STORE, 'readwrite', (s) => s.delete(id));
  notifyTasksChanged();
}

export async function getTasksByDate(date: string): Promise<Task[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(TASKS_STORE, 'readonly');
    const req = t.objectStore(TASKS_STORE).index('by_date').getAll(date);
    req.onsuccess = () => resolve(req.result as Task[]);
    req.onerror = () => reject(req.error);
  });
}

/** Every task, any date, any status. Used for full-text search on the
 *  Checklist page — filtering/scoping happens in the caller. */
export async function getAllTasks(): Promise<Task[]> {
  const db = await openDB();
  return tx(db, TASKS_STORE, 'readonly', (s) => s.getAll());
}

/**
 * Every open (not done) task whose date falls in the given calendar month.
 * Used by the Reminders page. `month` is 1-12.
 */
export async function getOpenTasksByMonth(year: number, month: number): Promise<Task[]> {
  const db = await openDB();
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return new Promise((resolve, reject) => {
    const t = db.transaction(TASKS_STORE, 'readonly');
    const req = t.objectStore(TASKS_STORE).getAll();
    req.onsuccess = () => {
      const rows = (req.result as Task[]).filter(
        (task) => task.status === 'open' && task.date.startsWith(prefix)
      );
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

// --- Diary entries (Diary page) -------------------------------------------------

export async function saveDiaryEntry(entry: DiaryEntry): Promise<void> {
  const db = await openDB();
  await tx(db, DIARY_STORE, 'readwrite', (s) => s.put(entry));
}

export async function deleteDiaryEntry(id: string): Promise<void> {
  const db = await openDB();
  await tx(db, DIARY_STORE, 'readwrite', (s) => s.delete(id));
}

export async function getDiaryEntriesByDate(date: string): Promise<DiaryEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(DIARY_STORE, 'readonly');
    const req = t.objectStore(DIARY_STORE).index('by_date').getAll(date);
    req.onsuccess = () => resolve(req.result as DiaryEntry[]);
    req.onerror = () => reject(req.error);
  });
}

// --- Photos (attachments; not yet wired into either page) ------------------

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
