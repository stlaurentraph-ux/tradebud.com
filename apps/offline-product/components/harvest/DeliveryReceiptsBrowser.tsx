import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import type { HarvestPlotOption } from '@/features/harvest/multiPlotDeliverySession';
import {
  formatReceiptDateLabel,
  formatReceiptRecipientSummary,
  normalizeDeliveryReceipts,
  type DeliveryReceiptRecord,
} from '@/features/harvest/deliveryReceiptModels';
import {
  enrichAndDedupeDeliveryReceipts,
  receiptMatchesPlotFilter,
} from '@/features/harvest/localDeliveryReceipts';
import type { PlotServerLinks } from '@/features/plots/plotServerLink';
import { deliveryReceiptHref } from '@/features/navigation/receiptRoutes';
import { cacheReceiptForNavigation } from '@/features/harvest/receiptNavigationCache';
import type { TranslateFn } from '@/features/i18n/translate';
import { createDeliveryReceiptsBrowserStyles } from '@/components/harvest/harvestPanelStyles';
import { useThemedStyles } from '@/features/theme/useThemedStyles';

type DeliveryReceiptsBrowserProps = {
  t: TranslateFn;
  vouchers: unknown[];
  mergedPlots: readonly HarvestPlotOption[];
  /** When set, list only this plot's deliveries. */
  plotIdFilter?: string | null;
  /** Extra plot ids to match (local id when filter uses server id, etc.). */
  plotIdAliases?: readonly string[];
  plotNameFilter?: string | null;
  pendingReceipts?: DeliveryReceiptRecord[];
  deviceReceipts?: DeliveryReceiptRecord[];
  plotServerLinks?: PlotServerLinks;
  /** Passed to receipt detail for back navigation. */
  receiptFrom?: string;
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
  plotServerLinks = {},
  receiptFrom,
}: DeliveryReceiptsBrowserProps) {
  const styles = useThemedStyles(createDeliveryReceiptsBrowserStyles);
  const receipts = useMemo(() => {
    const synced = normalizeDeliveryReceipts({ vouchers, mergedPlots, t });
    return enrichAndDedupeDeliveryReceipts({
      deviceReceipts,
      pendingReceipts,
      synced,
      plotServerLinks,
    });
  }, [vouchers, mergedPlots, pendingReceipts, deviceReceipts, plotServerLinks, t]);

  const plotFilterIds = useMemo(() => {
    const ids = new Set<string>();
    if (plotIdFilter) ids.add(String(plotIdFilter));
    for (const alias of plotIdAliases) {
      if (alias) ids.add(String(alias));
    }
    return ids;
  }, [plotIdFilter, plotIdAliases]);

  const displayReceipts = useMemo(() => {
    if (plotFilterIds.size === 0) return receipts;
    return receipts.filter((receipt) => receiptMatchesPlotFilter(receipt, plotFilterIds));
  }, [receipts, plotFilterIds]);

  const showPlotColumn = plotFilterIds.size === 0;

  const openReceipt = (receiptId: string) => {
    const row = displayReceipts.find((receipt) => receipt.id === receiptId);
    if (row) {
      cacheReceiptForNavigation(row);
    }
    router.push(
      deliveryReceiptHref(receiptId, receiptFrom ? { from: receiptFrom } : undefined),
    );
  };

  if (receipts.length === 0) {
    return (
      <Card variant="outlined" style={styles.card}>
        <ThemedText type="caption">{t('no_deliveries')}</ThemedText>
      </Card>
    );
  }

  if (displayReceipts.length === 0) {
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
      {plotNameFilter ? (
        <>
          <ThemedText type="defaultSemiBold" style={styles.plotHeading}>
            {plotNameFilter}
          </ThemedText>
          <ThemedText type="caption" style={styles.plotSubheading}>
            {t('harvest_receipts_plot_count', { n: displayReceipts.length })}
          </ThemedText>
        </>
      ) : null}
      <ReceiptsTable
        receipts={displayReceipts}
        showPlotColumn={showPlotColumn}
        t={t}
        onPressReceipt={openReceipt}
      />
    </View>
  );
}

function ReceiptsTable({
  receipts,
  showPlotColumn,
  t,
  onPressReceipt,
}: {
  receipts: DeliveryReceiptRecord[];
  showPlotColumn: boolean;
  t: TranslateFn;
  onPressReceipt: (receiptId: string) => void;
}) {
  const styles = useThemedStyles(createDeliveryReceiptsBrowserStyles);

  return (
    <Card variant="outlined" style={styles.tableCard}>
      <View style={styles.tableHeader}>
        {showPlotColumn ? (
          <ThemedText type="caption" style={[styles.tableHeaderCell, styles.tableColPlot]}>
            {t('harvest_receipts_col_plot')}
          </ThemedText>
        ) : null}
        <ThemedText type="caption" style={[styles.tableHeaderCell, styles.tableColDate]}>
          {t('harvest_receipts_col_date')}
        </ThemedText>
        <ThemedText
          type="caption"
          style={[
            styles.tableHeaderCell,
            styles.tableColWeight,
          ]}
        >
          {t('harvest_receipts_col_weight')}
        </ThemedText>
        <ThemedText type="caption" style={[styles.tableHeaderCell, styles.tableColRecipient]}>
          {t('harvest_receipts_col_recipient')}
        </ThemedText>
        <View style={styles.tableColChevron} />
      </View>
      {receipts.map((receipt, index) => (
        <ReceiptTableRow
          key={receipt.id}
          receipt={receipt}
          showPlotColumn={showPlotColumn}
          isLast={index === receipts.length - 1}
          t={t}
          onPress={() => onPressReceipt(receipt.id)}
        />
      ))}
    </Card>
  );
}

function ReceiptTableRow({
  receipt,
  showPlotColumn,
  isLast,
  t,
  onPress,
}: {
  receipt: DeliveryReceiptRecord;
  showPlotColumn: boolean;
  isLast: boolean;
  t: TranslateFn;
  onPress: () => void;
}) {
  const styles = useThemedStyles(createDeliveryReceiptsBrowserStyles);
  const recipient = formatReceiptRecipientSummary(receipt, t);
  const recipientStyle =
    recipient.tone === 'pending'
      ? styles.recipientPending
      : recipient.tone === 'qr'
        ? styles.recipientQr
        : recipient.tone === 'muted'
          ? styles.recipientMuted
          : styles.recipientDefault;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${receipt.plotName}, ${Math.round(receipt.kg)} kg, ${recipient.label}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tableRow,
        !isLast && styles.tableRowBorder,
        pressed && styles.tableRowPressed,
      ]}
    >
      {showPlotColumn ? (
        <View style={styles.tableColPlot}>
          <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.tablePlotName}>
            {receipt.plotName}
          </ThemedText>
        </View>
      ) : null}
      <View style={styles.tableColDate}>
        <ThemedText type="caption" numberOfLines={1} style={styles.tableDate}>
          {formatReceiptDateLabel(receipt.createdAt)}
        </ThemedText>
      </View>
      <View style={styles.tableColWeight}>
        <ThemedText type="defaultSemiBold" style={styles.tableKg}>
          {`${Math.round(receipt.kg).toLocaleString()} kg`}
        </ThemedText>
      </View>
      <View style={styles.tableColRecipient}>
        <View style={styles.recipientRow}>
          {recipient.showQrIcon ? (
            <Ionicons name="qr-code-outline" size={14} color={styles.recipientQr.color} />
          ) : null}
          <ThemedText type="caption" numberOfLines={2} style={recipientStyle}>
            {recipient.label}
          </ThemedText>
        </View>
      </View>
      <View style={styles.tableColChevron}>
        <Ionicons name="chevron-forward" size={18} color={styles.chevron.color} />
      </View>
    </Pressable>
  );
}
