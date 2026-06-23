import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { StackGradientHeader } from '@/components/layout/StackGradientHeader';
import { ThemedText } from '@/components/themed-text';
import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { alertLocationPermissionDenied } from '@/features/permissions/locationPermission';
import { useLanguage } from '@/features/state/LanguageContext';
import { useAppState } from '@/features/state/AppStateContext';
import { setSetting } from '@/features/state/persistence';
import { queueFieldDevicePreferencesSync } from '@/features/sync/syncFieldDevicePreferences';
import { bboxAroundCoordinate } from '@/features/offlineTiles/manualTraceImagery';
import {
  downloadOfflineTilePack,
  listOfflineTilePacks,
  OFFLINE_TILE_PRESETS,
  type OfflineTilesPackMeta,
  type OfflineTilesProgress,
} from '@/features/offlineTiles/offlineTiles';
import { goBackOrHome } from '@/features/navigation/routes';
import { useAppColors, useThemedStyles } from '@/features/theme/useThemedStyles';
import { createOfflineMapsScreenStyles } from '@/screenStyles/offlineMapsScreenStyles';

export default function OfflineMapsScreen() {
  const colors = useAppColors();
  const styles = useThemedStyles(createOfflineMapsScreenStyles);
  const { t } = useLanguage();
  const { farmer } = useAppState();
  const [packs, setPacks] = useState<OfflineTilesPackMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<OfflineTilesProgress | null>(null);

  const refreshPacks = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listOfflineTilePacks();
      setPacks(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshPacks();
  }, [refreshPacks]);

  const finishDownload = async (packId: string) => {
    await setSetting('offlineTilesEnabled', '1');
    await setSetting('offlineTilesActivePackId', packId);
    await refreshPacks();
    if (farmer) {
      await queueFieldDevicePreferencesSync(farmer).catch(() => undefined);
    }
    Alert.alert(t('offline_maps_ready_title'), t('offline_maps_ready_body'), [
      { text: t('ok'), onPress: () => goBackOrHome(router) },
    ]);
  };

  const downloadNearMe = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alertLocationPermissionDenied(t);
      return;
    }

    setDownloading(true);
    setProgress(null);
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;
      const packId = `near-${Math.round(latitude * 1000)}-${Math.round(longitude * 1000)}-${Date.now()}`;
      const bbox = bboxAroundCoordinate(latitude, longitude);
      await downloadOfflineTilePack({
        packId,
        label: t('offline_maps_near_me_label'),
        bbox,
        zooms: [14, 15, 16],
        onProgress: setProgress,
      });
      await finishDownload(packId);
    } catch (e) {
      Alert.alert(
        t('offline_maps_download_failed_title'),
        e instanceof Error ? e.message : t('offline_maps_download_failed_body'),
      );
    } finally {
      setDownloading(false);
      setProgress(null);
    }
  };

  const downloadPreset = async (presetId: string) => {
    const preset = OFFLINE_TILE_PRESETS.find((row) => row.id === presetId);
    if (!preset) return;

    setDownloading(true);
    setProgress(null);
    try {
      await downloadOfflineTilePack({
        packId: preset.id,
        label: preset.label,
        bbox: preset.bbox,
        zooms: preset.zooms,
        onProgress: setProgress,
      });
      await finishDownload(preset.id);
    } catch (e) {
      Alert.alert(
        t('offline_maps_download_failed_title'),
        e instanceof Error ? e.message : t('offline_maps_download_failed_body'),
      );
    } finally {
      setDownloading(false);
      setProgress(null);
    }
  };

  const progressPct =
    progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <ThemedView style={styles.screen}>
      <StackGradientHeader title={t('offline_maps_title')} onBack={() => goBackOrHome(router)} backLabel={t('back')} />

      <ThemedScrollView contentContainerStyle={[styles.content, { paddingTop: 8 }]}>
        <Card variant="outlined">
          <CardContent>
            <View style={styles.introRow}>
              <Ionicons name="map-outline" size={22} color={colors.link} />
              <ThemedText type="defaultSemiBold" style={{ flex: 1 }}>
                {t('offline_maps_intro')}
              </ThemedText>
            </View>
            <ThemedText type="caption" style={styles.introBody}>
              {t('offline_maps_intro_body')}
            </ThemedText>
          </CardContent>
        </Card>

        <View style={{ marginTop: 16, gap: 10 }}>
          <Button
            variant="secondary"
            fullWidth
            disabled={downloading}
            onPress={() => void downloadNearMe()}
          >
            {t('offline_maps_download_near_me')}
          </Button>
          {OFFLINE_TILE_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              fullWidth
              disabled={downloading}
              onPress={() => void downloadPreset(preset.id)}
            >
              {t('offline_maps_download_preset', { label: preset.label })}
            </Button>
          ))}
        </View>

        {downloading ? (
          <View style={styles.progressBox}>
            <ActivityIndicator color={colors.link} />
            <ThemedText type="caption">
              {t('offline_maps_downloading', { pct: progressPct })}
            </ThemedText>
          </View>
        ) : null}

        <Card variant="outlined" style={{ marginTop: 20 }}>
          <CardContent>
            <ThemedText type="defaultSemiBold">{t('offline_maps_installed_title')}</ThemedText>
            {loading ? (
              <ActivityIndicator style={{ marginTop: 12 }} color={colors.link} />
            ) : packs.length === 0 ? (
              <ThemedText type="caption" style={styles.emptyCaption}>
                {t('offline_maps_installed_empty')}
              </ThemedText>
            ) : (
              packs.map((pack) => (
                <View key={pack.id} style={styles.packRow}>
                  <ThemedText type="defaultSemiBold">{pack.label}</ThemedText>
                  <ThemedText type="caption">
                    {t('offline_maps_pack_meta', {
                      tiles: pack.tileCount ?? 0,
                      south: pack.bbox.south.toFixed(2),
                      north: pack.bbox.north.toFixed(2),
                      west: pack.bbox.west.toFixed(2),
                      east: pack.bbox.east.toFixed(2),
                    })}
                  </ThemedText>
                </View>
              ))
            )}
          </CardContent>
        </Card>
      </ThemedScrollView>
    </ThemedView>
  );
}
