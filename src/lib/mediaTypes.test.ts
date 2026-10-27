import assert from 'node:assert/strict';
import test from 'node:test';

import { extensionFor, mediaFilename } from './mediaTypes.ts';

test('maps the types this app actually produces', () => {
  assert.equal(extensionFor('image/jpeg', 'photo'), 'jpg');
  assert.equal(extensionFor('image/png', 'photo'), 'png');
  assert.equal(extensionFor('image/webp', 'photo'), 'webp');
  assert.equal(extensionFor('audio/webm', 'audio'), 'webm');
  assert.equal(extensionFor('audio/ogg', 'audio'), 'ogg');
  assert.equal(extensionFor('audio/wav', 'audio'), 'wav');
});

test('strips the codec parameter MediaRecorder appends', () => {
  // This is the real shape of recorder.mimeType on Android Chrome, and the
  // case that would otherwise miss the table entirely and hit the fallback.
  assert.equal(extensionFor('audio/webm;codecs=opus', 'audio'), 'webm');
  assert.equal(extensionFor('audio/mp4;codecs=mp4a.40.2', 'audio'), 'm4a');
});

test('audio/mp4 becomes .m4a, not .mp4', () => {
  // Audio-only MP4 named .mp4 is treated as video by players and file
  // managers, some of which then refuse to open it.
  assert.equal(extensionFor('audio/mp4', 'audio'), 'm4a');
});

test('tolerates case and surrounding whitespace', () => {
  assert.equal(extensionFor('IMAGE/JPEG', 'photo'), 'jpg');
  assert.equal(extensionFor('  audio/webm ; codecs=opus', 'audio'), 'webm');
});

test('falls back by kind for an empty or unknown type', () => {
  // A blob restored from an older backup can genuinely have no type.
  assert.equal(extensionFor('', 'photo'), 'jpg');
  assert.equal(extensionFor('', 'audio'), 'webm');
  assert.equal(extensionFor('application/octet-stream', 'photo'), 'jpg');
  assert.equal(extensionFor('video/mp4', 'audio'), 'webm');
});

test('builds the filename the download attribute uses', () => {
  assert.equal(mediaFilename('photo', 'image/png', 'photo'), 'photo.png');
  assert.equal(mediaFilename('audio-note', 'audio/webm;codecs=opus', 'audio'), 'audio-note.webm');
  assert.equal(mediaFilename('photo', '', 'photo'), 'photo.jpg');
});
