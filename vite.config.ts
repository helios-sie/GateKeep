import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// IMPORTANT: change 'diary-app' below to your actual GitHub repo name.
// GitHub Pages serves project sites from /<repo-name>/, so Vite needs
// to know that prefix at build time or asset paths will break.
export default defineConfig({
  plugins: [react()],
  base: '/diary-app/',
});
