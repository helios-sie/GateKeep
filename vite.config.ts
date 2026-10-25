import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/*
 * public/service-worker.js is copied verbatim into every build, but the
 * Android build never registers it (src/main.tsx). Shipping an inert copy
 * inside the APK is not harmful today — it is just a file nobody loads — but
 * it is the kind of thing that costs an hour later, when someone finds a
 * service worker in the bundle and reasonably assumes the app uses one.
 *
 * Deleted after the write rather than filtered from the bundle because
 * anything under public/ is copied, not bundled, so no bundle hook sees it.
 */
function dropServiceWorker(outDir: string): Plugin {
  return {
    name: 'gatekeep-drop-service-worker',
    apply: 'build',
    closeBundle() {
      rmSync(resolve(outDir, 'service-worker.js'), { force: true });
    },
  };
}

/*
 * Two targets, one codebase, and the ONLY difference is the base path.
 *
 *   default (`npm run build`)        -> base '/GateKeep/'
 *   `--mode android` (build:android) -> base '/'
 *
 * GitHub Pages serves project sites from /<repo-name>/, so the Pages build
 * needs that prefix or every asset URL 404s. Capacitor is the opposite case:
 * it serves the app from the ROOT of its own https://localhost origin inside
 * the WebView, so a '/GateKeep/' prefix there points at a directory that does
 * not exist and the app never boots.
 *
 * Driven by Vite's `mode` rather than a hand-rolled env var so the same
 * switch is readable from application code as `import.meta.env.MODE` (see
 * src/main.tsx, which uses it to skip service-worker registration) and so
 * `import.meta.env.BASE_URL` stays correct in both builds — anything deriving
 * a URL from BASE_URL then works in both without knowing which it is.
 *
 * Note `--mode android` does NOT make this a development build: Vite's build
 * command pins NODE_ENV to production regardless of mode, so React is still
 * the production build and `import.meta.env.PROD` is still true.
 */
export default defineConfig(({ mode }) => {
  const android = mode === 'android';
  return {
    plugins: android ? [react(), dropServiceWorker('dist')] : [react()],
    base: android ? '/' : '/GateKeep/',
  };
});
