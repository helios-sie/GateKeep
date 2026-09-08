import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves project sites from /<repo-name>/, so Vite needs
// that prefix at build time or asset paths break. Repo: helios-sie/GateKeep.
export default defineConfig({
  plugins: [react()],
  base: '/GateKeep/',
});
