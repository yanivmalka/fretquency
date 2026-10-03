// ── ScaleTermHint — a tappable ⓘ beside a Scales word ─────────────────────
//
// Wishlist "Update 2026-10-03" item 1: a beginner who doesn't know what
// "box", "root", "degree", a string number or "fret" means gets one plain
// sentence in place (`scaleTerms.ts`). The host owns which term is open
// (one at a time per screen) so it can pass `termHighlight(active)` to its
// neck board, which lights up the thing the sentence talks about.
//
// - `ScaleTermHint` — the bare ⓘ, for a word already on screen ("Box 1").
// - `ScaleTermNote` — the open term's sentence, placed by the host.
// - `ScaleTermStrip` — a row of word chips + the sentence, under a board.

import { SCALE_TERMS, type ScaleTermId } from '../learning/scaleTerms';
import { useTranslation } from '../i18n/useTranslation';
import { playClickSound, haptic } from '../utils/feedback';

interface HintProps {
  term: ScaleTermId;
  active: ScaleTermId | null;
  onToggle: (term: ScaleTermId | null) => void;
}

export default function ScaleTermHint({ term, active, onToggle }: HintProps) {
  const { t } = useTranslation();
  const open = active === term;
  return (
    <button
      type="button"
      className={`scale-term-hint${open ? ' scale-term-hint-open' : ''}`}
      aria-label={`${t(SCALE_TERMS[term].labelKey)} — ${t('What does this word mean?')}`}
      title={t('What does this word mean?')}
      aria-expanded={open}
      onClick={() => { playClickSound(); haptic.tap(); onToggle(open ? null : term); }}
    >
      i
    </button>
  );
}

export function ScaleTermNote({ term }: { term: ScaleTermId | null }) {
  const { t } = useTranslation();
  if (!term) return null;
  return (
    <p className="scale-term-note" role="status" aria-live="polite">
      <strong>{t(SCALE_TERMS[term].labelKey)}</strong>{' — '}{t(SCALE_TERMS[term].sentenceKey)}
    </p>
  );
}

interface StripProps {
  terms: readonly ScaleTermId[];
  active: ScaleTermId | null;
  onToggle: (term: ScaleTermId | null) => void;
}

export function ScaleTermStrip({ terms, active, onToggle }: StripProps) {
  const { t } = useTranslation();
  return (
    <div className="scale-term-strip">
      <div className="scale-term-chips" role="group" aria-label={t('What the words mean')}>
        {terms.map((term) => {
          const open = active === term;
          return (
            <button
              key={term}
              type="button"
              className={`scale-term-chip${open ? ' scale-term-chip-open' : ''}`}
              aria-expanded={open}
              onClick={() => { playClickSound(); haptic.tap(); onToggle(open ? null : term); }}
            >
              {t(SCALE_TERMS[term].labelKey)}
              <span className="scale-term-chip-i" aria-hidden="true">i</span>
            </button>
          );
        })}
      </div>
      <ScaleTermNote term={active} />
    </div>
  );
}
