# GateKeep

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
                     Both have a Download button (a real <a download> on the
                     blob: URL); AudioPlayer also has a 0.25x-2x speed
                     selector. Used by both Checklist and Diary.
    InlineComposer/   The WhatsApp-style composer itself: a contentEditable
                     box (not a <textarea> — that can't hold real inline
                     content) with camera + mic icons docked in its
                     bottom-right corner. Tapping one saves the attachment
                     via a caller-supplied SegmentMediaStore and inserts a
                     real inline icon at the cursor, live — each with its
                     own small ✕ badge (a separate element, not overlapping
                     the icon's tap target) to discard + delete that
                     blob before anything is submitted. Optionally seeded
                     with `initialContent` to pre-fill an existing entry for
                     editing. extractSegments.ts walks its DOM into an
                     ordered ContentSegment[] on submit. Shared as-is by
                     Checklist's Editor and Diary's DiaryEntryEditor — only
                     the SegmentMediaStore (which store the icons read/
                     write/delete through) differs between them.
    SegmentContent/   Renders a ContentSegment[] in order — text as text,
                     photo/audio as small inline tappable icons that open
                     ImageLightbox/AudioPlayer. Read-only counterpart to
                     InlineComposer (no discard button); shared by
                     Checklist's TaskContent and Diary's DiaryEntryView.
    TodayButton.tsx   "Today" quick-jump; hides itself when already on today.
                     Used by Calendar via its optional onToday prop.
    SearchResultsList.tsx  "<snippet> — <date>" rows shared by Checklist's
                     and Diary's search (both just supply a data source).
  pages/            One folder per routed view; each owns its own components.
    Checklist/        Tasks -> "tasks" store. `content` is the authoritative
                     shape: an ordered ContentSegment[] (text/photo/audio,
                     types/content.ts) so media sits inline exactly where it
                     was inserted, not in a separate list; `text` is a
                     derived plain-text mirror (kept in sync on save,
                     src/lib/content.ts) that Reminders/search read without
                     needing to know about segments. Tasks saved before this
                     existed have no `content` — treated as one text segment.
                     Attachments live in "taskPhotos"/"taskAudio".
      components/      Editor (thin: an InlineComposer + Add-task button,
                       wired to saveTaskPhoto/saveTaskAudio), TaskSearch
                       (search bar + month/year/all-time scope + results,
                       over the derived `text`), TaskList/TaskRow (swipe
                       left or right to delete — the only way; disintegrate-
                       into-particles animation via useSwipeToDelete) /
                       TaskContent (a SegmentContent wired to
                       getTaskPhoto/getTaskAudio).
    Diary/            One entry per date (id=date) -> "diaryEntries", same
                     content/text split as tasks. Attachments live in their
                     own "diaryPhotos"/"diaryAudio" — never the task stores.
      components/      DiaryEntryEditor (an InlineComposer wired to
                       saveDiaryPhoto/saveDiaryAudio, pre-filled via
                       initialContent when editing) / DiaryEntryView (a
                       SegmentContent wired to getDiaryPhoto/getDiaryAudio,
                       read-only + pencil) / DiarySearch (icon that reveals
                       a search bar; collapsed by default, unlike
                       Checklist's always-visible one).
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
                     (tasks, taskPhotos, taskAudio, diaryEntries,
                     diaryPhotos, diaryAudio) with non-overlapping
                     functions — the task/diary media stores never read or
                     write each other.
    content.ts       getContent (old-record fallback) / deriveText /
                     extractMediaIds — the ContentSegment[] helpers shared
                     by both Checklist and Diary (generic over anything
                     shaped {text, content?}).
    dateUtils.ts     Small date-formatting helpers.
    userProfile.ts   Placeholder user name; swap here when a profile UI exists.
    taskEvents.ts    Pub-sub fired by db.ts on every task write, so Reminders
                     (and anything else reading "tasks") can refresh instantly
                     instead of only on its next mount.
  types/             content.ts (ContentSegment — shared), task.ts (Task),
                     diaryEntry.ts (DiaryEntry), taskMedia.ts (TaskPhoto,
                     TaskAudio), diaryMedia.ts (DiaryPhoto, DiaryAudio).
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
