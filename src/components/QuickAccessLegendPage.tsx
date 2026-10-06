import { Chevron } from './Chevron';
import { withClick as click } from '../utils/withClick';
import QuickAccessGlyph from './QuickAccessGlyph';
import { QUICK_ACCESS_ITEMS, type QuickAccessId } from '../utils/quickAccess';
import { SOUND_LEVEL_COUNT, soundLevelLabel } from '../utils/feedback';

/** One glyph + the caption explaining what it means, for one state of a
 *  pinnable setting. */
interface LegendState {
  value: unknown;
  caption: string;
}

function statesFor(id: QuickAccessId, t: (s: string) => string, guitarSupported: boolean): LegendState[] {
  switch (id) {
    case 'notation':
      return [
        { value: 'alpha', caption: t('Letters (A B C)') },
        { value: 'solfege', caption: t('Solfège (Do Re Mi)') },
        { value: 'german', caption: t('German letters (A H C)') },
      ];
    case 'accidental':
      return [
        { value: 'sharps', caption: t('Sharps (♯)') },
        { value: 'flats', caption: t('Flats (♭)') },
      ];
    case 'showScore':
      return [
        { value: true, caption: t('On') },
        { value: false, caption: t('Off') },
      ];
    case 'soundLevel':
      return Array.from({ length: SOUND_LEVEL_COUNT }, (_, n) => ({
        value: n,
        caption: soundLevelLabel(n, t),
      }));
    case 'answerMode':
      return [
        { value: 'tap', caption: t('Tap') },
        { value: 'voice', caption: t('Voice') },
        // Only where the device can listen for a played note.
        ...(guitarSupported ? [{ value: 'guitar', caption: t('Guitar') }] : []),
      ];
    case 'showMastery':
      return [
        { value: true, caption: t('On') },
        { value: false, caption: t('Off') },
      ];
    default:
      return [];
  }
}

/**
 * The read-only "what does each icon mean" page for Quick Access. Reached
 * from a link under the "Quick access" enable row in Settings — not from the
 * widget itself. Lists all six pinnable settings, each with every glyph
 * `QuickAccessGlyph` can draw for it and a caption for what that glyph means;
 * tapping a pinned shortcut on the home-screen widget cycles through these in
 * order.
 */
export default function QuickAccessLegendPage({
  t, lang, onBack, guitarSupported,
}: {
  t: (s: string) => string;
  lang: string;
  onBack: () => void;
  guitarSupported: boolean;
}) {
  return (
    <div className="app settings-page">
      <div className="sp2 settings-page-inner" dir={lang === 'he' ? 'rtl' : undefined}>
        <div className="sp2-head settings-page-head">
          <button className="sp2-back" onClick={click(onBack)}>
            <Chevron dir="back" /> {t('Back')}
          </button>
        </div>
        <header className="settings-page-hero">
          <span className="settings-page-emoji" aria-hidden="true">📌</span>
          <h2 className="settings-page-name">{t('Quick access symbol legend')}</h2>
        </header>
        <div className="settings-page-body">
          <p className="set-card-help qa-manage-intro">
            {t('What each icon on the Quick Access widget means. Tapping a pinned shortcut cycles through these states in order.')}
          </p>
          <ul className="qa-legend-list">
            {QUICK_ACCESS_ITEMS.map((item) => (
              <li key={item.id} className="qa-legend-row">
                <div className="qa-legend-label">{t(item.label)}</div>
                <div className="qa-legend-states">
                  {statesFor(item.id, t, guitarSupported).map((s, i) => (
                    <div key={i} className="qa-legend-state">
                      <span className="qa-legend-glyph" aria-hidden="true">
                        <QuickAccessGlyph id={item.id} value={s.value} />
                      </span>
                      <span className="qa-legend-caption">{s.caption}</span>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
