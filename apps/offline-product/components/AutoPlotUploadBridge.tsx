import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useAppState } from '@/features/state/AppStateContext';
import { uploadUnsyncedPlotsForFarmer } from '@/features/sync/plotServerSync';

const DEBOUNCE_MS = 1600;

/**
 * When the user is signed in (Supabase session available) and has local plots,
 * uploads any plots missing on the Tracebud server — same as My Plots → Upload plot.
 * Runs shortly after plots/farmer change and when the app returns to the foreground.
 */
export function AutoPlotUploadBridge() {
  const { farmer, plots } = useAppState();
  const inFlight = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(async () => {
    if (!farmer?.id || plots.length === 0) return;
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      await uploadUnsyncedPlotsForFarmer({
        farmerId: farmer.id,
        localPlots: plots,
      });
    } finally {
      inFlight.current = false;
    }
  }, [farmer?.id, plots]);

  useEffect(() => {
    if (!farmer?.id || plots.length === 0) return;
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
