import { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { subscribeServerPlotSyncChanged } from '@/features/sync/plotServerSync';
import { restoreCloudStateOnFocus } from '@/features/sync/restoreCloudStateOnFocus';

type UseFocusCloudPullParams = {
  isSignedIn: boolean;
  reloadFromDisk: () => Promise<void>;
  /** Runs after disk reload following pull (or immediately when signed out). */
  onPullComplete?: () => void | Promise<void>;
  /** When false, skip focus pull (e.g. screen not ready). Default true. */
  enabled?: boolean;
};

/**
 * On screen focus: reload SQLite → pull cloud state → reload SQLite → refresh UI.
 */
export function useFocusCloudPull(params: UseFocusCloudPullParams): {
  runFocusPull: () => Promise<void>;
} {
  const { isSignedIn, reloadFromDisk, enabled = true } = params;
  const onCompleteRef = useRef(params.onPullComplete);
  onCompleteRef.current = params.onPullComplete;

  const runFocusPull = useCallback(async () => {
    await reloadFromDisk();
    if (isSignedIn && enabled) {
      await restoreCloudStateOnFocus().catch(() => undefined);
      await reloadFromDisk();
    }
    await onCompleteRef.current?.();
  }, [enabled, isSignedIn, reloadFromDisk]);

  useFocusEffect(
    useCallback(() => {
      void runFocusPull();
    }, [runFocusPull]),
  );

  return { runFocusPull };
}

/** Reload from disk then run caller refresh after cross-device sync completes elsewhere. */
export function useReloadOnServerPlotSyncChanged(params: {
  reloadFromDisk: () => Promise<void>;
  onSyncChanged: () => void | Promise<void>;
}): void {
  const onSyncRef = useRef(params.onSyncChanged);
  onSyncRef.current = params.onSyncChanged;

  useEffect(() => {
    return subscribeServerPlotSyncChanged(() => {
      void params.reloadFromDisk().then(() => onSyncRef.current?.());
    });
  }, [params.reloadFromDisk]);
}
