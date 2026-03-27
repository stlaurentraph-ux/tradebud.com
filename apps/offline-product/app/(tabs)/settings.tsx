import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  saveAndApplySyncAuth,
  testBackendLogin,
} from '@/features/api/postPlot';
import { useCallback, useEffect, useState } from 'react';
import { loadPendingSyncActions } from '@/features/state/persistence';
import {
  listUnsyncedLocalPlots,
  subscribeServerPlotSyncChanged,
  uploadUnsyncedPlotsForFarmer,
} from '@/features/sync/plotServerSync';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppState } from '@/features/state/AppStateContext';
import { Input } from '@/components/ui/input';
import { useFocusEffect } from '@react-navigation/native';

export default function SettingsScreen() {
  const { lang, setLang, t } = useLanguage();
  const { farmer, plots, setFarmer, updateFarmerProfilePhoto } = useAppState();
  const [nameInput, setNameInput] = useState('');
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
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
  }, [farmer?.id, plots]);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        await refreshSavedSyncEmail();
        await refreshSyncMetrics();
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
        const dest = `${FileSystem.documentDirectory}farmer-profile.jpg`;
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
        if (farmer?.id && plots.length > 0) {
          await uploadUnsyncedPlotsForFarmer({ farmerId: farmer.id, localPlots: plots });
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
    const res = await testBackendLogin();
    if (!res.ok) {
      setSyncMessage(res.message);
      await refreshSyncMetrics();
      return;
    }
    if (!farmer?.id || plots.length === 0) {
      setSyncMessage('Backend connection OK. No local plots to sync.');
      await refreshSyncMetrics();
      return;
    }
    const syncRes = await uploadUnsyncedPlotsForFarmer({ farmerId: farmer.id, localPlots: plots });
    if (syncRes.stoppedForAuth) {
      setSyncMessage('Session expired. Sign in again under Settings → Your profile.');
    } else if (syncRes.fetchFailed) {
      setSyncMessage('Could not reach Tracebud API while syncing plots.');
    } else if (syncRes.unsyncedBefore === 0) {
      setSyncMessage('All local plots are already synced.');
    } else if (syncRes.uploaded === syncRes.unsyncedBefore) {
      setSyncMessage(`Synced all plots (${syncRes.uploaded}/${syncRes.unsyncedBefore}).`);
    } else {
      const reason = syncRes.firstError ? ` ${syncRes.firstError}` : '';
      setSyncMessage(
        `Partially synced plots (${syncRes.uploaded}/${syncRes.unsyncedBefore}, failed ${syncRes.failed}).${reason}`,
      );
    }
    await refreshSyncMetrics();
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
});

