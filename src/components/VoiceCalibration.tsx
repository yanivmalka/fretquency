import { useCallback, useEffect, useRef, useState } from 'react';
import { displayNote, type AccidentalMode, type NotationMode } from '../utils/music';
import { captureUtterance, isolateWord } from '../utils/utteranceCapture';
import { computeMfcc, framesToJson, framesFromJson } from '../utils/mfcc';
import { dtwDistance } from '../utils/dtw';
import {
  addTemplate, deleteProfile, deleteTemplateByKey, getActiveProfile,
  listLabelTemplates, loadTemplates, recomputeReady, setActiveProfile, templateCounts,
  ADAPTIVE_PROFILE,
} from '../utils/voiceProfile';
import {
  LETTER_LABELS, ACCIDENTAL_LABELS, PROFILE_LABELS, SAMPLES_PER_LABEL, profileVocabId,
} from '../utils/voiceProfileVocab';
import { resemblesSpokenNote } from '../utils/calibrationGate';
import { resetSpeechEngine } from '../utils/speech';
import { cloudInsertTemplate, cloudDeleteTemplate, cloudDeleteProfile } from '../utils/voiceSync';
import type { SpeechNotation } from '../utils/speechVocab';
import { playClickSound, getFeedbackAudioCtx, haptic } from '../utils/feedback';
import { useTranslation } from '../i18n/useTranslation';
import { encodeWav } from '../utils/wavEncode';

// Canonical letter -> filename fragment, matching `scripts/wav-lib.mts`'s
// `classify()` naming (`alpha_<frag>_*.wav` / `solfege_<frag>_*.wav`), so a
// recording exported here can be fed straight into `scripts/eval-voice.mts`.
const ALPHA_FRAG: Record<string, string> = {
  A: 'A', B: 'B', C: 'C', D: 'D', E: 'E', F: 'F', G: 'G',
};
const SOLFEGE_FRAG: Record<string, string> = {
  C: 'do', D: 're', E: 'mi', F: 'fa', G: 'sol', A: 'la', B: 'si',
};
// The spoken word for an accidental, in the language the player will say it
// in: the notation picks the family (letters vs do-re-mi), the UI language the
// spelling. German says the ending ("Cis", "Des"), Japanese the English loan.
function accidentalWordFor(label: string, notation: NotationMode, lang: string): string {
  const sharp = label === '#';
  if (lang === 'ja') return sharp ? 'シャープ' : 'フラット';
  if (notation === 'german') return sharp ? 'is' : 'es';
  if (notation === 'solfege') {
    if (lang === 'es') return sharp ? 'sostenido' : 'bemol';
    if (lang === 'pt-BR') return sharp ? 'sustenido' : 'bemol';
    if (lang === 'it') return sharp ? 'diesis' : 'bemolle';
    return sharp ? 'dièse' : 'bémol';
  }
  return sharp ? 'sharp' : 'flat';
}

function exportFileStem(notation: NotationMode, label: string): string {
  const set = notation === 'solfege' ? 'solfege' : 'alpha';
  if (label === '#') return `${set}_${notation === 'solfege' ? 'diese' : 'sharp'}`;
  if (label === 'b') return `${set}_${notation === 'solfege' ? 'bemol' : 'flat'}`;
  const frag = (notation === 'solfege' ? SOLFEGE_FRAG : ALPHA_FRAG)[label] ?? label;
  return `${set}_${frag}`;
}


// How many extra takes to prompt for, per label, when the self-test flags a
// pair as acoustically too close — on top of the usual SAMPLES_PER_LABEL.
const EXTRA_TAKES = 3;

interface Props {
  notation: NotationMode;
  accidental: AccidentalMode;
  onClose: () => void;
  /** Called after the profile changed so the parent can re-pick the engine. */
  onProfileChanged: () => void;
}

type RecState = 'idle' | 'recording' | 'thinking';

// A one-time, on-device calibration. Instead of every accidental note as a
// whole phrase, the user records nine short isolated words: the seven
// natural letters plus the accidental words "sharp"/"dièse" and "flat".
// At question time the recogniser splits the spoken answer and matches each
// part. Nothing leaves the device.
//
// Recording is automatic: the user presses "Start" once and then just
// speaks each word as it appears. Every capture is checked against the
// bundled general reference (`calibrationGate`) so background noise is not
// saved as a template, and each take can be deleted individually if it
// still came out wrong.
export default function VoiceCalibration({ notation, accidental, onClose, onProfileChanged }: Props) {
  const { t, lang } = useTranslation();
  const vocabId = profileVocabId(notation as SpeechNotation);
  const [profile, setProfile] = useState(() => getActiveProfile() ?? 'My profile');
  const [idx, setIdx] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [takes, setTakes] = useState<{ key: string; createdAt: number }[]>([]);
  const [rec, setRec] = useState<RecState>('idle');
  const [level, setLevel] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  // Raw PCM of the most recent capture, so the user can hear what was recorded.
  const lastPcmRef = useRef<{ pcm: Float32Array; sampleRate: number } | null>(null);
  const [hasLast, setHasLast] = useState(false);
  const [selfTest, setSelfTest] = useState<string[] | null>(null);
  const [closePairs, setClosePairs] = useState<{ a: string; b: string }[]>([]);
  const [testing, setTesting] = useState(false);
  // Set while recording extra takes for one flagged pair — overrides the
  // per-label target for just those two labels and confines auto-run to
  // cycling between them instead of the full label list.
  const [extraPair, setExtraPair] = useState<{ a: string; b: string } | null>(null);
  const [extraTarget, setExtraTarget] = useState<Record<string, number>>({});
  const abortRef = useRef<AbortController | null>(null);
  const autoTimerRef = useRef<number | null>(null);
  // Consecutive failed/empty/rejected captures while running; a short run of
  // them means the mic is unusable or the room is too noisy, so auto mode
  // stops instead of looping forever.
  const autoMissRef = useRef(0);
  // Optional: when set, every accepted take is also written out as a WAV —
  // the trimmed word, exactly what gets stored as a template — for offline
  // work with `scripts/eval-voice.mts`. Session-only (a directory handle
  // can't be persisted to localStorage); the user re-picks the folder each
  // time they want to export. Chrome/Edge desktop only.
  const exportDirRef = useRef<FileSystemDirectoryHandle | null>(null);
  const exportCounterRef = useRef<Record<string, number>>({});
  const [exporting, setExporting] = useState(false);
  const [exportErr, setExportErr] = useState<string | null>(null);
  const exportSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  const label = PROFILE_LABELS[idx];
  const isAccidental = (ACCIDENTAL_LABELS as readonly string[]).includes(label);
  // The accidental word follows the notation and language: "sharp"/"flat" for A-B-C,
  // "dièse"/"bémol" for do-re-mi. Always shown in its own language, never
  // transliterated to Hebrew.
  const accidentalWord = accidentalWordFor(label, notation, lang);
  const prompt = isAccidental
    ? accidentalWord
    : displayNote(label, accidental, notation);
  const hint = isAccidental
    ? t('Say just this word, on its own')
    : t('Say just the note name, on its own');

  // Display text for any label (letter or accidental), for the self-test list.
  const labelText = useCallback((l: string) => {
    if ((ACCIDENTAL_LABELS as readonly string[]).includes(l)) {
      return accidentalWordFor(l, notation, lang);
    }
    return displayNote(l, accidental, notation);
  }, [notation, accidental, lang]);

  const refreshCounts = useCallback(async (name: string) => {
    const c = await templateCounts(name, vocabId, true);
    setCounts(c);
  }, [vocabId]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const c = await templateCounts(profile, vocabId, true);
      if (alive) setCounts(c);
    })();
    return () => { alive = false; };
  }, [profile, vocabId]);

  // The individual takes for the word on screen, so the user can delete a
  // specific bad recording rather than wiping the whole label.
  useEffect(() => {
    let alive = true;
    void (async () => {
      const t = await listLabelTemplates(profile, vocabId, label);
      if (alive) setTakes(t);
    })();
    return () => { alive = false; };
  }, [profile, vocabId, label, counts]);

  useEffect(() => () => {
    abortRef.current?.abort();
    if (autoTimerRef.current !== null) clearTimeout(autoTimerRef.current);
  }, []);

  const total = PROFILE_LABELS.length;
  const doneLabels = PROFILE_LABELS.filter((n) => (counts[n] ?? 0) >= SAMPLES_PER_LABEL).length;
  const allDone = doneLabels === total;

  // Best-effort write of one accepted take to the picked export folder.
  // Failure here must never affect calibration itself — it only surfaces a
  // one-line status so the user knows to re-pick the folder if permission
  // was revoked mid-session.
  const exportTake = useCallback(async (pcm: Float32Array, sampleRate: number, forLabel: string) => {
    const dir = exportDirRef.current;
    if (!dir) return;
    try {
      const stem = exportFileStem(notation, forLabel);
      const n = (exportCounterRef.current[stem] ?? 0) + 1;
      exportCounterRef.current[stem] = n;
      const handle = await dir.getFileHandle(`${stem}_r${n}.wav`, { create: true });
      const writable = await handle.createWritable();
      await writable.write(encodeWav(pcm, sampleRate));
      await writable.close();
      setExportErr(null);
    } catch {
      setExportErr(t('Could not write to the export folder — pick it again'));
    }
  }, [notation, t]);

  const record = useCallback(async () => {
    if (rec !== 'idle') return;
    playClickSound(); haptic.tap();
    setErr(null);
    setRec('recording');
    const abort = new AbortController();
    abortRef.current = abort;
    // Everything from here is wrapped so a failure in capture, feature
    // extraction or storage can never leave `rec` stuck non-idle — that
    // would disable every button on the panel (Previous/Next/Delete/…).
    try {
      let captured: { pcm: Float32Array; sampleRate: number } | null = null;
      try {
        captured = await captureUtterance({
          signal: abort.signal,
          onLevel: (rms) => setLevel(Math.min(1, rms * 6)),
        });
      } catch {
        setErr(t('Could not use the microphone — try again'));
        autoMissRef.current++;
        return;
      }
      setLevel(0);
      if (abort.signal.aborted) return;
      if (!captured) {
        setErr(t('No sound captured — try again, closer to the mic'));
        autoMissRef.current++;
        return;
      }
      lastPcmRef.current = captured;
      setHasLast(true);
      setRec('thinking');
      try {
        // Trim to the spoken word exactly as `templateSpeechEngine` trims a
        // question-time segment. Storing the untrimmed capture instead left
        // several hundred ms of trailing silence in every template, which DTW
        // then charged against every comparison — see `isolateWord`.
        const isolated = isolateWord(captured.pcm, captured.sampleRate);
        const { frames } = computeMfcc(isolated, captured.sampleRate);
        if (!frames.length) {
          setErr(t('Recording too short — try again'));
          autoMissRef.current++;
        } else if (!(await resemblesSpokenNote(frames, label, vocabId))) {
          // Sounded like noise, not a spoken note — don't save it.
          setErr(t("That didn't sound like a note — try again"));
          autoMissRef.current++;
        } else {
          // Stop pressed (or the panel closed) while this take was still being
          // processed — don't persist it. The outer `finally` still restores
          // `rec` to idle.
          if (abort.signal.aborted) return;
          const stored = await addTemplate(profile, vocabId, label, framesToJson(frames));
          void cloudInsertTemplate(stored);
          await refreshCounts(profile);
          autoMissRef.current = 0;
          haptic.tap();
          void exportTake(isolated, captured.sampleRate, label);
        }
      } catch {
        setErr(t('Saving the recording failed'));
        autoMissRef.current++;
      }
    } finally {
      setRec('idle');
    }
  }, [rec, profile, vocabId, label, refreshCounts, exportTake, t]);

  const toggleExport = useCallback(async () => {
    playClickSound(); haptic.tap();
    if (exportDirRef.current) {
      exportDirRef.current = null;
      setExporting(false);
      setExportErr(null);
      return;
    }
    try {
      const picker = (window as unknown as {
        showDirectoryPicker: (opts?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>;
      }).showDirectoryPicker;
      const dir = await picker({ mode: 'readwrite' });
      exportDirRef.current = dir;
      exportCounterRef.current = {};
      setExporting(true);
      setExportErr(null);
    } catch {
      // User cancelled the picker, or permission was refused — not an error.
    }
  }, []);

  const stopRun = useCallback(() => {
    setRunning(false);
    setExtraPair(null);
    setExtraTarget({});
    autoMissRef.current = 0;
    if (autoTimerRef.current !== null) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    abortRef.current?.abort();
  }, []);

  const toggleRun = () => {
    playClickSound(); haptic.tap();
    if (running) { stopRun(); return; }
    autoMissRef.current = 0;
    setErr(null);
    setRunning(true);
  };

  // Compare every recorded word against every other and flag pairs that are
  // acoustically too close to tell apart — the usual culprits are B/E/G/D.
  const runSelfTest = useCallback(async () => {
    setTesting(true);
    try {
      const rows = await loadTemplates(profile, vocabId);
      const byLabel = new Map<string, Float32Array[][]>();
      for (const r of rows) {
        const arr = byLabel.get(r.label) ?? [];
        arr.push(framesFromJson(r.frames));
        byLabel.set(r.label, arr);
      }
      const labels = [...byLabel.keys()];
      const warns: string[] = [];
      const pairs: { a: string; b: string }[] = [];
      for (let i = 0; i < labels.length; i++) {
        for (let j = i + 1; j < labels.length; j++) {
          const a = byLabel.get(labels[i])!;
          const b = byLabel.get(labels[j])!;
          let cross = Infinity;
          for (const x of a) for (const y of b) cross = Math.min(cross, dtwDistance(x, y));
          // Tightest spread within either label, as a yardstick for "close".
          let within = Infinity;
          for (const set of [a, b]) {
            for (let p = 0; p < set.length; p++) {
              for (let q = p + 1; q < set.length; q++) {
                within = Math.min(within, dtwDistance(set[p], set[q]));
              }
            }
          }
          // Without at least one within-label pair there is no yardstick for
          // "close", so skip rather than warn on everything.
          if (!Number.isFinite(within) || !Number.isFinite(cross)) continue;
          if (cross <= within * 1.15) {
            const a = labelText(labels[i]);
            const b = labelText(labels[j]);
            warns.push(
              t('“{a}” and “{b}” sound very similar — re-record one of them.')
                .replace('{a}', a).replace('{b}', b),
            );
            pairs.push({ a: labels[i], b: labels[j] });
          }
        }
      }
      setSelfTest(warns);
      setClosePairs(pairs);
    } finally {
      setTesting(false);
    }
  }, [profile, vocabId, labelText, t]);

  // Start a focused round of extra takes for one flagged pair, on top of the
  // takes already recorded — more calibration data on the exact pair a user
  // confuses is cheap and, on real recordings, closed most of the B/D gap
  // without touching the matcher at all.
  const startExtraTakes = (pair: { a: string; b: string }) => {
    playClickSound(); haptic.tap();
    setExtraTarget({
      [pair.a]: (counts[pair.a] ?? 0) + EXTRA_TAKES,
      [pair.b]: (counts[pair.b] ?? 0) + EXTRA_TAKES,
    });
    setExtraPair(pair);
    setSelfTest(null);
    setClosePairs([]);
    setErr(null);
    autoMissRef.current = 0;
    const startIdx = PROFILE_LABELS.findIndex((n) => n === pair.a);
    if (startIdx >= 0) setIdx(startIdx);
    setRunning(true);
  };

  // Once started, keep cycling — record the current word, and when it has
  // enough samples jump to the next word that still needs some — so the user
  // only has to speak, never tap anything between takes. While `extraPair` is
  // set, cycling stays confined to that pair's two labels and, once both hit
  // their (higher) target, the self-test re-runs automatically so the user
  // sees right away whether the extra takes actually resolved the pair.
  useEffect(() => {
    if (!running || rec !== 'idle') return;
    if (autoMissRef.current >= 3) { stopRun(); return; }

    const target = extraTarget[label] ?? SAMPLES_PER_LABEL;
    const needsHere = (counts[label] ?? 0) < target;
    if (needsHere) {
      autoTimerRef.current = window.setTimeout(() => { void record(); }, 800);
    } else if (extraPair) {
      const other = label === extraPair.a ? extraPair.b : extraPair.a;
      const otherTarget = extraTarget[other] ?? SAMPLES_PER_LABEL;
      if ((counts[other] ?? 0) < otherTarget) {
        setIdx(PROFILE_LABELS.findIndex((n) => n === other));
      } else {
        stopRun();
        void runSelfTest();
      }
    } else {
      const nextAfter = PROFILE_LABELS.findIndex(
        (n, i) => i > idx && (counts[n] ?? 0) < SAMPLES_PER_LABEL,
      );
      const nextAny = nextAfter >= 0
        ? nextAfter
        : PROFILE_LABELS.findIndex((n) => (counts[n] ?? 0) < SAMPLES_PER_LABEL);
      if (nextAny >= 0) setIdx(nextAny);
      else stopRun(); // everything recorded
    }

    return () => {
      if (autoTimerRef.current !== null) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    };
  }, [running, rec, counts, idx, label, record, stopRun, extraPair, extraTarget, runSelfTest]);

  const playLast = useCallback(() => {
    const cap = lastPcmRef.current;
    if (!cap) return;
    playClickSound();
    try {
      // Reuse the click-sound module's persistent AudioContext rather than
      // constructing a fresh one: a freshly-constructed context stayed
      // silent on at least one iOS device even after resume(), while this
      // one is already proven to produce audible sound (the click itself).
      const ctx = getFeedbackAudioCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      const buf = ctx.createBuffer(1, cap.pcm.length, cap.sampleRate);
      buf.getChannelData(0).set(cap.pcm);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start();
    } catch { /* playback is a nicety — ignore failures */ }
  }, []);

  const removeTake = async (key: string) => {
    playClickSound(); haptic.tap();
    await deleteTemplateByKey(key);
    void cloudDeleteTemplate(key);
    await refreshCounts(profile);
  };

  const step = (d: number) => {
    playClickSound(); haptic.tap();
    setIdx((i) => Math.max(0, Math.min(total - 1, i + d)));
  };

  const finish = async () => {
    playClickSound(); haptic.tap();
    setActiveProfile(profile);
    await recomputeReady(vocabId, [...PROFILE_LABELS], SAMPLES_PER_LABEL);
    resetSpeechEngine();
    onProfileChanged();
    onClose();
  };

  const wipe = async () => {
    playClickSound();
    await deleteProfile(profile);
    void cloudDeleteProfile(profile);
    await recomputeReady(vocabId, [...PROFILE_LABELS]);
    resetSpeechEngine();
    onProfileChanged();
    await refreshCounts(profile);
  };

  const wipeLearned = async () => {
    playClickSound();
    await deleteProfile(ADAPTIVE_PROFILE);
    resetSpeechEngine();
    onProfileChanged();
  };

  const here = counts[label] ?? 0;
  // Never show a target lower than what's already recorded — `extraTarget`
  // resets once a focused round finishes, and without this the display
  // would snap back to the baseline SAMPLES_PER_LABEL even though the label
  // already has more takes than that.
  const target = Math.max(SAMPLES_PER_LABEL, extraTarget[label] ?? 0, here);
  const lettersDone = LETTER_LABELS.filter((n) => (counts[n] ?? 0) >= SAMPLES_PER_LABEL).length;

  return (
    <div className="vcal-backdrop" role="dialog" aria-label={t('Voice calibration')}>
      <div className="vcal-card">
        <div className="vcal-head">
          <span className="vcal-title">{t('Personal voice calibration')}</span>
          <button className="vcal-x" onClick={() => { playClickSound(); onClose(); }} aria-label={t('Close')}>✕</button>
        </div>

        <label className="vcal-profile">
          {t('Profile name')}
          <input
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            spellCheck={false}
          />
        </label>

        <div className="vcal-progress">
          {t('Recorded')} {doneLabels}/{total} ({lettersDone}/{LETTER_LABELS.length} {t('notes')}, {doneLabels - lettersDone}/{ACCIDENTAL_LABELS.length} {t('accidentals')})
          <div className="vcal-progress-track">
            <div className="vcal-progress-fill" style={{ width: `${(doneLabels / total) * 100}%` }} />
          </div>
        </div>

        <div className="vcal-hint">
          {t('Speak clearly and pause briefly between words — later, when answering, say the letter, pause, then “sharp” / “flat” as two separate words.')}
        </div>

        <div className="vcal-prompt">
          <span className="vcal-prompt-label">{t('Say:')}</span>
          <span className="vcal-note">{prompt}</span>
          <span className="vcal-here">{here} / {target} {t('recordings')}</span>
        </div>
        <div className="vcal-hint">{hint}</div>
        {extraPair && (
          <div className="vcal-hint vcal-extra-hint">
            {t('Recording extra takes to tell “{a}” and “{b}” apart')
              .replace('{a}', labelText(extraPair.a)).replace('{b}', labelText(extraPair.b))}
          </div>
        )}

        <div className={`vcal-meter${rec === 'recording' ? ' is-live' : ''}`}>
          <div className="vcal-meter-fill" style={{ width: `${level * 100}%` }} />
        </div>

        {err && <div className="vcal-err">{err}</div>}

        {hasLast && (
          <button className="vcal-btn vcal-link" onClick={playLast} disabled={rec !== 'idle'}>
            ▶ {t('Play last recording')}
          </button>
        )}

        {import.meta.env.DEV && exportSupported && (
          <>
            <button className="vcal-btn vcal-link" onClick={() => void toggleExport()}>
              {exporting ? t('Stop exporting recordings') : t('Export recordings to a folder (dev)')}
            </button>
            {exporting && (
              <div className="vcal-hint">
                {t('Every accepted take is also saved as a WAV, named for scripts/eval-voice.mts.')}
              </div>
            )}
            {exportErr && <div className="vcal-err">{exportErr}</div>}
          </>
        )}

        <button
          className="vcal-btn vcal-auto"
          onClick={toggleRun}
          disabled={allDone && !running}
        >
          {running
            ? (rec === 'recording' ? `● ${t('Listening…')}` : `⏸ ${t('Stop')}`)
            : `▶️ ${t('Start')}`}
        </button>
        {running && (
          <div className="vcal-hint">{t('Speak the word on screen — calibration advances on its own')}</div>
        )}

        <div className="vcal-takes">
          {takes.length === 0
            ? <span className="vcal-here">
                {t('No recordings for “{prompt}” yet').replace('{prompt}', prompt)}
              </span>
            : takes.map((tk, i) => (
              <span key={tk.key} className="vcal-take">
                {t('Take')} {i + 1}
                <button
                  className="vcal-take-x"
                  onClick={() => void removeTake(tk.key)}
                  disabled={rec !== 'idle' || running}
                  aria-label={t('Delete take {n} of {prompt}').replace('{n}', String(i + 1)).replace('{prompt}', prompt)}
                >✕</button>
              </span>
            ))}
        </div>

        <div className="vcal-actions">
          <button className="vcal-btn" onClick={() => step(-1)} disabled={idx === 0 || rec !== 'idle' || running}>{t('Previous')}</button>
          <button className="vcal-btn" onClick={() => step(1)} disabled={idx === total - 1 || rec !== 'idle' || running}>{t('Next')}</button>
        </div>

        <div className="vcal-actions vcal-actions-sec">
          <button className="vcal-btn vcal-link vcal-danger" onClick={wipe} disabled={running}>{t('Delete profile')}</button>
        </div>

        <div className="vcal-actions vcal-actions-sec">
          <button className="vcal-btn vcal-link" onClick={wipeLearned} disabled={running}>
            {t('Reset automatic learning of the general mode')}
          </button>
        </div>

        {allDone && (
          <div className="vcal-actions vcal-actions-sec">
            <button
              className="vcal-btn vcal-link"
              onClick={() => void runSelfTest()}
              disabled={testing || rec !== 'idle' || running}
            >
              {testing ? t('Checking recordings…') : t('Self-test recordings')}
            </button>
          </div>
        )}
        {selfTest && (
          <div className="vcal-selftest">
            {selfTest.length === 0
              ? <span className="vcal-here">{t('All words are distinct enough — looks good.')}</span>
              : selfTest.map((w, i) => (
                <div key={i} className="vcal-selftest-row">
                  <div className="vcal-err">{w}</div>
                  {closePairs[i] && (
                    <button
                      className="vcal-btn vcal-link"
                      onClick={() => startExtraTakes(closePairs[i])}
                      disabled={rec !== 'idle' || running}
                    >
                      {t('Record {n} more takes for “{a}” and “{b}”')
                        .replace('{n}', String(EXTRA_TAKES))
                        .replace('{a}', labelText(closePairs[i].a))
                        .replace('{b}', labelText(closePairs[i].b))}
                    </button>
                  )}
                </div>
              ))}
          </div>
        )}

        <button className="vcal-btn vcal-finish" onClick={finish} disabled={!allDone || rec !== 'idle'}>
          {allDone ? t('Finish & enable') : `${total - doneLabels} ${t('to go')}`}
        </button>
      </div>
    </div>
  );
}
