// This is the single boundary between the app and on-device storage.
// Nothing outside this file should call indexedDB directly — components and
// hooks only ever talk to the functions exported here.
//
// Unrelated concepts, unrelated object stores. Task functions, diary
// functions, and task-media functions are deliberately independent — they
// share no domain logic and no domain function, so each feature can evolve
// separately:
//
//   tasks        -> Checklist page   saveTask / getTasksByDate / deleteTask / getAllTasks (search)
//                -> Reminders page   getOpenTasksByMonth (read-only)
//   taskPhotos   -> Checklist page   saveTaskPhoto / getTaskPhoto / deleteTaskPhoto
//   taskAudio    -> Checklist page   saveTaskAudio / getTaskAudio / deleteTaskAudio
//   diaryEntries -> Diary page       saveDiaryEntry / getDiaryEntriesByDate / deleteDiaryEntry / getAllDiaryEntries (search)
//   diaryPhotos  -> Diary page       saveDiaryPhoto / getDiaryPhoto / deleteDiaryPhoto
//   diaryAudio   -> Diary page       saveDiaryAudio / getDiaryAudio / deleteDiaryAudio
//
// taskPhotos/taskAudio are scoped to tasks only — a task's inline content
// segments point into them. diaryPhotos/diaryAudio are scoped to diary
// entries only, the same way. Neither pair reads or writes the other.
//
// `openDB` and `tx` below are storage plumbing only (connection + transaction
// wrappers); they carry no knowledge of tasks or diary entries.

import { notifyTasksChanged } from './taskEvents';
import type { DiaryAudio, DiaryPhoto } from '../types/diaryMedia';
import type { DiaryEntry } from '../types/diaryEntry';
import type { Task } from '../types/task';
import type { TaskAudio, TaskPhoto } from '../types/taskMedia';

const DB_NAME = 'gatekeep-db';
// Bumping this is the ONLY thing that makes onupgradeneeded run again for a
// browser that already has the database open at an older version — adding a
// createObjectStore call without also bumping this number is a no-op for
// anyone whose IndexedDB is already sitting at the current version (exactly
// what happened here: diaryPhotos/diaryAudio's creation code shipped without
// this number changing, so any database already at 3 skipped it entirely
// and saveDiaryPhoto/saveDiaryAudio failed with NotFoundError).
const DB_VERSION = 4;

const TASKS_STORE = 'tasks';
const TASK_PHOTOS_STORE = 'taskPhotos';
const TASK_AUDIO_STORE = 'taskAudio';
const DIARY_STORE = 'diaryEntries';
const DIARY_PHOTOS_STORE = 'diaryPhotos';
const DIARY_AUDIO_STORE = 'diaryAudio';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(TASKS_STORE)) {
        const store = db.createObjectStore(TASKS_STORE, { keyPath: 'id' });
        store.createIndex('by_date', 'date', { unique: false });
      }

      if (!db.objectStoreNames.contains(TASK_PHOTOS_STORE)) {
        db.createObjectStore(TASK_PHOTOS_STORE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(TASK_AUDIO_STORE)) {
        db.createObjectStore(TASK_AUDIO_STORE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(DIARY_STORE)) {
        const store = db.createObjectStore(DIARY_STORE, { keyPath: 'id' });
        store.createIndex('by_date', 'date', { unique: false });
      }

      if (!db.objectStoreNames.contains(DIARY_PHOTOS_STORE)) {
        db.createObjectStore(DIARY_PHOTOS_STORE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(DIARY_AUDIO_STORE)) {
        db.createObjectStore(DIARY_AUDIO_STORE, { keyPath: 'id' });
      }

      // v1 had a generic, unused "photos" store — superseded by taskPhotos.
      if (db.objectStoreNames.contains('photos')) {
        db.deleteObjectStore('photos');
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

// --- Task photos (attached to a task; not shared with diary media) --------

export async function saveTaskPhoto(photo: TaskPhoto): Promise<void> {
  const db = await openDB();
  await tx(db, TASK_PHOTOS_STORE, 'readwrite', (s) => s.put(photo));
}

export async function getTaskPhoto(id: string): Promise<TaskPhoto | undefined> {
  const db = await openDB();
  return tx(db, TASK_PHOTOS_STORE, 'readonly', (s) => s.get(id));
}

export async function deleteTaskPhoto(id: string): Promise<void> {
  const db = await openDB();
  await tx(db, TASK_PHOTOS_STORE, 'readwrite', (s) => s.delete(id));
}

// --- Task audio (attached to a task; not shared with diary media) ---------

export async function saveTaskAudio(audio: TaskAudio): Promise<void> {
  const db = await openDB();
  await tx(db, TASK_AUDIO_STORE, 'readwrite', (s) => s.put(audio));
}

export async function getTaskAudio(id: string): Promise<TaskAudio | undefined> {
  const db = await openDB();
  return tx(db, TASK_AUDIO_STORE, 'readonly', (s) => s.get(id));
}

export async function deleteTaskAudio(id: string): Promise<void> {
  const db = await openDB();
  await tx(db, TASK_AUDIO_STORE, 'readwrite', (s) => s.delete(id));
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

/** Every diary entry, any date. Used for full-text search on the Diary page. */
export async function getAllDiaryEntries(): Promise<DiaryEntry[]> {
  const db = await openDB();
  return tx(db, DIARY_STORE, 'readonly', (s) => s.getAll());
}

// --- Diary photos (attached to a diary entry; not shared with task media) -

export async function saveDiaryPhoto(photo: DiaryPhoto): Promise<void> {
  const db = await openDB();
  await tx(db, DIARY_PHOTOS_STORE, 'readwrite', (s) => s.put(photo));
}

export async function getDiaryPhoto(id: string): Promise<DiaryPhoto | undefined> {
  const db = await openDB();
  return tx(db, DIARY_PHOTOS_STORE, 'readonly', (s) => s.get(id));
}

export async function deleteDiaryPhoto(id: string): Promise<void> {
  const db = await openDB();
  await tx(db, DIARY_PHOTOS_STORE, 'readwrite', (s) => s.delete(id));
}

// --- Diary audio (attached to a diary entry; not shared with task media) --

export async function saveDiaryAudio(audio: DiaryAudio): Promise<void> {
  const db = await openDB();
  await tx(db, DIARY_AUDIO_STORE, 'readwrite', (s) => s.put(audio));
}

export async function getDiaryAudio(id: string): Promise<DiaryAudio | undefined> {
  const db = await openDB();
  return tx(db, DIARY_AUDIO_STORE, 'readonly', (s) => s.get(id));
}

export async function deleteDiaryAudio(id: string): Promise<void> {
  const db = await openDB();
  await tx(db, DIARY_AUDIO_STORE, 'readwrite', (s) => s.delete(id));
}
