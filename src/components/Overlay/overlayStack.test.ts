// Run with:  npm test
//
// Uses node:test and Node's built-in TypeScript support, so this adds no
// dependency. overlayStack is deliberately free of React, which is what
// makes the back-button ordering testable without a renderer or a DOM:
// the few document/window touches it has are stubbed below.

import assert from 'node:assert/strict';
import test from 'node:test';

interface StubApp {
  attrs: Record<string, string>;
}

/** Minimal stand-ins for the handful of DOM APIs overlayStack uses. */
function installDomStubs(): { app: StubApp; bodyClasses: Set<string> } {
  const app: StubApp = { attrs: {} };
  const bodyClasses = new Set<string>();

  const g = globalThis as Record<string, unknown>;
  g.document = {
    querySelector: (sel: string) =>
      sel === '.app'
        ? {
            setAttribute: (k: string, v: string) => {
              app.attrs[k] = v;
            },
            removeAttribute: (k: string) => {
              delete app.attrs[k];
            },
          }
        : null,
    body: {
      classList: {
        toggle: (name: string, on: boolean) => {
          if (on) bodyClasses.add(name);
          else bodyClasses.delete(name);
        },
      },
    },
  };
  g.window = {
    setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
    clearTimeout: (id: number) => clearTimeout(id),
  };

  return { app, bodyClasses };
}

const { app, bodyClasses } = installDomStubs();
const { registerOverlay, closeTopOverlay, hasOpenOverlay } = await import('./overlayStack.ts');

/**
 * Mirrors what really happens on screen: closing an overlay unmounts the
 * React component, whose effect cleanup is the unregister. A close handler
 * that did not unregister would leave the stack lying about what is open.
 */
function openOverlay(name: string, closed: string[]) {
  const unregister = registerOverlay(() => {
    closed.push(name);
    unregister();
  });
  return unregister;
}

test('back closes two stacked overlays newest-first, then reports empty', () => {
  const closed: string[] = [];

  openOverlay('lightbox', closed);
  openOverlay('audio', closed);
  assert.equal(hasOpenOverlay(), true);

  // First back press: the one opened last goes.
  assert.equal(closeTopOverlay(), true);
  assert.deepEqual(closed, ['audio']);
  assert.equal(hasOpenOverlay(), true, 'the first overlay must still be open');

  // Second back press: the one underneath.
  assert.equal(closeTopOverlay(), true);
  assert.deepEqual(closed, ['audio', 'lightbox']);
  assert.equal(hasOpenOverlay(), false);

  // Third: nothing left. The false return is what tells the back handler to
  // fall through to route navigation / exitApp instead of swallowing the
  // press.
  assert.equal(closeTopOverlay(), false);
  assert.deepEqual(closed, ['audio', 'lightbox']);
});

test('the app is held inert while anything is open, and released after', async () => {
  const closed: string[] = [];
  openOverlay('panel', closed);

  assert.equal(app.attrs.inert, '', 'app should be inert while an overlay is open');
  assert.equal(app.attrs['aria-hidden'], 'true');
  assert.equal(bodyClasses.has('overlay-open'), true, 'body scroll should be locked');

  closeTopOverlay();

  // Still held immediately after closing -- this is the 350ms window that
  // stops a second tap landing on whatever the overlay was covering.
  assert.equal(app.attrs.inert, '', 'isolation must outlive the close by a beat');

  await new Promise((r) => setTimeout(r, 450));
  assert.equal(app.attrs.inert, undefined, 'isolation should be released');
  assert.equal(app.attrs['aria-hidden'], undefined);
  assert.equal(bodyClasses.has('overlay-open'), false);
});

test('re-opening during the release window keeps the app inert', async () => {
  const closed: string[] = [];
  openOverlay('first', closed);
  closeTopOverlay();

  // Re-open before the 350ms timer fires; the pending release must be
  // cancelled, or the new overlay is left with the page behind it live.
  openOverlay('second', closed);
  await new Promise((r) => setTimeout(r, 450));

  assert.equal(app.attrs.inert, '', 'a pending release must not tear down a newer overlay');
  closeTopOverlay();
  await new Promise((r) => setTimeout(r, 450));
  assert.equal(app.attrs.inert, undefined);
});
