import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { DeliveryReceiptDetailPanel } from '@/components/harvest/DeliveryReceiptDetailPanel';
import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { ActionButton as Button } from '@/components/ui/action-button';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSignInSheet } from '@/features/auth/SignInSheetContext';
import {
  buildDeliveryReceiptCatalog,
  findDeliveryReceiptById,
} from '@/features/harvest/buildDeliveryReceiptCatalog';
import type { DeliveryReceiptRecord } from '@/features/harvest/deliveryReceiptModels';
import {
  syncQueuedDeliveryReceipt,
  type SyncDeliveryReceiptFeedback,
} from '@/features/harvest/syncQueuedDeliveryReceipt';
import { goBackOrHome } from '@/features/navigation/routes';
import { useAppState } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';

export default function DeliveryReceiptScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { id, fresh, from } = useLocalSearchParams<{ id: string; fresh?: string; from?: string }>();
  const { farmer, plots: localPlots } = useAppState();
  const { t, lang, openLanguagePicker } = useLanguage();
  const { isSignedIn, openSignIn } = useSignInSheet();

  const receiptId = typeof id === 'string' ? id.trim() : '';
  const justLogged = fresh === '1';

  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<DeliveryReceiptRecord | null>(null);
  const [backendPlots, setBackendPlots] = useState<unknown[]>([]);
  const [plotServerLinks, setPlotServerLinks] = useState<Record<string, string>>({});
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<SyncDeliveryReceiptFeedback | null>(null);

  const refreshReceipt = useCallback(async () => {
    if (!farmer?.id || !receiptId) {
      setReceipt(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const catalog = await buildDeliveryReceiptCatalog({
        farmerId: farmer.id,
        localPlots,
        t,
        forcePlotFetch: true,
      });
      setBackendPlots(catalog.backendPlots);
      setPlotServerLinks(catalog.plotServerLinks);
      setReceipt(findDeliveryReceiptById(catalog.receipts, receiptId));
    } catch {
      setReceipt(null);
    } finally {
      setLoading(false);
    }
  }, [farmer?.id, localPlots, receiptId, t]);

  useEffect(() => {
    void refreshReceipt();
  }, [refreshReceipt]);

  useFocusEffect(
    useCallback(() => {
      void refreshReceipt();
    }, [refreshReceipt]),
  );

  const handleBack = useCallback(() => {
    if (from === 'harvests') {
      router.replace('/(tabs)/harvests');
      return;
    }
    goBackOrHome(router);
  }, [from]);

  const runSyncNow = useCallback(async () => {
    if (!farmer?.id || !receipt) return;
    if (!isSignedIn) {
      openSignIn({ variant: 'sync' });
      return;
    }

    setSyncBusy(true);
    setSyncFeedback(null);
    try {
      const result = await syncQueuedDeliveryReceipt({
        farmerId: farmer.id,
        receipt,
        localPlots,
        backendPlots,
        plotServerLinks,
        t,
      });
      setSyncFeedback(result);
      if (result.qrCodeRef) {
        setReceipt({
          ...receipt,
          qrCodeRef: result.qrCodeRef,
          pendingSync: false,
        });
      }
      void refreshReceipt();
    } catch {
      setSyncFeedback({
        variant: 'error',
        message: t('harvest_receipt_sync_failed'),
      });
    } finally {
      setSyncBusy(false);
    }
  }, [
    backendPlots,
    farmer?.id,
    isSignedIn,
    localPlots,
    openSignIn,
    plotServerLinks,
    receipt,
    refreshReceipt,
    t,
  ]);

  const showSyncActions = useMemo(
    () => Boolean(receipt?.pendingSync || (!receipt?.qrCodeRef && receipt)),
    [receipt],
  );

  const renderSyncBanner = () => {
    if (syncBusy) {
      return (
        <View style={[styles.syncBanner, styles.syncInfo]}>
          <ActivityIndicator size="small" color="#0A7F59" />
          <ThemedText type="defaultSemiBold" style={styles.syncText}>
            {t('harvest_receipt_syncing_now')}
          </ThemedText>
        </View>
      );
    }
    if (!syncFeedback) return null;

    const iconName =
      syncFeedback.variant === 'success'
        ? 'checkmark-circle'
        : syncFeedback.variant === 'error'
          ? 'alert-circle'
          : 'information-circle';
    const iconColor =
      syncFeedback.variant === 'success'
        ? '#0A7F59'
        : syncFeedback.variant === 'error'
          ? '#B45309'
          : '#2563EB';

    return (
      <View
        style={[
          styles.syncBanner,
          syncFeedback.variant === 'success'
            ? styles.syncSuccess
            : syncFeedback.variant === 'error'
              ? styles.syncError
              : styles.syncInfo,
        ]}
      >
        <Ionicons name={iconName} size={20} color={iconColor} />
        <ThemedText type="defaultSemiBold" style={styles.syncText}>
          {syncFeedback.message}
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.screen}>
      <LinearGradient
        colors={['#0A7F59', '#0B6F50']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={handleBack} style={styles.backPill}>
            <Ionicons name="chevron-back" size={18} color={colors.textInverse} />
            <ThemedText type="caption" style={{ color: colors.textInverse }}>
              {t('back')}
            </ThemedText>
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <ThemedText type="defaultSemiBold" style={{ color: colors.textInverse }}>
              {t('plot_delivery_receipt_header')}
            </ThemedText>
          </View>
          <Pressable
            onPress={openLanguagePicker}
            accessibilityRole="button"
            accessibilityLabel={t('language_picker_title')}
            style={styles.langPill}
          >
            <ThemedText type="caption" style={{ color: colors.textInverse }}>
              {String(lang).toUpperCase()}
            </ThemedText>
          </Pressable>
        </View>
      </LinearGradient>

      <ThemedScrollView contentContainerStyle={styles.container}>
        {justLogged ? (
          <Card variant="outlined" style={styles.freshBanner}>
            <View style={styles.freshBannerRow}>
              <Ionicons name="checkmark-circle" size={22} color="#0A7F59" />
              <ThemedText type="defaultSemiBold" style={styles.freshBannerText}>
                {t('harvest_logged_title')}
              </ThemedText>
            </View>
          </Card>
        ) : null}

        {loading ? (
          <Card variant="outlined" style={styles.loadingCard}>
            <ThemedText type="caption">{t('voucher_share_loading')}</ThemedText>
          </Card>
        ) : receipt ? (
          <>
            <DeliveryReceiptDetailPanel
              t={t}
              receipt={receipt}
              onBack={handleBack}
              hideBackRow
            />

            {showSyncActions ? (
              <View style={styles.syncActions}>
                {renderSyncBanner()}
                <Button
                  title={t('harvest_receipt_sync_now')}
                  variant="primary"
                  loading={syncBusy}
                  disabled={syncBusy}
                  onPress={() => void runSyncNow()}
                />
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(tabs)/harvests?focus=select')}
              style={styles.linkRow}
            >
              <ThemedText type="defaultSemiBold" style={styles.linkText}>
                {t('log_another_harvest')}
              </ThemedText>
              <Ionicons name="chevron-forward" size={18} color="#0A7F59" />
            </Pressable>
          </>
        ) : (
          <Card variant="outlined" style={styles.loadingCard}>
            <ThemedText type="defaultSemiBold">{t('harvest_receipt_not_found_title')}</ThemedText>
            <ThemedText type="caption" style={styles.notFoundBody}>
              {t('harvest_receipt_not_found_body')}
            </ThemedText>
          </Card>
        )}
      </ThemedScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 42,
    gap: 8,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 72,
  },
  langPill: {
    minWidth: 54,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  container: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  freshBanner: {
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
    padding: 12,
  },
  freshBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  freshBannerText: {
    color: '#065F46',
    flex: 1,
  },
  loadingCard: {
    padding: 16,
    gap: 8,
  },
  notFoundBody: {
    marginTop: 6,
    color: '#6B7280',
    lineHeight: 20,
  },
  syncActions: {
    gap: 10,
    marginTop: 4,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  syncSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  syncError: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  syncInfo: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  syncText: {
    flex: 1,
    color: '#1F2937',
    lineHeight: 20,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
  },
  linkText: { color: '#0A7F59' },
});
