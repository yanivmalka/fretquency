import { useMemo, useState, type ReactNode } from 'react';
import { loadSetting, saveSetting } from '../utils/settings';
import type { Difficulty } from '../hooks/useSelector';
import { useTranslation } from '../i18n/useTranslation';
import { displayNote, type AccidentalMode, type NotationMode } from '../utils/music';
import { CHROMATIC, INSTRUMENTS, type InstrumentConfig, type InstrumentId } from '../utils/instruments';
import { withClick as click } from '../utils/withClick';
import { PRIVACY_POLICY_URL, TERMS_URL, recordLegalAccepted } from '../utils/onboardingState';
import GoogleIcon from './GoogleIcon';

interface Props {
  onDone: () => void;
  onInstrument: (id: InstrumentId) => void;
  /** Apply the placement result to the live Selector difficulty. */
  onPlacement: (difficulty: Difficulty) => void;
  /** The active instrument — re-resolved by <App> after `onInstrument`. */
  instrument: InstrumentConfig;
  notation: NotationMode;
  accidental: AccidentalMode;
  account: {
    /** False in a build without Supabase: the sign-in step is skipped. */
    available: boolean;
    loading: boolean;
    signedIn: boolean;
    onSignIn: () => void;
  };
}

type Step = 'welcome' | 'privacy' | 'account' | 'instrument' | 'level' | 'test' | 'result';
const STEPS: Step[] = ['welcome', 'privacy', 'account', 'instrument', 'level', 'test', 'result'];
// Remembered across a reload: the web Google sign-in leaves the page and comes
// back, and the player should land where they were, not on the first slide.
const STEP_KEY = 'onboardingStep';

const INSTRUMENT_ORDER: InstrumentId[] = ['guitar', 'bass', 'ukulele', 'mandolin', 'banjo'];

const WELCOME_SLIDES = 3;

interface PlacementQuestion { fret: number; answer: string }

// One question per Selector difficulty on the instrument's lowest open
// string — a natural note on a dot fret, a natural between the dots, and a
// sharp — so a full score really means the whole chromatic neck. On a guitar
// or bass low E this is fret 5 (A), 8 (C) and 6 (A#).
function placementFor(inst: InstrumentConfig): { stringIdx: number; questions: PlacementQuestion[] } {
  let stringIdx = 0;
  inst.openMidi.forEach((midi, i) => {
    if ((inst.minFrets?.[i] ?? 0) === 0 && midi < inst.openMidi[stringIdx]) stringIdx = i;
  });
  const row = inst.notes[stringIdx];
  const natural = (f: number) => !row[f].includes('#');
  const isDot = (f: number) => inst.dotFrets.includes(f);
  const dotFrets = inst.dotFrets.filter(f => f >= 3 && f <= 12 && natural(f));
  const dot = dotFrets.includes(5) ? 5 : dotFrets[0] ?? 5;
  const after = Array.from({ length: 12 - dot }, (_, i) => dot + 1 + i);
  const between = after.find(f => !isDot(f) && natural(f)) ?? dot + 3;
  const sharp = after.find(f => !natural(f)) ?? dot + 1;
  return {
    stringIdx,
    questions: [dot, between, sharp].map(fret => ({ fret, answer: row[fret] })),
  };
}

function scoreToDifficulty(score: number): Difficulty {
  if (score >= 3) return 'full';
  if (score >= 2) return 'naturals';
  return 'dots';
}

export default function Onboarding({
  onDone, onInstrument, onPlacement, instrument, notation, accidental, account,
}: Props) {
  const { t } = useTranslation();
  const [savedStep, setStepState] = useState<Step>(() => {
    const saved = loadSetting<string>(STEP_KEY, 'welcome');
    return (STEPS as string[]).includes(saved) && saved !== 'test' && saved !== 'result'
      ? saved as Step : 'welcome';
  });
  const setStep = (s: Step) => { setStepState(s); saveSetting(STEP_KEY, s); };
  const [slide, setSlide] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [testIdx, setTestIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  // Back from Google (or already signed in): the offer has done its job.
  const step: Step = savedStep === 'account' && (account.signedIn || !account.available)
    ? 'instrument' : savedStep;

  const placement = useMemo(() => placementFor(instrument), [instrument]);
  const noteOptions = useMemo(() => {
    const open = CHROMATIC.indexOf(instrument.notes[placement.stringIdx][0]);
    return Array.from({ length: 12 }, (_, i) => CHROMATIC[(open + i) % 12]);
  }, [instrument, placement]);

  const finish = () => onDone();
  const finishWithDifficulty = (difficulty: Difficulty) => {
    onPlacement(difficulty);
    finish();
  };

  const pickInstrument = (id: InstrumentId) => {
    onInstrument(id);
    setStep('level');
  };

  const handleTestAnswer = (answer: string) => {
    if (picked) return;
    const q = placement.questions[testIdx];
    if (answer === q.answer) setCorrect(c => c + 1);
    setPicked(answer);
    setTimeout(() => {
      setPicked(null);
      if (testIdx + 1 < placement.questions.length) setTestIdx(i => i + 1);
      else setStep('result');
    }, 800);
  };

  const card = (children: ReactNode, wide = false) => (
    <div className="onboarding" role="dialog" aria-modal="true">
      <div className={`onboarding-card${wide ? ' onboarding-card-wide' : ''}`}>{children}</div>
    </div>
  );

  if (step === 'welcome') {
    const last = slide === WELCOME_SLIDES - 1;
    return card(<>
      {slide === 0 && <>
        <img className="onboarding-app-icon" src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" />
        <h2 className="onboarding-title">{t('Welcome to Fretquency')}</h2>
        <p className="onboarding-sub">
          {t('Learn every note on the neck of your guitar, bass, ukulele, mandolin or banjo — in short, focused drills, a few minutes a day.')}
        </p>
      </>}

      {slide === 1 && <>
        <h2 className="onboarding-title">{t("What's inside")}</h2>
        <ul className="onboarding-features">
          <Feature icon="🎯" title={t('Note drills')}
            text={t('Name the note at a fret, or find every fret of a note. Start with the dot frets and work up to the whole neck.')} />
          <Feature icon="🎤" title={t('Answer your way')}
            text={t('Tap, say the note out loud, or play it on your instrument.')} />
          <Feature icon="📈" title={t('Watch yourself improve')}
            text={t('Stats, personal bests, badges and a leaderboard.')} />
          <Feature icon="🎚️" title={t('Built-in tuner')}
            text={t('Tune up before you practise.')} />
        </ul>
      </>}

      {slide === 2 && <>
        <h2 className="onboarding-title">{t('Free to start')}</h2>
        <ul className="onboarding-features">
          <Feature icon="⭐" title={t('Free')}
            text={t('The full note drill on every string, badges, the leaderboard and cloud backup. Shows ads.')} />
          <Feature icon="✦" title={t('Pro')}
            text={t('Your full history and trends, mastery maps, a precise fret range, multi-string drills — and no ads.')} />
          <Feature icon="🎓" title={t('Premium')}
            text={t('A teacher, not a timer: a daily plan built from your weak spots, a learning path, intervals, scales, staff reading and tab reading.')} />
        </ul>
        <p className="onboarding-hint">{t('Pro and Premium are coming soon.')}</p>
      </>}

      <div className="onboarding-dots" aria-hidden="true">
        {Array.from({ length: WELCOME_SLIDES }, (_, i) => (
          <span key={i} className={i === slide ? 'is-on' : ''} />
        ))}
      </div>
      <button className="onboarding-primary" onClick={click(() => last ? setStep('privacy') : setSlide(slide + 1))}>
        {slide === 0 ? t('Get started') : t('Next')}
      </button>
      {slide > 0 && (
        <button className="onboarding-skip" onClick={click(() => setSlide(slide - 1))}>{t('Back')}</button>
      )}
    </>, slide > 0);
  }

  if (step === 'privacy') return card(<>
    <div className="onboarding-logo" aria-hidden="true">🔒</div>
    <h2 className="onboarding-title">{t('Your privacy')}</h2>
    <ul className="onboarding-features">
      <Feature icon="📱" title={t('Your practice stays on this device')}
        text={t('As a guest, your history, settings and badges are stored only on this phone or browser.')} />
      <Feature icon="☁️" title={t('Backup is your choice')}
        text={t('Only if you sign in with Google is your data backed up to our server, so you can restore it.')} />
      <Feature icon="🎤" title={t('The microphone only when you ask')}
        text={t('It is used only if you choose to answer by voice or by playing, and audio is never saved.')} />
      <Feature icon="📢" title={t('Ads on the free plan')}
        text={t('Ads are provided by Google, which may use an advertising ID to show and measure them.')} />
    </ul>
    {/* Absolute URL: the Android build serves the app from a relative base,
        so a relative link would navigate the WebView away. */}
    <div className="onboarding-links">
      <a className="onboarding-link" href={TERMS_URL} target="_blank" rel="noopener noreferrer">
        {t('Terms of use')} ↗
      </a>
      <a className="onboarding-link" href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer">
        {t('Privacy policy')} ↗
      </a>
    </div>
    <label className="onboarding-consent">
      <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
      <span>{t('I have read the terms of use and the privacy policy and agree to them.')}</span>
    </label>
    <button
      className="onboarding-primary"
      disabled={!agreed}
      onClick={click(() => {
        recordLegalAccepted();
        setStep(account.available && !account.signedIn ? 'account' : 'instrument');
      })}
    >
      {t('Continue')}
    </button>
    <button className="onboarding-skip" onClick={click(() => { setStep('welcome'); setSlide(WELCOME_SLIDES - 1); })}>
      {t('Back')}
    </button>
  </>, true);

  if (step === 'account') return card(<>
    <div className="onboarding-logo" aria-hidden="true">☁️</div>
    <h2 className="onboarding-title">{t('Keep your progress safe')}</h2>
    <p className="onboarding-sub">{t('Sign in with Google — it takes a few seconds and is optional.')}</p>
    <ul className="onboarding-features">
      <Feature icon="💾" title={t('Never lose your progress')}
        text={t('History, badges, personal bests and settings are backed up — even if you change or reset your phone.')} />
      <Feature icon="🔄" title={t('Every device, one account')}
        text={t('Practise on your phone, carry on in the browser on your computer.')} />
      <Feature icon="🏆" title={t('Join the leaderboard')}
        text={t('Earn XP and see how you compare with other players.')} />
    </ul>
    <button
      className="onboarding-primary onboarding-google"
      disabled={account.loading}
      onClick={click(account.onSignIn)}
    >
      <GoogleIcon size={18} />
      {t('Sign in with Google')}
    </button>
    <button className="onboarding-skip" onClick={click(() => setStep('instrument'))}>
      {t('Continue as a guest')}
    </button>
    <p className="onboarding-hint">{t('You can sign in any time from the menu → Account.')}</p>
  </>, true);

  if (step === 'instrument') return card(<>
    <div className="onboarding-logo" aria-hidden="true">{instrument.emoji}</div>
    <p className="onboarding-question">{t('What do you play?')}</p>
    <div className="onboarding-options">
      {INSTRUMENT_ORDER.map(id => (
        <button key={id} className="onboarding-btn" onClick={click(() => pickInstrument(id))}>
          {INSTRUMENTS[id].emoji} {t(INSTRUMENTS[id].label)}
        </button>
      ))}
    </div>
    <p className="onboarding-hint">{t('Strings, frets and tuning can be changed later from the menu → Playing.')}</p>
    <button className="onboarding-skip" onClick={click(finish)}>{t('Skip setup →')}</button>
  </>);

  if (step === 'level') return card(<>
    <div className="onboarding-logo" aria-hidden="true">{instrument.emoji}</div>
    <p className="onboarding-question">{t('How well do you know the fretboard?')}</p>
    <div className="onboarding-options">
      <button className="onboarding-btn" onClick={click(() => finishWithDifficulty('dots'))}>
        🌱 {t("I'm just starting")}
        <span className="onboarding-hint">{t('Start with the dot frets')}</span>
      </button>
      <button className="onboarding-btn" onClick={click(() => { setTestIdx(0); setCorrect(0); setStep('test'); })}>
        🎯 {t('I play but want to improve')}
        <span className="onboarding-hint">{t('Quick 3-question test')}</span>
      </button>
      <button className="onboarding-btn" onClick={click(() => finishWithDifficulty('full'))}>
        🏆 {t('I know the full neck')}
        <span className="onboarding-hint">{t('Jump right in')}</span>
      </button>
    </div>
    <button className="onboarding-skip" onClick={click(finish)}>{t('Skip →')}</button>
  </>);

  if (step === 'test') {
    const q = placement.questions[testIdx];
    return card(<>
      <p className="onboarding-progress">{testIdx + 1} / {placement.questions.length}</p>
      <p className="onboarding-question">
        {t('String')} {placement.stringIdx + 1} ({displayNote(noteOptions[0], accidental, notation)})
        {' — '}{t('what note is fret')} <strong>{q.fret}</strong>?
      </p>
      <div className="onboarding-note-grid">
        {noteOptions.map(n => (
          <button
            key={n}
            className={`onboarding-note-btn${
              picked && n === q.answer ? ' onboarding-note-correct'
                : picked === n ? ' onboarding-note-wrong' : ''}`}
            onClick={() => handleTestAnswer(n)}
          >
            {displayNote(n, accidental, notation)}
          </button>
        ))}
      </div>
      <button className="onboarding-skip" onClick={click(finish)}>{t('Skip test →')}</button>
    </>);
  }

  const msgs = [t('Keep going!'), t('Good start!'), t('Nice work!'), t('Impressive!')];
  const suggested = scoreToDifficulty(correct);
  const DIFF_LABEL: Record<Difficulty, string> = {
    dots: t('Dot Frets'),
    naturals: t('Natural notes'),
    full: t('the full chromatic neck'),
  };
  return card(<>
    <div className="onboarding-logo" aria-hidden="true">{correct >= 3 ? '🏆' : correct >= 2 ? '🎯' : '🌱'}</div>
    <p className="onboarding-question">{msgs[correct]}</p>
    <p className="onboarding-sub">
      {correct}/3 {t("correct — we've set you up on")} {DIFF_LABEL[suggested]}. {t('Change it anytime in the selector panel.')}
    </p>
    <button className="onboarding-primary" onClick={click(() => finishWithDifficulty(suggested))}>
      {t("Let's go →")}
    </button>
  </>);
}

function Feature({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <li className="onboarding-feature">
      <span className="onboarding-feature-icon" aria-hidden="true">{icon}</span>
      <span>
        <strong>{title}</strong>
        <span className="onboarding-feature-text">{text}</span>
      </span>
    </li>
  );
}
