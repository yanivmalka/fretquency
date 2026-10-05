import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App'
import { LanguageProvider } from './i18n/LanguageContext'
import AdBanner from './components/AdBanner'
import { loadDictionary, type Lang } from './i18n/translations'
import { initialLanguage } from './i18n/initialLanguage'
import { markBootDone } from './utils/bootState'
import { verror } from './utils/debugLog'
import { trackAppOpenAndReturns } from './utils/analytics'

// Fetch the starting language's dictionary (only that one) behind the boot
// splash, so the first render is already translated. Capped so a stalled
// download never holds the app: past the cap it renders in English and the
// LanguageProvider switches over when the dictionary arrives.
const DICTIONARY_WAIT_MS = 4000
Promise.race([
  loadDictionary(initialLanguage()).catch(() => {}),
  new Promise((resolve) => setTimeout(resolve, DICTIONARY_WAIT_MS)),
]).then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <LanguageProvider>
        <App />
        <AdBanner />
      </LanguageProvider>
    </StrictMode>,
  )
  trackAppOpenAndReturns()
})

// Retire the inline boot splash (index.html) once the app has done its first
// real work behind it. Two things must settle before we fade it out:
//
//  1. First data load — <App> fires a window 'app-ready' event when the
//     Supabase session and (for a signed-in user) the entitlement lookup have
//     resolved, so the UI never visibly flips from a guest/default state to
//     the signed-in one after the splash has already gone.
//
//  2. Latest-version check — on every launch we ask the service worker to
//     check for a newer deploy *now*, and if one is found we hold the splash
//     until it has installed and reload straight into it (still behind the
//     splash), so a launch always runs the newest build.
//
// There is deliberately NO hard time cap: the splash stays until that work
// genuinely finishes, however long the network takes (min-visible 1.6s so it
// never flashes). The progress bar is driven by real milestones. After a long
// wait we show a "still loading" note but keep waiting. Non-blocking failures
// (no service worker, an offline update check) are logged and skipped with no
// UI — the app runs the build it already has. The one blocking failure, a
// crash before the app is ready, shows the error and a reload button.
{
  const splash = document.getElementById('boot-splash')
  const bar = splash?.querySelector<HTMLElement>('.boot-splash__bar') ?? null
  const pctEl = splash?.querySelector<HTMLElement>('.boot-splash__pct') ?? null
  const msgEl = splash?.querySelector<HTMLElement>('.boot-splash__msg') ?? null
  const retryEl = splash?.querySelector<HTMLButtonElement>('.boot-splash__retry') ?? null

  const MIN_VISIBLE_MS = 1600
  const SLOW_NOTICE_MS = 20000
  const RECHECK_INTERVAL_MS = 60 * 60 * 1000
  const BOOT_RELOAD_KEY = 'pwa-boot-reloaded'
  // How long to wait for a freshly installed worker to take control before
  // reloading anyway. With skipWaiting + clientsClaim the hand-over lands in
  // well under a second; the cap only covers the case where it never comes.
  const HANDOVER_WAIT_MS = 3000

  const lang: Lang = initialLanguage()
  const COPY = {
    slow: { he: 'עדיין טוען…', en: 'Still loading…', es: 'Todavía cargando…', 'pt-BR': 'Ainda carregando…', fr: 'Chargement en cours…', it: 'Ancora in caricamento…' },
    crash: { he: 'האפליקציה נתקלה בשגיאה בטעינה.', en: 'The app hit an error while loading.', es: 'La app tuvo un error al cargar.', 'pt-BR': 'O app encontrou um erro ao carregar.', fr: 'L’app a rencontré une erreur au chargement.', it: 'L’app ha riscontrato un errore durante il caricamento.' },
    retry: { he: 'נסה שוב', en: 'Try again', es: 'Reintentar', 'pt-BR': 'Tentar de novo', fr: 'Réessayer', it: 'Riprova' },
  } as const
  const say = (k: keyof typeof COPY) => COPY[k][lang]

  // --- progress bar: `progress` is the milestone target (jumps + a slow creep
  // between milestones); `displayed` eases toward it on a ~60fps ticker so the
  // bar and the "42%" readout visibly count up rather than snap.
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  let progress = 6
  let displayed = 6
  let creepTimer: ReturnType<typeof setInterval> | undefined
  let tickTimer: ReturnType<typeof setInterval> | undefined

  // --- boot flourish ----------------------------------------------------------
  // Each launch greets the user with a short *random* one-octave scale, and the
  // scale and the progress bar are one motion, not two: the bar is the scale's
  // ceiling and the scale is the bar's floor.
  //
  //  * A note never sounds before the bar has reached its step, so the melody
  //    can never run ahead of the loading it is illustrating.
  //  * The bar never advances faster than `pace()` (the scale's own tempo), so
  //    an instant cached load can't cross every milestone in two frames and
  //    stack the whole scale into a chord.
  //  * The bar never falls behind `floor()` — a plain linear clock started with
  //    the scale — so a slow load can't stall the melody mid-phrase. The melody
  //    always flows at a steady STEP_MS; the bar shows whichever is further
  //    along, the real load or the music.
  //
  // One rising / drifting / fading glyph is spawned at the bar's head per note.
  // The splash is held until the scale has finished (`flourish.done()` gates
  // `maybeDismiss`) so it is always heard and seen.
  //
  // The scale is *armed* (`arm()`) only once we know this launch won't reload
  // into a newer build — a reload behind the splash would otherwise cut the
  // melody off mid-phrase and restart it from the top on the second pass.
  //
  // Audio is best-effort: a browser keeps a fresh AudioContext suspended until
  // a user gesture, so a plain reload (Ctrl+R) with no click/tap starts silent.
  // The first pointer/key/touch resumes the context and the scale simply
  // carries on from where it is — it is deliberately never replayed from the
  // top, and the listeners die with the splash, so nothing can ever sound over
  // the app itself.
  const track = splash?.querySelector<HTMLElement>('.boot-splash__track') ?? null
  const flourishCleanups: (() => void)[] = []
  type Flourish = {
    /** Start the scale, spreading it over the bar from `fromPct` to 100. */
    arm: (fromPct: number) => void
    /** Called every frame with the bar's rendered %; sounds any note due. */
    at: (pct: number) => void
    /** Max % the bar may advance per 16ms tick (the scale's tempo). */
    pace: () => number
    /** Min % the bar must be at by now, so the melody never stalls. */
    floor: () => number
    done: () => boolean
    whenDone: (cb: () => void) => void
  }
  const flourish = ((): Flourish => {
    let doneCb: (() => void) | undefined
    if (!splash) {
      return {
        arm: () => {}, at: () => {}, pace: () => Infinity, floor: () => 0,
        done: () => true, whenDone: (cb) => cb(),
      }
    }

    const rand = (n: number) => Math.floor(Math.random() * n)

    // A random one-octave run: random root (G3–G4), random mode, random
    // direction (ascending or descending). All modes top out at 8 notes, so the
    // scale runs 9 * STEP_MS ≈ MIN_VISIBLE_MS end to end and rarely delays boot.
    const MODES: number[][] = [
      [0, 2, 4, 5, 7, 9, 11, 12], // major
      [0, 2, 3, 5, 7, 8, 10, 12], // natural minor
      [0, 2, 3, 5, 7, 9, 10, 12], // Dorian
      [0, 2, 4, 6, 7, 9, 11, 12], // Lydian
      [0, 2, 4, 5, 7, 9, 10, 12], // Mixolydian
      [0, 2, 3, 5, 7, 8, 11, 12], // harmonic minor
      [0, 2, 4, 7, 9, 12], // major pentatonic
      [0, 3, 5, 7, 10, 12], // minor pentatonic
      [0, 3, 5, 6, 7, 10, 12], // blues
    ]
    const root = 55 + rand(13)
    let degrees = MODES[rand(MODES.length)]
    if (Math.random() < 0.5) {
      const top = degrees[degrees.length - 1]
      degrees = degrees.map((d) => top - d).reverse()
    }
    const freqs = degrees.map((d) => 440 * 2 ** ((root + d - 69) / 12))
    const N = freqs.length
    const STEP_MS = 190

    // --- audio (best-effort) ---
    type WithWebkitAudio = typeof window & { webkitAudioContext?: typeof AudioContext }
    const AC = window.AudioContext || (window as WithWebkitAudio).webkitAudioContext
    let ctx: AudioContext | undefined
    const getCtx = () => {
      if (!AC) return undefined
      if (!ctx) { try { ctx = new AC() } catch { return undefined } }
      return ctx
    }
    let heardAny = false
    const playFreq = (freq: number) => {
      const c = getCtx()
      if (!c || c.state !== 'running') return
      heardAny = true
      const t = c.currentTime
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.16, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
      osc.connect(gain).connect(c.destination)
      osc.start(t)
      osc.stop(t + 0.55)
    }

    // --- glyphs ---
    const GLYPHS = ['♪', '♫', '♩', '♬', '♭', '♯']
    const spawnGlyph = (fraction: number) => {
      if (reduceMotion || !track || !document.body.contains(track)) return
      const r = track.getBoundingClientRect()
      if (!r.width) return
      const el = document.createElement('span')
      el.className = 'boot-splash__note'
      el.textContent = GLYPHS[rand(GLYPHS.length)]
      el.style.left = `${r.left + r.width * fraction}px`
      el.style.top = `${r.top + r.height / 2}px`
      el.style.fontSize = `${16 + rand(10)}px`
      el.style.setProperty('--drift', `${rand(37) - 18}px`)
      el.style.setProperty('--rise', `${66 + rand(40)}px`)
      el.style.setProperty('--spin', `${rand(31) - 15}deg`)
      splash.appendChild(el)
      const gone = setTimeout(() => el.remove(), 1400)
      flourishCleanups.push(() => { clearTimeout(gone); el.remove() })
    }

    // --- the scale, as a position on the bar -----------------------------------
    // The scale is laid over the *first* SPAN of the bar's remaining travel —
    // note `i` is due at `startPct + ((i + 1) / N) * span`, the last one landing
    // on `endPct`. The tail past `endPct` is left to the real load, so the
    // music never pushes the bar to a figure the loading hasn't earned.
    //
    // `floor()` walks that same line at a constant STEP_MS per step and is what
    // keeps the melody flowing when the load stalls; `pace()` is the same speed
    // as a per-tick limit, which is what stops a cached load from crossing every
    // step at once. Once the scale is done `pace()` lifts and the bar is the
    // load's alone again.
    const SPAN = 0.72
    const runMs = N * STEP_MS
    let armed = false
    let fired = 0
    let startPct = 0
    let span = 100 * SPAN
    let armedAt = 0
    let lastNoteAt = 0

    const api: Flourish = {
      arm: (fromPct: number) => {
        if (armed) return
        armed = true
        // Clamped so a late arm still leaves the scale room to breathe: the
        // notes then catch up under the STEP_MS gate rather than as a chord.
        startPct = Math.max(0, Math.min(fromPct, 55))
        span = (100 - startPct) * SPAN
        armedAt = performance.now()
        lastNoteAt = armedAt - STEP_MS
      },
      // Before the scale is armed the same speed limit still applies (over a
      // nominal full-width run), so the bar can't sprint to 92% during the
      // update check and leave the whole scale to catch up afterwards.
      pace: () => (fired >= N ? Infinity : ((armed ? span : 100 * SPAN) / runMs) * 16),
      floor: () => (armed
        ? startPct + Math.min((performance.now() - armedAt) / runMs, 1) * span
        : 0),
      at: (pct: number) => {
        if (!armed || fired >= N) return
        const now = performance.now()
        if (now - lastNoteAt < STEP_MS * 0.75) return // never stack into a chord
        if (pct + 0.01 < startPct + ((fired + 1) / N) * span) return // never lead the bar
        playFreq(freqs[fired])
        spawnGlyph(pct / 100)
        fired += 1
        lastNoteAt = now
        if (fired >= N) doneCb?.()
      },
      done: () => armed && fired >= N,
      whenDone: (cb: () => void) => { doneCb = cb; if (api.done()) cb() },
    }

    // Gesture fallback: on the first interaction, resume a suspended context so
    // the rest of the scale is audible. The scale is never restarted — it stays
    // locked to the bar — and the listeners are dropped with the splash, so a
    // late tap can never play notes over the app.
    const kick = () => {
      detach()
      const c = getCtx()
      if (!c || heardAny || c.state === 'running') return
      void c.resume().catch(() => { /* still no gesture credit — stay silent */ })
    }
    const evs: (keyof WindowEventMap)[] = ['pointerdown', 'touchstart', 'keydown']
    const detach = () => evs.forEach((e) => window.removeEventListener(e, kick))
    evs.forEach((e) => window.addEventListener(e, kick, { passive: true }))
    flourishCleanups.push(detach)

    return api
  })()

  const render = () => {
    if (bar) bar.style.width = `${displayed}%`
    if (pctEl) pctEl.textContent = `${Math.round(displayed)}%`
  }
  // One frame of the bar. Three forces, in order: ease toward the real
  // milestone target, but never faster than the scale's tempo (`pace`); never
  // slower than the scale's own clock (`floor`); then hand the rendered % to
  // the scale so it can sound whatever note that position has now reached.
  const tick = () => {
    const gap = progress - displayed
    if (Math.abs(gap) < 0.1) displayed = progress
    else displayed += reduceMotion ? gap : Math.min(gap * 0.14, flourish.pace())
    const floor = flourish.floor()
    if (floor > displayed) displayed = floor
    render()
    flourish.at(displayed)
  }
  const stopTicker = () => {
    if (tickTimer !== undefined) { clearInterval(tickTimer); tickTimer = undefined }
  }
  const stopCreep = () => {
    if (creepTimer !== undefined) { clearInterval(creepTimer); creepTimer = undefined }
  }
  const setProgress = (pct: number) => {
    if (pct <= progress) return
    progress = Math.min(pct, 100)
  }
  const creepTo = (ceil: number) => {
    stopCreep()
    creepTimer = setInterval(() => {
      if (progress >= ceil - 0.5) { stopCreep(); return }
      progress += (ceil - progress) * 0.08
    }, 400)
  }
  render()
  tickTimer = setInterval(tick, 16)
  setProgress(15)

  const shownAt = performance.now()
  let appReady = false
  let updateSettled = false
  let dismissed = false
  let fatal = false

  const showMsg = (text: string) => { if (msgEl) { msgEl.textContent = text; msgEl.hidden = false } }
  const clearMsg = () => {
    if (msgEl) { msgEl.textContent = ''; msgEl.hidden = true }
    if (retryEl) { retryEl.hidden = true; retryEl.onclick = null }
  }

  const hideSplash = () => {
    if (!splash) return
    flourishCleanups.forEach((fn) => { try { fn() } catch { /* ignore */ } })
    splash.classList.add('boot-splash--hide')
    splash.addEventListener('transitionend', () => splash.remove(), { once: true })
    // Fallback in case the transition never fires (e.g. reduced motion).
    setTimeout(() => splash.remove(), 600)
  }

  const maybeDismiss = () => {
    // Also hold the splash until the intro scale has finished, so a fast data
    // load never cuts it off — the bar still reflects the real load speed.
    if (dismissed || fatal || !appReady || !updateSettled || !flourish.done()) return
    dismissed = true
    stopCreep()
    setProgress(100)
    const finish = () => {
      stopTicker()
      displayed = 100
      render()
      clearMsg()
      hideSplash()
      markBootDone()
    }
    // Give the readout ~450ms to visibly run up to 100 before the fade.
    const runUp = 450
    const held = performance.now() - shownAt
    setTimeout(finish, Math.max(runUp, MIN_VISIBLE_MS - held))
  }

  const markUpdateSettled = () => {
    if (updateSettled) return
    updateSettled = true
    setProgress(appReady ? 100 : 70)
    // Only now is this launch committed to the build it already has, so the
    // scale can start knowing it won't be cut off by a reload behind the
    // splash. It plays out over the bar's remaining travel from here.
    flourish.arm(displayed)
    maybeDismiss()
  }

  // When the intro scale finishes it may be the last thing the splash was
  // waiting on.
  flourish.whenDone(maybeDismiss)

  window.addEventListener('app-ready', () => {
    appReady = true
    // A crash message shown earlier was provisional — the app recovered.
    if (fatal) {
      fatal = false
      clearMsg()
      if (tickTimer === undefined && !dismissed) tickTimer = setInterval(tick, 16)
    }
    setProgress(updateSettled ? 100 : 92)
    maybeDismiss()
  }, { once: true })

  // No time cap — just reassure the user the splash isn't dead after a while.
  setTimeout(() => { if (!dismissed && !fatal) showMsg(say('slow')) }, SLOW_NOTICE_MS)

  // The only blocking failure: an uncaught error before the app is ready. Every
  // one is written to the in-app debug log (the admin debug panel) so a flash
  // on a phone can still be read afterwards. It is shown — with a reload
  // button — only if the app is still not ready BOOT_ERROR_GRACE_MS later: a
  // passing error the app recovers from (it still reaches 'app-ready') used to
  // flash "error, try again" and freeze the bar and the intro scale, which then
  // all played out at once when the app came back.
  const BOOT_ERROR_GRACE_MS = 4000
  let pendingBootError: ReturnType<typeof setTimeout> | undefined
  const onBootError = (detail: string) => {
    if (appReady || dismissed || fatal) return
    verror('[boot] error before app-ready', detail)
    if (pendingBootError !== undefined) return
    pendingBootError = setTimeout(() => showBootError(detail), BOOT_ERROR_GRACE_MS)
  }
  const showBootError = (detail: string) => {
    if (appReady || dismissed || fatal) return
    fatal = true
    stopCreep()
    stopTicker() // freeze the readout where it stalled
    showMsg(detail ? `${say('crash')} (${detail})` : say('crash'))
    if (retryEl) {
      retryEl.textContent = say('retry')
      retryEl.hidden = false
      retryEl.onclick = () => window.location.reload()
    }
  }
  window.addEventListener('error', (e) => onBootError(e.message || 'error'))
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason as { message?: string } | string | undefined
    onBootError((typeof r === 'string' ? r : r?.message) || 'promise rejection')
  })

  let swRegistration: ServiceWorkerRegistration | undefined

  // Resolves once a *different* worker has taken control of this page, or when
  // `ms` elapses (resolving false). Bounded on purpose: a hand-over that never
  // comes must not hold the splash — or the refresh button — open forever.
  function waitForControllerChange(ms: number) {
    return new Promise<boolean>((resolve) => {
      const done = (v: boolean) => { clearTimeout(timer); resolve(v) }
      const timer = setTimeout(() => done(false), ms)
      navigator.serviceWorker.addEventListener(
        'controllerchange', () => done(true), { once: true },
      )
    })
  }

  // Belt-and-braces nudge for a worker parked in `waiting`. The generated SW
  // keeps a SKIP_WAITING message listener regardless of registerType, so this
  // is a no-op when the worker already skipped waiting on its own.
  function nudgeWaiting(reg: ServiceWorkerRegistration) {
    try { reg.waiting?.postMessage({ type: 'SKIP_WAITING' }) } catch { /* ignore */ }
  }

  // On every launch: check for a newer deploy now, and if one is found hold the
  // splash until it has installed, then reload into it — the reload that
  // vite-plugin-pwa fires from its own `activated` handler happens behind the
  // splash. NB: `onNeedRefresh` is never called under registerType:'autoUpdate',
  // so this lives in `onRegisteredSW`, not there.
  async function applyNewestThenSettle(reg: ServiceWorkerRegistration) {
    let bootReloaded = false
    try { bootReloaded = sessionStorage.getItem(BOOT_RELOAD_KEY) === '1' } catch { /* private mode */ }

    try {
      await reg.update()
    } catch (err) {
      // Offline / server error — non-blocking, run the cached build. No UI.
      console.warn('[pwa] update check failed', err)
      try { sessionStorage.removeItem(BOOT_RELOAD_KEY) } catch { /* ignore */ }
      markUpdateSettled()
      return
    }

    const installing = reg.installing
    if (installing && !reg.waiting) {
      creepTo(60)
      await new Promise<void>((resolve) => {
        const settled = () => { if (installing.state !== 'installing') { resolve(); return true } return false }
        installing.addEventListener('statechange', settled)
        settled() // guard the race where it left 'installing' before this ran
      })
      stopCreep()
    }

    // A newer build finished installing. Reload into it while the splash is
    // still up — once per launch only, so a worker that fails to take over
    // can't spin us in a reload loop.
    if ((reg.installing || reg.waiting) && !bootReloaded) {
      try { sessionStorage.setItem(BOOT_RELOAD_KEY, '1') } catch { /* ignore */ }
      setProgress(66)
      // Reloading while the new worker is still `installed`/`activating` would
      // be served by the *old* worker's precache — the reload would land back
      // on the stale build and BOOT_RELOAD_KEY would stop us retrying. Give the
      // hand-over a short bounded window first; if it doesn't come we reload
      // anyway, exactly as before.
      nudgeWaiting(reg)
      if (reg.waiting || reg.installing) await waitForControllerChange(HANDOVER_WAIT_MS)
      window.location.reload()
      return
    }

    try { sessionStorage.removeItem(BOOT_RELOAD_KEY) } catch { /* ignore */ }
    markUpdateSettled()
  }

  if (Capacitor.isNativePlatform()) {
    // The APK ships its web assets inside the app and updates as a new APK, so
    // a service worker there only does harm: after every APK install the old
    // worker served the *previous* build from its cache, then found the new
    // one, installed it and reloaded behind the splash — while the stale page
    // asked for chunks the new APK no longer has ("error, try again", then a
    // reset). Retire any worker an earlier APK registered, with its caches. If
    // a worker still controls this page, the network fallback is the APK's own
    // files, which are this very build.
    markUpdateSettled()
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .catch((err) => console.warn('[pwa] unregister failed', err))
    }
    if ('caches' in window) {
      void caches.keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .catch((err) => console.warn('[pwa] cache cleanup failed', err))
    }
  } else if (import.meta.env.DEV || !('serviceWorker' in navigator)) {
    // Dev has no service worker (registerSW is a no-op that never calls back);
    // neither do older browsers. Nothing to check — settle straight away.
    markUpdateSettled()
  } else {
    registerSW({
      immediate: true,
      onRegisteredSW(_swUrl, reg) {
        if (!reg) { markUpdateSettled(); return }
        swRegistration = reg
        setProgress(30)
        void applyNewestThenSettle(reg)
        setInterval(() => { void reg.update() }, RECHECK_INTERVAL_MS)
      },
      onRegisterError(err) {
        // Non-blocking: the app runs fine without a service worker (no offline
        // cache, no auto-update). Log and carry on — no UI.
        console.warn('[pwa] service worker registration failed', err)
        markUpdateSettled()
      },
    })
  }

  // The build-info "↻" button calls this instead of a bare location.reload().
  // A plain reload just re-serves the cached build, so a fresh deploy only
  // showed up after the hourly re-check or a cold launch. Here we ask the
  // service worker to check *now*, wait for the new worker to take control,
  // and then reload ourselves.
  //
  // We deliberately do NOT hand the reload off to vite-plugin-pwa's own
  // `activated` handler: workbox-window drops its `updatefound` listener after
  // the first update it considers "external" (anything more than 60s after
  // registration — i.e. every press of this button), so from the second press
  // on in one page lifetime that handler never fires and nothing would reload.
  // Reloading here unconditionally is safe: if the plugin does reload too, the
  // page is being torn down either way.
  window.__applyUpdate = async () => {
    const reg = swRegistration
    if (!reg) { window.location.reload(); return }
    try { await reg.update() } catch { /* offline — fall through to a plain reload */ }

    if (reg.installing || reg.waiting) {
      nudgeWaiting(reg)
      await waitForControllerChange(HANDOVER_WAIT_MS)
    }
    window.location.reload()
  }
}
