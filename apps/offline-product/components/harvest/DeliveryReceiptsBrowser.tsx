import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import type { HarvestPlotOption } from '@/features/harvest/multiPlotDeliverySession';
import {
  formatReceiptDateLabel,
  groupDeliveryReceiptsByPlot,
  normalizeDeliveryReceipts,
  type DeliveryReceiptRecord,
} from '@/features/harvest/deliveryReceiptModels';
import {
  dedupeDeliveryReceipts,
  findPlotReceiptGroupForScreen,
  mergeDeliveryReceiptLists,
  receiptMatchesPlotFilter,
} from '@/features/harvest/localDeliveryReceipts';
import { deliveryReceiptHref } from '@/features/navigation/receiptRoutes';
import type { TranslateFn } from '@/features/i18n/translate';
import { createDeliveryReceiptsBrowserStyles } from '@/components/harvest/harvestPanelStyles';
import { useThemedStyles } from '@/features/theme/useThemedStyles';

type ReceiptsScreen = { kind: 'plots' } | { kind: 'plot'; plotId: string };

type DeliveryReceiptsBrowserProps = {
  t: TranslateFn;
  vouchers: unknown[];
  mergedPlots: readonly HarvestPlotOption[];
  /** When set, skip plot picker and show this plot's deliveries only. */
  plotIdFilter?: string | null;
  /** Extra plot ids to match (local id when filter uses server id, etc.). */
  plotIdAliases?: readonly string[];
  plotNameFilter?: string | null;
  pendingReceipts?: DeliveryReceiptRecord[];
  deviceReceipts?: DeliveryReceiptRecord[];
};

export function DeliveryReceiptsBrowser({
  t,
  vouchers,
  mergedPlots,
  plotIdFilter = null,
  plotIdAliases = [],
  plotNameFilter = null,
  pendingReceipts = [],
  deviceReceipts = [],
}: DeliveryReceiptsBrowserProps) {
  const styles = useThemedStyles(createDeliveryReceiptsBrowserStyles);
  const receipts = useMemo(() => {
    const synced = normalizeDeliveryReceipts({ vouchers, mergedPlots, t });
    return dedupeDeliveryReceipts(
      mergeDeliveryReceiptLists(deviceReceipts, pendingReceipts, synced),
    );
  }, [vouchers, mergedPlots, pendingReceipts, deviceReceipts, t]);
  const plotGroups = useMemo(() => groupDeliveryReceiptsByPlot(receipts), [receipts]);

  const plotFilterIds = useMemo(() => {
    const ids = new Set<string>();
    if (plotIdFilter) ids.add(String(plotIdFilter));
    for (const alias of plotIdAliases) {
      if (alias) ids.add(String(alias));
    }
    return ids;
  }, [plotIdFilter, plotIdAliases]);

  const filteredGroups = useMemo(() => {
    if (plotFilterIds.size === 0) return plotGroups;
    return plotGroups
      .map((group) => {
        const matchingReceipts = group.receipts.filter((receipt) =>
          receiptMatchesPlotFilter(receipt, plotFilterIds),
        );
        if (matchingReceipts.length === 0) return null;
        return {
          ...group,
          receipts: matchingReceipts,
          receiptCount: matchingReceipts.length,
        };
      })
      .filter((group): group is NonNullable<typeof group> => group != null);
  }, [plotGroups, plotFilterIds]);

  const screen = useMemo(
    (): ReceiptsScreen =>
      plotIdFilter ? { kind: 'plot', plotId: plotIdFilter } : { kind: 'plots' },
    [plotIdFilter],
  );

  const activePlotGroup = useMemo(() => {
    if (screen.kind === 'plots') return null;
    return findPlotReceiptGroupForScreen(filteredGroups, screen.plotId, plotFilterIds);
  }, [screen, filteredGroups, plotFilterIds]);

  const openReceipt = (receiptId: string) => {
    router.push(deliveryReceiptHref(receiptId));
  };

  if (receipts.length === 0) {
    return (
      <Card variant="outlined" style={styles.card}>
        <ThemedText type="caption">{t('no_deliveries')}</ThemedText>
      </Card>
    );
  }

  if (screen.kind === 'plot') {
    if (!activePlotGroup) {
      return (
        <View style={styles.wrap}>
          {plotNameFilter ? (
            <ThemedText type="defaultSemiBold" style={styles.plotHeading}>
              {plotNameFilter}
            </ThemedText>
          ) : null}
          <Card variant="outlined" style={styles.card}>
            <ThemedText type="caption">{t('no_deliveries')}</ThemedText>
          </Card>
        </View>
      );
    }
    return (
      <View style={styles.wrap}>
        <ThemedText type="defaultSemiBold" style={styles.plotHeading}>
          {activePlotGroup.plotName}
        </ThemedText>
        <ThemedText type="caption" style={styles.plotSubheading}>
          {t('harvest_receipts_plot_count', { n: activePlotGroup.receiptCount })}
        </ThemedText>
        <View style={styles.list}>
          {activePlotGroup.receipts.map((receipt) => (
            <ReceiptRow
              key={receipt.id}
              receipt={receipt}
              t={t}
              onPress={() => openReceipt(receipt.id)}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {filteredGroups.map((group) => (
        <Pressable
          key={group.plotId}
          accessibilityRole="button"
          onPress={() => router.push(`/plot/${encodeURIComponent(group.plotId)}?sub=deliveries`)}
        >
          <Card variant="outlined" style={styles.plotCard}>
            <View style={styles.plotCardRow}>
              <View style={styles.plotIconWrap}>
                <Ionicons name="leaf-outline" size={20} color="#0B8B63" />
              </View>
              <View style={styles.plotCardBody}>
                <ThemedText type="defaultSemiBold">{group.plotName}</ThemedText>
                <ThemedText type="caption" style={styles.plotCardMeta}>
                  {t('harvest_receipts_plot_count', { n: group.receiptCount })}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}

function ReceiptRow({
  receipt,
  t,
  onPress,
}: {
  receipt: DeliveryReceiptRecord;
  t: TranslateFn;
  onPress: () => void;
}) {
  const styles = useThemedStyles(createDeliveryReceiptsBrowserStyles);
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card variant="outlined" style={styles.receiptRow}>
        <View style={styles.receiptRowTop}>
          <ThemedText type="subtitle" style={styles.receiptKg}>
            {`${Math.round(receipt.kg).toLocaleString()} kg`}
          </ThemedText>
          <ThemedText type="caption" style={styles.receiptDate}>
            {formatReceiptDateLabel(receipt.createdAt)}
          </ThemedText>
        </View>
        <ThemedText type="caption" style={styles.receiptBuyer}>
          {receipt.buyerLabel}
        </ThemedText>
        {receipt.pendingSync ? (
          <ThemedText type="caption" style={styles.receiptPending}>
            {t('harvest_receipt_pending_sync')}
          </ThemedText>
        ) : null}
      </Card>
    </Pressable>
  );
}
