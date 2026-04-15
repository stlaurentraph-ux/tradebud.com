import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { CompactTabHeader } from '@/components/layout/CompactTabHeader';
import { ThemedText } from '@/components/themed-text';
import { compactTabHeaderStyles } from '@/constants/compactTabHeader';
import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { useLanguage } from '@/features/state/LanguageContext';
import {
  clearPersistedSyncAuth,
  fetchPlotsForFarmer,
  getAuthCredentials,
  getTracebudApiBaseUrl,
  hydrateSyncAuthFromSettings,
  postAuditEventToBackend,
  saveAndApplySyncAuth,
  testBackendLogin,
} from '@/features/api/postPlot';
import {
  buildDeclarationBundle,
  declarationBundleToJson,
} from '@/features/compliance/declarationBundle';
import { useCallback, useEffect, useState } from 'react';
import {
  getSetting,
  loadPendingSyncActions,
  setSetting,
} from '@/features/state/persistence';
import { formatHsHeading, getCommodityDefinition } from '@/features/compliance/commodityCatalog';
import {
  listUnsyncedLocalPlots,
  subscribeServerPlotSyncChanged,
  uploadUnsyncedPlotsForFarmer,
} from '@/features/sync/plotServerSync';
import { processPendingSyncQueue } from '@/features/sync/processPendingSyncQueue';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppState } from '@/features/state/AppStateContext';
import { Input } from '@/components/ui/input';
import { useFocusEffect } from '@react-navigation/native';

const fsAny = FileSystem as unknown as {
  documentDirectory?: string | null;
  cacheDirectory?: string | null;
};

export default function SettingsScreen() {
  const { lang, setLang, t } = useLanguage();
  const { farmer, plots, setFarmer, updateFarmerProfilePhoto } = useAppState();
  const [nameInput, setNameInput] = useState('');
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncNowBusy, setSyncNowBusy] = useState(false);
  const [declarationBusy, setDeclarationBusy] = useState(false);
  /** SQLite queue: harvests, photo sync, evidence sync (not plot geometry upload). */
  const [queuePendingCount, setQueuePendingCount] = useState(0);
  /** Local plots with no matching server row (by name). */
  const [unsyncedPlotCount, setUnsyncedPlotCount] = useState(0);
  const [syncEmail, setSyncEmail] = useState('');
  const [syncPassword, setSyncPassword] = useState('');
  const [syncSigningIn, setSyncSigningIn] = useState(false);
  const [syncAuthHint, setSyncAuthHint] = useState<string | null>(null);
  const [syncSignedIn, setSyncSignedIn] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [vertexAvgSeconds, setVertexAvgSeconds] = useState<60 | 120>(120);

  const refreshSavedSyncEmail = useCallback(async () => {
    await hydrateSyncAuthFromSettings();
    const { email, password } = getAuthCredentials();
    if (email) setSyncEmail(email);
    setSyncSignedIn(Boolean(email?.trim() && password));
  }, []);

  const refreshSyncMetrics = useCallback(async () => {
    const rows = await loadPendingSyncActions().catch(() => []);
    setQueuePendingCount(rows.length);

    const { email, password } = getAuthCredentials();
    const canQueryServer = Boolean(farmer?.id && email?.trim() && password);
    if (!canQueryServer) {
      setUnsyncedPlotCount(0);
      return;
    }
    try {
      const backend = await fetchPlotsForFarmer(farmer!.id);
      setUnsyncedPlotCount(listUnsyncedLocalPlots(plots, backend ?? []).length);
    } catch {
      // Keep previous unsynced count on network errors so we don't flash "up to date" incorrectly.
    }
  }, [farmer, plots]);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        await refreshSavedSyncEmail();
        await refreshSyncMetrics();
        const v = await getSetting('vertexAveragingSeconds').catch(() => null);
        setVertexAvgSeconds(v === '60' ? 60 : 120);
      })();
    }, [refreshSavedSyncEmail, refreshSyncMetrics]),
  );

  useEffect(() => {
    void refreshSyncMetrics();
  }, [refreshSyncMetrics]);

  useEffect(() => {
    return subscribeServerPlotSyncChanged(() => {
      void refreshSyncMetrics();
    });
  }, [refreshSyncMetrics]);

  useEffect(() => {
    setNameInput(farmer?.name ?? '');
  }, [farmer?.id, farmer?.name]);

  const totalSyncPending = queuePendingCount + unsyncedPlotCount;
  const usedMb = Math.max(24, 120 + totalSyncPending * 6);
  const totalMb = 500;
  const usagePct = Math.min(1, usedMb / totalMb);

  const persistPickedImage = async (uri: string) => {
    let out = uri;
    if (Platform.OS !== 'web') {
      try {
        const dest = `${fsAny.documentDirectory ?? ''}farmer-profile.jpg`;
        await FileSystem.copyAsync({ from: uri, to: dest });
        out = dest;
      } catch {
        // keep picker URI if copy fails
      }
    }
    updateFarmerProfilePhoto(out);
  };

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to set your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    await persistPickedImage(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('perm_camera_title'), t('perm_camera_body'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    await persistPickedImage(result.assets[0].uri);
  };

  const saveFarmerName = () => {
    if (!farmer) {
      Alert.alert(t('profile_title'), t('finish_home_first'));
      return;
    }
    const trimmed = nameInput.trim();
    setFarmer({ ...farmer, name: trimmed || undefined });
  };

  const captureDeclarationGeo = async () => {
    if (!farmer) {
      Alert.alert(t('profile_title'), t('finish_home_first'));
      return;
    }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('warning'), t('simplified_declaration_location_denied'));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const declarationLatitude = roundWgs84Coordinate(pos.coords.latitude);
      const declarationLongitude = roundWgs84Coordinate(pos.coords.longitude);
      setFarmer({
        ...farmer,
        declarationLatitude,
        declarationLongitude,
        declarationGeoCapturedAt: Date.now(),
      });
    } catch (e) {
      Alert.alert(t('warning'), e instanceof Error ? e.message : t('simplified_declaration_location_failed'));
    }
  };

  const clearDeclarationGeo = () => {
    if (!farmer) return;
    setFarmer({
      ...farmer,
      declarationLatitude: undefined,
      declarationLongitude: undefined,
      declarationGeoCapturedAt: undefined,
    });
  };

  const displayProfileEmail = syncSignedIn
    ? syncEmail.trim() || getAuthCredentials().email || '—'
    : t('profile_email_none');

  const enterProfileEdit = () => {
    setNameInput(farmer?.name ?? '');
    setProfileEditing(true);
  };

  const exitProfileEditSave = () => {
    if (!farmer) {
      Alert.alert(t('profile_title'), t('finish_home_first'));
      return;
    }
    saveFarmerName();
    setProfileEditing(false);
  };

  const exitProfileEditCancel = () => {
    setNameInput(farmer?.name ?? '');
    setSyncPassword('');
    setSyncAuthHint(null);
    void refreshSavedSyncEmail();
    setProfileEditing(false);
  };

  const openPhotoOptions = () => {
    if (!farmer) {
      Alert.alert(t('profile_title'), t('finish_home_photo'));
      return;
    }
    Alert.alert(t('profile_photo_title'), t('profile_photo_body'), [
      { text: t('photo_library'), onPress: () => void pickFromLibrary() },
      { text: t('take_photo'), onPress: () => void takePhoto() },
      ...(farmer?.profilePhotoUri
        ? [{ text: t('remove_photo'), style: 'destructive' as const, onPress: () => updateFarmerProfilePhoto(null) }]
        : []),
      { text: t('cancel'), style: 'cancel' },
    ]);
  };

  const onSignInForSync = async () => {
    if (!syncEmail.trim() || !syncPassword) {
      setSyncAuthHint(t('enter_email_password'));
      return;
    }
    setSyncSigningIn(true);
    setSyncAuthHint(null);
    try {
      await saveAndApplySyncAuth(syncEmail, syncPassword);
      const res = await testBackendLogin();
      if (res.ok) {
        setSyncSignedIn(true);
        setSyncAuthHint(null);
        setSyncPassword('');
        setSyncMessage(null);
        if (farmer?.id && plots.length > 0) {
          await uploadUnsyncedPlotsForFarmer({ farmerId: farmer.id, localPlots: plots });
        }
        if (farmer?.id) {
          const qr = await processPendingSyncQueue({ farmerId: farmer.id, localPlots: plots });
          if (qr.fetchFailed) {
            setSyncMessage(t('sync_queue_fetch_failed'));
          } else if (qr.completed > 0 || qr.failedActions > 0 || qr.droppedInvalid > 0) {
            const bits: string[] = [];
            if (qr.completed > 0) bits.push(t('sync_queue_sent', { n: qr.completed }));
            if (qr.droppedInvalid > 0) bits.push(t('sync_queue_dropped_invalid', { n: qr.droppedInvalid }));
            if (qr.failedActions > 0) {
              bits.push(t('sync_queue_failed_remain', { n: qr.failedActions }));
              if (qr.firstError) bits.push(qr.firstError);
            }
            setSyncMessage(bits.join('\n\n'));
          }
        }
        void refreshSyncMetrics();
      } else {
        setSyncSignedIn(false);
        setSyncAuthHint(res.message);
      }
    } catch (e) {
      setSyncSignedIn(false);
      setSyncAuthHint(e instanceof Error ? e.message : String(e));
    } finally {
      setSyncSigningIn(false);
    }
  };

  const onSignOutSync = async () => {
    await clearPersistedSyncAuth();
    setSyncSignedIn(false);
    setSyncEmail('');
    setSyncPassword('');
    setSyncAuthHint(t('signed_out_device'));
    setSyncMessage(null);
    void refreshSyncMetrics();
  };

  const runSyncNow = async () => {
    setSyncNowBusy(true);
    setSyncMessage(null);
    try {
      const res = await testBackendLogin();
      if (!res.ok) {
        setSyncMessage(res.message);
        return;
      }
      if (!farmer?.id) {
        setSyncMessage(t('sync_no_farmer_profile'));
        return;
      }

      const parts: string[] = [];

      if (plots.length === 0) {
        parts.push(t('sync_plots_none'));
      } else {
        const syncRes = await uploadUnsyncedPlotsForFarmer({
          farmerId: farmer.id,
          localPlots: plots,
        });
        if (syncRes.stoppedForAuth) {
          parts.push(t('sync_session_expired_short'));
        } else if (syncRes.fetchFailed) {
          parts.push(t('sync_plots_fetch_failed'));
        } else if (syncRes.unsyncedBefore === 0) {
          parts.push(t('sync_plots_already_synced'));
        } else if (syncRes.uploaded === syncRes.unsyncedBefore) {
          parts.push(
            t('sync_plots_uploaded_all', {
              uploaded: syncRes.uploaded,
              total: syncRes.unsyncedBefore,
            }),
          );
        } else {
          parts.push(
            t('sync_plots_partial', {
              uploaded: syncRes.uploaded,
              total: syncRes.unsyncedBefore,
              failed: syncRes.failed,
            }) + (syncRes.firstError ? `\n${syncRes.firstError}` : ''),
          );
        }
      }

      const queueRes = await processPendingSyncQueue({
        farmerId: farmer.id,
        localPlots: plots,
      });
      if (queueRes.fetchFailed) {
        parts.push(t('sync_queue_fetch_failed'));
      } else {
        if (queueRes.completed > 0) {
          parts.push(t('sync_queue_sent', { n: queueRes.completed }));
        }
        if (queueRes.droppedInvalid > 0) {
          parts.push(t('sync_queue_dropped_invalid', { n: queueRes.droppedInvalid }));
        }
        if (queueRes.failedActions > 0) {
          parts.push(t('sync_queue_failed_remain', { n: queueRes.failedActions }));
          if (queueRes.firstError) parts.push(queueRes.firstError);
        }
      }

      setSyncMessage(parts.filter(Boolean).join('\n\n'));
    } finally {
      setSyncNowBusy(false);
      await refreshSyncMetrics();
    }
  };

  const shareDeclarationBundle = async () => {
    if (!farmer) {
      Alert.alert(t('warning'), t('declaration_export_no_farmer'));
      return;
    }
    const bundle = buildDeclarationBundle({
      farmer,
      plots,
      appVersion: Constants.expoConfig?.version ?? null,
    });
    const json = declarationBundleToJson(bundle);
    try {
      if (Platform.OS === 'web') {
        await Share.share({ message: json, title: 'Tracebud' });
        return;
      }
      const dir = fsAny.cacheDirectory;
      if (!dir) {
        await Share.share({ message: json });
        return;
      }
      const path = `${dir}tracebud-declaration-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(path, json);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: 'application/json', UTI: 'public.json' });
      } else {
        await Share.share({ message: json });
      }
    } catch (e) {
      Alert.alert(t('warning'), e instanceof Error ? e.message : String(e));
    }
  };

  const syncDeclarationSnapshotToServer = async () => {
    if (!farmer) {
      Alert.alert(t('warning'), t('declaration_export_no_farmer'));
      return;
    }
    const login = await testBackendLogin();
    if (!login.ok) {
      Alert.alert(t('warning'), login.message);
      return;
    }
    setDeclarationBusy(true);
    try {
      const bundle = buildDeclarationBundle({
        farmer,
        plots,
        appVersion: Constants.expoConfig?.version ?? null,
      });
      const res = await postAuditEventToBackend({
        eventType: 'offline_declaration_bundle',
        payload: { ...bundle, farmerId: farmer.id },
        deviceId: Constants.deviceName ?? null,
      });
      if (!res.ok) {
        Alert.alert(
          t('warning'),
          res.reason === 'no_access_token'
            ? t('declaration_sync_need_signin')
            : res.message ?? t('declaration_sync_failed'),
        );
        return;
      }
      Alert.alert(t('declaration_sync_ok_title'), t('declaration_sync_ok_body'));
    } finally {
      setDeclarationBusy(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <CompactTabHeader
        paddingTop={insets.top}
        badge={
          <Badge variant={totalSyncPending > 0 ? 'warning' : 'success'} size="sm">
            {totalSyncPending > 0 ? t('pending_count', { n: totalSyncPending }) : t('online')}
          </Badge>
        }
        left={
          <Pressable onPress={() => router.push('/')} style={compactTabHeaderStyles.backButton}>
            <Ionicons name="chevron-back" size={20} color={colors.textInverse} />
            <ThemedText type="defaultSemiBold" style={{ color: colors.textInverse }}>
              {t('back')}
            </ThemedText>
          </Pressable>
        }
        centerTitle={t('settings_title')}
        onLanguagePress={() => setLang(lang === 'en' ? 'es' : 'en')}
        languageLabel={String(lang)}
        textInverseColor={colors.textInverse}
      />

      <ThemedScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.sectionTitleAbove}>
          <Ionicons name="person-circle-outline" size={22} color={Brand.primary} />
          <ThemedText type="subtitle" style={styles.sectionTitleAboveText}>
            {t('your_profile')}
          </ThemedText>
        </View>
        <Card variant="outlined" padding="none" style={styles.card}>
          <CardContent style={styles.cardInner}>
            {!profileEditing ? (
              <>
                <View style={styles.profileReadonlyTop}>
                  <View style={styles.userAvatar}>
                    {farmer?.profilePhotoUri ? (
                      <Image source={{ uri: farmer.profilePhotoUri }} style={styles.avatarImage} />
                    ) : (
                      <Ionicons name="person-outline" size={28} color={Brand.primary} />
                    )}
                  </View>
                  <View style={styles.profileReadonlyTextCol}>
                    <ThemedText type="subtitle" style={styles.profileReadonlyName}>
                      {farmer?.name?.trim() ? farmer.name.trim() : t('profile_no_name')}
                    </ThemedText>
                    <ThemedText type="defaultSemiBold" style={[styles.greenText, styles.profileReadonlyLocation]}>
                      {t('farmer_region')}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.profileReadonlyField}>
                  <ThemedText type="default" style={styles.profileReadonlyLabel}>
                    {t('label_email')}
                  </ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.profileReadonlyValue}>
                    {displayProfileEmail}
                  </ThemedText>
                </View>
                {farmer?.postalAddress?.trim() ? (
                  <View style={styles.profileReadonlyField}>
                    <ThemedText type="default" style={styles.profileReadonlyLabel}>
                      {t('settings_postal_label')}
                    </ThemedText>
                    <ThemedText type="defaultSemiBold" style={styles.profileReadonlyValue}>
                      {farmer.postalAddress.trim()}
                    </ThemedText>
                  </View>
                ) : null}
                {farmer?.commodityCode ? (
                  <View style={styles.profileReadonlyField}>
                    <ThemedText type="default" style={styles.profileReadonlyLabel}>
                      {t('settings_commodity_label')}
                    </ThemedText>
                    <ThemedText type="defaultSemiBold" style={styles.profileReadonlyValue}>
                      {t(
                        `commodity_${farmer.commodityCode}` as
                          | 'commodity_coffee'
                          | 'commodity_cocoa'
                          | 'commodity_rubber'
                          | 'commodity_soy'
                          | 'commodity_timber',
                      )}
                      {(() => {
                        const hs = getCommodityDefinition(farmer.commodityCode)?.hsCode;
                        return hs ? ` · HS ${formatHsHeading(hs)}` : '';
                      })()}
                    </ThemedText>
                  </View>
                ) : null}
                {farmer?.declarationLatitude != null &&
                farmer?.declarationLongitude != null &&
                Number.isFinite(farmer.declarationLatitude) &&
                Number.isFinite(farmer.declarationLongitude) ? (
                  <View style={styles.profileReadonlyField}>
                    <ThemedText type="default" style={styles.profileReadonlyLabel}>
                      {t('settings_declaration_geo_label')}
                    </ThemedText>
                    <ThemedText type="defaultSemiBold" style={styles.profileReadonlyValue}>
                      {Math.abs(farmer.declarationLatitude).toFixed(6)}°
                      {farmer.declarationLatitude >= 0 ? 'N' : 'S'},{' '}
                      {Math.abs(farmer.declarationLongitude).toFixed(6)}°
                      {farmer.declarationLongitude >= 0 ? 'E' : 'W'}
                    </ThemedText>
                  </View>
                ) : null}
                <Button variant="secondary" size="md" fullWidth onPress={enterProfileEdit}>
                  {t('profile_edit')}
                </Button>
              </>
            ) : (
              <>
                <View style={styles.profileAvatarRow}>
                  <Pressable
                    onPress={openPhotoOptions}
                    accessibilityRole="button"
                    accessibilityLabel="Change profile photo"
                    style={styles.avatarWrap}
                  >
                    <View style={styles.userAvatar}>
                      {farmer?.profilePhotoUri ? (
                        <Image source={{ uri: farmer.profilePhotoUri }} style={styles.avatarImage} />
                      ) : (
                        <Ionicons name="person-outline" size={28} color={Brand.primary} />
                      )}
                    </View>
                    <View style={styles.avatarCameraBadge} pointerEvents="none">
                      <Ionicons name="camera" size={13} color="#FFFFFF" />
                    </View>
                  </Pressable>
                  <Pressable onPress={openPhotoOptions} hitSlop={12} style={styles.changeLink}>
                    <ThemedText type="defaultSemiBold" style={styles.changeLinkText}>
                      {t('change_photo')}
                    </ThemedText>
                  </Pressable>
                </View>
                <Input
                  label={t('label_your_name')}
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder={farmer ? t('ph_your_name') : t('ph_complete_home')}
                  editable={Boolean(farmer)}
                  containerStyle={styles.nameInputWrap}
                />

                {farmer ? (
                  <View style={{ marginTop: 12, gap: 8 }}>
                    <ThemedText type="defaultSemiBold">{t('settings_declaration_geo_label')}</ThemedText>
                    <ThemedText type="caption" style={styles.mutedText}>
                      {t('simplified_declaration_geo_body')}
                    </ThemedText>
                    {farmer.declarationLatitude != null &&
                    farmer.declarationLongitude != null &&
                    Number.isFinite(farmer.declarationLatitude) &&
                    Number.isFinite(farmer.declarationLongitude) ? (
                      <ThemedText type="caption">
                        {Math.abs(farmer.declarationLatitude).toFixed(6)}°
                        {farmer.declarationLatitude >= 0 ? 'N' : 'S'},{' '}
                        {Math.abs(farmer.declarationLongitude).toFixed(6)}°
                        {farmer.declarationLongitude >= 0 ? 'E' : 'W'}
                      </ThemedText>
                    ) : null}
                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                      <Button variant="secondary" size="md" onPress={() => void captureDeclarationGeo()}>
                        {t('simplified_declaration_capture_gps')}
                      </Button>
                      {farmer.declarationLatitude != null && farmer.declarationLongitude != null ? (
                        <Button variant="outline" size="md" onPress={clearDeclarationGeo}>
                          {t('simplified_declaration_clear_gps')}
                        </Button>
                      ) : null}
                    </View>
                  </View>
                ) : null}

                <View style={styles.profileDivider} />

                <View style={styles.syncAccountHeader}>
                  <Ionicons
                    name={syncSignedIn ? 'checkmark-circle-outline' : 'log-in-outline'}
                    size={20}
                    color={Brand.primary}
                  />
                  <ThemedText type="defaultSemiBold" style={styles.syncAccountTitle}>
                    {syncSignedIn ? t('tracebud_account') : t('sign_in_sync_plots')}
                  </ThemedText>
                </View>
                {syncSignedIn ? (
                  <>
                    <ThemedText type="defaultSemiBold" style={styles.syncSignedInEmail}>
                      {t('signed_in_as')}{' '}
                      {syncEmail.trim() ? syncEmail : getAuthCredentials().email || '—'}
                    </ThemedText>
                    <ThemedText type="default" style={styles.syncAccountSub}>
                      {t('plot_sync_note')}
                    </ThemedText>
                  </>
                ) : (
                  <>
                    <ThemedText type="default" style={styles.syncAccountSub}>
                      {t('sign_in_sub')}
                    </ThemedText>
                    <Input
                      label={t('label_email')}
                      value={syncEmail}
                      onChangeText={setSyncEmail}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      placeholder="you@example.com"
                      containerStyle={styles.syncInput}
                    />
                    <Input
                      label={t('label_password')}
                      value={syncPassword}
                      onChangeText={setSyncPassword}
                      secureTextEntry
                      placeholder="••••••••"
                      containerStyle={styles.syncInput}
                    />
                  </>
                )}
                <View style={styles.syncActions}>
                  {!syncSignedIn ? (
                    <View style={styles.syncPrimaryBtnWrap}>
                      {syncSigningIn ? (
                        <ActivityIndicator color={Brand.primary} />
                      ) : (
                        <Button variant="primary" size="md" fullWidth onPress={() => void onSignInForSync()}>
                          {t('sign_in')}
                        </Button>
                      )}
                    </View>
                  ) : null}
                  <Button variant="outline" size="md" fullWidth onPress={() => void onSignOutSync()}>
                    {t('sign_out_device')}
                  </Button>
                </View>
                {syncAuthHint ? (
                  <ThemedText type="default" style={styles.syncAuthHint}>
                    {syncAuthHint}
                  </ThemedText>
                ) : null}

                <View style={styles.profileEditActions}>
                  <Button variant="primary" size="md" fullWidth onPress={exitProfileEditSave} disabled={!farmer}>
                    {t('profile_save')}
                  </Button>
                  <Button variant="outline" size="md" fullWidth onPress={exitProfileEditCancel}>
                    {t('cancel')}
                  </Button>
                </View>
              </>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined" padding="none" style={styles.card}>
          <CardContent style={styles.cardInner}>
            <View style={styles.rowHeaderInline}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="language-outline" size={20} color={Brand.primary} />
                <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>
                  {t('language')}
                </ThemedText>
              </View>
              <Pressable onPress={() => setLang(lang === 'en' ? 'es' : 'en')} hitSlop={10}>
                <ThemedText type="defaultSemiBold" style={styles.greenText}>
                  {lang === 'es' ? 'Español' : 'English'}
                </ThemedText>
              </Pressable>
            </View>
          </CardContent>
        </Card>

        <Card variant="outlined" padding="none" style={styles.card}>
          <CardContent style={styles.cardInner}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="locate-outline" size={20} color={Brand.primary} />
              <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>
                {t('settings_vertex_avg_title')}
              </ThemedText>
            </View>
            <ThemedText type="caption" style={styles.mutedText}>
              {t('settings_vertex_avg_body')}
            </ThemedText>
            <View style={styles.vertexAvgRow}>
              <Pressable
                onPress={() => {
                  setVertexAvgSeconds(60);
                  void setSetting('vertexAveragingSeconds', '60');
                }}
                style={[
                  styles.vertexAvgChip,
                  vertexAvgSeconds === 60 && styles.vertexAvgChipSelected,
                ]}
              >
                <ThemedText
                  type="defaultSemiBold"
                  style={vertexAvgSeconds === 60 ? styles.vertexAvgChipTextSelected : undefined}
                >
                  {t('settings_vertex_60')}
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => {
                  setVertexAvgSeconds(120);
                  void setSetting('vertexAveragingSeconds', '120');
                }}
                style={[
                  styles.vertexAvgChip,
                  vertexAvgSeconds === 120 && styles.vertexAvgChipSelected,
                ]}
              >
                <ThemedText
                  type="defaultSemiBold"
                  style={vertexAvgSeconds === 120 ? styles.vertexAvgChipTextSelected : undefined}
                >
                  {t('settings_vertex_120')}
                </ThemedText>
              </Pressable>
            </View>
          </CardContent>
        </Card>

        <Card variant="outlined" padding="none" style={styles.card}>
          <CardContent style={styles.cardInner}>
            <View style={styles.rowHeaderInline}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="sync-outline" size={20} color={Brand.primary} />
                <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>
                  {t('sync_status_section')}
                </ThemedText>
              </View>
              <Badge variant={totalSyncPending > 0 ? 'warning' : 'success'} size="md">
                {totalSyncPending > 0 ? t('pending_count', { n: totalSyncPending }) : t('up_to_date')}
              </Badge>
            </View>
            <ThemedText type="caption" style={styles.mutedText}>
              {t('settings_api_base')}: {getTracebudApiBaseUrl()}
            </ThemedText>
            <ThemedText type="caption" style={styles.syncAuthHint}>
              {t('settings_api_url_hint')}
            </ThemedText>
            <View style={styles.btnWrap}>
              <Button
                variant="secondary"
                size="md"
                fullWidth
                loading={syncNowBusy}
                disabled={syncNowBusy}
                onPress={() => void runSyncNow()}
              >
                {t('sync_now')}
              </Button>
            </View>
            {syncMessage ? (
              <ThemedText type="default" style={styles.syncHint}>
                {syncMessage}
              </ThemedText>
            ) : null}
          </CardContent>
        </Card>

        <Card variant="outlined" padding="none" style={styles.card}>
          <CardContent style={styles.cardInner}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="document-text-outline" size={20} color={Brand.primary} />
              <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>
                {t('declaration_audit_section')}
              </ThemedText>
            </View>
            <ThemedText type="caption" style={styles.mutedText}>
              {t('declaration_audit_body')}
            </ThemedText>
            <View style={[styles.btnWrap, { marginTop: 10 }]}>
              <Button variant="outline" size="md" fullWidth onPress={() => void shareDeclarationBundle()}>
                {t('declaration_export_json')}
              </Button>
            </View>
            <View style={styles.btnWrap}>
              <Button
                variant="secondary"
                size="md"
                fullWidth
                loading={declarationBusy}
                disabled={declarationBusy}
                onPress={() => void syncDeclarationSnapshotToServer()}
              >
                {t('declaration_sync_server')}
              </Button>
            </View>
          </CardContent>
        </Card>

        <Card variant="outlined" padding="none" style={styles.card}>
          <CardContent style={styles.cardInner}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="phone-portrait-outline" size={20} color={Brand.primary} />
              <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>
                {t('local_storage')}
              </ThemedText>
            </View>
            <View style={styles.storageBarTrack}>
              <View style={[styles.storageBarFill, { width: `${usagePct * 100}%` }]} />
            </View>
            <ThemedText type="default" style={styles.mutedText}>
              {t('mb_used', { used: usedMb, total: totalMb })}
            </ThemedText>
          </CardContent>
        </Card>

        <Card variant="outlined" padding="none" style={[styles.card, styles.helpCard]}>
          <CardContent style={styles.cardInner}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="information-circle-outline" size={20} color={Brand.primary} />
              <View style={{ flex: 1 }}>
                <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>
                  {t('need_help')}
                </ThemedText>
                <ThemedText type="default" style={styles.helpSub}>
                  {t('contact_us')}
                </ThemedText>
              </View>
            </View>
            <View style={styles.btnWrap}>
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onPress={() => {
                  Linking.openURL('mailto:support@tracebud.com').catch(() => undefined);
                }}
              >
                {t('contact_us_btn')}
              </Button>
            </View>
          </CardContent>
        </Card>
      </ThemedScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Spacing['2xl'],
    gap: 12,
  },
  sectionTitleAbove: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
    marginBottom: 0,
  },
  sectionTitleAboveText: {
    color: '#111111',
  },
  card: { marginTop: 0 },
  cardInner: {
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionLabel: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333333',
  },
  btnWrap: {
    marginTop: 8,
  },
  syncHint: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#666666',
  },
  rowHeaderInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  profileAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nameInputWrap: {
    marginBottom: 8,
  },
  profileReadonlyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
    alignSelf: 'stretch',
  },
  profileReadonlyTextCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  profileReadonlyName: {
    textAlign: 'left',
    color: '#111111',
  },
  profileReadonlyLocation: {
    textAlign: 'left',
    marginTop: 0,
  },
  profileReadonlyField: {
    alignSelf: 'stretch',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
  },
  profileReadonlyLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: '#666666',
    marginBottom: 4,
  },
  profileReadonlyValue: {
    fontSize: 16,
    lineHeight: 22,
    color: '#111111',
  },
  profileEditActions: {
    gap: 10,
    marginTop: 16,
    paddingTop: 4,
  },
  avatarWrap: {
    position: 'relative',
  },
  userAvatar: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D8F2E7',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#AEE6D3',
    flexShrink: 0,
  },
  avatarCameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  changeLink: { justifyContent: 'center', paddingVertical: 8 },
  changeLinkText: {
    fontSize: 16,
    lineHeight: 22,
    color: Brand.primary,
    textDecorationLine: 'underline',
  },
  mutedText: {
    color: '#666666',
    marginTop: 0,
    fontSize: 15,
    lineHeight: 22,
  },
  greenText: {
    color: '#0A7F59',
    marginTop: 4,
    fontSize: 15,
    lineHeight: 22,
  },
  storageBarTrack: {
    marginTop: 10,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E5E5E5',
    overflow: 'hidden',
  },
  storageBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#1CC08B',
  },
  helpCard: {
    backgroundColor: '#EAF8F2',
    borderColor: '#AEE6D3',
  },
  helpSub: {
    color: '#0A7F59',
    marginTop: 4,
    fontSize: 15,
    lineHeight: 22,
  },
  profileDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5E5',
    marginVertical: 16,
  },
  syncAccountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  syncAccountTitle: {
    fontSize: 16,
    lineHeight: 22,
    color: '#111111',
  },
  syncAccountSub: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666666',
    marginBottom: 12,
  },
  syncSignedInEmail: {
    fontSize: 16,
    lineHeight: 22,
    color: '#111111',
    marginBottom: 6,
  },
  syncInput: {
    marginBottom: 12,
  },
  syncActions: {
    gap: 10,
    marginTop: 4,
  },
  syncPrimaryBtnWrap: {
    minHeight: 48,
    justifyContent: 'center',
  },
  syncAuthHint: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
  },
  vertexAvgRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  vertexAvgChip: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  vertexAvgChipSelected: {
    borderColor: Brand.primary,
    backgroundColor: '#E8F8F1',
  },
  vertexAvgChipTextSelected: {
    color: Brand.primary,
  },
});

