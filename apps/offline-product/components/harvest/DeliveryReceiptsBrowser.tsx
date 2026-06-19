import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DeliveryReceiptDetailPanel } from '@/components/harvest/DeliveryReceiptDetailPanel';
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
import type { TranslateFn } from '@/features/i18n/translate';

type ReceiptsScreen =
  | { kind: 'plots' }
  | { kind: 'plot'; plotId: string }
  | { kind: 'detail'; receiptId: string };

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
  /** Open this receipt on load (e.g. after logging a delivery). */
  initialReceiptId?: string | null;
  /** When filtered to one plot, open the newest matching receipt (e.g. from Deliveries tab). */
  openLatestReceipt?: boolean;
  onScreenChange?: (title: string | null) => void;
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
  initialReceiptId = null,
  openLatestReceipt = false,
  onScreenChange,
}: DeliveryReceiptsBrowserProps) {
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

  const [screen, setScreen] = useState<ReceiptsScreen>(() =>
    resolveInitialReceiptsScreen(plotIdFilter, initialReceiptId),
  );

  useEffect(() => {
    if (!initialReceiptId) return;
    const match = receipts.find((row) => row.id === initialReceiptId);
    if (!match) return;
    setScreen({ kind: 'detail', receiptId: match.id });
  }, [initialReceiptId, receipts]);

  useEffect(() => {
    if (initialReceiptId || !openLatestReceipt || plotFilterIds.size === 0) return;
    const matching = receipts.filter((row) => receiptMatchesPlotFilter(row, plotFilterIds));
    if (matching.length === 0) return;
    setScreen({ kind: 'detail', receiptId: matching[0]!.id });
  }, [initialReceiptId, openLatestReceipt, receipts, plotFilterIds]);

  const activePlotGroup = useMemo(() => {
    if (screen.kind === 'plots') return null;
    const plotId = screen.kind === 'plot' ? screen.plotId : findReceiptPlotId(receipts, screen.receiptId);
    if (!plotId) return null;
    return findPlotReceiptGroupForScreen(filteredGroups, plotId, plotFilterIds);
  }, [screen, filteredGroups, receipts, plotFilterIds]);

  const activeReceipt = useMemo(() => {
    if (screen.kind !== 'detail') return null;
    return receipts.find((row) => row.id === screen.receiptId) ?? null;
  }, [screen, receipts]);

  const navigate = (next: ReceiptsScreen) => {
    setScreen(next);
    if (next.kind === 'plots') {
      onScreenChange?.(null);
      return;
    }
    if (next.kind === 'plot') {
      const group = plotGroups.find((row) => String(row.plotId) === String(next.plotId));
      onScreenChange?.(group?.plotName ?? plotNameFilter ?? null);
      return;
    }
    const receipt = receipts.find((row) => row.id === next.receiptId);
    onScreenChange?.(receipt ? `${receipt.kg} kg` : null);
  };

  if (receipts.length === 0) {
    return (
      <Card variant="outlined" style={styles.card}>
        <ThemedText type="caption">{t('no_deliveries')}</ThemedText>
      </Card>
    );
  }

  if (screen.kind === 'detail' && activeReceipt) {
    return (
      <DeliveryReceiptDetailPanel
        t={t}
        receipt={activeReceipt}
        onBack={() => {
          navigate({ kind: 'plot', plotId: activeReceipt.plotId });
        }}
      />
    );
  }

  if (screen.kind === 'detail') {
    return (
      <Card variant="outlined" style={styles.card}>
        <ThemedText type="caption">{t('voucher_share_loading')}</ThemedText>
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
        {!plotIdFilter ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => navigate({ kind: 'plots' })}
            style={styles.backRow}
          >
            <Ionicons name="chevron-back" size={18} color="#0A7F59" />
            <ThemedText type="defaultSemiBold" style={styles.backText}>
              {t('harvest_receipts_all_plots')}
            </ThemedText>
          </Pressable>
        ) : null}
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
              onPress={() => navigate({ kind: 'detail', receiptId: receipt.id })}
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
          onPress={() => navigate({ kind: 'plot', plotId: group.plotId })}
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

function findReceiptPlotId(receipts: DeliveryReceiptRecord[], receiptId: string): string | null {
  return receipts.find((row) => row.id === receiptId)?.plotId ?? null;
}

function resolveInitialReceiptsScreen(
  plotIdFilter: string | null,
  initialReceiptId: string | null,
): ReceiptsScreen {
  if (initialReceiptId) {
    return { kind: 'detail', receiptId: initialReceiptId };
  }
  if (plotIdFilter) {
    return { kind: 'plot', plotId: plotIdFilter };
  }
  return { kind: 'plots' };
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  card: { padding: 14 },
  list: { gap: 10 },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  backText: { color: '#0A7F59' },
  plotHeading: { color: '#1F2937', fontSize: 18 },
  plotSubheading: { color: '#6B7280', marginBottom: 4 },
  plotCard: { padding: 14, borderRadius: 16 },
  plotCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  plotIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F7F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plotCardBody: { flex: 1, minWidth: 0 },
  plotCardMeta: { color: '#6B7280', marginTop: 2 },
  receiptRow: { padding: 14, borderRadius: 14, gap: 6 },
  receiptRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  receiptKg: { color: '#0A7F59' },
  receiptDate: { color: '#6B7280' },
  receiptBuyer: { color: '#374151' },
  receiptPending: { color: '#B45309', marginTop: 2 },
});
