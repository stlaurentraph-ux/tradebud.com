import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { hasSyncAuthSession } from '@/features/api/syncAuthSession';
import { useAppState } from '@/features/state/AppStateContext';
import { runConservativeAutoBackup } from '@/features/sync/runAutoBackup';

const DEBOUNCE_MS = 1600;

/**
 * Conservative background sync: only when local work exists and throttle/backoff
 * allows. Does not run on every foreground or plot tick.
 */
export function AutoPlotUploadBridge() {
  const { farmer, plots } = useAppState();
  const inFlight = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(async () => {
    if (!farmer?.id || !hasSyncAuthSession()) return;
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      await runConservativeAutoBackup({ farmerId: farmer.id, localPlots: plots });
    } catch {
      // Background backup must not surface transport errors to farmers.
    } finally {
      inFlight.current = false;
    }
  }, [farmer?.id, plots]);

  useEffect(() => {
    if (!farmer?.id || !hasSyncAuthSession()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      void run();
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [farmer?.id, plots, run]);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') void run();
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [run]);

  return null;
}
