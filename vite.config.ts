import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'child_process'
import { resolve } from 'path'

const commitHash = execSync('git rev-parse --short HEAD').toString().trim();
const commitDate = execSync('git log -1 --format=%ci').toString().trim();

// GitHub Pages serves from a sub-path; a Capacitor APK serves web assets from
// the root (https://localhost/), so a sub-path base 404s every asset and the
// app renders a black screen. The APK workflow sets CAP_BUILD=1 to opt into a
// relative base; every other build (Pages deploy, local dev/build) is unchanged.
const BASE = process.env.CAP_BUILD === '1' ? './' : '/fretquency/';

export default defineConfig({
  base: BASE,
  // Dev server only. Bind to all interfaces so the app is reachable over
  // the LAN (e.g. from a phone) at http://<host>:5173/fretquency/.
  server: {
    host: true,
  },
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __COMMIT_DATE__: JSON.stringify(commitDate),
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        designPreview: resolve(__dirname, 'design-preview.html'),
        statsRedesign: resolve(__dirname, 'stats-redesign.html'),
        tuner: resolve(__dirname, 'tuner.html'),
        guitarNeckNotes: resolve(__dirname, 'guitar-neck-notes.html'),
        guitarNeckNotesEs: resolve(__dirname, 'guitar-neck-notes.es.html'),
        guitarNeckNotesPtBr: resolve(__dirname, 'guitar-neck-notes.pt-br.html'),
        guitarNeckNotesFr: resolve(__dirname, 'guitar-neck-notes.fr.html'),
        guitarNeckNotesIt: resolve(__dirname, 'guitar-neck-notes.it.html'),
        guitarNeckNotesHe: resolve(__dirname, 'guitar-neck-notes.he.html'),
        pitchSpike: resolve(__dirname, 'pitch-spike.html'),
        scaleSpike: resolve(__dirname, 'scale-spike.html'),
      },
    },
  },
  plugins: [
    {
      // Dev server only. Two fixes for hitting the dev server from a phone
      // on the LAN, both scoped to `apply: 'serve'` so they never touch the
      // production build or the production base path:
      //
      //   1. Some mobile browsers / carrier data-saver proxies send the
      //      request in HTTP absolute-form (`GET http://host:5173/path`).
      //      Vite's base middleware only understands origin-form (`/path`),
      //      so it fails to strip the base and rewrites the redirect to
      //      `/fretquency/http://host:5173/...`. Normalising
      //      req.url back to origin-form before Vite sees it fixes this.
      //   2. Vite serves the app at the base path WITH a trailing slash and
      //      404s the slash-less form; redirect the bare base path to the
      //      canonical one so `http://<host>:5173/fretquency` works.
      name: 'dev-lan-base-path-fixes',
      apply: 'serve',
      configureServer(server) {
        const bare = BASE.replace(/\/$/, '');
        server.middlewares.use((req, res, next) => {
          let url = req.url ?? '';
          if (/^https?:\/\//i.test(url)) {
            try {
              const parsed = new URL(url);
              url = parsed.pathname + parsed.search;
              req.url = url;
            } catch { /* leave req.url untouched */ }
          }
          if (url === bare || url.startsWith(bare + '?')) {
            res.statusCode = 301;
            res.setHeader('Location', BASE + url.slice(bare.length));
            res.end();
            return;
          }
          next();
        });
      },
    },
    react(),
    VitePWA({
      // 'autoUpdate': the generated SW takes control as soon as a newer build
      // finishes installing (skipWaiting + clientsClaim), so a fresh deploy is
      // picked up on the next launch without depending on a hand-rolled apply
      // step landing inside the boot-splash window. 'prompt' left the new SW
      // stuck in "waiting" whenever that window was missed, so the app could
      // sit on a stale cached build indefinitely. registerSW() is still called
      // by hand in main.tsx (injectRegister: false) to drive the boot splash
      // and the manual refresh button; in practice the update still applies
      // behind the splash on launch, not mid-session.
      registerType: 'autoUpdate',
      injectRegister: false,
      workbox: {
        // MUST be set by hand: vite-plugin-pwa only derives these two from
        // registerType:'autoUpdate' when `injectRegister` is 'auto'/unset (see
        // its `injectRegister === 'auto' || injectRegister == null` guard).
        // With `injectRegister: false` the guard is skipped, so the generated
        // SW came out prompt-shaped — it installed and then sat in `waiting`
        // forever, because the client-side registerSW() in autoUpdate mode
        // never sends the SKIP_WAITING message. The old worker kept serving
        // the cached build across reloads and the new one only took over
        // after every tab was closed.
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3}'],
        // The synthetic-voice template set (~280 KB) is a lazy import used
        // only by the "General" voice engine — keep it out of the precache
        // and cache it at runtime the first time that engine runs.
        // Same for the per-language dictionaries (src/i18n/translations.*.ts,
        // ~55–100 KB each): only the player's own language is ever fetched, so
        // precaching all of them would download every language on install.
        globIgnores: ['**/generalVoiceTemplates-*.js', '**/translations.*-*.js'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/translations\.[^/]*\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'languages',
              expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 180 },
            },
          },
          {
            urlPattern: /\/assets\/generalVoiceTemplates-.*\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'voice-templates',
              expiration: { maxEntries: 2, maxAgeSeconds: 60 * 60 * 24 * 180 },
            },
          },
          {
            urlPattern: /^https:\/\/gleitz\.github\.io\/midi-js-soundfonts\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'guitar-samples',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      manifest: {
        name: 'Fretquency',
        short_name: 'Fretquency',
        description: 'Learn every note on the fretboard of guitar, bass, ukulele, mandolin or banjo, plus intervals, scales, staff and tab reading — with a tuner built in.',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        // 'minimal-ui', not 'standalone': Android Chrome disables the Web
        // Speech API (voice answers) inside a 'standalone'/'fullscreen' PWA,
        // failing every listen with a bogus 'network' error. 'minimal-ui'
        // keeps the app-like chrome (no editable URL bar) while leaving
        // SpeechRecognition working from a home-screen link.
        display: 'minimal-ui',
        orientation: 'portrait',
        // Raster icons generated from assets/note-mark.png by
        // `npm run gen:icons` (scripts/gen-app-icons.mts) and committed to
        // public/. The SVG stays as a scalable fallback / favicon.
        // Paths are RELATIVE (no leading slash) so the browser resolves them
        // against the manifest URL — i.e. under the Pages base path. A leading
        // slash would resolve to the domain root and 404 on GitHub Pages.
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
