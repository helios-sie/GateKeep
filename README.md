# Gatekeep

A private, on-device journal PWA — text notes, voice-to-text, and photos, organized by date, with task-style status tracking. All data lives in the browser's IndexedDB, on your device — nothing is sent to any server.

## Structure

```
src/
  components/   One folder per UI piece (Calendar, Editor, PhotoCapture, TaskList, FilterBar).
                 Each component only renders — no direct storage access.
  hooks/         useEntries: bridges db.ts to React state.
                 useVoiceInput: wraps the browser's SpeechRecognition API.
  lib/
    db.ts        The only file that touches IndexedDB. Everything else goes through it.
    dateUtils.ts Small date-formatting helpers.
  types/         Shared TypeScript types.
  App.tsx        Wires hooks + components together. No business logic itself.
```

## Setup

```bash
npm install
npm run dev
```

Open the printed local URL. On your phone, use your machine's LAN IP (e.g. `http://192.168.x.x:5173`) instead of `localhost` to test camera/mic on a real device during development.

## Before deploying

1. In `vite.config.ts`, set `base` to match your actual GitHub repo name.
2. In `public/manifest.json`, update `start_url` and `scope` the same way.
3. Add real icons at `public/icons/icon-192.png` and `public/icons/icon-512.png` (192×192 and 512×512 PNGs).

## Deploy to GitHub Pages

```bash
npm install -D gh-pages   # already in package.json devDependencies
npm run deploy
```

This builds the app and pushes `dist/` to a `gh-pages` branch. Enable GitHub Pages for that branch in your repo settings, then visit `https://<username>.github.io/<repo-name>/`.

On your phone, open that URL in the browser and use "Add to Home Screen" to install it like a native app.

## Notes on browser support

- **Camera**: uses a standard file input with `capture="environment"`, which opens the camera directly on most mobile browsers.
- **Voice-to-text**: uses the Web Speech API, which isn't supported everywhere (notably inconsistent on iOS Safari). The mic button hides itself automatically if unsupported — typing always works as a fallback.
