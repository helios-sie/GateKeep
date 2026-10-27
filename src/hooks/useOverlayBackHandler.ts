import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { closeTopOverlay } from '../components/Overlay/overlayStack';
import { navigateTo, type Route } from './useHashRoute';

/*
 * One place that decides what "back" means — the Android hardware button on
 * the device, and the Escape key everywhere.
 *
 * Mounted once, from App. It does not need to know which overlays exist:
 * every overlay registers itself with overlayStack on mount (that is what
 * Overlay does for all three of them), so this only has to ask the stack to
 * close whatever is on top. Adding a fourth overlay later needs no change
 * here.
 *
 * The order is the whole point. Before this, the hardware back button went
 * straight to the OS, so dismissing a photo meant closing the entire app.
 */

/** Back from any other tab walks toward this one; back FROM it exits. */
const HOME_ROUTE: Route = 'reminders';

export function useOverlayBackHandler(route: Route): void {
  // Read through a ref so the listener is registered once, rather than being
  // torn down and rebuilt on every route change.
  const routeRef = useRef(route);
  useEffect(() => {
    routeRef.current = route;
  }, [route]);

  // Escape, on every platform. Lives here rather than in Overlay so that it
  // closes the TOP overlay specifically — an Escape handler per instance
  // would close all of them at once if two were ever open together.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (closeTopOverlay()) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    // On the web there is no hardware back button, and @capacitor/app's web
    // implementation never fires this event. Guarding means the plugin is
    // not even fetched in a browser — the import below is dynamic, so it
    // stays out of the web bundle entirely.
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    let remove: (() => void) | undefined;

    import('@capacitor/app').then(({ App }) => {
      if (cancelled) return;
      App.addListener('backButton', ({ canGoBack }) => {
        // 1. An overlay is open: close the topmost and stop. This is the
        //    case that used to kill the app.
        if (closeTopOverlay()) return;

        // 2. Nothing open, but we are not on the home tab: go back a route.
        //    canGoBack comes from the WebView's own history, so it is the
        //    honest answer to "is there anywhere to go back to" — without
        //    it, history.back() on a cold start that landed directly on
        //    Checklist would navigate out of the app to a blank page.
        if (routeRef.current !== HOME_ROUTE) {
          if (canGoBack) window.history.back();
          else navigateTo(HOME_ROUTE);
          return;
        }

        // 3. Home tab, nothing open: this is what "back" means to Android.
        App.exitApp();
      }).then((handle) => {
        if (cancelled) handle.remove();
        else remove = () => handle.remove();
      });
    });

    return () => {
      cancelled = true;
      remove?.();
    };
  }, []);
}
