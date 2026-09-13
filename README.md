# Gatekeep

A private, on-device PWA with three independent pages — Reminders, Checklist,
and Diary — switched from a bottom tab bar. All data lives in the browser's
IndexedDB, on your device; nothing is sent to any server.

## Structure

```
src/
  components/        Shared UI, used by more than one page.
    BottomNav/        The three-tab bar.
    Calendar/         Day navigator (Checklist + Diary).
    PhotoCapture/     Headless: renders a hidden camera/file input, exposes
                     ref.current.open(). Caller supplies its own trigger icon
                     and decides where to persist the returned File.
    AudioCapture/     Headless: records via MediaRecorder, exposes
                     ref.current.toggle() + an onRecordingChange callback.
                     Same storage-agnostic, caller-supplies-the-icon split.
    MediaViewer/      ImageLightbox + AudioPlayer — in-app modal viewers for
                     attached media (never a new tab / OS default player).
                     Used by Checklist's tasks now; reusable for Diary later.
    TodayButton.tsx   "Today" quick-jump; hides itself when already on today.
                     Used by Calendar via its optional onToday prop.
    SearchResultsList.tsx  "<snippet> — <date>" rows shared by Checklist's
                     and Diary's search (both just supply a data source).
  pages/            One folder per routed view; each owns its own components.
    Checklist/        Tasks -> "tasks" store. `content` is the authoritative
                     shape: an ordered TaskSegment[] (text/photo/audio) so
                     media sits inline exactly where it was inserted, not in
                     a separate list; `text` is a derived plain-text mirror
                     (kept in sync on save) that Reminders/search read
                     without needing to know about segments. Tasks saved
                     before this existed have no `content` — treated as one
                     text segment (src/lib/taskContent.ts).
      components/      Editor: a plain textarea with a camera + mic icon
                       docked in its bottom-right corner (WhatsApp-style).
                       Tapping one saves via saveTaskPhoto/saveTaskAudio and
                       inserts a ⟦photo:id⟧/⟦audio:id⟧ marker at the cursor
                       (Editor/taskMarkers.ts parses these into segments on
                       submit — the one place "rich content in a plain
                       textarea" is represented as text).
                       TaskSearch (search bar + month/year/all-time scope +
                       results, over the derived `text`).
                       TaskList/TaskRow (swipe left or right to delete — the
                       only way; disintegrate-into-particles animation via
                       useSwipeToDelete) / TaskContent (renders a task's
                       segments in order; photo/audio segments are small
                       inline icons that open ImageLightbox/AudioPlayer).
    Diary/            One entry per date (id=date, text, createdAt) -> "diaryEntries".
      components/      DiaryEntryView (read-only + pencil) / DiaryEntryEditor /
                       DiarySearch (icon that reveals a search bar; collapsed
                       by default, unlike Checklist's always-visible one).
    Reminders/        All open tasks, one calendar month at a time, grouped by
                     date (most recent first). Read-only; tapping a task
                     deep-links to Checklist at that date.
      components/      MonthSwitcher, DateGroup.
  hooks/
    useHashRoute      #/checklist | #/diary | #/reminders (default checklist),
                     each with an optional deep-link param, e.g.
                     #/checklist/2026-09-05. Also exports navigateTo().
    useTasks          Bridges the "tasks" store to React state (Checklist).
    useDatedSearch    Shared keyword + month/year/all-time scope matching
                     over any {date, text, createdAt} store. useTaskSearch
                     and useDiaryEntrySearch are one-line wrappers around it.
    useOpenTasksByMonth  Open tasks for a month, grouped by date (Reminders).
    useDiaryEntry     Loads/saves the single diary entry for a date.
  lib/
    db.ts            The only file that touches IndexedDB. Separate stores
                     (tasks, taskPhotos, taskAudio, diaryEntries) with
                     non-overlapping functions — taskPhotos/taskAudio are
                     scoped to tasks only, never shared with diary media.
    dateUtils.ts     Small date-formatting helpers.
    userProfile.ts   Placeholder user name; swap here when a profile UI exists.
    taskEvents.ts    Pub-sub fired by db.ts on every task write, so Reminders
                     (and anything else reading "tasks") can refresh instantly
                     instead of only on its next mount.
    taskContent.ts   getTaskContent (old-task fallback) / deriveText /
                     extractMediaIds — the segment-array helpers shared by
                     Checklist's composer, display, and delete-cleanup.
  types/             task.ts (Task, TaskSegment), diaryEntry.ts, taskMedia.ts
                     (TaskPhoto, TaskAudio).
  App.tsx            Header + routed page + BottomNav. No business logic.
```

## Setup

```bash
npm install
npm run dev
```

Open the printed local URL. On your phone, use your machine's LAN IP (e.g. `http://192.168.x.x:5173`) instead of `localhost` to test camera/mic on a real device during development.

## Before deploying

Paths are configured for the repo `helios-sie/GateKeep` (served from `/GateKeep/`).
If the repo name changes, update `base` in `vite.config.ts`, `start_url`/`scope` in
`public/manifest.json`, the `APP_SHELL` paths in `public/service-worker.js`, and the
service-worker registration path in `src/main.tsx` to match.

Also add real icons at `public/icons/icon-192.png` and `public/icons/icon-512.png`
(192×192 and 512×512 PNGs).

## Deploy to GitHub Pages

```bash
npm install -D gh-pages   # already in package.json devDependencies
npm run deploy
```

This builds the app and pushes `dist/` to a `gh-pages` branch. Enable GitHub Pages for that branch in the repo settings, then visit `https://helios-sie.github.io/GateKeep/`.

On your phone, open that URL in the browser and use "Add to Home Screen" to install it like a native app.

## Notes on browser support

- **Camera**: uses a standard file input with `capture="environment"`, which opens the camera directly on most mobile browsers.
- **Voice-to-text**: uses the Web Speech API, which isn't supported everywhere (notably inconsistent on iOS Safari). The mic button hides itself automatically if unsupported — typing always works as a fallback.
