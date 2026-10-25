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
 * Web only. The Android build (vite --mode android, see vite.config.ts) must
 * NOT register the worker: Capacitor already serves the whole app from the
 * device, so a cache layer in front of it buys nothing, and a worker that
 * latches onto the WebView's https://localhost origin would go on serving a
 * stale shell after an app update with no deploy to correct it.
 *
 * The path is derived from BASE_URL rather than written out, so '/GateKeep/'
 * lives in vite.config.ts alone — hardcoding it here is what would silently
 * break if the repo were ever renamed.
 */
if (import.meta.env.MODE !== 'android' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`).catch(() => {
      // Offline support is a nice-to-have; failing silently here is fine,
      // the app still works fully online without it.
    });
  });
}
