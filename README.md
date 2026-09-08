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
    PhotoCapture/     Camera capture + photo strip. Not wired to a page yet.
  pages/            One folder per routed view; each owns its own components.
    Checklist/        Tasks (id, date, text, status, createdAt) -> "tasks" store.
      components/      Editor, FilterBar, TaskList.
    Diary/            One entry per date (id=date, text, createdAt) -> "diaryEntries".
      components/      DiaryEntryView (read-only + pencil) / DiaryEntryEditor.
    Reminders/        Placeholder.
  hooks/
    useHashRoute      #/checklist | #/diary | #/reminders (default checklist).
    useTasks          Bridges the "tasks" store to React state.
    useDiaryEntry     Loads/saves the single diary entry for a date.
    useVoiceInput     Wraps the browser's SpeechRecognition API.
  lib/
    db.ts            The only file that touches IndexedDB. Three separate stores
                     (tasks, diaryEntries, photos) with non-overlapping functions.
    dateUtils.ts     Small date-formatting helpers.
    userProfile.ts   Placeholder user name; swap here when a profile UI exists.
  types/             task.ts, diaryEntry.ts, photo.ts.
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
