import { useState, useCallback, useEffect, useRef } from 'react';
import type { HistoryEntry } from '../utils/music';
import { withIds, cloudInsertEntry, cloudDeleteKey, cloudDeleteAll } from '../utils/sync';
import { recordDailyActivity } from '../utils/dailyActivity';

export function useHistory() {
  // All history keyed by selector-derived string key (e.g. "6|0-12|byFret|dots")
  const [allHistory, setAllHistory] = useState<Record<string, HistoryEntry[]>>(() => {
    try {
      const raw = localStorage.getItem('selectorHistory');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Current session history (resets on start/switch)
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Track which keys have ever been played
  const [everPlayed, setEverPlayed] = useState<Set<string>>(new Set());

  // Persist allHistory to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('selectorHistory', JSON.stringify(allHistory));
  }, [allHistory]);

  // Latest-value mirror so callers (the sign-in sync in App) can read the
  // current map without taking it as an effect dependency.
  const allHistoryRef = useRef(allHistory);
  useEffect(() => { allHistoryRef.current = allHistory; }, [allHistory]);
  const getAllHistory = useCallback(() => allHistoryRef.current, []);

  const addEntry = useCallback((key: string, entry: HistoryEntry) => {
    // Stamp a stable id + timestamp so the row can be synced/merged per account.
    const stamped = withIds(entry);
    setHistory(prev => [...prev, stamped]);
    setAllHistory(prev => ({
      ...prev,
      [key]: [...(prev[key] ?? []), stamped],
    }));
    // Write-through to the cloud for signed-in users (no-op for guests/offline).
    void cloudInsertEntry(key, stamped);
    recordDailyActivity();
  }, []);

  const markPlayed = useCallback((key: string) => {
    setEverPlayed(prev => { const s = new Set(prev); s.add(key); return s; });
  }, []);

  const clearHistory = useCallback((key: string) => {
    setHistory([]);
    setAllHistory(prev => { const u = { ...prev }; delete u[key]; return u; });
    // Propagate the clear to the cloud + other devices for signed-in users
    // (writes a local tombstone even when offline; no-op for guests).
    void cloudDeleteKey(key);
  }, []);

  // Wipe history for every settings combination — this is what the Stats
  // panel's "Clear History" runs, so the all-time mastery bars on the note
  // wheel / fret grid (which aggregate every combination) also reset.
  const clearAllHistory = useCallback(() => {
    setHistory([]);
    setAllHistory({});
    void cloudDeleteAll();
  }, []);

  const resetSession = useCallback(() => {
    setHistory([]);
  }, []);

  const getEntriesForKey = useCallback((key: string): HistoryEntry[] => {
    return allHistory[key] ?? [];
  }, [allHistory]);

  // Replace all stored history with the post-sign-in merged set.
  const replaceAllHistory = useCallback((next: Record<string, HistoryEntry[]>) => {
    setAllHistory(next);
  }, []);

  return {
    history, allHistory, everPlayed,
    addEntry, markPlayed, clearHistory, clearAllHistory, resetSession, getEntriesForKey,
    replaceAllHistory, getAllHistory,
  };
}
