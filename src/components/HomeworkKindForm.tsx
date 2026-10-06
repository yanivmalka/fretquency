// ── HomeworkKindForm — the teacher's picks for a non-Notes homework ─────────
//
// The Intervals / Scales / Staff reading / Tab reading half of the assign
// form. Pure controlled UI over a `NonNotesSpec`; the title, instrument, due
// date and Save live in ClassroomScreen's AssignView. Reuses the classroom
// form styles (`class-field`, `class-chips`, `class-string-chip`).

import { useTranslation } from '../i18n/useTranslation';
import { playClickSound, haptic } from '../utils/feedback';
import { getInstrument, type InstrumentId } from '../utils/instruments';
import { INTERVALS } from '../utils/intervals';
import { scaleTypeById } from '../utils/scales';
import { KEY_IDS } from '../utils/staff';
import { STAFF_RANGES } from '../learning/staffDrill';
import { displayNote } from '../utils/music';
import {
  INTERVAL_EXERCISES, SCALE_EXERCISES, STAFF_EXERCISES, TAB_EXERCISES,
  KIND_QUESTION_COUNTS, PHRASE_QUESTION_COUNTS,
  exerciseLabel, homeworkRangeLabel, homeworkScaleChoices,
  type Direction, type NonNotesSpec,
} from '../teacher/homeworkKinds';

interface Props {
  spec: NonNotesSpec;
  instrumentId: InstrumentId;
  onChange: (spec: NonNotesSpec) => void;
}

const tap = (fn: () => void) => () => { playClickSound(); haptic.tap(); fn(); };

const DIRECTION_LABEL: Record<Direction, string> = { up: 'Ascending', down: 'Descending', both: 'Both' };

function Chips<T extends string | number>({ label, options, value, onPick, render, isOn, className = 'fotd-instrument-btn' }: {
  label: string;
  options: readonly T[];
  value?: T;
  onPick: (v: T) => void;
  render: (v: T) => React.ReactNode;
  /** Multi-select: whether `v` is currently picked (overrides `value`). */
  isOn?: (v: T) => boolean;
  className?: string;
}) {
  return (
    <div className="class-field">
      <span>{label}</span>
      <div className="class-chips">
        {options.map((o) => {
          const on = isOn ? isOn(o) : o === value;
          return (
            <button key={String(o)} className={`${className}${on ? ' active' : ''}`} aria-pressed={on} onClick={tap(() => onPick(o))}>
              {render(o)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const toggle = <T,>(list: readonly T[], v: T): T[] => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export default function HomeworkKindForm({ spec, instrumentId, onChange }: Props) {
  const { t } = useTranslation();
  const instrument = getInstrument(instrumentId);

  const countChips = (counts: readonly number[], value: number, onPick: (n: number) => void) => (
    <Chips label={t('Questions')} options={counts} value={value} onPick={onPick} render={(n) => n} className="class-string-chip" />
  );

  if (spec.kind === 'interval') {
    const stringNums = Array.from({ length: instrument.stringCount }, (_, i) => i + 1);
    const frets = Array.from({ length: instrument.maxFret - 2 }, (_, i) => i + 3);
    return (
      <>
        <Chips label={t('Exercise')} options={INTERVAL_EXERCISES} value={spec.exercise}
          onPick={(exercise) => onChange({ ...spec, exercise })} render={(e) => t(exerciseLabel(e))} />
        <Chips label={t('Direction')} options={['up', 'down', 'both'] as const} value={spec.direction}
          onPick={(direction) => onChange({ ...spec, direction })} render={(d) => t(DIRECTION_LABEL[d])} />
        <div className="class-field">
          <span>{t('Intervals')}</span>
          <div className="class-chips" dir="ltr">
            {INTERVALS.map((iv) => {
              const on = spec.semitones.includes(iv.semitones);
              return (
                <button key={iv.semitones} className={`class-string-chip${on ? ' active' : ''}`} aria-pressed={on}
                  title={t(iv.nameKey)}
                  onClick={tap(() => {
                    const next = toggle(spec.semitones, iv.semitones).sort((a, b) => a - b);
                    if (next.length > 0) onChange({ ...spec, semitones: next });
                  })}>
                  {iv.short}
                </button>
              );
            })}
          </div>
        </div>
        <div className="class-field">
          <span>{t('Strings')}</span>
          <div className="class-chips" dir="ltr">
            {stringNums.map((s) => {
              const on = spec.strings.includes(s);
              return (
                <button key={s} className={`class-string-chip${on ? ' active' : ''}`} aria-pressed={on}
                  title={t(instrument.stringLabels[s] ?? '')}
                  onClick={tap(() => {
                    const next = toggle(spec.strings, s).sort((a, b) => a - b);
                    if (next.length > 0) onChange({ ...spec, strings: next });
                  })}>
                  {s} <small>{instrument.notes[s - 1]?.[0]}</small>
                </button>
              );
            })}
          </div>
        </div>
        <div className="class-field">
          <span>{t('Frets')}</span>
          <div className="class-inline-form" dir="ltr">
            <span>0 –</span>
            <select className="class-input" value={spec.fretTo} aria-label={t('To fret')}
              onChange={(e) => onChange({ ...spec, fretTo: Number(e.target.value) })}>
              {frets.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
        {countChips(KIND_QUESTION_COUNTS, spec.questionCount, (questionCount) => onChange({ ...spec, questionCount }))}
      </>
    );
  }

  if (spec.kind === 'scale') {
    const choices = homeworkScaleChoices(instrumentId);
    return (
      <>
        <Chips label={t('Exercise')} options={SCALE_EXERCISES} value={spec.exercise}
          onPick={(exercise) => onChange({ ...spec, exercise })} render={(e) => t(exerciseLabel(e))} />
        <div className="class-field">
          <span>{t('Scales')}</span>
          <div className="class-chips">
            {choices.map((id) => {
              const on = spec.scaleTypeIds.includes(id);
              return (
                <button key={id} className={`fotd-instrument-btn${on ? ' active' : ''}`} aria-pressed={on}
                  onClick={tap(() => {
                    const next = toggle(spec.scaleTypeIds, id);
                    if (next.length > 0) onChange({ ...spec, scaleTypeIds: next });
                  })}>
                  {t(scaleTypeById(id)?.nameKey ?? id)}
                </button>
              );
            })}
          </div>
        </div>
        {spec.exercise === 'identifyScale' && (
          <Chips label={t('Direction')} options={['up', 'down', 'both'] as const} value={spec.direction}
            onPick={(direction) => onChange({ ...spec, direction })} render={(d) => t(DIRECTION_LABEL[d])} />
        )}
        {countChips(KIND_QUESTION_COUNTS, spec.questionCount, (questionCount) => onChange({ ...spec, questionCount }))}
      </>
    );
  }

  // Staff / tab share the range picker and the phrase-vs-single question counts.
  const isPhrase = spec.exercise === 'readPhrase' || spec.exercise === 'readRiff';
  const counts = isPhrase ? PHRASE_QUESTION_COUNTS : KIND_QUESTION_COUNTS;
  const fitCount = (nextPhrase: boolean, n: number) => {
    const set: readonly number[] = nextPhrase ? PHRASE_QUESTION_COUNTS : KIND_QUESTION_COUNTS;
    return set.includes(n) ? n : set[nextPhrase ? 1 : 0];
  };
  const rangeChips = (
    <Chips label={t('Range')} options={STAFF_RANGES} value={spec.range}
      onPick={(range) => onChange({ ...spec, range })}
      render={(r) => homeworkRangeLabel(r, instrument.maxFret, t)} />
  );

  if (spec.kind === 'staff') {
    return (
      <>
        <Chips label={t('Exercise')} options={STAFF_EXERCISES} value={spec.exercise}
          onPick={(exercise) => onChange({ ...spec, exercise, questionCount: fitCount(exercise === 'readPhrase', spec.questionCount) })}
          render={(e) => t(exerciseLabel(e))} />
        {rangeChips}
        <div className="class-field">
          <span>{t('Key signature')}</span>
          <div className="class-chips" dir="ltr">
            {KEY_IDS.map((k) => (
              <button key={k} className={`class-string-chip${spec.key === k ? ' active' : ''}`} aria-pressed={spec.key === k}
                onClick={tap(() => onChange({ ...spec, key: k }))}>
                {displayNote(k, 'sharps', 'alpha')}
              </button>
            ))}
          </div>
        </div>
        <label className="class-check">
          <input type="checkbox" checked={spec.inKeyOnly} onChange={(e) => onChange({ ...spec, inKeyOnly: e.target.checked })} />
          <span>{spec.key === 'C' ? t('Natural notes only (no sharps or flats)') : t('Notes of the key only')}</span>
        </label>
        {countChips(counts, spec.questionCount, (questionCount) => onChange({ ...spec, questionCount }))}
      </>
    );
  }

  return (
    <>
      <Chips label={t('Exercise')} options={TAB_EXERCISES} value={spec.exercise}
        onPick={(exercise) => onChange({ ...spec, exercise, questionCount: fitCount(exercise === 'readRiff', spec.questionCount) })}
        render={(e) => t(exerciseLabel(e))} />
      {rangeChips}
      <label className="class-check">
        <input type="checkbox" checked={spec.naturalsOnly} onChange={(e) => onChange({ ...spec, naturalsOnly: e.target.checked })} />
        <span>{t('Natural notes only (no sharps or flats)')}</span>
      </label>
      {countChips(counts, spec.questionCount, (questionCount) => onChange({ ...spec, questionCount }))}
    </>
  );
}
