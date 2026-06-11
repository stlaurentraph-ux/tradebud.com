import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { AppState, type AppStateStatus } from 'react-native';

import { pingTracebudApi } from '@/features/network/pingTracebudApi';

const POLL_MS = 30_000;

/**
 * Header connectivity: reachable network + Tracebud API (not signed-in / backup state).
 */
export function useDeviceOnline() {
  const [isOnline, setIsOnline] = useState(true);

  const refresh = useCallback(async () => {
    const ok = await pingTracebudApi();
    setIsOnline(ok);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    const id = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') void refresh();
    };
    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, [refresh]);

  return { isOnline, refresh };
}
