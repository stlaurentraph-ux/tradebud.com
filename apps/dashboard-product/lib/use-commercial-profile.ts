'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchCommercialProfile, type CommercialProfile } from '@/lib/commercial-profile';

export function useCommercialProfile() {
  const [profile, setProfile] = useState<CommercialProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const loaded = await fetchCommercialProfile();
      setProfile(loaded);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { profile, isLoading, refresh, setProfile };
}
