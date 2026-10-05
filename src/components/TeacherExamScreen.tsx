// ── TeacherExamScreen — the teacher theory test ───────────────────────────
//
// Replaces self-declaration (0026) as the only way into `public.teachers`.
// Every rule that decides pass/fail lives on the server
// (supabase/migrations/0027_teacher_exam.sql): the question pool, the
// per-question time limit, and the clock the answer is checked against. This
// screen only displays what the server sends and relays the pick — a wrong
// client clock, a paused tab, or a hand-crafted request can only ever make an
// answer arrive "late" (scored wrong), never "early" or "right" by itself.
//
// Same self-contained full-page-takeover shape as ClassroomScreen (reached
// from its "I'm a teacher" card), with its own tiny router: intro → running
// → done.

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { playClickSound, haptic } from '../utils/feedback';
import { Chevron } from './Chevron';
import SpeedBar from './SpeedBar';
import { getInstrument, type InstrumentId } from '../utils/instruments';
import { loadSetting } from '../utils/settings';
import type { AccidentalMode, NotationMode } from '../utils/music';
import {
  EXAM_INSTRUMENTS, EXAM_KIND_LABEL,
  fetchExamStatus, startExam, answerExam, skipExamAsAdmin,
  questionText, optionLabel,
  type ExamStatus, type ExamStep, type ExamQuestion, type ExamOption, type ExamKind,
} from '../teacher/teacherExam';

interface Props {
  profileName: string | null;
  onPassed: () => void;
  onClose: () => void;
  /** Lets the app's Android/browser Back handler reach this screen's own
   *  mid-question confirm instead of closing it outright. */
  backRef?: RefObject<(() => void) | null>;
}

const tap = (fn: () => void) => () => { playClickSound(); haptic.tap(); fn(); };

type View =
  | { kind: 'intro' }
  | { kind: 'picking' }
  | {
    kind: 'running'; attemptId: string; index: number; total: number;
    question: ExamQuestion; issuedAt: number; lastCorrect?: boolean;
  }
  | { kind: 'done'; score: number; total: number; passMark: number; passed: boolean; byKind: Partial<Record<ExamKind, number>>; retryAt: string | null };

function useCountdown() {
  const { lang } = useTranslation();
  return useMemo(() => new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }), [lang]);
}

function isCooling(retryAt: string | null | undefined): boolean {
  return !!retryAt && new Date(retryAt).getTime() > Date.now();
}

function formatRetry(iso: string, t: (s: string) => string, rtf: Intl.RelativeTimeFormat): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return t('Try again now.');
  const hours = Math.round(ms / 3_600_000);
  if (hours < 36) return rtf.format(hours, 'hour');
  return rtf.format(Math.round(hours / 24), 'day');
}

export default function TeacherExamScreen({ profileName, onPassed, onClose, backRef }: Props) {
  const { t, lang } = useTranslation();
  const rtf = useCountdown();
  const accidental: AccidentalMode = loadSetting('pref_accidental', 'sharps');
  const notation: NotationMode = loadSetting('pref_notation', 'alpha');

  const [view, setView] = useState<View>({ kind: 'intro' });
  const [status, setStatus] = useState<ExamStatus | null>(null);
  const [statusError, setStatusError] = useState(false);
  const [instrumentId, setInstrumentId] = useState<InstrumentId>('guitar');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    let live = true;
    fetchExamStatus().then((s) => { if (live) setStatus(s); }, () => { if (live) setStatusError(true); });
    return () => { live = false; };
  }, []);

  const back = () => {
    if (view.kind === 'picking' || (view.kind === 'intro')) { onClose(); return; }
    if (view.kind === 'done') { onClose(); return; }
    // Mid-question: leaving counts the attempt as abandoned (the server ends
    // it as a failure next time it's touched) — confirm, don't silently drop.
    if (window.confirm(t('Leave now? This attempt will count as failed.'))) onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') back(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // Android/browser Back (via ClassroomScreen's forwarded backRef) hits the
  // same mid-question confirm as Escape, instead of ClassroomScreen's own
  // back or an outright close.
  useEffect(() => {
    if (backRef) backRef.current = back;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backRef, view]);

  const adminSkip = async () => {
    setBusy(true); setError(null);
    try {
      await skipExamAsAdmin();
      onPassed();
    } catch (e) {
      console.warn('[teacherExam] adminSkip', e);
      setError(t('Something went wrong. Check your connection and try again.'));
    } finally {
      setBusy(false);
    }
  };

  const begin = async (id: InstrumentId) => {
    setBusy(true); setError(null);
    try {
      const step = await startExam(id, profileName);
      applyStep(step);
    } catch (e) {
      console.warn('[teacherExam] start', e);
      setError(t('Something went wrong. Check your connection and try again.'));
    } finally {
      setBusy(false);
    }
  };

  function applyStep(step: ExamStep) {
    if (step.status === 'already') { onPassed(); return; }
    if (step.status === 'cooldown') {
      setStatus((s) => (s ? { ...s, retryAt: step.retryAt } : s));
      setView({ kind: 'intro' });
      return;
    }
    if (step.status === 'question') {
      setPicked(null);
      setView({
        kind: 'running', attemptId: step.attemptId, index: step.index, total: step.total,
        question: step.question, issuedAt: Date.now(), lastCorrect: step.lastCorrect,
      });
      return;
    }
    setView({
      kind: 'done', score: step.score, total: step.total, passMark: step.passMark,
      passed: step.passed, byKind: step.byKind, retryAt: step.retryAt,
    });
    if (step.passed) onPassed();
  }

  // Timed-out guard: fires once the server's own limit has passed, so the
  // button disabling below is a courtesy, not the enforcement — a late
  // in-flight answer is still scored wrong server-side regardless.
  const timedOutRef = useRef(false);
  useEffect(() => {
    timedOutRef.current = false;
    if (view.kind !== 'running') return;
    const id = window.setTimeout(() => { timedOutRef.current = true; }, view.question.limit_ms);
    return () => window.clearTimeout(id);
  }, [view]);

  const choose = async (idx: number) => {
    if (view.kind !== 'running' || picked !== null) return;
    playClickSound(); haptic.tap();
    setPicked(idx);
    try {
      const step = await answerExam(view.attemptId, idx);
      applyStep(step);
    } catch (e) {
      console.warn('[teacherExam] answer', e);
      setError(t('Something went wrong. Check your connection and try again.'));
      setPicked(null);
    }
  };

  // A question the learner never answers (closed the app, lost connection)
  // still needs to resolve so the UI isn't stuck — sent as choice -1, which
  // the server always scores wrong regardless of what arrives.
  useEffect(() => {
    if (view.kind !== 'running') return;
    const id = window.setTimeout(() => {
      if (picked === null) void choose(-1);
    }, view.question.limit_ms + 4000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const title = view.kind === 'running'
    ? t('Question {n} of {total}').replace('{n}', String(view.index + 1)).replace('{total}', String(view.total))
    : t('Teacher test');

  return (
    <div className="app settings-page class-page">
      <div className="sp2 settings-page-inner" dir={lang === 'he' ? 'rtl' : undefined}>
        <div className="sp2-head settings-page-head">
          <button className="sp2-back" onClick={tap(back)}>
            <Chevron dir="back" /> {t('Back')}
          </button>
        </div>
        <header className="settings-page-hero">
          <span className="settings-page-emoji" aria-hidden="true">📝</span>
          <h2 className="settings-page-name">{title}</h2>
        </header>

        <div className="settings-page-body class-body">
          {view.kind === 'intro' && (
            <IntroCard
              status={status} statusError={statusError} busy={busy} error={error}
              instrumentId={instrumentId} setInstrumentId={setInstrumentId}
              rtf={rtf}
              onStart={() => { setError(null); setView({ kind: 'picking' }); }}
              onAdminSkip={() => void adminSkip()}
            />
          )}
          {view.kind === 'picking' && (
            <InstrumentPick
              instrumentId={instrumentId} setInstrumentId={setInstrumentId} busy={busy}
              onConfirm={() => void begin(instrumentId)}
            />
          )}
          {view.kind === 'running' && (
            <RunningCard
              view={view} accidental={accidental} notation={notation}
              picked={picked} onChoose={choose}
            />
          )}
          {view.kind === 'done' && (
            <DoneCard view={view} rtf={rtf} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}

function IntroCard({
  status, statusError, busy, error, rtf, onStart, onAdminSkip,
}: {
  status: ExamStatus | null; statusError: boolean; busy: boolean; error: string | null;
  instrumentId: InstrumentId; setInstrumentId: (id: InstrumentId) => void;
  rtf: Intl.RelativeTimeFormat; onStart: () => void; onAdminSkip: () => void;
}) {
  const { t } = useTranslation();
  const cooling = isCooling(status?.retryAt);
  return (
    <section className="class-card">
      <h3 className="class-h">{t('Show what you know')}</h3>
      <p className="class-muted">
        {t('Becoming a teacher needs a short music-theory test: {n} questions, each timed, about reading the neck, the staff, intervals, key signatures and chords. A pass needs {pass} or more right.')
          .replace('{n}', String(status?.questions ?? 12)).replace('{pass}', String(status?.passMark ?? 10))}
      </p>
      <p className="class-muted">
        {t('Each question disappears once its time is up, so there is no time to look anything up — just enough to answer if you know it.')}
      </p>
      {statusError ? (
        <p className="class-muted" role="status">{t('Something went wrong. Check your connection and try again.')}</p>
      ) : cooling && !status?.isAdmin ? (
        <p className="class-muted" role="status">
          {t('You can try again {when}.').replace('{when}', formatRetry(status!.retryAt!, t, rtf))}
        </p>
      ) : (
        <button className="class-btn-primary" disabled={busy || !status} onClick={tap(onStart)}>
          {t('Start the test')}
        </button>
      )}
      {status?.isAdmin && (
        <>
          <p className="class-muted">
            {t('Admins already have Premium regardless of teacher status — skip the test and become a teacher directly.')}
          </p>
          <button className="clear-btn" disabled={busy || !status} onClick={tap(onAdminSkip)}>
            {t('Skip the test (admin)')}
          </button>
        </>
      )}
      {error && <p className="class-muted" role="status">{error}</p>}
    </section>
  );
}

function InstrumentPick({
  instrumentId, setInstrumentId, busy, onConfirm,
}: { instrumentId: InstrumentId; setInstrumentId: (id: InstrumentId) => void; busy: boolean; onConfirm: () => void }) {
  const { t } = useTranslation();
  return (
    <section className="class-card">
      <h3 className="class-h">{t('Which instrument?')}</h3>
      <p className="class-muted">{t('The neck and staff questions use this instrument.')}</p>
      <div className="class-chips">
        {EXAM_INSTRUMENTS.map((id) => (
          <button key={id} className={`fotd-instrument-btn${id === instrumentId ? ' active' : ''}`}
            aria-pressed={id === instrumentId} onClick={tap(() => setInstrumentId(id))}>
            <span aria-hidden="true">{getInstrument(id).emoji}</span> {t(getInstrument(id).label)}
          </button>
        ))}
      </div>
      <button className="class-btn-primary" disabled={busy} onClick={tap(onConfirm)}>
        {busy ? t('Loading…') : t('Begin')}
      </button>
    </section>
  );
}

function RunningCard({
  view, accidental, notation, picked, onChoose,
}: {
  view: Extract<View, { kind: 'running' }>;
  accidental: AccidentalMode; notation: NotationMode;
  picked: number | null; onChoose: (idx: number) => void;
}) {
  const { t } = useTranslation();
  const q = view.question;
  const total = q.limit_ms / 1000;
  return (
    <section className="class-card exam-running">
      <SpeedBar
        key={`exam-${view.index}`}
        remaining={Math.max(0, Math.ceil(total))}
        total={total}
        startAt={view.issuedAt}
        answered={picked !== null}
        paused={false}
      />
      <p className="class-lead exam-question">{questionText(q, notation, t)}</p>
      <div className="exam-options">
        {q.options.map((o: ExamOption, i: number) => (
          <button
            key={i}
            className={`class-string-chip exam-option${picked === i ? ' active' : ''}`}
            disabled={picked !== null}
            dir="ltr"
            onClick={tap(() => onChoose(i))}
          >
            {optionLabel(q, o, accidental, notation, t)}
          </button>
        ))}
      </div>
      {view.lastCorrect !== undefined && (
        <p className="class-muted" aria-hidden="true">
          {view.lastCorrect ? '✓' : '✗'}
        </p>
      )}
    </section>
  );
}

function DoneCard({
  view, rtf, onClose,
}: { view: Extract<View, { kind: 'done' }>; rtf: Intl.RelativeTimeFormat; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <section className="class-card class-run-result">
      <div className="class-run-score">{view.score}/{view.total}</div>
      {view.passed ? (
        <>
          <p className="class-lead">{t("You're a teacher now — you can create classes and assign homework.")}</p>
          <p className="class-muted">{t('Get Premium free once one of your classes has 6 or more active students.')}</p>
        </>
      ) : (
        <>
          <p className="class-lead">{t('Not this time — {pass} or more were needed.').replace('{pass}', String(view.passMark))}</p>
          {view.retryAt && (
            <p className="class-muted">
              {t('You can try again {when}.').replace('{when}', formatRetry(view.retryAt, t, rtf))}
            </p>
          )}
          <ul className="class-list">
            {(Object.entries(view.byKind) as [ExamKind, number][]).map(([kind, n]) => (
              <li key={kind} className="class-member-row">
                <span>{t(EXAM_KIND_LABEL[kind])}</span>
                <span className="class-muted">{n}/2</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <button className="class-btn-primary" onClick={tap(onClose)}>{t('Done')}</button>
    </section>
  );
}
