import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { alertLocationPermissionDenied } from '@/features/permissions/locationPermission';
import { useLanguage } from '@/features/state/LanguageContext';
import { setSetting } from '@/features/state/persistence';
import {
  bboxAroundCoordinate,
} from '@/features/offlineTiles/manualTraceImagery';
import {
  downloadOfflineTilePack,
  listOfflineTilePacks,
  OFFLINE_TILE_PRESETS,
  type OfflineTilesPackMeta,
  type OfflineTilesProgress,
} from '@/features/offlineTiles/offlineTiles';
import { goBackOrHome } from '@/features/navigation/routes';
import { Brand } from '@/constants/theme';

export default function OfflineMapsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
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
    <ThemedView style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Button variant="ghost" onPress={() => goBackOrHome(router)}>
          {t('back')}
        </Button>
        <ThemedText type="subtitle" style={styles.headerTitle}>
          {t('offline_maps_title')}
        </ThemedText>
        <View style={{ width: 64 }} />
      </View>

      <ThemedScrollView contentContainerStyle={styles.content}>
        <Card variant="outlined">
          <CardContent>
            <View style={styles.introRow}>
              <Ionicons name="map-outline" size={22} color={Brand.primary} />
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
            <ActivityIndicator color={Brand.primary} />
            <ThemedText type="caption">
              {t('offline_maps_downloading', { pct: progressPct })}
            </ThemedText>
          </View>
        ) : null}

        <Card variant="outlined" style={{ marginTop: 20 }}>
          <CardContent>
            <ThemedText type="defaultSemiBold">{t('offline_maps_installed_title')}</ThemedText>
            {loading ? (
              <ActivityIndicator style={{ marginTop: 12 }} color={Brand.primary} />
            ) : packs.length === 0 ? (
              <ThemedText type="caption" style={{ marginTop: 8 }}>
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  introRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  introBody: {
    marginTop: 8,
    opacity: 0.85,
    lineHeight: 18,
  },
  progressBox: {
    marginTop: 16,
    alignItems: 'center',
    gap: 8,
  },
  packRow: {
    marginTop: 12,
    gap: 4,
  },
});
