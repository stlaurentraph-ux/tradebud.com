'use client';

import { useEffect, useState } from 'react';
import type { TimelineEvent } from '@/components/ui/timeline-row';

export function useDashboardActivity(enabled = true) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loaded, setLoaded] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional effect-driven state sync (async load / client hydration); React Compiler adoption tracked separately
      setEvents([]);
      setLoaded(true);
      return;
    }

    setLoaded(false);
    const token = window.sessionStorage.getItem('tracebud_token');
    fetch('/api/dashboard/activity', {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: 'no-store',
    })
      .then((response) => response.json())
      .then((payload) => {
        if (Array.isArray(payload?.events)) {
          setEvents(payload.events as TimelineEvent[]);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [enabled]);

  return { events, loaded };
}
