import type { ReactNode, RefObject } from 'react';
import NoteCircle from '../NoteCircle';
import FretGrid from '../FretGrid';
import IntervalChoiceRow from '../IntervalChoiceRow';
import SpeedBar from '../SpeedBar';
import AnimatedScore from '../AnimatedScore';
import IntervalPrompt from '../IntervalPrompt';
import VoiceLevelMeter from '../VoiceLevelMeter';
import VoiceStatusRow from './VoiceStatusRow';
import GuitarStatusRow from './GuitarStatusRow';
import { withClick as click } from '../../utils/withClick';
import { displayNote } from '../../utils/music';
import type { AccidentalMode, NotationMode } from '../../utils/music';
import { intervalBySemitones } from '../../utils/intervals';
import { intervalContentBySemitones } from '../../learning/intervalContent';
import type { InstrumentConfig } from '../../utils/instruments';
import type { MasteryStat } from '../../utils/mastery';
import type { DerivedSettings } from '../../hooks/useSelector';
import type { useDerivedNotes } from '../../hooks/useDerivedNotes';
import type { IntervalPromptState } from '../../hooks/useGameEngine';
import type { SessionScore } from '../../hooks/useScoring';
import type { UseVoiceAnswerResult } from '../../hooks/useVoiceAnswer';
import type { UseGuitarAnswerResult } from '../../hooks/useGuitarAnswer';
import type { Lang } from '../../i18n/translations';

/**
 * The question column (string label / question display / speed bar / info row /
 * live score / feedback / interval feedback / voice status) plus the
 * FretGrid ⇄ IntervalChoiceRow ⇄ NoteCircle board switch. Presentation only —
 * <App> owns the engine and drives everything through props. The game-end
 * summary and the transport controls are passed in as `children` so <App>
 * keeps composing them.
 */
export interface DrillBoardProps {
  t: (s: string) => string;
  lang: Lang;
  accidental: AccidentalMode;
  notation: NotationMode;
  instrument: InstrumentConfig;
  derived: ReturnType<typeof useDerivedNotes>;
  eff: DerivedSettings;
  voice: UseVoiceAnswerResult;
  guitar: UseGuitarAnswerResult;
  scoringSession: SessionScore;
  fretMastery: Record<number, MasteryStat>;
  noteMastery: Record<string, MasteryStat>;
  /** Fills a mastery bar to 100% (null = open-ended window, bar always full). */
  masteryDenominator: number | null;
  intervalPrompt: IntervalPromptState | null;
  questionDisplayRef: RefObject<HTMLDivElement | null>;

  gameActive: boolean;
  isStopped: boolean;
  gameEnded: boolean;
  /** True while the Auto Advance stage-transition banner is up (drives the
   *  `stage-exiting` question-display class). */
  stageExiting: boolean;
  isPlaying: boolean;
  boardLive: boolean;
  running: boolean;
  paused: boolean;
  answered: boolean;
  showScore: boolean;
  showMastery: boolean;
  byString: boolean;
  voiceActive: boolean;
  guitarActive: boolean;
  multiplierIcon: string;
  feedback: string;

  safeGuitarString: number;
  currentNote: string | null;
  currentFret: number | null;
  questionSeq: number;
  remaining: number;
  questionTime: number;
  questionStart: number;
  questionNumber: number;
  remainingFrets: number[];
  foundFrets: number[];
  wrongFret: number | null;
  correctCofNote: string | null;
  wrongCofNote: string | null;
  wrongInterval: number | null;

  selectFret: (fret: number) => void;
  selectAnswer: (note: string) => boolean | undefined;
  selectInterval: (semitones: number) => void;
  replayIntervalQuestion: () => void;
  /** Interval drill, after a wrong answer: the engine is holding for a Continue tap. */
  awaitingContinue: boolean;
  continueAfterMiss: () => void;

  children?: ReactNode;
}

export default function DrillBoard({
  t, lang, accidental, notation, instrument, derived, eff, voice, guitar, scoringSession,
  fretMastery, noteMastery, masteryDenominator, intervalPrompt, questionDisplayRef,
  gameActive, isStopped, gameEnded, stageExiting, isPlaying, boardLive, running, paused,
  answered, showScore, showMastery, byString, voiceActive, guitarActive, multiplierIcon, feedback,
  safeGuitarString, currentNote, currentFret, questionSeq, remaining, questionTime,
  questionStart, questionNumber, remainingFrets, foundFrets, wrongFret,
  correctCofNote, wrongCofNote, wrongInterval,
  selectFret, selectAnswer, selectInterval, replayIntervalQuestion,
  awaitingContinue, continueAfterMiss,
  children,
}: DrillBoardProps) {
  const {
    cofList, startIndex, activeNotes, questionActiveNotes, fretDots, noteFrets, isMulti,
  } = derived;

  return (
    <>
      <div className="question-col">
        {gameActive && (
          <>
            <div className="string-label" key={`str-${safeGuitarString}`}>{t(instrument.stringLabels[safeGuitarString])}</div>
            {intervalPrompt
              ? <div className={`note-display${stageExiting ? ' stage-exiting' : ''}`} ref={questionDisplayRef}>
                  <IntervalPrompt prompt={intervalPrompt} accidental={accidental} notation={notation} onReplay={replayIntervalQuestion} />
                </div>
              : eff.byNote
              ? <div className={`note-display${stageExiting ? ' stage-exiting' : ''}`} ref={questionDisplayRef}>{currentNote ? displayNote(currentNote, accidental, notation) : '—'}</div>
              : <div className={`fret-display${stageExiting ? ' stage-exiting' : ''}`} ref={questionDisplayRef}>{currentFret !== null ? currentFret : '—'}</div>
            }
            <SpeedBar key={`sb-${questionSeq}`} remaining={remaining} total={questionTime} startAt={questionStart} answered={answered} paused={paused} />
            <div className="game-info-row">
              <span className="game-timer">{remaining}s</span>
              <span className="game-progress-text">{questionNumber}/{eff.maxQuestions}</span>
              {showScore && multiplierIcon && <span className="multiplier-icon">{multiplierIcon}</span>}
            </div>
            {showScore && (
              <div id="live-score" className="score-live">
                <AnimatedScore value={scoringSession.score} />
              </div>
            )}
            <div className={`feedback ${feedback.startsWith('✓') ? 'good' : feedback.startsWith('✗') ? 'bad' : 'warn'}`}>
              {feedback}{showScore && scoringSession.lastPoints > 0 && feedback.startsWith('✓') ? ` +${scoringSession.lastPoints}` : ''}
            </div>
            {/* Intervals Learning (§7 / task T10): on a missed or timed-out
                interval question, reveal the interval name + its size, the
                nearest-neighbour discriminator, and — for *identify the
                interval* — the two notes that were played, plus a 🔊 replay.
                Educational content only; no theory screen. */}
            {intervalPrompt && answered && !feedback.startsWith('✓') && (() => {
              const def = intervalBySemitones(intervalPrompt.semitones);
              const content = intervalContentBySemitones(intervalPrompt.semitones);
              return (
                <div className="interval-feedback-note" dir={lang === 'he' ? 'rtl' : undefined}>
                  <div className="interval-feedback-name">
                    <strong>{def ? t(def.nameKey) : `+${intervalPrompt.semitones}`}</strong>
                    {' · '}
                    {intervalPrompt.semitones} {t('semitones')}
                  </div>
                  {intervalPrompt.exercise === 'identifyInterval' && (
                    <div className="interval-feedback-pair" dir="ltr">
                      {displayNote(intervalPrompt.rootNote, accidental, notation)}
                      {' → '}
                      {displayNote(intervalPrompt.targetNote, accidental, notation)}
                    </div>
                  )}
                  {intervalPrompt.exercise === 'identifyInterval' && (() => {
                    // The two notes on the neck, with the fret distance. The
                    // grid is the same lowest-string-first single-string board
                    // the find-on-the-neck drill uses (it mirrors itself for
                    // left-handed play); the window widens to hold both notes.
                    const dist = Math.abs(intervalPrompt.targetFret - intervalPrompt.refFret);
                    const shortName = def?.short ?? `+${intervalPrompt.semitones}`;
                    const lo = Math.min(eff.fretFrom, intervalPrompt.refFret, intervalPrompt.targetFret);
                    const hi = Math.max(eff.fretTo, intervalPrompt.refFret, intervalPrompt.targetFret);
                    return (
                      <div className="interval-feedback-neck">
                        <FretGrid
                          fretFrom={lo}
                          fretTo={hi}
                          guitarString={intervalPrompt.refString}
                          validFrets={new Set(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i))}
                          active={false}
                          correctFrets={[intervalPrompt.targetFret]}
                          wrongFret={null}
                          foundFrets={[]}
                          onSelect={() => {}}
                          showMastery={false}
                          referenceFret={intervalPrompt.refFret}
                        />
                        <div className="interval-feedback-distance">
                          {(dist === 1 ? t('1 fret = {interval}') : t('{n} frets = {interval}'))
                            .replace('{n}', String(dist))
                            .replace('{interval}', shortName)}
                        </div>
                      </div>
                    );
                  })()}
                  {content && (
                    <div className="interval-feedback-compare">{t(content.comparison)}</div>
                  )}
                  <button
                    type="button"
                    className="interval-replay-btn"
                    onClick={click(replayIntervalQuestion)}
                  >
                    🔊 {t('Hear it again')}
                  </button>
                  {awaitingContinue && (
                    <button
                      type="button"
                      className="interval-continue-btn"
                      onClick={click(continueAfterMiss)}
                      autoFocus
                    >
                      {t('Continue')}
                    </button>
                  )}
                </div>
              );
            })()}
            {voiceActive && <VoiceStatusRow voice={voice} t={t} />}
            {voiceActive && running && !paused && voice.permission !== 'denied' && (
              <VoiceLevelMeter active={running && !paused} />
            )}
            {guitarActive && <GuitarStatusRow guitar={guitar} t={t} />}
          </>
        )}

        {children}
      </div>

      {/* Keep the grid/circle visible (frozen) while paused; hide only when fully stopped and showing stats/end summary */}
      {(gameActive || (isStopped && !gameEnded)) && (
        intervalPrompt && intervalPrompt.exercise === 'findTargetPosition' ? (
          // *Find on the neck*: the reference note is marked on the string and
          // the learner taps the note that completes the interval (any
          // octave-equivalent counts). The engine drives it through the
          // by-note flow — `remainingFrets` holds every accepted position.
          <FretGrid
            fretFrom={eff.fretFrom}
            fretTo={eff.fretTo}
            guitarString={safeGuitarString}
            validFrets={new Set(Array.from({ length: eff.fretTo - eff.fretFrom + 1 }, (_, i) => eff.fretFrom + i))}
            active={isPlaying && !answered}
            correctFrets={gameActive ? remainingFrets : []}
            wrongFret={gameActive ? wrongFret : null}
            foundFrets={gameActive ? foundFrets : []}
            onSelect={selectFret}
            showMastery={false}
            referenceFret={intervalPrompt.refFret}
          />
        ) : intervalPrompt ? (
          <IntervalChoiceRow
            variant={intervalPrompt.exercise === 'identifyInterval' ? 'interval' : 'note'}
            options={
              intervalPrompt.exercise === 'identifyInterval'
                ? intervalPrompt.optionSemitones.map((s) => ({
                    value: String(s),
                    label: intervalBySemitones(s)?.short ?? `+${s}`,
                  }))
                : intervalPrompt.options.map((n) => ({
                    value: n,
                    label: displayNote(n, accidental, notation),
                  }))
            }
            correct={
              gameActive && answered
                ? intervalPrompt.exercise === 'identifyInterval'
                  ? String(intervalPrompt.semitones)
                  : intervalPrompt.targetNote
                : null
            }
            wrong={
              gameActive && answered
                ? intervalPrompt.exercise === 'identifyInterval'
                  ? wrongInterval != null
                    ? String(wrongInterval)
                    : null
                  : wrongCofNote
                : null
            }
            disabled={!(isPlaying && !answered)}
            dir={lang === 'he' ? 'rtl' : undefined}
            onSelect={(value) =>
              intervalPrompt.exercise === 'identifyInterval'
                ? selectInterval(Number(value))
                : selectAnswer(value)
            }
          />
        ) : eff.byNote ? (
          <FretGrid
            fretFrom={eff.fretFrom}
            fretTo={eff.fretTo}
            guitarString={safeGuitarString}
            validFrets={new Set(Object.values(noteFrets).flat())}
            active={isPlaying && !answered}
            correctFrets={gameActive ? remainingFrets : []}
            wrongFret={gameActive ? wrongFret : null}
            foundFrets={gameActive ? foundFrets : []}
            onSelect={selectFret}
            masteryByFret={fretMastery}
            masteryDenominator={masteryDenominator}
            showMastery={!boardLive && showMastery}
            referenceFret={null}
          />
        ) : (
          <NoteCircle
            notes={cofList}
            activeNotes={isMulti && gameActive ? questionActiveNotes : activeNotes}
            active={isPlaying && !answered}
            correctNote={gameActive ? correctCofNote : null}
            wrongNote={gameActive ? wrongCofNote : null}
            onSelect={selectAnswer}
            guitarString={safeGuitarString}
            fretDots={fretDots}
            noteFrets={noteFrets}
            byString={byString}
            startIndex={startIndex}
            showDots={!(isMulti && eff.multiStrings.length > 1) || boardLive}
            accidental={accidental}
            notation={notation}
            masteryByNote={noteMastery}
            masteryDenominator={masteryDenominator}
            showMastery={!boardLive && showMastery}
          />
        )
      )}
    </>
  );
}
