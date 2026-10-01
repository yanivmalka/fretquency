// Regenerates every app-icon / splash raster from a single master image
// (assets/note-mark.png — the metallic guitar-note mark, transparent bg).
//
// There is no test runner or asset pipeline in this repo, so this is a
// stand-alone script in the same spirit as the other scripts/*.mts — run by
// hand whenever the master art changes, and commit the results:
//
//   npm run gen:icons        (== node scripts/gen-app-icons.mts)
//
// It writes two families of files:
//   1. public/*   — the web / PWA icons and the boot-splash mark. These are
//      committed so `npm run build` never needs an image library.
//   2. assets/*   — the source art for `capacitor-assets generate`, which the
//      Android APK workflow runs to produce native mipmaps / adaptive icons /
//      splash screens into the (gitignored) android/ project.
//
// The mark is composited over a subtle vertical gradient that matches the
// hamburger drawer palette (--bg-0 #1a1a2e at the top → --bg-1 #111122 at the
// bottom); the web boot-splash progress bar reuses the same cyan --accent.

import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MASTER = join(root, 'assets', 'note-mark.png');

const GRAD_TOP = '#1a1a2e';    // --bg-0
const GRAD_BOTTOM = '#111122'; // --bg-1

/** A size×size PNG buffer of the vertical drawer-palette gradient. */
function gradient(size: number): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${GRAD_TOP}"/>
      <stop offset="1" stop-color="${GRAD_BOTTOM}"/>
    </linearGradient></defs>
    <rect width="${size}" height="${size}" fill="url(#g)"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** The master mark, trimmed of its transparent border, scaled so its longest
 *  side is `px` pixels. Returned as a PNG buffer with alpha intact. */
function mark(px: number): Promise<Buffer> {
  return sharp(MASTER)
    .trim()
    .resize(px, px, { fit: 'inside', withoutEnlargement: false })
    .png()
    .toBuffer();
}

/** Mark centred over the gradient. `coverage` is the mark's longest side as a
 *  fraction of the canvas (the rest is breathing room / mask safe-zone). */
async function onGradient(size: number, coverage: number, out: string): Promise<void> {
  const bg = await gradient(size);
  const fg = await mark(Math.round(size * coverage));
  await sharp(bg)
    .composite([{ input: fg, gravity: 'center' }])
    .png()
    .toFile(join(root, out));
  console.log(`  ${out}  (${size}px, mark ${Math.round(coverage * 100)}%)`);
}

/** Just the trimmed mark on transparency, longest side `size`. */
async function transparent(size: number, out: string): Promise<void> {
  await sharp(await mark(size)).png().toFile(join(root, out));
  console.log(`  ${out}  (${size}px, transparent)`);
}

/** The trimmed mark centred on a fixed transparent `canvas`×`canvas` square,
 *  its longest side `markPx`. Used for the Android 12 system-splash icon,
 *  whose slot has a fixed dp size and a circular safe zone. */
async function centered(canvas: number, markPx: number, out: string): Promise<void> {
  await sharp({
    create: { width: canvas, height: canvas, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: await mark(markPx), gravity: 'center' }])
    .png()
    .toFile(join(root, out));
  console.log(`  ${out}  (${canvas}px canvas, ${markPx}px mark)`);
}

async function solid(size: number, out: string): Promise<void> {
  await sharp(await gradient(size)).png().toFile(join(root, out));
  console.log(`  ${out}  (${size}px, gradient only)`);
}

await mkdir(join(root, 'public'), { recursive: true });
await mkdir(join(root, 'assets'), { recursive: true });

console.log('web / PWA (committed to public/):');
// Home-screen / install icons: generous mark, small inset so it never kisses
// the edge.
await onGradient(192, 0.78, 'public/icon-192.png');
await onGradient(512, 0.78, 'public/icon-512.png');
// Maskable: platforms crop to a circle/squircle, keep the mark inside the
// ~80% safe zone (→ 0.6 of the full canvas).
await onGradient(512, 0.6, 'public/icon-maskable-512.png');
// iOS already rounds the corners of apple-touch-icon itself.
await onGradient(180, 0.8, 'public/apple-touch-icon.png');
// The web boot-splash paints its own CSS gradient behind this mark.
await transparent(640, 'public/splash-mark.png');

console.log('native source art (for capacitor-assets, in assets/):');
await onGradient(1024, 0.78, 'assets/icon-only.png');
// Android adaptive icon: the launcher masks and zooms (~1.4x) the foreground
// layer, so the mark sits small on a full 1024 transparent canvas to survive
// the crop. The note glyph is diagonal, so its farthest pixel (the top-right
// tuning pegs) sits ~0.64x the mark's longest side out from centre — at 0.5
// canvas coverage that lands just inside the 72dp adaptive safe zone, where a
// bigger mark had the pegs shaved off by tighter OEM masks (OneUI's squircle).
await sharp({
  create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([{ input: await mark(512), gravity: 'center' }])
  .png()
  .toFile(join(root, 'assets/icon-foreground.png'));
console.log('  assets/icon-foreground.png  (1024px canvas, 512px mark)');
await solid(1024, 'assets/icon-background.png');
// Android adaptive-icon foreground, hi-res. `capacitor-assets` 3.0.5 has a bug:
// given an explicit assets/icon-foreground.png it resizes with the *legacy*
// icon table (192px at xxxhdpi), not the adaptive one (432px). Android then
// upscales that 192px layer onto the 108dp (= 432px at xxxhdpi) adaptive
// canvas and the mark comes out soft. This 512px `nodpi` copy — same 0.5
// canvas coverage as icon-foreground.png so the on-screen size is unchanged,
// only the pixel density goes up — is wired up by the APK workflow via
// android-overrides/mipmap-anydpi-v26/ic_launcher.xml, which points the
// foreground at it and drops the generator's doubled inset. The mark stays
// small so it survives the launcher's mask + ~1.4x parallax zoom: 0.5 keeps
// the diagonal glyph's corners (tuning pegs) inside the 72dp safe zone.
await centered(512, Math.round(512 * 0.5), 'assets/ic-adaptive-fg.png');
// Splash: 2732² is the capacitor-assets canonical source size. Keep the mark
// small — only the centre ~1200px is guaranteed visible on every device.
// Deliberately no assets/splash-dark.png: the splash looks the same in dark
// mode, and Android falls back to the plain drawables when no -night ones
// exist. A dark source (even an identical copy) makes capacitor-assets emit a
// second full set of -night splash PNGs, ~1.5 MB of APK for nothing.
await onGradient(2732, 0.3, 'assets/splash.png');
// Android 12+ system splash: the platform draws its own splash and ignores the
// pre-12 full-screen `splash.png` above — it shows an icon in a fixed ~288dp
// slot (logo inside the centre ~192dp circle). `capacitor-assets` doesn't emit
// anything for this, so the OS falls back to the adaptive-launcher foreground,
// which it generates at only 192px (xxxhdpi) and then up-scales → blurry. A
// dedicated 1152px asset (crisp at xxxhdpi = 288dp × 4) wired up by the APK
// workflow via android-overrides/values-v31/styles.xml. This icon has no
// windowSplashScreenIconBackgroundColor, so the platform clips it to a circle
// ~2/3 of the canvas (radius 384px here); the mark's farthest pixel from
// centre must stay inside that or its corners get shaved (the low notehead /
// the tuning pegs). 576px longest side keeps the whole glyph ~4% clear of the
// mask while still filling the slot.
await centered(1152, 576, 'assets/android12-splash-icon.png');

console.log('done.');
