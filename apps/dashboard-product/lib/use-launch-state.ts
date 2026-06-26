'use client';

import { useEffect, useState } from 'react';
import type { LaunchState } from '@/lib/load-launch-state';
import { getAccessToken } from '@/lib/auth-session';

export function useLaunchState(enabled = true): {
  launchState: LaunchState | null;
  isLoading: boolean;
} {
  const [launchState, setLaunchState] = useState<LaunchState | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional effect-driven state sync (async load / client hydration); React Compiler adoption tracked separately
      setLaunchState(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    const token = getAccessToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    void fetch('/api/launch/state', { headers, cache: 'no-store' })
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as {
          lifecycle_status?: LaunchState['lifecycle_status'];
          trial_expires_at?: string | null;
        };
        if (!response.ok || !payload.lifecycle_status) {
          return null;
        }
        return {
          lifecycle_status: payload.lifecycle_status,
          trial_expires_at: payload.trial_expires_at ?? null,
        } satisfies LaunchState;
      })
      .then((state) => {
        if (!cancelled) {
          setLaunchState(state);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLaunchState(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { launchState, isLoading };
}
