import { useCallback, useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { assessManualTraceImageryAvailability } from '@/features/offlineTiles/manualTraceImagery';
import { listOfflineTilePacks } from '@/features/offlineTiles/offlineTiles';
import { pingFieldMapImagery } from '@/features/network/pingFieldMapImagery';
import { setSetting } from '@/features/state/persistence';

type UseFieldMapOfflineBannerInput = {
  enabled: boolean;
  latitude: number;
  longitude: number;
  lowDataMap: boolean;
  offlineTilesEnabled: boolean;
  offlineTilesPackId: string | null;
  onOfflinePackActivated?: (packId: string) => void;
};

/** Shows the green offline-map banner when satellite imagery is unavailable (no Esri + no local pack). */
export function useFieldMapOfflineBanner(input: UseFieldMapOfflineBannerInput): boolean {
  const [showBanner, setShowBanner] = useState(false);

  const refresh = useCallback(async () => {
    if (!input.enabled || input.lowDataMap) {
      setShowBanner(false);
      return;
    }

    const assessment = await assessManualTraceImageryAvailability({
      latitude: input.latitude,
      longitude: input.longitude,
      lowDataMap: false,
      activePackId: input.offlineTilesPackId,
      listPacks: listOfflineTilePacks,
      pingOnlineImagery: pingFieldMapImagery,
    });

    if (assessment.allowed && assessment.imagerySource === 'offline_pack' && assessment.packId) {
      setShowBanner(false);
      if (!input.offlineTilesEnabled || input.offlineTilesPackId !== assessment.packId) {
        await setSetting('offlineTilesEnabled', '1');
        await setSetting('offlineTilesActivePackId', assessment.packId);
        input.onOfflinePackActivated?.(assessment.packId);
      }
      return;
    }

    if (assessment.allowed && assessment.imagerySource === 'esri_online') {
      setShowBanner(false);
      return;
    }

    setShowBanner(true);
  }, [
    input.enabled,
    input.latitude,
    input.longitude,
    input.lowDataMap,
    input.offlineTilesEnabled,
    input.offlineTilesPackId,
    input.onOfflinePackActivated,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        void refresh();
      }
    };
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, [refresh]);

  return showBanner;
}
