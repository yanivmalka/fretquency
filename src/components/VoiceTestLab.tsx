import { useCallback, useEffect, useRef, useState } from 'react';
import { openMicSession, UtteranceVad, CAPTURE_BLOCK } from '../utils/utteranceCapture';
import {
  answerPlan, calibrationPlan, clearTakes, deleteTake, exportTar, listTakes, promptText,
  saveTake, summarize, type TakeKind, type TestNotation, type TestPrompt,
} from '../utils/voiceTestset';
import { playClickSound, haptic } from '../utils/feedback';
import { useTranslation } from '../i18n/useTranslation';

// Admin tool: records labelled takes of real speakers for the offline
// end-to-end voice score (`scripts/eval-voice-e2e.mts`). See
// `utils/voiceTestset.ts` for what is stored and why.
//
// Each take opens a fresh microphone, exactly as the recogniser does per
// listen turn, shows the prompt, and runs the app's own VAD live
// (calibration or answer settings) only to decide when to stop; the whole
// raw stream is kept, plus a short tail, so the offline replay sees what the
// live VAD saw.

// Mirrors the app: calibration uses `captureUtterance`'s defaults, a
// question-time answer the segmented engine's longer limits.
const VAD_CFG: Record<TakeKind, { trailingSilenceMs: number; maxSpeechMs: number }> = {
  cal: { trailingSilenceMs: 350, maxSpeechMs: 2500 },
  ans: { trailingSilenceMs: 500, maxSpeechMs: 3500 },
};
const ONSET_TIMEOUT_S = 4;
const TAIL_S = 0.6;
const GAP_MS = 700;

const CONDITIONS = ['quiet', 'tv-music', 'talking', 'other'] as const;
const CONDITION_LABEL: Record<(typeof CONDITIONS)[number], string> = {
  quiet: 'Quiet room',
  'tv-music': 'TV / music in the background',
  talking: 'People talking nearby',
  other: 'Other noise',
};

type RawResult =
  | { kind: 'ok'; stream: Float32Array; sampleRate: number; liveSamples: number }
  | { kind: 'no-speech' }
  | { kind: 'no-mic' }
  | { kind: 'aborted' };

/** Record the raw stream for one prompt, stopping where the live VAD would. */
async function recordRaw(
  kind: TakeKind,
  signal: AbortSignal,
  onLevel: (rms: number) => void,
): Promise<RawResult> {
  const session = await openMicSession();
  if (!session) return { kind: 'no-mic' };
  if (signal.aborted) { session.close(); return { kind: 'aborted' }; }
  const { ctx, source, sampleRate } = session;
  if (ctx.state === 'suspended') {
    try { await ctx.resume(); } catch { /* noop */ }
  }
  const processor = ctx.createScriptProcessor(CAPTURE_BLOCK, 1, 1);
  const sink = ctx.createGain();
  const cfg = VAD_CFG[kind];
  const vad = new UtteranceVad(sampleRate, cfg.trailingSilenceMs, cfg.maxSpeechMs, CAPTURE_BLOCK);
  const blocks: Float32Array[] = [];
  let liveSamples = 0;
  let tailLeft = -1;

  return await new Promise<RawResult>((resolve) => {
    let done = false;
    const finish = (r: RawResult) => {
      if (done) return;
      done = true;
      signal.removeEventListener('abort', onAbort);
      try { source.disconnect(processor); } catch { /* noop */ }
      try { processor.disconnect(); } catch { /* noop */ }
      try { sink.disconnect(); } catch { /* noop */ }
      session.close();
      resolve(r);
    };
    const onAbort = () => finish({ kind: 'aborted' });
    signal.addEventListener('abort', onAbort);

    const stream = () => {
      const n = blocks.reduce((s, b) => s + b.length, 0);
      const out = new Float32Array(n);
      let off = 0;
      for (const b of blocks) { out.set(b, off); off += b.length; }
      return out;
    };

    processor.onaudioprocess = (e: AudioProcessingEvent) => {
      if (done) return;
      const block = new Float32Array(e.inputBuffer.getChannelData(0));
      blocks.push(block);
      if (tailLeft >= 0) {
        tailLeft -= block.length;
        if (tailLeft <= 0) finish({ kind: 'ok', stream: stream(), sampleRate, liveSamples });
        return;
      }
      const step = vad.push(block);
      onLevel(vad.lastRms);
      if (step.kind === 'done') {
        liveSamples = step.pcm.length;
        tailLeft = TAIL_S * sampleRate;
        onLevel(0);
      } else if (!vad.started && vad.waitedSamples >= ONSET_TIMEOUT_S * sampleRate) {
        vad.logOnsetTimeout();
        finish({ kind: 'no-speech' });
      }
    };
    source.connect(processor);
    sink.gain.value = 0;
    processor.connect(sink);
    sink.connect(ctx.destination);
  });
}

function readLs(key: string, fallback: string): string {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function writeLs(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

interface Props { onClose: () => void }

export default function VoiceTestLab({ onClose }: Props) {
  const { t } = useTranslation();
  const [speaker, setSpeaker] = useState(() => readLs('voiceLab.speaker', ''));
  const [condition, setCondition] = useState(() => readLs('voiceLab.condition', 'quiet'));
  const [device, setDevice] = useState(() => readLs(
    'voiceLab.device',
    /Android|iPhone|iPad/i.test(navigator.userAgent) ? 'phone' : 'computer',
  ));
  const [notation, setNotation] = useState<TestNotation>(
    () => (readLs('voiceLab.notation', 'alpha') === 'solfege' ? 'solfege' : 'alpha'),
  );
  const [rounds, setRounds] = useState(2);

  const [plan, setPlan] = useState<TestPrompt[] | null>(null);
  const [pos, setPos] = useState(0);
  const [running, setRunning] = useState(false);
  const [level, setLevel] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [lastId, setLastId] = useState<number | null>(null);
  const [summary, setSummary] = useState<{ key: string; n: number }[]>([]);
  const [total, setTotal] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const [busy, setBusy] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  // Bumped by every start/resume/pause/discard. A loop runs only while its
  // own generation is current, so a paused loop still unwinding from its
  // aborted recording can never stop (or race) the one started after it.
  const genRef = useRef(0);
  const posRef = useRef(0);

  const refresh = useCallback(async () => {
    try {
      const takes = await listTakes();
      setSummary(summarize(takes));
      setTotal(takes.length);
    } catch {
      setMsg(t('Could not read the stored takes'));
    }
  }, [t]);

  useEffect(() => {
    let alive = true;
    listTakes().then((takes) => {
      if (!alive) return;
      setSummary(summarize(takes));
      setTotal(takes.length);
    }).catch(() => { /* the summary just stays empty */ });
    return () => { alive = false; };
  }, []);
  useEffect(() => () => { genRef.current++; abortRef.current?.abort(); }, []);

  const click = () => { playClickSound(); haptic.tap(); };

  const loop = useCallback(async (p: TestPrompt[], gen: number) => {
    const meta = { speaker: speaker.trim(), condition, device, notation };
    const live = () => genRef.current === gen;
    let misses = 0;
    while (live() && posRef.current < p.length) {
      const prompt = p[posRef.current];
      const abort = new AbortController();
      abortRef.current = abort;
      setMsg(null);
      const r = await recordRaw(prompt.kind, abort.signal, (rms) => setLevel(Math.min(1, rms * 6)));
      setLevel(0);
      if (r.kind === 'aborted' || !live()) break;
      if (r.kind === 'no-mic') {
        setMsg(t('Could not use the microphone — try again'));
        break;
      }
      if (r.kind === 'no-speech') {
        // Three silent prompts in a row: the speaker stepped away — pause.
        if (++misses >= 3) { setMsg(t('Nothing heard — paused')); break; }
        setMsg(t('Nothing heard — say it again'));
        continue;
      }
      misses = 0;
      try {
        const id = await saveTake({ ...meta, ...prompt }, r.stream, r.sampleRate, r.liveSamples);
        setLastId(id);
        setTotal((n) => n + 1);
        haptic.tap();
      } catch {
        setMsg(t('Saving the recording failed'));
        break;
      }
      posRef.current++;
      setPos(posRef.current);
      await new Promise((res) => setTimeout(res, GAP_MS));
    }
    if (live()) setRunning(false);
    void refresh();
  }, [speaker, condition, device, notation, refresh, t]);

  const run = (p: TestPrompt[]) => {
    const gen = ++genRef.current;
    setRunning(true);
    void loop(p, gen);
  };

  const halt = () => {
    genRef.current++;
    abortRef.current?.abort();
    setRunning(false);
  };

  const start = (which: 'cal' | 'ans' | 'both') => {
    click();
    if (!speaker.trim()) { setMsg(t('Enter the speaker\'s name first')); return; }
    writeLs('voiceLab.speaker', speaker.trim());
    writeLs('voiceLab.condition', condition);
    writeLs('voiceLab.device', device);
    writeLs('voiceLab.notation', notation);
    const p = which === 'cal' ? calibrationPlan()
      : which === 'ans' ? answerPlan(rounds)
        : [...calibrationPlan(), ...answerPlan(rounds)];
    setPlan(p);
    posRef.current = 0;
    setPos(0);
    setLastId(null);
    run(p);
  };

  const resume = () => {
    click();
    if (plan) run(plan);
  };

  const pause = () => {
    click();
    halt();
  };

  // Drop the last saved take and step back so its prompt comes up again.
  const discardLast = async () => {
    click();
    if (lastId === null) return;
    const wasRunning = running;
    halt();
    try { await deleteTake(lastId); } catch { /* ignore */ }
    setLastId(null);
    posRef.current = Math.max(0, posRef.current - 1);
    setPos(posRef.current);
    void refresh();
    if (wasRunning && plan) run(plan);
  };

  const download = async () => {
    click();
    setBusy(true);
    try {
      const takes = await listTakes();
      const blob = exportTar(takes);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voice-testset-${new Date().toISOString().slice(0, 10)}.tar`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      setMsg(t('Export failed'));
    } finally {
      setBusy(false);
    }
  };

  const clearAll = async () => {
    click();
    if (!confirmClear) { setConfirmClear(true); return; }
    setConfirmClear(false);
    await clearTakes();
    void refresh();
  };

  const prompt = plan && pos < plan.length ? plan[pos] : null;
  const text = prompt ? promptText(prompt, notation) : null;
  const finished = !!plan && pos >= plan.length;

  return (
    <div className="vcal-backdrop vlab-backdrop" role="dialog" aria-label={t('Voice test lab')}>
      <div className="vcal-card vlab-card">
        <div className="vcal-head">
          <span className="vcal-title">🎙 {t('Voice test lab')}</span>
          <button className="vcal-x" onClick={() => { pause(); onClose(); }} aria-label={t('Close')}>✕</button>
        </div>

        {!plan || finished ? (
          <>
            <p className="vcal-hint vlab-intro">
              {t('Records labelled takes for measuring voice recognition offline. Nothing is uploaded — download the file at the end.')}
            </p>
            {finished && <p className="vlab-done">✓ {t('Session finished')}</p>}
            <label className="vcal-profile">
              {t('Speaker')}
              <input value={speaker} onChange={(e) => setSpeaker(e.target.value)} placeholder="yaniv / dad" />
            </label>
            <label className="vcal-profile">
              {t('Surroundings')}
              <select className="vlab-select" value={condition} onChange={(e) => setCondition(e.target.value)}>
                {CONDITIONS.map((c) => <option key={c} value={c}>{t(CONDITION_LABEL[c])}</option>)}
              </select>
            </label>
            <label className="vcal-profile">
              {t('Device')}
              <select className="vlab-select" value={device} onChange={(e) => setDevice(e.target.value)}>
                <option value="phone">{t('Phone')}</option>
                <option value="computer">{t('Computer')}</option>
              </select>
            </label>
            <label className="vcal-profile">
              {t('Note names')}
              <select className="vlab-select" value={notation} onChange={(e) => setNotation(e.target.value as TestNotation)}>
                <option value="alpha">A B C</option>
                <option value="solfege">Do Re Mi</option>
              </select>
            </label>
            <label className="vcal-profile">
              {t('Answer rounds (17 notes each)')}
              <select className="vlab-select" value={rounds} onChange={(e) => setRounds(Number(e.target.value))}>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <div className="vcal-actions">
              <button className="vcal-btn vcal-rec" onClick={() => start('both')}>{t('Calibration + answers')}</button>
            </div>
            <div className="vcal-actions">
              <button className="vcal-btn" onClick={() => start('cal')}>{t('Calibration only')}</button>
              <button className="vcal-btn" onClick={() => start('ans')}>{t('Answers only')}</button>
            </div>
          </>
        ) : (
          <>
            <div className="vcal-progress">
              {pos + 1} / {plan.length} · {prompt?.kind === 'cal' ? t('Calibration') : t('Answers')}
              <div className="vcal-progress-track">
                <div className="vcal-progress-fill" style={{ width: `${(pos / plan.length) * 100}%` }} />
              </div>
            </div>
            <div className="vcal-prompt" dir="ltr">
              <span className="vcal-note">{text?.show}</span>
              <span className="vcal-here">“{text?.say}”</span>
            </div>
            <p className="vcal-hint">
              {prompt?.kind === 'cal'
                ? t('Say just this word, on its own')
                : t('Say it the way you would answer in a drill — naturally, no special pause')}
            </p>
            <div className={`vcal-meter${running ? ' is-live' : ''}`}>
              <div className="vcal-meter-fill" style={{ width: `${level * 100}%` }} />
            </div>
            <div className="vcal-actions">
              {running
                ? <button className="vcal-btn" onClick={pause}>{t('Pause')}</button>
                : <button className="vcal-btn vcal-rec" onClick={resume}>{t('Continue')}</button>}
              <button className="vcal-btn" onClick={() => { void discardLast(); }} disabled={lastId === null}>
                {t('Discard last take')}
              </button>
            </div>
            {!running && (
              <div className="vcal-actions">
                <button className="vcal-btn" onClick={() => { click(); setPlan(null); }}>{t('End session')}</button>
              </div>
            )}
          </>
        )}

        {msg && <p className="vcal-err">{msg}</p>}

        <div className="vlab-store">
          <div className="vcal-progress">{t('Stored on this device')}: {total}</div>
          {summary.map((s) => (
            <div key={s.key} className="vlab-row" dir="ltr"><span>{s.key}</span><span>{s.n}</span></div>
          ))}
          <div className="vcal-actions">
            <button className="vcal-btn" onClick={() => { void download(); }} disabled={!total || busy || running}>
              {t('Download all (.tar)')}
            </button>
            <button className="vcal-btn" onClick={() => { void clearAll(); }} disabled={!total || running}>
              {confirmClear ? t('Tap again to delete') : t('Delete all')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
