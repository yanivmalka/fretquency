// ── ClassroomScreen — Teacher mode, first slice ───────────────────────────
//
// A self-contained full-page takeover (same shape as the Tuner and Fret of
// the Day), reached from the Learn drawer or a shared `?class=CODE` invite
// link (useClassLinkRoute). It owns its own little router — plain view state,
// no App.tsx involvement past open/close:
//
//   home ─┬─ teach (a class I run: code + invite, roster, homework + results)
//         │    └─ assign (new homework form)
//         └─ study (a class I joined: homework list)
//              └─ run (HomeworkRun — the drill itself)
//
// Everything goes through src/teacher/classroom.ts (Supabase, RLS in
// migration 0026). Signed-in only: a guest sees why and a sign-in button,
// since the teacher's view needs results on the server and guests never
// write state to the network. Free on every tier — Premium is what a
// *verified* teacher gets (server-side trigger), not a requirement here.

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { useTranslation } from '../i18n/useTranslation';
import { dateLocale } from '../i18n/translations';
import { playClickSound, haptic } from '../utils/feedback';
import { Chevron } from './Chevron';
import HomeworkRun from './HomeworkRun';
import { isSupabaseConfigured } from '../utils/supabase';
import { loadSetting } from '../utils/settings';
import { getInstrument, type InstrumentId } from '../utils/instruments';
import type { AccidentalMode, OrderMode, NotationMode } from '../utils/music';
import { shareResult } from '../utils/share';
import {
  fetchTeacherStatus, becomeTeacher, fetchTeachingClasses, fetchJoinedClasses,
  createClass, deleteClass, joinClass, leaveClass, fetchMembers, removeMember,
  fetchHomework, assignHomework, deleteHomework, fetchAttempts, submitAttempt,
  type ClassRow, type MemberRow, type HomeworkRow, type AttemptRow, type TeacherStatus,
} from '../teacher/classroom';
import {
  HOMEWORK_INSTRUMENTS, HOMEWORK_QUESTION_COUNTS, CLASS_CODE_LENGTH,
  defaultHomeworkPicks, buildHomeworkDrill, parseHomeworkDrill, describeHomework,
  summariseAttempts, normaliseClassCode, isHomeworkInstrument, type HomeworkPicks, type StudentResult,
} from '../teacher/homework';
import { buildClassInviteUrl, clearPendingClassCode, setPendingClassCode } from '../teacher/classLink';

interface Props {
  user: User | null;
  profileName: string | null;
  /** A join code from an invite link (or one saved across sign-in). */
  initialCode: string | null;
  onSignIn: () => void;
  onClose: () => void;
}

type View =
  | { kind: 'home' }
  | { kind: 'teach'; cls: ClassRow }
  | { kind: 'assign'; cls: ClassRow }
  | { kind: 'study'; cls: ClassRow }
  | { kind: 'run'; cls: ClassRow; homework: HomeworkRow };

const tap = (fn: () => void) => () => { playClickSound(); haptic.tap(); fn(); };

/** Loads `fn` whenever `deps` change; `reload()` re-runs it. */
function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    fn().then((d) => { if (live) setData(d); }, (e) => {
      console.warn('[classroom]', e);
      if (live) setError(true);
    });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  const reload = useCallback(() => { setError(false); setTick((n) => n + 1); }, []);
  return { data, error, reload };
}

export default function ClassroomScreen({ user, profileName, initialCode, onSignIn, onClose }: Props) {
  const { t, lang } = useTranslation();
  const [view, setView] = useState<View>({ kind: 'home' });

  const back = useCallback(() => {
    setView((v) => {
      if (v.kind === 'assign') return { kind: 'teach', cls: v.cls };
      if (v.kind === 'run') return { kind: 'study', cls: v.cls };
      if (v.kind === 'home') { onClose(); return v; }
      return { kind: 'home' };
    });
  }, [onClose]);

  // Escape steps back one level, like the system back gesture would.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') back(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [back]);

  const title = view.kind === 'home' ? t('Class') : view.cls.name;

  return (
    <div className="app settings-page class-page">
      <div className="sp2 settings-page-inner" dir={lang === 'he' ? 'rtl' : undefined}>
        <div className="sp2-head settings-page-head">
          <button className="sp2-back" onClick={tap(back)}>
            <Chevron dir="back" /> {t('Back')}
          </button>
        </div>
        <header className="settings-page-hero">
          <span className="settings-page-emoji" aria-hidden="true">🏫</span>
          <h2 className="settings-page-name">{title}</h2>
        </header>

        <div className="settings-page-body class-body">
          {!isSupabaseConfigured ? (
            <p className="class-muted">{t('Classes need an internet connection and are not available in this build.')}</p>
          ) : !user ? (
            <GuestHome initialCode={initialCode} onSignIn={onSignIn} />
          ) : view.kind === 'home' ? (
            <Home user={user} profileName={profileName} initialCode={initialCode} setView={setView} />
          ) : view.kind === 'teach' ? (
            <TeachView cls={view.cls} onAssign={() => setView({ kind: 'assign', cls: view.cls })}
              onDeleted={() => setView({ kind: 'home' })} />
          ) : view.kind === 'assign' ? (
            <AssignView cls={view.cls} onDone={() => setView({ kind: 'teach', cls: view.cls })} />
          ) : view.kind === 'study' ? (
            <StudyView user={user} cls={view.cls}
              onRun={(homework) => setView({ kind: 'run', cls: view.cls, homework })}
              onLeft={() => setView({ kind: 'home' })} />
          ) : (
            <RunView user={user} cls={view.cls} homework={view.homework}
              onDone={() => setView({ kind: 'study', cls: view.cls })} />
          )}
        </div>
      </div>
    </div>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="class-card">
      <p className="class-muted">{t('Something went wrong. Check your connection and try again.')}</p>
      <button className="clear-btn" onClick={tap(onRetry)}>{t('Try again')}</button>
    </div>
  );
}

// ── Guest ───────────────────────────────────────────────────────────────

function GuestHome({ initialCode, onSignIn }: { initialCode: string | null; onSignIn: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="class-card">
      {initialCode && (
        <p className="class-lead">{t('You were invited to join a class with code {code}.').replace('{code}', initialCode)}</p>
      )}
      <p className="class-muted">
        {t('Classes connect a teacher and their students: the teacher assigns practice, and sees who did it and how it went. Sign in so your teacher can see your results.')}
      </p>
      <button className="class-btn-primary" onClick={tap(() => {
        if (initialCode) setPendingClassCode(initialCode);
        onSignIn();
      })}>
        {t('Sign in with Google')}
      </button>
    </div>
  );
}

// ── Home (signed in) ────────────────────────────────────────────────────

function Home({ user, profileName, initialCode, setView }: {
  user: User; profileName: string | null; initialCode: string | null; setView: (v: View) => void;
}) {
  const { t } = useTranslation();
  const joined = useLoad(() => fetchJoinedClasses(user.id), [user.id]);
  const status = useLoad<TeacherStatus>(() => fetchTeacherStatus(user.id), [user.id]);
  const teaching = useLoad(
    () => (status.data?.isTeacher ? fetchTeachingClasses(user.id) : Promise.resolve([])),
    [user.id, status.data?.isTeacher],
  );

  return (
    <>
      <JoinCard profileName={profileName} initialCode={initialCode}
        onJoined={() => { clearPendingClassCode(); joined.reload(); }} />

      {joined.error ? <LoadError onRetry={joined.reload} /> : joined.data && joined.data.length > 0 && (
        <section className="class-card">
          <h3 className="class-h">{t('My classes')}</h3>
          <ul className="class-list">
            {joined.data.map((c) => (
              <li key={c.id}>
                <button className="class-list-btn" onClick={tap(() => setView({ kind: 'study', cls: c }))}>
                  <span className="class-list-name">{c.name}</span>
                  {c.teacherName && <span className="class-muted">{c.teacherName}</span>}
                  <Chevron dir="forward" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {status.error ? <LoadError onRetry={status.reload} /> : status.data && (
        status.data.isTeacher ? (
          <section className="class-card">
            <h3 className="class-h">{t('Classes I teach')}</h3>
            <p className="class-muted">
              {status.data.verified
                ? t('Verified teacher — Premium is on us.')
                : t('Verified teachers get Premium free. We check teacher accounts by hand; until then, everything here already works.')}
            </p>
            {teaching.error ? <LoadError onRetry={teaching.reload} /> : (
              <ul className="class-list">
                {(teaching.data ?? []).map((c) => (
                  <li key={c.id}>
                    <button className="class-list-btn" onClick={tap(() => setView({ kind: 'teach', cls: c }))}>
                      <span className="class-list-name">{c.name}</span>
                      <span className="class-code-chip" dir="ltr">{c.code}</span>
                      <Chevron dir="forward" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <NewClassForm profileName={profileName}
              onCreated={(c) => setView({ kind: 'teach', cls: c })} />
          </section>
        ) : (
          <BecomeTeacherCard user={user} profileName={profileName} onDone={status.reload} />
        )
      )}
    </>
  );
}

function JoinCard({ profileName, initialCode, onJoined }: {
  profileName: string | null; initialCode: string | null; onJoined: () => void;
}) {
  const { t } = useTranslation();
  const [code, setCode] = useState(initialCode ?? '');
  const [name, setName] = useState(profileName ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const ready = code.length === CLASS_CODE_LENGTH && name.trim().length > 0 && !busy;

  const submit = async () => {
    setBusy(true); setMsg(null);
    try {
      const out = await joinClass(code, name.trim());
      if (out.kind === 'joined') {
        setMsg(t('You joined {name}.').replace('{name}', out.name));
        setCode('');
        onJoined();
      } else if (out.kind === 'ownClass') {
        setMsg(t('That is your own class — you teach it.'));
      } else {
        setMsg(t('No class has that code. Check it with your teacher.'));
      }
    } catch (e) {
      console.warn('[classroom] join', e);
      setMsg(t('Something went wrong. Check your connection and try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="class-card">
      <h3 className="class-h">{t('Join a class')}</h3>
      <label className="class-field">
        <span>{t('Class code')}</span>
        <input className="class-input class-code-input" dir="ltr" inputMode="text" autoCapitalize="characters"
          autoComplete="off" maxLength={CLASS_CODE_LENGTH + 2} value={code} placeholder="ABC234"
          onChange={(e) => setCode(normaliseClassCode(e.target.value))} />
      </label>
      <label className="class-field">
        <span>{t('Your name, as your teacher will see it')}</span>
        <input className="class-input" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <button className="class-btn-primary" disabled={!ready} onClick={tap(() => { void submit(); })}>
        {t('Join')}
      </button>
      {msg && <p className="class-muted" role="status">{msg}</p>}
    </section>
  );
}

function BecomeTeacherCard({ user, profileName, onDone }: {
  user: User; profileName: string | null; onDone: () => void;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <section className="class-card">
      <h3 className="class-h">{t('Do you teach guitar, bass or ukulele?')}</h3>
      <p className="class-muted">
        {t('Create a class, give your students its code, assign practice and see who did it. Verified teachers get Premium free.')}
      </p>
      <button className="clear-btn" disabled={busy} onClick={tap(() => {
        setBusy(true); setFailed(false);
        becomeTeacher(user.id, profileName).then(onDone, (e) => {
          console.warn('[classroom] becomeTeacher', e);
          setFailed(true);
        }).finally(() => setBusy(false));
      })}>
        {t("I'm a teacher")}
      </button>
      {failed && <p className="class-muted" role="status">{t('Something went wrong. Check your connection and try again.')}</p>}
    </section>
  );
}

function NewClassForm({ profileName, onCreated }: { profileName: string | null; onCreated: (c: ClassRow) => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div className="class-inline-form">
      <input className="class-input" maxLength={60} value={name} placeholder={t('New class name')}
        onChange={(e) => setName(e.target.value)} />
      <button className="clear-btn" disabled={busy || name.trim().length === 0} onClick={tap(() => {
        setBusy(true); setFailed(false);
        createClass(name, profileName).then((c) => { if (c) onCreated(c); }, (e) => {
          console.warn('[classroom] createClass', e);
          setFailed(true);
        }).finally(() => setBusy(false));
      })}>
        {t('Create class')}
      </button>
      {failed && <p className="class-muted" role="status">{t('Something went wrong. Check your connection and try again.')}</p>}
    </div>
  );
}

// ── Teacher: one class ──────────────────────────────────────────────────

function TeachView({ cls, onAssign, onDeleted }: { cls: ClassRow; onAssign: () => void; onDeleted: () => void }) {
  const { t } = useTranslation();
  const data = useLoad(async () => {
    const [members, homework, attempts] = await Promise.all([
      fetchMembers(cls.id), fetchHomework(cls.id), fetchAttempts(cls.id),
    ]);
    return { members, homework, attempts };
  }, [cls.id]);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const invite = async () => {
    const url = buildClassInviteUrl(`${window.location.origin}${import.meta.env.BASE_URL}`, cls.code);
    const outcome = await shareResult({
      title: t('Join my class on Fretquency'),
      text: t('Join my class "{name}" on Fretquency — code {code}').replace('{name}', cls.name).replace('{code}', cls.code),
      url,
    });
    if (outcome === 'copied') { setShareMsg(t('Copied to clipboard')); window.setTimeout(() => setShareMsg(null), 2000); }
  };

  return (
    <>
      <section className="class-card class-code-card">
        <span className="class-muted">{t('Class code')}</span>
        <span className="class-code-big" dir="ltr">{cls.code}</span>
        <button className="clear-btn" onClick={tap(() => { void invite(); })}>{t('Share invite link')}</button>
        {shareMsg && <span className="class-muted" role="status">{shareMsg}</span>}
      </section>

      {data.error ? <LoadError onRetry={data.reload} /> : !data.data ? (
        <p className="class-muted">{t('Loading…')}</p>
      ) : (
        <>
          <section className="class-card">
            <div className="class-h-row">
              <h3 className="class-h">{t('Homework')}</h3>
              <button className="class-btn-primary class-small-btn" onClick={tap(onAssign)}>{t('Assign homework')}</button>
            </div>
            {data.data.homework.length === 0 ? (
              <p className="class-muted">{t('No homework yet.')}</p>
            ) : (
              <ul className="class-list">
                {data.data.homework.map((hw) => (
                  <HomeworkResults key={hw.id} hw={hw} members={data.data!.members}
                    attempts={data.data!.attempts.filter((a) => a.homework_id === hw.id)}
                    onDeleted={data.reload} />
                ))}
              </ul>
            )}
          </section>

          <section className="class-card">
            <h3 className="class-h">
              {t('Students')} <span className="class-muted">({data.data.members.length})</span>
            </h3>
            {data.data.members.length === 0 ? (
              <p className="class-muted">{t('No students yet. Share the code or the invite link with them.')}</p>
            ) : (
              <ul className="class-list">
                {data.data.members.map((m) => (
                  <li key={m.userId} className="class-member-row">
                    <span>{m.displayName}</span>
                    <button className="class-link-btn" onClick={tap(() => {
                      if (!window.confirm(t('Remove {name} from this class?').replace('{name}', m.displayName))) return;
                      removeMember(cls.id, m.userId).then(data.reload, (e) => console.warn('[classroom] remove', e));
                    })}>
                      {t('Remove')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <div className="class-danger">
        {confirmDelete ? (
          <>
            <span className="class-muted">{t('Delete this class, its homework and all results?')}</span>
            <button className="clear-btn" onClick={tap(() => {
              deleteClass(cls.id).then(onDeleted, (e) => console.warn('[classroom] deleteClass', e));
            })}>{t('Delete')}</button>
            <button className="clear-btn" onClick={tap(() => setConfirmDelete(false))}>{t('Cancel')}</button>
          </>
        ) : (
          <button className="class-link-btn" onClick={tap(() => setConfirmDelete(true))}>{t('Delete class')}</button>
        )}
      </div>
    </>
  );
}

function useShortDate() {
  const { lang } = useTranslation();
  return useMemo(() => {
    const fmt = new Intl.DateTimeFormat(dateLocale(lang), { day: 'numeric', month: 'short' });
    return (iso: string) => fmt.format(new Date(iso.length === 10 ? `${iso}T12:00:00` : iso));
  }, [lang]);
}

function HomeworkResults({ hw, members, attempts, onDeleted }: {
  hw: HomeworkRow; members: MemberRow[]; attempts: AttemptRow[]; onDeleted: () => void;
}) {
  const { t } = useTranslation();
  const shortDate = useShortDate();
  const [open, setOpen] = useState(false);
  const byStudent = useMemo(() => summariseAttempts(attempts), [attempts]);
  const practised = members.filter((m) => byStudent.has(m.userId)).length;
  const drill = parseHomeworkDrill(hw.drill, hw.instrumentId, { accidental: 'sharps', order: 'fifths' });
  const instrumentEmoji = isHomeworkInstrument(hw.instrumentId) ? getInstrument(hw.instrumentId).emoji : '🎸';

  return (
    <li className="class-hw">
      <button className="class-list-btn" aria-expanded={open} onClick={tap(() => setOpen((o) => !o))}>
        <span aria-hidden="true">{instrumentEmoji}</span>
        <span className="class-list-name">{hw.title}</span>
        <span className="class-muted">
          {t('{n} of {total} practised').replace('{n}', String(practised)).replace('{total}', String(members.length))}
        </span>
      </button>
      {open && (
        <div className="class-hw-body">
          {drill && <p className="class-muted">{describeHomework(drill, t)}</p>}
          {hw.dueOn && <p className="class-muted">{t('Due {date}').replace('{date}', shortDate(hw.dueOn))}</p>}
          <ul className="class-results">
            {members.map((m) => {
              const r = byStudent.get(m.userId);
              return (
                <li key={m.userId} className={r ? 'done' : 'todo'}>
                  <span>{m.displayName}</span>
                  <span className="class-muted">
                    {r
                      ? t('best {correct}/{total} · {n} tries · {date}')
                        .replace('{correct}', String(r.bestCorrect)).replace('{total}', String(r.bestTotal))
                        .replace('{n}', String(r.attempts)).replace('{date}', shortDate(r.lastAt))
                      : t('Not yet')}
                  </span>
                </li>
              );
            })}
          </ul>
          <button className="class-link-btn" onClick={tap(() => {
            if (!window.confirm(t('Delete this homework and its results?'))) return;
            deleteHomework(hw.id).then(onDeleted, (e) => console.warn('[classroom] deleteHomework', e));
          })}>
            {t('Delete homework')}
          </button>
        </div>
      )}
    </li>
  );
}

// ── Teacher: assign homework ────────────────────────────────────────────

function AssignView({ cls, onDone }: { cls: ClassRow; onDone: () => void }) {
  const { t } = useTranslation();
  const [picks, setPicks] = useState<HomeworkPicks>(() => defaultHomeworkPicks('guitar'));
  const [title, setTitle] = useState('');
  const [dueOn, setDueOn] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const instrument = getInstrument(picks.instrumentId);
  const drill = buildHomeworkDrill(picks);
  const frets = Array.from({ length: instrument.maxFret + 1 }, (_, f) => f);
  const stringNums = Array.from({ length: instrument.stringCount }, (_, i) => i + 1);
  const ready = title.trim().length > 0 && picks.strings.length > 0 && !busy;

  const set = (p: Partial<HomeworkPicks>) => setPicks((prev) => ({ ...prev, ...p }));

  return (
    <section className="class-card class-assign">
      <h3 className="class-h">{t('Assign homework')}</h3>
      <p className="class-muted">{t('A Notes drill: a fret is shown, the student names the note.')}</p>

      <label className="class-field">
        <span>{t('Title')}</span>
        <input className="class-input" maxLength={80} value={title} placeholder={t('e.g. Low E string, first 5 frets')}
          onChange={(e) => setTitle(e.target.value)} />
      </label>

      <div className="class-field">
        <span>{t('Instrument')}</span>
        <div className="class-chips">
          {HOMEWORK_INSTRUMENTS.map((id: InstrumentId) => (
            <button key={id} className={`fotd-instrument-btn${id === picks.instrumentId ? ' active' : ''}`}
              aria-pressed={id === picks.instrumentId}
              onClick={tap(() => setPicks({ ...defaultHomeworkPicks(id), naturalsOnly: picks.naturalsOnly, questionCount: picks.questionCount }))}>
              <span aria-hidden="true">{getInstrument(id).emoji}</span> {t(getInstrument(id).label)}
            </button>
          ))}
        </div>
      </div>

      <div className="class-field">
        <span>{t('Strings')}</span>
        <div className="class-chips" dir="ltr">
          {stringNums.map((s) => {
            const on = picks.strings.includes(s);
            return (
              <button key={s} className={`class-string-chip${on ? ' active' : ''}`} aria-pressed={on}
                title={t(instrument.stringLabels[s] ?? '')}
                onClick={tap(() => set({ strings: on ? picks.strings.filter((x) => x !== s) : [...picks.strings, s] }))}>
                {s} <small>{instrument.notes[s - 1]?.[0]}</small>
              </button>
            );
          })}
        </div>
      </div>

      <div className="class-field">
        <span>{t('Frets')}</span>
        <div className="class-inline-form" dir="ltr">
          <select className="class-input" value={picks.fretFrom} aria-label={t('From fret')}
            onChange={(e) => set({ fretFrom: Number(e.target.value) })}>
            {frets.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <span>–</span>
          <select className="class-input" value={picks.fretTo} aria-label={t('To fret')}
            onChange={(e) => set({ fretTo: Number(e.target.value) })}>
            {frets.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      <label className="class-check">
        <input type="checkbox" checked={picks.naturalsOnly} onChange={(e) => set({ naturalsOnly: e.target.checked })} />
        <span>{t('Natural notes only (no sharps or flats)')}</span>
      </label>

      <div className="class-field">
        <span>{t('Questions')}</span>
        <div className="class-chips">
          {HOMEWORK_QUESTION_COUNTS.map((n) => (
            <button key={n} className={`class-string-chip${n === picks.questionCount ? ' active' : ''}`}
              aria-pressed={n === picks.questionCount} onClick={tap(() => set({ questionCount: n }))}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <label className="class-field">
        <span>{t('Due date (optional)')}</span>
        <input className="class-input" type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} />
      </label>

      <p className="class-muted">{describeHomework(drill, t)}</p>

      <div className="class-row">
        <button className="clear-btn" onClick={tap(onDone)}>{t('Cancel')}</button>
        <button className="class-btn-primary" disabled={!ready} onClick={tap(() => {
          setBusy(true); setFailed(false);
          assignHomework({ classId: cls.id, title, instrumentId: picks.instrumentId, drill, dueOn: dueOn || null })
            .then(onDone, (e) => { console.warn('[classroom] assign', e); setFailed(true); })
            .finally(() => setBusy(false));
        })}>
          {t('Assign')}
        </button>
      </div>
      {failed && <p className="class-muted" role="status">{t('Something went wrong. Check your connection and try again.')}</p>}
    </section>
  );
}

// ── Student: one class ──────────────────────────────────────────────────

function StudyView({ user, cls, onRun, onLeft }: {
  user: User; cls: ClassRow; onRun: (hw: HomeworkRow) => void; onLeft: () => void;
}) {
  const { t } = useTranslation();
  const shortDate = useShortDate();
  const data = useLoad(async () => {
    const [homework, attempts] = await Promise.all([fetchHomework(cls.id), fetchAttempts(cls.id)]);
    // RLS already limits a student to their own attempts; the filter is belt
    // and braces. Keyed per homework for the "best 8/10 · 2 tries" line.
    const mine = new Map<string, StudentResult>();
    for (const hw of homework) {
      const r = summariseAttempts(attempts.filter((a) => a.user_id === user.id && a.homework_id === hw.id)).get(user.id);
      if (r) mine.set(hw.id, r);
    }
    return { homework, mine };
  }, [cls.id, user.id]);

  return (
    <>
      {cls.teacherName && (
        <p className="class-muted">{t('Teacher: {name}').replace('{name}', cls.teacherName)}</p>
      )}
      {data.error ? <LoadError onRetry={data.reload} /> : !data.data ? (
        <p className="class-muted">{t('Loading…')}</p>
      ) : (
        <section className="class-card">
          <h3 className="class-h">{t('Homework')}</h3>
          {data.data.homework.length === 0 ? (
            <p className="class-muted">{t('No homework yet.')}</p>
          ) : (
            <ul className="class-list">
              {data.data.homework.map((hw) => {
                const mine = data.data!.mine.get(hw.id);
                const runnable = parseHomeworkDrill(hw.drill, hw.instrumentId, { accidental: 'sharps', order: 'fifths' }) !== null;
                const meta = [
                  hw.dueOn ? t('Due {date}').replace('{date}', shortDate(hw.dueOn)) : null,
                  mine
                    ? t('best {correct}/{total} · {n} tries')
                      .replace('{correct}', String(mine.bestCorrect)).replace('{total}', String(mine.bestTotal))
                      .replace('{n}', String(mine.attempts))
                    : t('Not done yet'),
                ].filter(Boolean).join(' · ');
                return (
                  <li key={hw.id} className={`class-hw class-hw-student${mine ? ' done' : ''}`}>
                    <div className="class-hw-info">
                      <span className="class-list-name">{mine ? '✓ ' : ''}{hw.title}</span>
                      <span className="class-muted">{meta}</span>
                    </div>
                    {runnable ? (
                      <button className={mine ? 'clear-btn' : 'class-btn-primary class-small-btn'} onClick={tap(() => onRun(hw))}>
                        {t('Practice')}
                      </button>
                    ) : (
                      <span className="class-muted">{t('Update the app to open this homework.')}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
      <div className="class-danger">
        <button className="class-link-btn" onClick={tap(() => {
          if (!window.confirm(t('Leave this class? Your teacher will no longer see your results.'))) return;
          leaveClass(cls.id, user.id).then(onLeft, (e) => console.warn('[classroom] leave', e));
        })}>
          {t('Leave class')}
        </button>
      </div>
    </>
  );
}

function RunView({ user, cls, homework, onDone }: {
  user: User; cls: ClassRow; homework: HomeworkRow; onDone: () => void;
}) {
  const accidental: AccidentalMode = loadSetting('pref_accidental', 'sharps');
  const order: OrderMode = loadSetting('pref_order', 'fifths');
  const notation: NotationMode = loadSetting('pref_notation', 'alpha');
  const drill = useMemo(
    () => parseHomeworkDrill(homework.drill, homework.instrumentId, { accidental, order }),
    [homework, accidental, order],
  );
  // StudyView only offers runnable homework, so this is a can't-happen guard.
  if (!drill || !isHomeworkInstrument(homework.instrumentId)) return null;
  return (
    <HomeworkRun
      title={homework.title}
      instrumentId={homework.instrumentId}
      drill={drill}
      accidental={accidental}
      order={order}
      notation={notation}
      onFinished={(r) => submitAttempt({ homeworkId: homework.id, classId: cls.id, userId: user.id, ...r })}
      onDone={onDone}
    />
  );
}
