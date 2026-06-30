import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Image, Pressable, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { PhotoVaultMap } from '@/components/plot-photo-vault/PhotoVaultMap';
import { ActionButton as Button } from '@/components/ui/action-button';
import { ThemedText } from '@/components/themed-text';
import { Brand } from '@/constants/theme';
import { createGroundTruthPhotoCaptureStyles } from '@/components/plot-photo-vault/groundTruthPhotoCaptureStyles';
import { useThemedStyles } from '@/features/theme/useThemedStyles';
import {
  directionForSlotIndex,
  GROUND_TRUTH_DIRECTIONS,
  headingDeltaToDirection,
  isDirectionPhotoGeoVerified,
  isFacingDirection,
  isGroundTruthPhotoSetComplete,
  isPhotoStandpointReady,
  nextGroundTruthPhotoSlotIndex,
  normalizePhotoDirection,
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
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';

type WizardStep = 'stand' | 'aim' | 'summary';

type PendingCapture = {
  uri: string;
  latitude: number;
  longitude: number;
  direction: GroundTruthPhotoDirection;
};

type GroundTruthPhotoCaptureProps = {
  plot: Plot;
  photos: PlotPhoto[];
  onPhotosChange: (photos: PlotPhoto[]) => void;
  t: TranslateFn;
  compact?: boolean;
};

function directionLabel(t: TranslateFn, direction: GroundTruthPhotoDirection): string {
  return t(`plot_dir_${direction}`);
}

function resolveInitialStep(photos: PlotPhoto[], plot: Plot): WizardStep {
  if (isGroundTruthPhotoSetComplete(photos, plot)) return 'summary';
  return 'stand';
}

function resolveActiveDirection(photos: PlotPhoto[], plot: Plot): GroundTruthPhotoDirection {
  const next = nextGroundTruthPhotoSlotIndex(photos, plot);
  return directionForSlotIndex(next ?? 0);
}

function mergeOptimisticPhoto(
  photos: PlotPhoto[],
  saved: {
    plotId: string;
    uri: string;
    takenAt: number;
    latitude: number;
    longitude: number;
    direction: GroundTruthPhotoDirection;
  },
): PlotPhoto[] {
  const withoutDirection = photos.filter(
    (photo) => normalizePhotoDirection(photo.direction) !== saved.direction,
  );
  return [
    ...withoutDirection,
    {
      id: -saved.takenAt,
      plotId: saved.plotId,
      uri: saved.uri,
      takenAt: saved.takenAt,
      latitude: saved.latitude,
      longitude: saved.longitude,
      direction: saved.direction,
    },
  ];
}

function DirectionProgressRow({
  photos,
  plot,
  t,
  activeDirection,
  selectable = false,
  onSelectDirection,
  savingDirection,
  openingCamera,
}: {
  photos: PlotPhoto[];
  plot: Plot;
  t: TranslateFn;
  activeDirection?: GroundTruthPhotoDirection;
  selectable?: boolean;
  onSelectDirection?: (direction: GroundTruthPhotoDirection) => void;
  savingDirection?: GroundTruthPhotoDirection | null;
  openingCamera?: boolean;
}) {
  const styles = useThemedStyles(createGroundTruthPhotoCaptureStyles);
  return (
    <View style={styles.directionProgressRow}>
      {GROUND_TRUTH_DIRECTIONS.map((dir) => {
        const photo = photoForDirection(photos, dir);
        const verified = isDirectionPhotoGeoVerified(photo, plot);
        const isActive = activeDirection === dir;
        const isBusy = isActive && (openingCamera || savingDirection === dir);
        return (
          <Pressable
            key={dir}
            disabled={!selectable || !onSelectDirection || isBusy}
            onPress={() => onSelectDirection?.(dir)}
            style={[
              styles.directionChip,
              verified && styles.directionChipDone,
              isActive && styles.directionChipActive,
            ]}
          >
            {isBusy ? (
              <ActivityIndicator size="small" color={Brand.primary} />
            ) : photo?.uri && normalizePhotoDirection(photo.direction) === dir ? (
              <Image source={{ uri: photo.uri }} style={styles.directionChipImage} />
            ) : (
              <ThemedText type="caption" style={styles.directionChipLetter}>
                {directionLabel(t, dir).charAt(0)}
              </ThemedText>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export function GroundTruthPhotoCapture({
  plot,
  photos,
  onPhotosChange,
  t,
  compact = false,
}: GroundTruthPhotoCaptureProps) {
  const styles = useThemedStyles(createGroundTruthPhotoCaptureStyles);
  const gps = usePhotoVaultGps(plot);
  const [lowDataMap, setLowDataMap] = useState(false);
  const [offlineTilesEnabled, setOfflineTilesEnabled] = useState(false);
  const [offlineTilesPackId, setOfflineTilesPackId] = useState<string | null>(null);
  const [openingCamera, setOpeningCamera] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [savingDirection, setSavingDirection] = useState<GroundTruthPhotoDirection | null>(null);
  const [step, setStep] = useState<WizardStep>(() => resolveInitialStep(photos, plot));
  const [activeDirection, setActiveDirection] = useState<GroundTruthPhotoDirection>(() =>
    resolveActiveDirection(photos, plot),
  );
  const openingCameraRef = useRef(false);
  const saveInFlightRef = useRef(false);
  const photosRef = useRef(photos);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  const resetCameraBusy = useCallback(() => {
    openingCameraRef.current = false;
    setOpeningCamera(false);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        resetCameraBusy();
      }
    });
    return () => subscription.remove();
  }, [resetCameraBusy]);

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

  useEffect(() => {
    if (isGroundTruthPhotoSetComplete(photos, plot)) {
      setStep('summary');
    }
  }, [photos, plot]);

  const mapRegion = useMemo(() => {
    const coords = [...plot.points, ...(gps.position ? [gps.position] : [])];
    return regionFromCoordinates(coords);
  }, [plot.points, gps.position]);

  const verifiedCount = GROUND_TRUTH_DIRECTIONS.filter((dir) =>
    isDirectionPhotoGeoVerified(photoForDirection(photos, dir), plot),
  ).length;

  const facingOk =
    gps.headingDeg == null ||
    isFacingDirection(gps.headingDeg, activeDirection);

  const headingDelta =
    gps.headingDeg != null ? headingDeltaToDirection(gps.headingDeg, activeDirection) : 0;

  const inwardRemainingM =
    gps.requiredInwardM > 0 && gps.inwardClearanceM != null
      ? Math.max(0, Math.ceil(gps.requiredInwardM - gps.inwardClearanceM))
      : null;

  const standStatus = gps.permissionDenied
    ? t('photo_vault_gps_permission_body')
    : gps.captureReady
      ? t('photo_vault_stand_ready')
      : gps.insidePlot && inwardRemainingM != null && inwardRemainingM > 0
        ? t('photo_vault_inward_waiting', { m: inwardRemainingM })
        : t('photo_vault_gps_polygon_waiting');

  const persistCapture = useCallback(
    async (snapshot: PendingCapture) => {
      if (saveInFlightRef.current) return;
      saveInFlightRef.current = true;
      setSavingPhoto(true);
      setSavingDirection(snapshot.direction);
      resetCameraBusy();

      const takenAt = Date.now();
      try {
        await upsertPlotGroundPhoto({
          plotId: plot.id,
          uri: snapshot.uri,
          takenAt,
          latitude: snapshot.latitude,
          longitude: snapshot.longitude,
          direction: snapshot.direction,
        });

        const optimistic = mergeOptimisticPhoto(photosRef.current, {
          plotId: plot.id,
          uri: snapshot.uri,
          takenAt,
          latitude: snapshot.latitude,
          longitude: snapshot.longitude,
          direction: snapshot.direction,
        });
        photosRef.current = optimistic;
        onPhotosChange(optimistic);

        if (isGroundTruthPhotoSetComplete(optimistic, plot)) {
          setStep('summary');
        } else {
          setActiveDirection(resolveActiveDirection(optimistic, plot));
          setStep('aim');
        }

        trackEvent(ANALYTICS_EVENTS.PHOTO_VAULT_CAPTURE_SUCCESS, {
          plotId: plot.id,
          direction: snapshot.direction,
          plotKind: plot.kind,
        });
        void logAuditEvent({
          eventType: 'ground_truth_photo_captured',
          payload: {
            plotId: plot.id,
            direction: snapshot.direction,
            latitude: snapshot.latitude,
            longitude: snapshot.longitude,
          },
        }).catch(() => undefined);

        void loadPhotosForPlot(plot.id)
          .then((loaded) => {
            photosRef.current = loaded;
            onPhotosChange(loaded);
          })
          .catch(() => undefined);
      } catch {
        Alert.alert(t('photo_vault_save_failed_title'), t('photo_vault_save_failed_body'));
        setStep('aim');
      } finally {
        saveInFlightRef.current = false;
        setSavingPhoto(false);
        setSavingDirection(null);
      }
    },
    [onPhotosChange, plot, resetCameraBusy, t],
  );

  const openCamera = async () => {
    if (openingCameraRef.current || saveInFlightRef.current || savingPhoto) return;
    openingCameraRef.current = true;
    setOpeningCamera(true);
    trackEvent(ANALYTICS_EVENTS.PHOTO_VAULT_CAPTURE_STARTED, {
      plotId: plot.id,
      direction: activeDirection,
      plotKind: plot.kind,
    });
    try {
      if (gps.permissionDenied) {
        Alert.alert(t('evidence_perm_camera_title'), t('photo_vault_gps_permission_body'));
        return;
      }
      if (!gps.captureReady || !gps.position) {
        Alert.alert(t('photo_vault_gps_blocked_title'), t('photo_vault_gps_polygon_body'));
        return;
      }
      if (!facingOk) {
        Alert.alert(
          t('photo_vault_gps_blocked_title'),
          t('photo_vault_direction_guide', { dir: directionLabel(t, activeDirection) }),
        );
        return;
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('evidence_perm_camera_title'), t('evidence_perm_camera_body'));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.65,
        exif: true,
        allowsEditing: false,
      });
      resetCameraBusy();

      if (result.canceled || !result.assets?.[0]?.uri) {
        return;
      }

      const coords = (await readDeviceCaptureCoordinates()) ?? gps.position;
      if (!isPhotoStandpointReady(coords.latitude, coords.longitude, plot)) {
        Alert.alert(t('photo_vault_gps_blocked_title'), t('photo_vault_capture_off_plot'));
        return;
      }

      await persistCapture({
        uri: result.assets[0].uri,
        latitude: coords.latitude,
        longitude: coords.longitude,
        direction: activeDirection,
      });
    } finally {
      resetCameraBusy();
    }
  };

  const startCapture = () => {
    setActiveDirection(resolveActiveDirection(photos, plot));
    setStep('aim');
  };

  const progressLabel = t('photo_vault_progress', { n: verifiedCount });
  const cameraBusy = openingCamera || savingPhoto;

  if (step === 'stand') {
    return (
      <View>
        {!compact ? (
          <ThemedText type="defaultSemiBold" style={styles.stepTitle}>
            {t(
              plot.areaHectares < 4
                ? 'photo_vault_stand_title_small'
                : 'photo_vault_stand_title',
            )}
          </ThemedText>
        ) : null}
        <ThemedText type="caption" style={styles.progressTop}>
          {progressLabel}
        </ThemedText>
        <DirectionProgressRow photos={photos} plot={plot} t={t} />
        <PhotoVaultMap
          plot={plot}
          region={mapRegion}
          userPosition={gps.position}
          lowDataMap={lowDataMap}
          offlineTilesEnabled={offlineTilesEnabled}
          offlineTilesPackId={offlineTilesPackId}
          mapHeight={compact ? 220 : 280}
        />
        <StatusStrip
          ready={gps.captureReady}
          label={standStatus}
          accuracyM={gps.accuracyM}
        />
        <Button
          title={t('photo_vault_continue')}
          variant="secondary"
          style={
            gps.captureReady
              ? styles.primaryBtn
              : { ...styles.primaryBtn, opacity: 0.55 }
          }
          onPress={() => {
            if (!gps.captureReady) {
              Alert.alert(t('photo_vault_gps_blocked_title'), t('photo_vault_gps_polygon_body'));
              return;
            }
            startCapture();
          }}
        />
      </View>
    );
  }

  if (step === 'aim') {
    const dirLabel = directionLabel(t, activeDirection);
    const headingHint =
      gps.headingDeg != null
        ? facingOk
          ? t('photo_vault_heading_ok', { dir: dirLabel })
          : headingDelta > 0
            ? t('photo_vault_heading_turn_right', {
                degrees: Math.round(Math.abs(headingDelta)),
                dir: dirLabel,
              })
            : t('photo_vault_heading_turn_left', {
                degrees: Math.round(Math.abs(headingDelta)),
                dir: dirLabel,
              })
        : t('photo_vault_direction_guide', { dir: dirLabel });

    return (
      <View>
        <ThemedText type="caption" style={styles.progressTop}>
          {progressLabel}
        </ThemedText>
        <DirectionProgressRow
          photos={photos}
          plot={plot}
          t={t}
          activeDirection={activeDirection}
          selectable
          onSelectDirection={setActiveDirection}
          savingDirection={savingDirection}
          openingCamera={openingCamera}
        />
        <ThemedText type="caption" style={styles.retakeHint}>
          {t('photo_vault_retake_hint')}
        </ThemedText>
        <View style={styles.aimHeader}>
          <ThemedText type="title" style={styles.directionTitle}>
            {dirLabel}
          </ThemedText>
          <CompassCue deltaDeg={headingDelta} facingOk={facingOk} />
        </View>
        <ThemedText type="caption" style={styles.headingHint}>
          {headingHint}
        </ThemedText>
        <PhotoVaultMap
          plot={plot}
          region={mapRegion}
          userPosition={gps.position}
          lowDataMap={lowDataMap}
          offlineTilesEnabled={offlineTilesEnabled}
          offlineTilesPackId={offlineTilesPackId}
          mapHeight={140}
        />
        <StatusStrip
          ready={gps.captureReady && facingOk}
          label={
            savingPhoto
              ? t('photo_vault_saving_photo')
              : gps.captureReady
                ? facingOk
                  ? t('photo_vault_gps_ready')
                  : headingHint
                : standStatus
          }
          accuracyM={gps.accuracyM}
        />
        <Button
          title={
            savingPhoto
              ? t('photo_vault_saving_photo')
              : openingCamera
                ? t('photo_vault_capture_busy')
                : t('photo_vault_take_photo')
          }
          variant="secondary"
          style={styles.primaryBtn}
          loading={savingPhoto}
          disabled={cameraBusy || !gps.captureReady || !facingOk}
          onPress={() => void openCamera()}
        />
      </View>
    );
  }

  return (
    <View>
      <ThemedText type="defaultSemiBold" style={styles.stepTitle}>
        {t('plot_photo_complete')}
      </ThemedText>
      <View style={styles.summaryGrid}>
        {GROUND_TRUTH_DIRECTIONS.map((dir) => {
          const photo = photoForDirection(photos, dir);
          const verified = isDirectionPhotoGeoVerified(photo, plot);
          const tagged = photo && normalizePhotoDirection(photo.direction) === dir;
          return (
            <View
              key={dir}
              style={[styles.summarySlot, verified && styles.summarySlotVerified]}
            >
              {tagged && photo?.uri ? (
                <Image source={{ uri: photo.uri }} style={styles.summaryImage} />
              ) : (
                <Ionicons name="image-outline" size={28} color="#9CA3AF" />
              )}
              <ThemedText type="caption" style={styles.summaryLabel}>
                {directionLabel(t, dir)}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function StatusStrip({
  ready,
  label,
  accuracyM,
}: {
  ready: boolean;
  label: string;
  accuracyM: number | null;
}) {
  const styles = useThemedStyles(createGroundTruthPhotoCaptureStyles);
  return (
    <View style={styles.gpsStrip}>
      <View style={[styles.gpsDot, { backgroundColor: ready ? Brand.primary : '#D97706' }]} />
      <ThemedText type="caption" style={styles.gpsLabel}>
        {label}
      </ThemedText>
      {accuracyM != null ? (
        <ThemedText type="caption" style={styles.gpsAccuracy}>
          ±{Math.round(accuracyM)} m
        </ThemedText>
      ) : null}
    </View>
  );
}

function CompassCue({ deltaDeg, facingOk }: { deltaDeg: number; facingOk: boolean }) {
  const styles = useThemedStyles(createGroundTruthPhotoCaptureStyles);
  return (
    <View
      style={[
        styles.compassRing,
        { borderColor: facingOk ? Brand.primary : '#D97706' },
      ]}
    >
      <Ionicons
        name="navigate"
        size={36}
        color={facingOk ? Brand.primary : '#D97706'}
        style={{ transform: [{ rotate: `${deltaDeg}deg` }] }}
      />
    </View>
  );
}
