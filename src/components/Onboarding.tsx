import { useState } from 'react';
import { saveSetting } from '../utils/settings';
import type { Difficulty } from '../hooks/useSelector';
import { useTranslation } from '../i18n/useTranslation';
import { withAccidentalGlyphs } from '../utils/music';

interface Props {
  onDone: () => void;
  /** Persist the player's instrument pick made on the first screen. */
  onInstrument?: (id: 'guitar' | 'bass') => void;
  /**
   * Apply the difficulty the placement flow lands on (self-reported level or
   * 3-question test score) to the live Selector settings. Skipping the flow
   * leaves the current difficulty untouched.
   */
  onPlacement?: (difficulty: Difficulty) => void;
}

// Quick placement questions: string 6, by fret, dots only
const PLACEMENT_QUESTIONS: { fret: number; answer: string }[] = [
  { fret: 5,  answer: 'A'  },
  { fret: 12, answer: 'E'  },
  { fret: 3,  answer: 'G'  },
];

type Step = 'instrument' | 'level' | 'test' | 'result';

const NOTE_OPTIONS = ['E','F','F#','G','G#','A','A#','B','C','C#','D','D#'];

// Map a placement outcome (0-3 correct, or a self-reported level) to a
// starting difficulty on the Selector's dots -> naturals -> full axis.
function scoreToDifficulty(score: number): Difficulty {
  if (score >= 3) return 'full';
  if (score >= 2) return 'naturals';
  return 'dots';
}

export default function Onboarding({ onDone, onInstrument, onPlacement }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('instrument');
  const [instrument, setInstrument] = useState<'guitar' | 'bass'>('guitar');
  const [testIdx, setTestIdx]     = useState(0);
  const [correct, setCorrect]     = useState(0);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);

  const testString = instrument === 'bass' ? 4 : 6;

  const pickInstrument = (id: 'guitar' | 'bass') => {
    setInstrument(id);
    onInstrument?.(id);
    setStep('level');
  };

  const finish = () => {
    saveSetting('onboardingDone', true);
    onDone();
  };

  // Apply a placement result, then close onboarding.
  const finishWithDifficulty = (difficulty: Difficulty) => {
    onPlacement?.(difficulty);
    finish();
  };

  const handleTestAnswer = (answer: string) => {
    const q = PLACEMENT_QUESTIONS[testIdx];
    const isCorrect = answer === q.answer;
    if (isCorrect) setCorrect(c => c + 1);
    setShowFeedback(isCorrect ? 'correct' : 'wrong');
    setTimeout(() => {
      setShowFeedback(null);
      if (testIdx + 1 < PLACEMENT_QUESTIONS.length) {
        setTestIdx(i => i + 1);
      } else {
        setStep('result');
      }
    }, 700);
  };

  if (step === 'instrument') return (
    <div className="onboarding">
      <div className="onboarding-card">
        <div className="onboarding-logo">🎸</div>
        <h2 className="onboarding-title">{t('Fretquency')}</h2>
        <p className="onboarding-sub">{t('Master the fretboard with the clock method — one string at a time.')}</p>
        <p className="onboarding-question">{t('What do you play?')}</p>
        <div className="onboarding-options">
          <button className="onboarding-btn" onClick={() => pickInstrument('guitar')}>
            🎸 {t('Guitar')}
          </button>
          <button className="onboarding-btn" onClick={() => pickInstrument('bass')}>
            🎵 {t('Bass')}
          </button>
        </div>
        <button className="onboarding-skip" onClick={finish}>{t('Skip setup →')}</button>
      </div>
    </div>
  );

  if (step === 'level') return (
    <div className="onboarding">
      <div className="onboarding-card">
        <div className="onboarding-logo">🎸</div>
        <p className="onboarding-question">{t('How well do you know the fretboard?')}</p>
        <div className="onboarding-options">
          <button className="onboarding-btn" onClick={() => finishWithDifficulty('dots')}>
            🌱 {t("I'm just starting")}
            <span className="onboarding-hint">{t('Start with dot frets on String 6')}</span>
          </button>
          <button className="onboarding-btn" onClick={() => setStep('test')}>
            🎯 {t('I play but want to improve')}
            <span className="onboarding-hint">{t('Quick 3-question test')}</span>
          </button>
          <button className="onboarding-btn" onClick={() => finishWithDifficulty('full')}>
            🏆 {t('I know the full neck')}
            <span className="onboarding-hint">{t('Jump right in')}</span>
          </button>
        </div>
        <button className="onboarding-skip" onClick={finish}>{t('Skip →')}</button>
      </div>
    </div>
  );

  if (step === 'test') {
    const q = PLACEMENT_QUESTIONS[testIdx];
    return (
      <div className="onboarding">
        <div className="onboarding-card">
          <p className="onboarding-progress">{testIdx + 1} / {PLACEMENT_QUESTIONS.length}</p>
          <p className="onboarding-question">{t('String')} {testString} — {t('what note is fret')} <strong>{q.fret}</strong>?</p>
          <div className="onboarding-note-grid">
            {NOTE_OPTIONS.map(n => (
              <button
                key={n}
                className={`onboarding-note-btn ${
                  showFeedback && n === q.answer ? 'onboarding-note-correct' :
                  showFeedback === 'wrong' && n === PLACEMENT_QUESTIONS[testIdx]?.answer ? '' : ''
                }`}
                onClick={() => { if (!showFeedback) { handleTestAnswer(n); } }}
              >
                {withAccidentalGlyphs(n)}
              </button>
            ))}
          </div>
          <button className="onboarding-skip" onClick={finish}>{t('Skip test →')}</button>
        </div>
      </div>
    );
  }

  // result step
  const score = correct;
  const msgs = [t('Keep going!'), t('Good start!'), t('Nice work!'), t('Impressive!')];
  const suggested = scoreToDifficulty(score);
  const DIFF_LABEL: Record<Difficulty, string> = {
    dots: t('Dot Frets'),
    naturals: t('Natural notes'),
    full: t('the full chromatic neck'),
  };
  return (
    <div className="onboarding">
      <div className="onboarding-card">
        <div className="onboarding-logo">{score >= 3 ? '🏆' : score >= 2 ? '🎯' : '🌱'}</div>
        <p className="onboarding-question">{msgs[score]}</p>
        <p className="onboarding-sub">
          {score}/3 {t("correct — we've set you up on")} {DIFF_LABEL[suggested]}. {t('Change it anytime in the selector panel.')}
        </p>
        <button className="onboarding-btn" onClick={() => finishWithDifficulty(suggested)}>
          {t("Let's go →")}
        </button>
      </div>
    </div>
  );
}
