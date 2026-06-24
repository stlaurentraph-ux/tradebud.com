import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brand } from '@/constants/theme';
import type { FieldEnumerationMappingRegion } from '@/features/enumeration/fieldEnumerationPackTypes';
import {
  bboxContainsRegion,
  buildDistrictPackId,
  capZoomLevelsForBbox,
  ENUMERATION_DISTRICT_ZOOMS,
  estimateDistrictPackSizeMb,
  requiresWifiAckForPack,
} from '@/features/enumeration/enumerationTileBootstrap';
import { useEnumerationOptional } from '@/features/enumeration/EnumerationContext';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';
import { bboxAroundCoordinate } from '@/features/offlineTiles/manualTraceImagery';
import {
  downloadOfflineTilePack,
  listOfflineTilePacks,
  type OfflineTilesProgress,
} from '@/features/offlineTiles/offlineTiles';
import { useAppState } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';
import { getSetting, setSetting } from '@/features/state/persistence';
import { queueFieldDevicePreferencesSync } from '@/features/sync/syncFieldDevicePreferences';

const COMPLETED_KEY = 'enumeration_tile_bootstrap_completed_for';
const DECLINED_KEY = 'enumeration_tile_bootstrap_declined_for';

async function regionAlreadyCovered(region: FieldEnumerationMappingRegion): Promise<boolean> {
  const packs = await listOfflineTilePacks();
  return packs.some((pack) => bboxContainsRegion(pack.bbox, region.bbox));
}

async function shouldPromptForRegion(region: FieldEnumerationMappingRegion): Promise<boolean> {
  const scope = region.campaignId ?? region.label;
  const [completed, declined, covered] = await Promise.all([
    getSetting(COMPLETED_KEY),
    getSetting(DECLINED_KEY),
    regionAlreadyCovered(region),
  ]);
  if (covered) return false;
  if (completed === scope) return false;
  if (declined === scope) return false;
  return true;
}

function gpsHintLabel(
  latitude: number,
  longitude: number,
  regionLabel: string,
): string {
  return `${regionLabel} (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`;
}

export function EnumerationTileBootstrapGate() {
  const { t } = useLanguage();
  const { farmer } = useAppState();
  const enumeration = useEnumerationOptional();
  const region = enumeration?.pendingTileBootstrap ?? null;
  const clearPending = enumeration?.clearPendingTileBootstrap;
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<OfflineTilesProgress | null>(null);
  const promptedScopeRef = useRef<string | null>(null);

  const runDownload = useCallback(
    async (target: FieldEnumerationMappingRegion) => {
      setDownloading(true);
      setProgress(null);
      const packId = buildDistrictPackId(target);
      const zooms = capZoomLevelsForBbox(target.bbox, ENUMERATION_DISTRICT_ZOOMS);
      trackEvent(ANALYTICS_EVENTS.TILE_BOOTSTRAP_DOWNLOAD_STARTED, {
        campaignId: target.campaignId ?? null,
        packId,
        estimatedMb: estimateDistrictPackSizeMb(target.bbox, zooms),
      });
      try {
        await downloadOfflineTilePack({
          packId,
          label: target.label,
          bbox: target.bbox,
          zooms,
          onProgress: setProgress,
        });
        await setSetting('offlineTilesEnabled', '1');
        await setSetting('offlineTilesActivePackId', packId);
        await setSetting(COMPLETED_KEY, target.campaignId ?? target.label);
        if (farmer) {
          await queueFieldDevicePreferencesSync(farmer, { deferPost: true }).catch(() => undefined);
        }
        trackEvent(ANALYTICS_EVENTS.TILE_BOOTSTRAP_DOWNLOAD_SUCCEEDED, {
          campaignId: target.campaignId ?? null,
          packId,
        });
        Alert.alert(t('enumeration_tile_ready_title'), t('enumeration_tile_ready_body'));
      } catch (error) {
        trackEvent(ANALYTICS_EVENTS.TILE_BOOTSTRAP_DOWNLOAD_FAILED, {
          campaignId: target.campaignId ?? null,
          message: error instanceof Error ? error.message : 'unknown',
        });
        Alert.alert(
          t('enumeration_tile_download_failed_title'),
          error instanceof Error ? error.message : t('enumeration_tile_download_failed_body'),
        );
      } finally {
        setDownloading(false);
        setProgress(null);
        clearPending?.();
      }
    },
    [clearPending, farmer, t],
  );

  const confirmDownload = useCallback(
    (target: FieldEnumerationMappingRegion) => {
      const zooms = capZoomLevelsForBbox(target.bbox, ENUMERATION_DISTRICT_ZOOMS);
      const estimatedMb = estimateDistrictPackSizeMb(target.bbox, zooms);
      const start = () => void runDownload(target);

      if (!requiresWifiAckForPack(estimatedMb)) {
        start();
        return;
      }

      Alert.alert(
        t('enumeration_tile_wifi_title'),
        t('enumeration_tile_wifi_body', { mb: estimatedMb }),
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('enumeration_tile_download_anyway'), onPress: start },
        ],
      );
    },
    [runDownload, t],
  );

  const promptRegionConfirm = useCallback(
    async (target: FieldEnumerationMappingRegion) => {
      trackEvent(ANALYTICS_EVENTS.TILE_BOOTSTRAP_PROMPT_SHOWN, {
        campaignId: target.campaignId ?? null,
        label: target.label,
      });

      let hint = target.label;
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          hint = gpsHintLabel(pos.coords.latitude, pos.coords.longitude, target.label);
        }
      } catch {
        // GPS hint is optional.
      }

      Alert.alert(
        t('enumeration_tile_region_title'),
        t('enumeration_tile_region_body', { region: hint }),
        [
          {
            text: t('enumeration_tile_region_no'),
            style: 'cancel',
            onPress: () => {
              trackEvent(ANALYTICS_EVENTS.TILE_BOOTSTRAP_DECLINED, {
                campaignId: target.campaignId ?? null,
              });
              void setSetting(DECLINED_KEY, target.campaignId ?? target.label);
              clearPending?.();
              router.push('/offline-maps');
            },
          },
          {
            text: t('enumeration_tile_region_yes'),
            onPress: () => {
              trackEvent(ANALYTICS_EVENTS.TILE_BOOTSTRAP_CONFIRMED, {
                campaignId: target.campaignId ?? null,
              });
              confirmDownload(target);
            },
          },
        ],
      );
    },
    [clearPending, confirmDownload, t],
  );

  useEffect(() => {
    if (!region || downloading) return;
    const scope = region.campaignId ?? region.label;
    if (promptedScopeRef.current === scope) return;

    void shouldPromptForRegion(region).then((shouldPrompt) => {
      if (!shouldPrompt) {
        clearPending?.();
        return;
      }
      promptedScopeRef.current = scope;
      void promptRegionConfirm(region);
    });
  }, [clearPending, downloading, promptRegionConfirm, region]);

  if (!downloading) return null;

  const progressPct =
    progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <Card variant="outlined" style={{ marginBottom: 12, padding: 12 }} testID="enumeration-tile-download">
      <View style={{ gap: 8 }}>
        <ThemedText type="defaultSemiBold">{t('enumeration_tile_downloading_title')}</ThemedText>
        <ActivityIndicator color={Brand.primary} />
        <ThemedText type="caption">{t('enumeration_tile_downloading_body', { pct: progressPct })}</ThemedText>
        <Button variant="outline" onPress={() => setDownloading(false)}>
          {t('cancel')}
        </Button>
      </View>
    </Card>
  );
}

