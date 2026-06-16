import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { PhotoVaultMap } from '@/components/plot-photo-vault/PhotoVaultMap';
import { Card } from '@/components/ui/card';
import { ActionButton as Button } from '@/components/ui/action-button';
import { ThemedText } from '@/components/themed-text';
import { Brand } from '@/constants/theme';
import {
  computePlotPhotoStandpoint,
  GROUND_TRUTH_DIRECTIONS,
  headingDeltaToDirection,
  isAtPhotoCaptureLocation,
  isDirectionPhotoGeoVerified,
  isFacingDirection,
  photoForDirection,
  type GroundTruthPhotoDirection,
} from '@/features/compliance/groundTruthPhotoGeo';
import { regionFromCoordinates } from '@/features/mapping/fieldMapRegion';
import {
  readDeviceCaptureCoordinates,
  usePhotoVaultGps,
} from '@/features/photoVault/usePhotoVaultGps';
import type { Plot } from '@/features/state/AppStateContext';
import {
  getSetting,
  loadPhotosForPlot,
  logAuditEvent,
  upsertPlotGroundPhoto,
  type PlotPhoto,
} from '@/features/state/persistence';
import type { TranslateFn } from '@/features/i18n/translate';

type PhotoVaultPanelProps = {
  plot: Plot;
  photos: PlotPhoto[];
  onPhotosChange: (photos: PlotPhoto[]) => void;
  t: TranslateFn;
};

export function PhotoVaultPanel({ plot, photos, onPhotosChange, t }: PhotoVaultPanelProps) {
  const gps = usePhotoVaultGps(plot);
  const [lowDataMap, setLowDataMap] = useState(false);
  const [offlineTilesEnabled, setOfflineTilesEnabled] = useState(false);
  const [offlineTilesPackId, setOfflineTilesPackId] = useState<string | null>(null);
  const [activeDirection, setActiveDirection] = useState<GroundTruthPhotoDirection | null>(null);
  const [captureBusy, setCaptureBusy] = useState(false);

  useEffect(() => {
    void getSetting('lowDataMap')
      .then((v) => setLowDataMap(v === '1'))
      .catch(() => undefined);
    void getSetting('offlineTilesEnabled')
      .then((v) => setOfflineTilesEnabled(v === '1'))
      .catch(() => undefined);
    void getSetting('offlineTilesActivePackId')
      .then((v) => setOfflineTilesPackId(v && v.length > 0 ? v : null))
      .catch(() => undefined);
  }, []);

  const standpoint = useMemo(() => computePlotPhotoStandpoint(plot), [plot]);
  const mapRegion = useMemo(() => {
    const coords = [
      ...plot.points,
      ...(standpoint ? [standpoint] : []),
      ...(gps.position ? [gps.position] : []),
    ];
    return regionFromCoordinates(coords);
  }, [plot.points, standpoint, gps.position]);

  const headingHint = useMemo(() => {
    if (!activeDirection || gps.headingDeg == null) return null;
    if (isFacingDirection(gps.headingDeg, activeDirection)) {
      return t('photo_vault_heading_ok', {
        dir: t(`plot_dir_${activeDirection}` as 'plot_dir_north'),
      });
    }
    const delta = headingDeltaToDirection(gps.headingDeg, activeDirection);
    if (delta > 0) {
      return t('photo_vault_heading_turn_right', {
        dir: t(`plot_dir_${activeDirection}` as 'plot_dir_north'),
        degrees: Math.round(Math.abs(delta)),
      });
    }
    return t('photo_vault_heading_turn_left', {
      dir: t(`plot_dir_${activeDirection}` as 'plot_dir_north'),
      degrees: Math.round(Math.abs(delta)),
    });
  }, [activeDirection, gps.headingDeg, t]);

  const captureDirection = async (direction: GroundTruthPhotoDirection) => {
    if (captureBusy) return;
    setActiveDirection(direction);
    setCaptureBusy(true);
    try {
      if (gps.permissionDenied) {
        Alert.alert(t('evidence_perm_camera_title'), t('photo_vault_gps_permission_body'));
        return;
      }
      if (!gps.captureReady || !gps.position) {
        Alert.alert(
          t('photo_vault_gps_blocked_title'),
          plot.kind === 'point'
            ? t('photo_vault_gps_point_body')
            : t('photo_vault_gps_polygon_body'),
        );
        return;
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('evidence_perm_camera_title'), t('evidence_perm_camera_body'));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({ quality: 0.65, exif: true });
      if (result.canceled || !result.assets?.[0]?.uri) return;

      const coords = (await readDeviceCaptureCoordinates()) ?? gps.position;
      if (!isAtPhotoCaptureLocation(coords.latitude, coords.longitude, plot)) {
        Alert.alert(t('photo_vault_gps_blocked_title'), t('photo_vault_capture_off_plot'));
        return;
      }

      await upsertPlotGroundPhoto({
        plotId: plot.id,
        uri: result.assets[0].uri,
        takenAt: Date.now(),
        latitude: coords.latitude,
        longitude: coords.longitude,
        direction,
      });
      const updated = await loadPhotosForPlot(plot.id);
      onPhotosChange(updated);
      void logAuditEvent({
        eventType: 'ground_truth_photo_captured',
        payload: {
          plotId: plot.id,
          direction,
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      }).catch(() => undefined);
    } finally {
      setCaptureBusy(false);
    }
  };

  return (
    <View>
      <Card variant="outlined" style={styles.introCard}>
        <ThemedText type="default" style={styles.introText}>
          {t('plot_photo_intro')}
        </ThemedText>
        <ThemedText type="caption" style={styles.mapHint}>
          {t('photo_vault_map_hint')}
        </ThemedText>
      </Card>

      <PhotoVaultMap
        plot={plot}
        region={mapRegion}
        standpoint={standpoint}
        userPosition={gps.position}
        lowDataMap={lowDataMap}
        offlineTilesEnabled={offlineTilesEnabled}
        offlineTilesPackId={offlineTilesPackId}
      />

      <View style={styles.gpsStrip}>
        <View
          style={[
            styles.gpsDot,
            { backgroundColor: gps.captureReady ? Brand.primary : '#D97706' },
          ]}
        />
        <ThemedText type="caption" style={styles.gpsLabel}>
          {gps.permissionDenied
            ? t('photo_vault_gps_permission_body')
            : gps.captureReady
              ? t('photo_vault_gps_ready')
              : plot.kind === 'point'
                ? t('photo_vault_gps_point_waiting')
                : t('photo_vault_gps_polygon_waiting')}
        </ThemedText>
        {gps.accuracyM != null ? (
          <ThemedText type="caption" style={styles.gpsAccuracy}>
            ±{Math.round(gps.accuracyM)} m
          </ThemedText>
        ) : null}
      </View>

      {activeDirection ? (
        <View style={styles.directionGuide}>
          <Ionicons name="compass-outline" size={18} color="#0A7F59" />
          <ThemedText type="caption" style={styles.directionGuideText}>
            {t('photo_vault_direction_guide', {
              dir: t(`plot_dir_${activeDirection}` as 'plot_dir_north'),
            })}
            {headingHint ? ` ${headingHint}` : ''}
          </ThemedText>
        </View>
      ) : (
        <ThemedText type="caption" style={styles.directionGuideIdle}>
          {t('photo_vault_direction_idle')}
        </ThemedText>
      )}

      <View style={styles.photoVaultGrid}>
        {GROUND_TRUTH_DIRECTIONS.map((dir) => {
          const photo = photoForDirection(photos, dir);
          const verified = isDirectionPhotoGeoVerified(photo, plot);
          const dirLabel = t(`plot_dir_${dir}` as 'plot_dir_north');
          return (
            <Pressable
              key={dir}
              style={[styles.photoVaultSlot, verified && styles.photoVaultSlotVerified]}
              onPress={() => void captureDirection(dir)}
              disabled={captureBusy}
            >
              {photo?.uri ? (
                <Image source={{ uri: photo.uri }} style={styles.photoVaultImage} />
              ) : (
                <Ionicons name="image-outline" size={42} color="#ACACAC" />
              )}
              <ThemedText type="defaultSemiBold" style={styles.photoVaultTitle}>
                {t('plot_photo_dir_view', { dir: dirLabel })}
              </ThemedText>
              <ThemedText type="caption" style={styles.photoVaultDate}>
                {photo?.takenAt
                  ? verified
                    ? new Date(photo.takenAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric',
                      })
                    : t('photo_vault_slot_off_plot')
                  : t('plot_photo_tap_capture')}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: 10 }}>
        <Button
          title={captureBusy ? t('photo_vault_capture_busy') : t('plot_photo_update')}
          variant="secondary"
          style={{ backgroundColor: '#0A7F59' }}
          disabled={captureBusy || !gps.captureReady}
          onPress={() => {
            const next = GROUND_TRUTH_DIRECTIONS.find(
              (dir) => !isDirectionPhotoGeoVerified(photoForDirection(photos, dir), plot),
            );
            if (next) void captureDirection(next);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  introCard: {
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  introText: {
    lineHeight: 20,
  },
  mapHint: {
    marginTop: 8,
    opacity: 0.85,
  },
  gpsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  gpsDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  gpsLabel: {
    flex: 1,
  },
  gpsAccuracy: {
    opacity: 0.7,
  },
  directionGuide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#E8F5EF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  directionGuideText: {
    flex: 1,
    lineHeight: 18,
  },
  directionGuideIdle: {
    marginBottom: 10,
    opacity: 0.8,
    paddingHorizontal: 4,
  },
  photoVaultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  photoVaultSlot: {
    width: '48%',
    minHeight: 148,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  photoVaultSlotVerified: {
    borderColor: '#0A7F59',
    backgroundColor: '#F2FBF7',
  },
  photoVaultImage: {
    width: '100%',
    height: 88,
    borderRadius: 10,
    marginBottom: 8,
  },
  photoVaultTitle: {
    textAlign: 'center',
  },
  photoVaultDate: {
    marginTop: 2,
    textAlign: 'center',
    opacity: 0.75,
  },
});
