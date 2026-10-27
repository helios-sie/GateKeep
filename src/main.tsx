import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/*
 * Production web builds only — not Android, and not the dev server.
 *
 * Not Android (vite --mode android, see vite.config.ts): Capacitor already
 * serves the whole app from the device, so a cache layer in front of it buys
 * nothing, and a worker latched onto the WebView's https://localhost origin
 * would go on serving a stale shell after an app update, with no deploy to
 * correct it.
 *
 * Not dev, and this one cost real debugging time: the worker is cache-first
 * for everything that is not a navigation (handleAsset in
 * public/service-worker.js). That is safe in production, where every bundle
 * filename carries a content hash and a new release simply requests new
 * names. In dev there are no hashes — Vite serves
 * /src/components/Foo.tsx at the same URL forever — so the worker pins the
 * first copy of every module it ever sees and keeps serving it through
 * reloads, restarts and HMR. The symptom is not an obvious cache error: the
 * app renders, but from a mixture of old and new modules, so edits appear to
 * do nothing and React can end up with two copies of itself.
 *
 * The path is derived from BASE_URL rather than written out, so '/GateKeep/'
 * lives in vite.config.ts alone — hardcoding it here is what would silently
 * break if the repo were ever renamed.
 */
if (import.meta.env.PROD && import.meta.env.MODE !== 'android' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`).catch(() => {
      // Offline support is a nice-to-have; failing silently here is fine,
      // the app still works fully online without it.
    });
  });
}

/*
 * One-time rescue for a dev machine that already has the worker installed.
 *
 * Simply not registering any more does not help there: a worker that is
 * already controlling the page keeps doing so until something unregisters
 * it, so anyone who ran the dev server before the guard above would stay
 * stuck on cached modules with no clue why. This clears it on the next dev
 * load, which is the only load where it can run at all — the whole block is
 * dropped from production bundles, since `import.meta.env.DEV` is a compile
 * time constant and the branch is dead code.
 */
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.filter((name) => name.startsWith('diary-cache-')).forEach((name) => caches.delete(name));
    });
  }
}
