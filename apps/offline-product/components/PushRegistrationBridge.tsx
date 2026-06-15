import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import {
  hasSyncAuthSession,
  hydrateSyncAuthFromSettings,
} from '@/features/api/syncAuthSession';
import { registerFarmerPushToken } from '@/features/notifications/registerFarmerPushToken';

/** Re-register Expo push token after sign-in and when the app returns to foreground. */
export function PushRegistrationBridge() {
  const lastRegisterAtRef = useRef(0);

  useEffect(() => {
    const registerIfSignedIn = async () => {
      try {
        await hydrateSyncAuthFromSettings();
        if (!hasSyncAuthSession()) {
          return;
        }
        const now = Date.now();
        if (now - lastRegisterAtRef.current < 30_000) {
          return;
        }
        lastRegisterAtRef.current = now;
        await registerFarmerPushToken();
      } catch {
        // Push registration is best-effort (preview builds may omit native push setup).
      }
    };

    void registerIfSignedIn();

    const onAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        void registerIfSignedIn();
      }
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  return null;
}
