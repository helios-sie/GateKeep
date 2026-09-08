import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/diary-app/service-worker.js').catch(() => {
      // Offline support is a nice-to-have; failing silently here is fine,
      // the app still works fully online without it.
    });
  });
}
