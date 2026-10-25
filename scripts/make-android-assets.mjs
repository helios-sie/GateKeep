/*
 * Builds the source images that @capacitor/assets expands into every Android
 * launcher-icon and splash density.
 *
 * Run this only when the quill art or the parchment colour changes, then
 * `npx @capacitor/assets generate --android`. The generated files under
 * android/app/src/main/res are committed, so a normal build never needs
 * either step.
 *
 * Why compose rather than point the generator straight at the quill PNG: the
 * quill is a transparent 831x894 portrait image, and the generator would
 * stretch it to a square and leave the icon background transparent (black on
 * most launchers). Everything here exists to put it on the app's own
 * parchment at the right scale.
 */
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const QUILL = join(REPO, 'src/assets/quill-header-icon.png');
const OUT = join(REPO, 'assets');

/** --bg from src/index.css. The icon has to agree with the app it opens. */
const PARCHMENT = '#f0e9d8';

mkdirSync(OUT, { recursive: true });

/** The quill, scaled to `box` px on its longest side, centred on `size`.
 *
 *  No trimming step: the source art already runs edge to edge in its 831x894
 *  canvas (the quill tip reaches the top-right corner and the desk rule spans
 *  the full width), so its bounding box IS the canvas and centring the canvas
 *  centres the art. `fit: 'inside'` scales on the taller side and leaves the
 *  narrower margins left and right, which is the artwork's own portrait
 *  proportion rather than a defect to correct. */
async function quillOn(size, box, background) {
  const quill = await sharp(QUILL)
    .resize(box, box, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: quill, gravity: 'centre' }])
    .png();
}

const opaque = { r: 0xf0, g: 0xe9, b: 0xd8, alpha: 1 };
const clear = { r: 0, g: 0, b: 0, alpha: 0 };

/*
 * Adaptive icons are two layers the launcher masks and parallaxes together,
 * and the foreground has to survive being cropped to a circle: Android only
 * guarantees the middle 66%.
 *
 * That safe zone is already applied for us. @capacitor/assets emits
 * mipmap-anydpi-v26/ic_launcher.xml wrapping BOTH layers in
 * `<inset android:inset="16.7%">`, which maps this whole 1024 canvas onto the
 * guaranteed 66% — so insetting the quill again here would inset it twice.
 * The first pass did exactly that (560/1024 became ~36% of the finished icon,
 * a small quill adrift in parchment). 820 fills the safe zone while leaving a
 * margin for the more aggressive launcher masks.
 */
await (await quillOn(1024, 820, clear)).toFile(join(OUT, 'icon-foreground.png'));
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: opaque } })
  .png()
  .toFile(join(OUT, 'icon-background.png'));

// The legacy square icon, for launchers that ignore the adaptive pair.
await (await quillOn(1024, 620, opaque)).toFile(join(OUT, 'icon.png'));

/*
 * 2732 square is the generator's expected splash source: it centre-crops that
 * one image to every portrait and landscape density, so the quill has to sit
 * well inside the middle or it loses its tip in landscape.
 */
await (await quillOn(2732, 900, opaque)).toFile(join(OUT, 'splash.png'));
// The app is light-only (color-scheme: light), so dark mode gets the same art
// rather than an inverted one that would not match the screen behind it.
await (await quillOn(2732, 900, opaque)).toFile(join(OUT, 'splash-dark.png'));

console.log(`Wrote icon, icon-foreground, icon-background, splash, splash-dark to ${OUT}`);
console.log(`Parchment: ${PARCHMENT}`);
