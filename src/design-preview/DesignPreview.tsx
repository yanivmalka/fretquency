import { useEffect, useRef, useState, type ReactNode } from 'react';
import NoteCircle from '../components/NoteCircle';
import FretGrid from '../components/FretGrid';
import SelectorPanel from '../components/SelectorPanel';
import type { SelectorState } from '../hooks/useSelector';
import { INSTRUMENTS } from '../utils/instruments';
import { getCofNotes } from '../utils/music';

type Theme = 'dark' | 'light';
type Dir = 'ltr' | 'rtl';

function Phone({
  title, tag, theme, dir, children, badge,
}: { title: string; tag?: string; theme: Theme; dir: Dir; children: ReactNode; badge?: string }) {
  return (
    <div className="dp-phone-wrap">
      <div className="dp-phone-title">{title}{badge && <span className="dp-legend"> — {badge}</span>}</div>
      <div className="dp-phone" data-theme={theme} dir={dir}>
        <div className="dp-phone-notch" />
        <div className="dp-phone-screen" data-theme={theme}>
          {children}
        </div>
      </div>
      {tag && <div className="dp-phone-tag">{tag}</div>}
    </div>
  );
}

function TopBurger({ dir }: { dir: Dir }) {
  return (
    <div className="dp-topline">
      <div className="dp-app-title">🎸 Fretquency</div>
      <div className="dp-burger">{dir === 'rtl' ? '☰' : '☰'}</div>
    </div>
  );
}

// NoteCircle renders at a fixed 340px. Inside a phone mockup there isn't
// always 340px to give it, so this measures the space actually available
// (whatever's left after the rest of the screen lays out) and scales the
// circle down uniformly — never up — to the largest size that fits both
// axes with a small margin, keeping it fully visible and centered instead
// of cropped.
function ResponsiveNoteCircle(props: React.ComponentProps<typeof NoteCircle>) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const NATIVE_SIZE = 340;
    const MARGIN = 0.94; // small intentional margin on both sides
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      setScale(Math.min(1, (Math.min(width, height) / NATIVE_SIZE) * MARGIN));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="dp-notecircle-wrap dp-notecircle-wrap--responsive" ref={wrapRef}>
      <div className="dp-notecircle-scale" style={{ transform: `scale(${scale})` }}>
        <NoteCircle {...props} />
      </div>
    </div>
  );
}

export default function DesignPreview() {
  const [globalTheme, setGlobalTheme] = useState<Theme>('dark');
  const [globalDir, setGlobalDir] = useState<Dir>('ltr');

  const cofList = getCofNotes('sharps', 'fifths', false);
  const activeNotes = new Set(cofList);

  // Live SelectorPanel demo state — the real production component, driven by a
  // local copy of its SelectorState so the fret-range neck, Circle Order chips
  // and Auto Advance toggle behave exactly as they do in the app.
  const [selDemo, setSelDemo] = useState<SelectorState>({
    selectedStrings: [4],
    multiMode: false,
    mode: 'byFret',
    lowerActive: true,
    upperActive: false,
    useFretRange: false,
    fretLo: 0,
    fretHi: 21,
    difficulty: 'dots',
    autoAdvance: false,
  });
  const [selOrder, setSelOrder] = useState<'fifths' | 'alphabet'>('fifths');
  const [selByString, setSelByString] = useState(false);

  const nav = [
    ['tokens', 'Foundations'],
    ['buttons', 'Buttons'],
    ['selectors', 'Selectors'],
    ['stage', 'Stage Nav'],
    ['guitar', 'NoteCircle / FretGrid'],
    ['gameplay', 'Gameplay'],
    ['results', 'Results & Stats'],
    ['overlays', 'Overlays'],
    ['states', 'States'],
    ['themes', 'Theme × Direction'],
  ] as const;

  return (
    <div className="dp-root" data-theme={globalTheme} dir={globalDir}>
      <div className="dp-topbar">
        <div className="dp-brand">
          <span className="dp-brand-title">🎸 Fretquency</span>
          <span className="dp-brand-sub">Design System Playground</span>
        </div>
        <div className="dp-controls">
          <div className="dp-toggle-group">
            <button className={`dp-toggle-btn ${globalTheme === 'dark' ? 'active' : ''}`} onClick={() => setGlobalTheme('dark')}>Dark</button>
            <button className={`dp-toggle-btn ${globalTheme === 'light' ? 'active' : ''}`} onClick={() => setGlobalTheme('light')}>Light</button>
          </div>
          <div className="dp-toggle-group">
            <button className={`dp-toggle-btn ${globalDir === 'ltr' ? 'active' : ''}`} onClick={() => setGlobalDir('ltr')}>LTR</button>
            <button className={`dp-toggle-btn ${globalDir === 'rtl' ? 'active' : ''}`} onClick={() => setGlobalDir('rtl')}>RTL</button>
          </div>
        </div>
      </div>

      <div className="dp-nav">
        {nav.map(([id, label]) => (
          <a key={id} className="dp-nav-link" href={`#${id}`}>{label}</a>
        ))}
      </div>

      {/* ── Foundations ─────────────────────────────────────── */}
      <section id="tokens" className="dp-section">
        <div className="dp-section-head">
          <h2 className="dp-section-title">Foundations</h2>
          <p className="dp-section-desc">Dark is the primary surface: deep indigo backgrounds, cyan as the single interactive accent, gold reserved for score/success, amber for warnings and streak heat. Light mode remaps the same roles onto a calmer, higher-contrast palette rather than inverting pixel-for-pixel.</p>
        </div>

        <div className="dp-card" style={{ marginBottom: 16 }}>
          <div className="dp-card-label">Color roles</div>
          <div className="dp-swatch-row">
            {[
              ['bg-0', 'var(--bg-0)'], ['bg-1', 'var(--bg-1)'], ['bg-2', 'var(--bg-2)'], ['bg-3', 'var(--bg-3)'],
              ['accent (cyan)', 'var(--accent)'], ['gold (score)', 'var(--gold)'], ['amber (streak/warn)', 'var(--amber)'],
              ['success', 'var(--success)'], ['danger', 'var(--danger)'], ['text-0', 'var(--text-0)'], ['text-2', 'var(--text-2)'],
            ].map(([name, val]) => (
              <div className="dp-swatch" key={name}>
                <div className="dp-swatch-chip" style={{ background: val }} />
                <div className="dp-swatch-name">{name}</div>
                <div className="dp-swatch-val">{val}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="dp-gallery">
          <div className="dp-card" style={{ width: 320 }}>
            <div className="dp-card-label">Typography</div>
            <div className="dp-type-row"><span className="dp-type-meta">display / 64</span><span style={{ fontSize: 40, fontWeight: 800 }}>12</span></div>
            <div className="dp-type-row"><span className="dp-type-meta">2xl / 40 · score</span><span style={{ fontSize: 28, fontWeight: 900, color: 'var(--gold)' }}>1,240</span></div>
            <div className="dp-type-row"><span className="dp-type-meta">xl / 28 · section</span><span style={{ fontSize: 20, fontWeight: 800 }}>Stage 3</span></div>
            <div className="dp-type-row"><span className="dp-type-meta">md / 15 · body</span><span style={{ fontSize: 15 }}>String 3 · G</span></div>
            <div className="dp-type-row"><span className="dp-type-meta">sm / 13 · label</span><span style={{ fontSize: 13, color: 'var(--text-2)' }}>Accuracy 82%</span></div>
            <div className="dp-type-row"><span className="dp-type-meta">xs / 11 · meta</span><span style={{ fontSize: 11, color: 'var(--text-3)' }}>QUESTIONS · 12/20</span></div>
          </div>

          <div className="dp-card" style={{ width: 220 }}>
            <div className="dp-card-label">Spacing scale</div>
            {[4, 8, 12, 16, 20, 28, 36].map(px => (
              <div className="dp-space-row" key={px}>
                <span className="dp-space-label">{px}px</span>
                <span className="dp-space-bar" style={{ width: px * 2 }} />
              </div>
            ))}
          </div>

          <div className="dp-card">
            <div className="dp-card-label">Radius</div>
            <div className="dp-radius-row">
              {[['xs 6', 6], ['sm 10', 10], ['md 14', 14], ['lg 20', 20], ['pill', 999]].map(([n, r]) => (
                <div className="dp-radius-item" key={n as string}>
                  <div className="dp-radius-box" style={{ borderRadius: r as number }} />
                  <span className="dp-swatch-val">{n}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dp-card">
            <div className="dp-card-label">Glow / shadow</div>
            <div className="dp-radius-row">
              <div className="dp-glow-item"><div className="dp-glow-box" style={{ boxShadow: 'var(--glow-cyan)' }} /><span className="dp-swatch-val">glow-cyan</span></div>
              <div className="dp-glow-item"><div className="dp-glow-box" style={{ borderColor: 'var(--gold)', boxShadow: 'var(--glow-gold)' }} /><span className="dp-swatch-val">glow-gold</span></div>
              <div className="dp-glow-item"><div className="dp-glow-box" style={{ borderColor: 'var(--amber)', boxShadow: 'var(--glow-amber)' }} /><span className="dp-swatch-val">glow-amber</span></div>
            </div>
          </div>

          <div className="dp-card">
            <div className="dp-card-label">Motion</div>
            <div className="dp-motion-row">
              <div className="dp-motion-chip"><div className="dp-motion-preview pulse" />radial pulse<br />correct answer</div>
              <div className="dp-motion-chip"><div className="dp-motion-preview pop" />pop / press<br />icon buttons</div>
              <div className="dp-motion-chip"><div className="dp-motion-preview glow" />glow fade<br />note played</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Buttons ──────────────────────────────────────────── */}
      <section id="buttons" className="dp-section">
        <div className="dp-section-head">
          <h2 className="dp-section-title">Buttons &amp; icon buttons</h2>
          <p className="dp-section-desc">Circular icon buttons for the transport controls (play → pause / stop). Minimum touch target is 44px; the real app renders them at 56px. Pill chips cover string picks, Circle Order and the stats filters. Gold and danger variants below are design-lab treatments, not current production states.</p>
        </div>
        <div className="dp-card">
          <div className="dp-btn-row">
            <button className="dp-icon-btn filled" title="Start"><svg viewBox="0 0 24 24" width="22" height="22"><polygon points="6,4 20,12 6,20" fill="currentColor" /></svg></button>
            <button className="dp-icon-btn" title="Pause"><svg viewBox="0 0 24 24" width="22" height="22"><rect x="5" y="4" width="4" height="16" fill="currentColor" /><rect x="15" y="4" width="4" height="16" fill="currentColor" /></svg></button>
            <button className="dp-icon-btn" title="Stop"><svg viewBox="0 0 24 24" width="22" height="22"><rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" /></svg></button>
            <button className="dp-icon-btn gold"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 2l2.6 6.6L21 10l-5 4.3L17.5 22 12 18.2 6.5 22 8 14.3 3 10l6.4-1.4z" fill="currentColor" /></svg></button>
            <button className="dp-icon-btn danger sm">✕</button>
            <button className="dp-pill-btn active">E</button>
            <button className="dp-pill-btn">A</button>
            <button className="dp-pill-btn outline-active">Multi</button>
            <button className="dp-pill-btn disabled">Locked</button>
            <button className="dp-pill-btn danger">Clear History ✕</button>
          </div>
        </div>
      </section>

      {/* ── Selectors ────────────────────────────────────────── */}
      <section id="selectors" className="dp-section">
        <div className="dp-section-head">
          <h2 className="dp-section-title">String / mode / difficulty selectors</h2>
          <p className="dp-section-desc">The production selection patterns — string pills + Multi, the Note by Fret / Fret by Note mode cards, the Circle Order chips (Alpha / Fifths / By String), the fret-range neck, and the Dots → Naturals → Full difficulty road with the Auto Advance toggle — rebuilt on tokens so they theme and mirror automatically. The live SelectorPanel below is the real component.</p>
        </div>
        <div className="dp-gallery">
          <div className="dp-card" style={{ width: 300 }}>
            <div className="dp-card-label">Strings</div>
            <div className="dp-string-pills">
              {['E','A','D','G','B','E'].map((s,i) => <span key={i} className={`dp-string-pill ${i===3?'active':''}`}>{s}</span>)}
              <span className="dp-string-pill">Multi</span>
            </div>
          </div>
          <div className="dp-card" style={{ width: 260 }}>
            <div className="dp-card-label">Mode</div>
            <div className="dp-mode-cards">
              <div className="dp-mode-card active">🎯<span>Note by Fret</span></div>
              <div className="dp-mode-card">🎵<span>Fret by Note</span></div>
            </div>
          </div>
          <div className="dp-card" style={{ width: 260 }}>
            <div className="dp-card-label">Circle Order</div>
            <div className="dp-order-col">
              <span className="dp-order-chip dp-order-chip-active">Alpha</span>
              <span className="dp-order-chip">Fifths</span>
              <span className="dp-order-chip dp-order-chip-toggle">By String</span>
            </div>
            <div className="dp-legend">Shown between the mode cards, By fret only</div>
          </div>
          <div className="dp-card" style={{ width: 260 }}>
            <div className="dp-card-label">Difficulty</div>
            <div className="dp-diff-road">
              <div className="dp-diff-btn active"><span>●</span> Dots</div>
              <div className="dp-diff-btn"><span>♮</span> Naturals</div>
              <div className="dp-diff-btn"><span>♯♭</span> Full</div>
            </div>
            <div className="dp-legend">Auto Advance continues Dots → Naturals → Full</div>
          </div>

          <div className="dp-card" style={{ width: 420 }} data-theme={globalTheme} dir={globalDir}>
            <div className="dp-card-label">SelectorPanel — live component</div>
            <SelectorPanel
              selector={selDemo}
              instrument={INSTRUMENTS.guitar}
              onStringSelect={(n) => setSelDemo(s => ({ ...s, selectedStrings: [n], multiMode: false }))}
              onMultiToggle={() => setSelDemo(s => ({ ...s, multiMode: !s.multiMode }))}
              onModeSelect={(m) => setSelDemo(s => ({ ...s, mode: m }))}
              onFretRangeToggle={(half) => setSelDemo(s => half === 'lower'
                ? { ...s, lowerActive: s.upperActive ? !s.lowerActive : true }
                : { ...s, upperActive: s.lowerActive ? !s.upperActive : true })}
              onDifficultySelect={(d) => setSelDemo(s => ({ ...s, difficulty: d }))}
              onAutoAdvanceToggle={() => setSelDemo(s => ({ ...s, autoAdvance: !s.autoAdvance }))}
              isPlaying={false}
              byString={selByString}
              order={selOrder}
              onByStringToggle={() => setSelByString(v => !v)}
              onOrderChange={setSelOrder}
            />
            <div className="dp-legend">String pills · mode cards · Circle Order chips · fret-range neck · difficulty road · Auto Advance</div>
          </div>

          <div className="dp-card" style={{ width: 320 }} data-theme={globalTheme} dir={globalDir}>
            <div className="dp-card-label">selector-panel-mini — during play</div>
            <SelectorPanel
              selector={selDemo}
              instrument={INSTRUMENTS.guitar}
              onStringSelect={() => {}} onMultiToggle={() => {}} onModeSelect={() => {}}
              onFretRangeToggle={() => {}} onDifficultySelect={() => {}}
              isPlaying activeString={selDemo.selectedStrings[0]} activeFret={7}
            />
            <div className="dp-legend">Collapses to one line + a mini neck highlighting the asked string / fret</div>
          </div>
        </div>
      </section>

      {/* ── Stage nav ────────────────────────────────────────── */}
      <section id="stage" className="dp-section">
        <div className="dp-section-head">
          <h2 className="dp-section-title">Stage navigation &amp; progress</h2>
          <p className="dp-section-desc">Chevrons flank a title/dots cluster. In RTL the chevrons and dot order flip via <code>dir</code> so "forward" always reads toward the reading direction.</p>
        </div>
        <div className="dp-gallery">
          {(['ltr','rtl'] as Dir[]).map(dir => (
            <div className="dp-card" key={dir} dir={dir} style={{ width: 300 }}>
              <div className="dp-card-label">{dir.toUpperCase()}</div>
              <div className="dp-stage-nav">
                <button className="dp-stage-chevron">{dir === 'ltr' ? '‹' : '›'}</button>
                <div className="dp-stage-info">
                  <span className="dp-stage-label">Stage 4 of 9</span>
                  <span className="dp-stage-title">Low E · Frets 0–5</span>
                  <div className="dp-stage-dots">
                    {[0,1,2,3,4,5].map(i => <span key={i} className={`dp-stage-dot ${i<3?'done':i===3?'active':''}`} />)}
                  </div>
                </div>
                <button className="dp-stage-chevron">{dir === 'ltr' ? '›' : '‹'}</button>
              </div>
            </div>
          ))}

          <div className="dp-card" style={{ width: 300 }}>
            <div className="dp-card-label">Auto Advance stage transition</div>
            <div className="dp-stage-transition">
              <div className="dp-stage-transition-label">STAGE COMPLETE</div>
              <div className="dp-stage-transition-name">NATURALS</div>
              <div className="dp-stage-transition-progress" dir="ltr">15 → 20 QUESTIONS</div>
            </div>
            <div className="dp-legend">Brief banner between stages of a continuous Auto Advance run — no 3·2·1, score / streak carry over</div>
          </div>
        </div>
      </section>

      {/* ── Guitar widgets ───────────────────────────────────── */}
      <section id="guitar" className="dp-section">
        <div className="dp-section-head">
          <h2 className="dp-section-title">NoteCircle &amp; FretGrid (live components)</h2>
          <p className="dp-section-desc">These are the actual production components, imported unmodified. Their inline/class colors are dark-only in the app itself, so this playground re-points them at the current theme tokens with scoped CSS overrides here (see design-preview.css) rather than editing the shared components.</p>
        </div>
        <div className="dp-gallery">
          <div className="dp-card" style={{ width: 380 }} data-theme={globalTheme}>
            <div className="dp-card-label">NoteCircle — by-fret mode</div>
            <div className="dp-notecircle-wrap" style={{ height: 340 }}>
              <div className="dp-notecircle-scale">
                <NoteCircle
                  notes={cofList}
                  activeNotes={activeNotes}
                  active={true}
                  correctNote={null}
                  wrongNote={null}
                  onSelect={() => {}}
                  guitarString={4}
                  fretDots={{}}
                  noteFrets={{}}
                  byString={false}
                  startIndex={0}
                  showDots={false}
                  accidental="sharps"
                  notation="alpha"
                />
              </div>
            </div>
          </div>
          <div className="dp-card" style={{ width: 300 }} data-theme={globalTheme}>
            <div className="dp-card-label">FretGrid — by-note mode</div>
            <FretGrid
              fretFrom={0} fretTo={7} guitarString={4}
              validFrets={new Set([0,1,2,3,4,5,6,7])}
              active={true}
              correctFrets={[3]}
              wrongFret={5}
              foundFrets={[0]}
              onSelect={() => {}}
            />
          </div>
        </div>
      </section>

      {/* ── Gameplay ─────────────────────────────────────────── */}
      <section id="gameplay" className="dp-section">
        <div className="dp-section-head">
          <h2 className="dp-section-title">Gameplay screens</h2>
          <p className="dp-section-desc">Every gameplay state fits inside one viewport height — no scrolling. Secondary chrome (selectors) collapses to a single mini-line once a round starts; the question, guitar interaction, and score always own the majority of vertical space.</p>
        </div>
        <div className="dp-gallery">
          <Phone title="Countdown" theme={globalTheme} dir={globalDir}>
            <div className="dp-screen">
              <TopBurger dir={globalDir} />
              <div className="dp-question-area" style={{ opacity: 0.25 }}>
                <div className="dp-note-display">7</div>
              </div>
            </div>
            <div className="dp-countdown-overlay"><span className="dp-countdown-num">3</span></div>
          </Phone>

          <Phone title="By fret — question live" theme={globalTheme} dir={globalDir}>
            <div className="dp-screen">
              <TopBurger dir={globalDir} />
              <div className="dp-selector-mini">
                <span className="dp-selector-mini-item">D</span>
                <span className="dp-selector-mini-sep">·</span>
                <span className="dp-selector-mini-item">N→F</span>
                <span className="dp-selector-mini-sep">·</span>
                <span className="dp-selector-mini-item">0-12</span>
                <span className="dp-selector-mini-sep">·</span>
                <span className="dp-selector-mini-item">●</span>
              </div>
              <div className="dp-question-area dp-question-area--compact">
                <div className="dp-string-label">String 4 · D</div>
                <div className="dp-fret-display">7</div>
                <div className="dp-speedbar"><div className="dp-speedbar-fill" style={{ width: '64%' }} /></div>
                <div className="dp-info-row">
                  <span className="dp-timer">4s</span>
                  <span>8/15</span>
                  <span className="dp-mult" style={{ color: 'var(--amber)' }}>🔥 ×1.5</span>
                </div>
                <div className="dp-score-live">860</div>
              </div>
              <ResponsiveNoteCircle notes={cofList} activeNotes={activeNotes} active={true} correctNote={null} wrongNote={null}
                onSelect={() => {}} guitarString={4} fretDots={{}} noteFrets={{}} byString={false} startIndex={0}
                showDots={false} accidental="sharps" notation="alpha" />
              <div className="dp-controls-row dp-controls-row--tight">
                <button className="dp-icon-btn sm"><svg viewBox="0 0 24 24" width="18" height="18"><rect x="5" y="4" width="4" height="16" fill="currentColor" /><rect x="15" y="4" width="4" height="16" fill="currentColor" /></svg></button>
                <button className="dp-icon-btn sm"><svg viewBox="0 0 24 24" width="18" height="18"><rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" /></svg></button>
              </div>
            </div>
          </Phone>

          <Phone title="By note — correct feedback" theme={globalTheme} dir={globalDir}>
            <div className="dp-screen">
              <TopBurger dir={globalDir} />
              <div className="dp-question-area">
                <div className="dp-string-label">String 3 · G</div>
                <div className="dp-note-display">C#</div>
                <div className="dp-speedbar"><div className="dp-speedbar-fill warn" style={{ width: '30%' }} /></div>
                <div className="dp-info-row"><span className="dp-timer">2s</span><span>14/20</span><span className="dp-mult" style={{ color: 'var(--gold)' }}>🔥🔥🔥🔥 ×3</span></div>
                <div className="dp-score-live">1,240</div>
                <div className="dp-feedback good">✓ Correct! +140</div>
              </div>
              <FretGrid fretFrom={0} fretTo={7} guitarString={3} validFrets={new Set([0,1,2,3,4,5,6,7])}
                active={false} correctFrets={[4]} wrongFret={null} foundFrets={[4]} onSelect={() => {}} />
              <div className="dp-controls-row">
                <button className="dp-icon-btn"><svg viewBox="0 0 24 24" width="20" height="20"><rect x="5" y="4" width="4" height="16" fill="currentColor" /><rect x="15" y="4" width="4" height="16" fill="currentColor" /></svg></button>
                <button className="dp-icon-btn"><svg viewBox="0 0 24 24" width="20" height="20"><rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" /></svg></button>
              </div>
            </div>
          </Phone>

          <Phone title="Wrong answer" theme={globalTheme} dir={globalDir}>
            <div className="dp-screen">
              <TopBurger dir={globalDir} />
              <div className="dp-question-area">
                <div className="dp-string-label">String 5 · A</div>
                <div className="dp-note-display">F</div>
                <div className="dp-speedbar"><div className="dp-speedbar-fill danger" style={{ width: '10%' }} /></div>
                <div className="dp-info-row"><span className="dp-timer">1s</span><span>5/20</span></div>
                <div className="dp-score-live">220</div>
                <div className="dp-feedback bad">✗ It was F</div>
              </div>
              <FretGrid fretFrom={0} fretTo={7} guitarString={5} validFrets={new Set([0,1,2,3,4,5,6,7])}
                active={false} correctFrets={[1]} wrongFret={2} foundFrets={[]} onSelect={() => {}} />
              <div className="dp-controls-row">
                <button className="dp-icon-btn"><svg viewBox="0 0 24 24" width="20" height="20"><rect x="5" y="4" width="4" height="16" fill="currentColor" /><rect x="15" y="4" width="4" height="16" fill="currentColor" /></svg></button>
                <button className="dp-icon-btn"><svg viewBox="0 0 24 24" width="20" height="20"><rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" /></svg></button>
              </div>
            </div>
          </Phone>

          <Phone title="Milestone celebration" theme={globalTheme} dir={globalDir}>
            <div className="dp-screen">
              <TopBurger dir={globalDir} />
              <div className="dp-question-area">
                <div className="dp-string-label">String 4 · D</div>
                <div className="dp-note-display">A</div>
                <div className="dp-speedbar"><div className="dp-speedbar-fill" style={{ width: '80%' }} /></div>
                <div className="dp-info-row"><span className="dp-timer">6s</span><span>10/20</span><span className="dp-mult" style={{ color: 'var(--gold)' }}>🔥🔥🔥 ×2.5</span></div>
                <div className="dp-score-live">1,000<span className="dp-score-float">+100</span></div>
                <div className="dp-feedback good">✓ Correct! +100</div>
              </div>
              <div className="dp-milestone-banner">10 STREAK!</div>
              <div className="dp-controls-row">
                <button className="dp-icon-btn"><svg viewBox="0 0 24 24" width="20" height="20"><rect x="5" y="4" width="4" height="16" fill="currentColor" /><rect x="15" y="4" width="4" height="16" fill="currentColor" /></svg></button>
              </div>
            </div>
          </Phone>

          <Phone title="Paused" theme={globalTheme} dir={globalDir}>
            <div className="dp-screen">
              <TopBurger dir={globalDir} />
              <div className="dp-selector-mini" style={{ opacity: 0.4 }}>
                <span className="dp-selector-mini-item">D</span>
                <span className="dp-selector-mini-sep">·</span>
                <span className="dp-selector-mini-item">N→F</span>
                <span className="dp-selector-mini-sep">·</span>
                <span className="dp-selector-mini-item">0-12</span>
              </div>
              <div className="dp-question-area dp-question-area--compact" style={{ opacity: 0.4 }}>
                <div className="dp-string-label">String 4 · D</div>
                <div className="dp-fret-display">7</div>
                <div className="dp-speedbar"><div className="dp-speedbar-fill" style={{ width: '46%' }} /></div>
                <div className="dp-info-row"><span className="dp-timer">3s</span><span>8/15</span></div>
                <div className="dp-score-live">860</div>
              </div>
              <div className="dp-pause-dim" />
              <div className="dp-controls-row" style={{ position: 'relative', zIndex: 2 }}>
                <button className="dp-icon-btn"><svg viewBox="0 0 24 24" width="20" height="20"><polygon points="6,4 20,12 6,20" fill="currentColor" /></svg></button>
                <button className="dp-icon-btn"><svg viewBox="0 0 24 24" width="20" height="20"><rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" /></svg></button>
              </div>
            </div>
          </Phone>
        </div>
      </section>

      {/* ── Results & stats ──────────────────────────────────── */}
      <section id="results" className="dp-section">
        <div className="dp-section-head">
          <h2 className="dp-section-title">Results &amp; statistics</h2>
          <p className="dp-section-desc">The end-of-round summary and the stats panel are separate states swapped in the same slot the game board occupies — never stacked below it, so both stay scroll-free.</p>
        </div>
        <div className="dp-gallery">
          <Phone title="Round complete" theme={globalTheme} dir={globalDir}>
            <div className="dp-screen" style={{ justifyContent: 'center', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--gold)' }}>🎉 Round Complete!</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--gold)', textShadow: 'var(--glow-gold)', fontFamily: 'Georgia, serif' }}>1,860 pts</div>
              <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-2)' }}>
                <span>🔥 12 streak</span><span>✓ 18/20</span>
              </div>
              <button className="dp-pill-btn active" style={{ marginTop: 6 }}>OK</button>
            </div>
          </Phone>

          <Phone title="Stats panel — Score" theme={globalTheme} dir={globalDir}>
            <div className="dp-screen">
              <TopBurger dir={globalDir} />
              <div className="dp-stats-tabs">
                <span className="dp-stats-tab active">Score</span>
                <span className="dp-stats-tab">Details</span>
              </div>
              <div className="dp-stats-header-row">
                <span className="dp-stats-score">82% <span className="dp-stats-score-detail">(18/22)</span></span>
                <span className="dp-stats-clear">Clear History ✕</span>
              </div>
              <div className="dp-encouragement">🔥 Amazing!</div>
              <div className="dp-score-summary">
                <div className="dp-score-summary-line"><span>Score</span><span className="dp-score-summary-gold">1860</span></div>
                <div className="dp-score-summary-line"><span>Best Streak</span><span>🔥 12</span></div>
                <div className="dp-score-summary-line"><span>Avg Speed</span><span>⚡ 2.4s</span></div>
                <div className="dp-score-summary-line"><span>Best Speed</span><span>🏆 1.1s</span></div>
              </div>
              <div className="dp-score-best">🏆 NEW PERSONAL BEST!</div>
            </div>
          </Phone>

          <Phone title="Stats panel — Details" theme={globalTheme} dir={globalDir}>
            <div className="dp-screen">
              <TopBurger dir={globalDir} />
              <div className="dp-stats-tabs">
                <span className="dp-stats-tab">Score</span>
                <span className="dp-stats-tab active">Details</span>
              </div>
              <div className="dp-stats-header-row">
                <span className="dp-stats-score">82% <span className="dp-stats-score-detail">(18/22)</span></span>
                <span className="dp-stats-clear">Clear History ✕</span>
              </div>
              <div className="dp-encouragement">✓18 ✗3 ⏱1</div>
              <div className="dp-stats-tabs">
                <span className="dp-stats-tab">By Note</span>
                <span className="dp-stats-tab active">By String</span>
              </div>
              <div className="dp-filter-row">
                <span className="dp-filter-chip active">All (22)</span>
                <span className="dp-filter-chip">✓ 18</span>
                <span className="dp-filter-chip">✗ 3</span>
                <span className="dp-filter-chip">⏱ 1</span>
              </div>
              <div className="dp-string-bars">
                {([['S6 E',92,'mastered'], ['S5 A',78,'solid'], ['S4 D',65,'solid'], ['S3 G',40,'growing']] as const).map(([l,p,cat]) => (
                  <div className="dp-bar-row" key={l}>
                    <span className="dp-bar-label">{l}</span>
                    <span className="dp-bar-track"><span className={`dp-bar-fill dp-bar-${cat}`} style={{ width: `${p}%` }} /></span>
                    <span className="dp-bar-pct">{p}%</span>
                  </div>
                ))}
              </div>
              <div className="dp-stat-group-title good">🏆 Mastered</div>
              <div className="dp-note-stats">
                {['E','A','B','D'].map(n => (
                  <span className="dp-note-stat-split" key={n}>
                    <span className="dp-note-stat-label">{n}</span>
                    <span className="dp-note-stat-good">✓5</span>
                    <span className="dp-note-stat-bad">✗1</span>
                  </span>
                ))}
              </div>
              <div className="dp-stat-group-title improving">🌱 Growing</div>
              <div className="dp-note-stats">
                <span className="dp-note-stat-split"><span className="dp-note-stat-label">G#</span><span className="dp-note-stat-good">✓1</span><span className="dp-note-stat-bad">✗3</span></span>
              </div>
            </div>
          </Phone>
        </div>
      </section>

      {/* ── Overlays ─────────────────────────────────────────── */}
      <section id="overlays" className="dp-section">
        <div className="dp-section-head">
          <h2 className="dp-section-title">Settings, onboarding &amp; overlays</h2>
          <p className="dp-section-desc">Overlays anchor to the edge nearest the trigger (top-end for the burger menu) and scroll internally only if content exceeds the frame — the frame itself never scrolls.</p>
        </div>
        <div className="dp-gallery">
          <Phone title="Settings overlay" theme={globalTheme} dir={globalDir}>
            <div className="dp-screen">
              <TopBurger dir={globalDir} />
              <div className="dp-question-area" style={{ opacity: 0.3 }}><div className="dp-note-display">4</div></div>
            </div>
            <div className="dp-overlay">
              <div className="dp-overlay-panel">
                <div className="dp-overlay-title">Settings</div>
                <div className="dp-overlay-row"><span>Notation</span><span style={{ color: 'var(--accent)' }}>Alphabet</span></div>
                <div className="dp-overlay-row"><span>Accidentals</span><span style={{ color: 'var(--accent)' }}>Sharps ♯</span></div>
                <div className="dp-overlay-row"><span>Sound effects</span><span style={{ color: 'var(--success)' }}>On</span></div>
                <div className="dp-overlay-row"><span>Haptics</span><span style={{ color: 'var(--success)' }}>On</span></div>
                <button className="dp-pill-btn" style={{ alignSelf: 'center' }}>Close</button>
              </div>
            </div>
          </Phone>

          <Phone title="Stage picker overlay" theme={globalTheme} dir={globalDir}>
            <div className="dp-screen">
              <TopBurger dir={globalDir} />
              <div className="dp-question-area" style={{ opacity: 0.3 }}><div className="dp-note-display">7</div></div>
            </div>
            <div className="dp-overlay" style={{ alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div className="dp-overlay-panel" style={{ maxHeight: '80%' }}>
                <div className="dp-overlay-title" style={{ textAlign: 'center' }}>Choose a stage</div>
                {['Low E · 0–5','Low E · 0–12','A string · 0–5','D string · 0–5'].map((s,i) => (
                  <div key={s} className="dp-overlay-row" style={{ background: i===1?'var(--bg-3)':'transparent', borderRadius: 8, paddingInline: 8 }}>
                    <span>{i<1?'✓':i===1?'▶':'○'} {s}</span>
                  </div>
                ))}
                <button className="dp-pill-btn" style={{ alignSelf: 'center' }}>Close</button>
              </div>
            </div>
          </Phone>

          <Phone title="Onboarding — step 1 of 4" theme={globalTheme} dir={globalDir}>
            <div className="dp-screen" />
            <div className="dp-onboarding">
              <div className="dp-onboard-card">
                <div className="dp-onboard-logo">🎸</div>
                <div className="dp-onboard-title">Fretquency</div>
                <div className="dp-onboard-sub">Master the fretboard with the clock method — one string at a time.</div>
                <div className="dp-onboard-title" style={{ fontSize: 13 }}>What do you play?</div>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="dp-onboard-btn selected">🎸 Guitar</div>
                  <div className="dp-onboard-btn" style={{ opacity: 0.5 }}>🎵 Bass <span className="dp-legend" style={{ margin: 0 }}>soon</span></div>
                </div>
                <div className="dp-legend">Skip setup →</div>
              </div>
            </div>
          </Phone>

          <Phone title="Onboarding — placement test" theme={globalTheme} dir={globalDir}>
            <div className="dp-screen" />
            <div className="dp-onboarding">
              <div className="dp-onboard-card">
                <div className="dp-legend" style={{ margin: 0 }}>2 / 3</div>
                <div className="dp-onboard-title" style={{ fontSize: 13 }}>String 6 — what note is fret <strong>12</strong>?</div>
                <div className="dp-onboard-note-grid">
                  {['E','F','F#','G','G#','A','A#','B','C','C#','D','D#'].map(n => (
                    <span key={n} className={`dp-onboard-note-btn${n === 'E' ? ' correct' : ''}`}>{n}</span>
                  ))}
                </div>
                <div className="dp-legend">Skip test →</div>
              </div>
            </div>
          </Phone>
        </div>
      </section>

      {/* ── States ───────────────────────────────────────────── */}
      <section id="states" className="dp-section">
        <div className="dp-section-head">
          <h2 className="dp-section-title">Loading, empty, error &amp; disabled states</h2>
          <p className="dp-section-desc">These states reuse the same layout slot as gameplay/stats so navigating between them never shifts or grows the page.</p>
        </div>
        <div className="dp-gallery">
          <Phone title="Loading samples" theme={globalTheme} dir={globalDir}>
            <div className="dp-screen">
              <TopBurger dir={globalDir} />
              <div className="dp-question-area">
                <div className="dp-motion-preview pulse" style={{ width: 48, height: 48 }} />
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 8 }}>Tuning up…</div>
              </div>
            </div>
          </Phone>

          <Phone title="Empty history" theme={globalTheme} dir={globalDir}>
            <div className="dp-screen">
              <TopBurger dir={globalDir} />
              <div className="dp-empty">
                <div className="dp-empty-icon">📊</div>
                <div className="dp-empty-text">No rounds yet</div>
                <div className="dp-empty-hint">Finish a round to see stats here</div>
              </div>
            </div>
          </Phone>

          <Phone title="Audio error" theme={globalTheme} dir={globalDir}>
            <div className="dp-screen">
              <TopBurger dir={globalDir} />
              <div className="dp-question-area">
                <div className="dp-error-banner">⚠ Couldn't load guitar sounds. Check your connection.</div>
                <button className="dp-pill-btn active" style={{ marginTop: 10 }}>Retry</button>
              </div>
            </div>
          </Phone>

          <Phone title="Locked / disabled selection" theme={globalTheme} dir={globalDir}>
            <div className="dp-screen">
              <TopBurger dir={globalDir} />
              <div className="dp-mode-cards">
                <div className="dp-mode-card active">🎯<span>Note by Fret</span></div>
                <div className="dp-mode-card" style={{ opacity: 0.35 }}>🔒<span>Fret by Note</span></div>
              </div>
              <div className="dp-diff-road" style={{ marginTop: 8 }}>
                <div className="dp-diff-btn active"><span>●</span> Dots</div>
                <div className="dp-diff-btn" style={{ opacity: 0.35 }}><span>♮</span> Naturals</div>
                <div className="dp-diff-btn" style={{ opacity: 0.35 }}><span>♯♭</span> Full</div>
              </div>
              <div className="dp-legend">Disabled-state treatment — a design-lab exploration; difficulties are not gated in the app</div>
            </div>
          </Phone>
        </div>
      </section>

      {/* ── Theme × direction matrix ─────────────────────────── */}
      <section id="themes" className="dp-section">
        <div className="dp-section-head">
          <h2 className="dp-section-title">Theme × direction matrix</h2>
          <p className="dp-section-desc">The same gameplay screen in all four combinations, independent of the global toggle above, so light/dark and LTR/RTL can be compared side by side.</p>
        </div>
        <div className="dp-gallery">
          {(['dark','light'] as Theme[]).flatMap(theme => (['ltr','rtl'] as Dir[]).map(dir => (
            <Phone key={`${theme}-${dir}`} title={`${theme} · ${dir.toUpperCase()}`} theme={theme} dir={dir}>
              <div className="dp-screen">
                <TopBurger dir={dir} />
                <div className="dp-selector-mini">
                  <span className="dp-selector-mini-item">G</span>
                  <span className="dp-selector-mini-sep">·</span>
                  <span className="dp-selector-mini-item">N→F</span>
                  <span className="dp-selector-mini-sep">·</span>
                  <span className="dp-selector-mini-item">0-12</span>
                  <span className="dp-selector-mini-sep">·</span>
                  <span className="dp-selector-mini-item">♮</span>
                </div>
                <div className="dp-question-area dp-question-area--compact">
                  <div className="dp-string-label">String 3 · G</div>
                  <div className="dp-fret-display">9</div>
                  <div className="dp-speedbar"><div className="dp-speedbar-fill" style={{ width: '55%' }} /></div>
                  <div className="dp-info-row"><span className="dp-timer">5s</span><span>9/20</span><span className="dp-mult" style={{ color: 'var(--amber)' }}>🔥 ×1.5</span></div>
                  <div className="dp-score-live">640</div>
                </div>
                <ResponsiveNoteCircle notes={dir === 'rtl' ? [...cofList].reverse() : cofList} activeNotes={activeNotes} active={true}
                  correctNote={null} wrongNote={null} onSelect={() => {}} guitarString={3} fretDots={{}} noteFrets={{}}
                  byString={false} startIndex={0} showDots={false} accidental="sharps" notation="alpha" />
                <div className="dp-controls-row dp-controls-row--tight">
                  <button className="dp-icon-btn sm"><svg viewBox="0 0 24 24" width="16" height="16"><rect x="5" y="4" width="4" height="16" fill="currentColor" /><rect x="15" y="4" width="4" height="16" fill="currentColor" /></svg></button>
                  <button className="dp-icon-btn sm"><svg viewBox="0 0 24 24" width="16" height="16"><rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" /></svg></button>
                </div>
              </div>
            </Phone>
          )))}
        </div>
      </section>
    </div>
  );
}
