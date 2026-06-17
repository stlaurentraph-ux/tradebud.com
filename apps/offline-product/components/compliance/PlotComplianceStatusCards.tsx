import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/card';
import { ThemedText } from '@/components/themed-text';
import { useLanguage } from '@/features/state/LanguageContext';
import {
  deforestationBodyKey,
  deforestationTitleKey,
  deforestationUiStateFromBackendStatus,
  parseDeforestationScreening,
  type DeforestationUiState,
} from '@/features/compliance/plotDeforestationStatus';

type PlotComplianceStatusCardsProps = {
  backendPlotId: string | null;
  backendStatus: unknown;
  deforestationScreening: unknown;
  sinaphOverlap: boolean;
  indigenousOverlap: boolean;
};

function deforestationIcon(state: DeforestationUiState): {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
} {
  switch (state) {
    case 'passed':
      return { name: 'leaf-outline', color: '#0A7F59', bg: '#E8F8F1' };
    case 'under_review':
    case 'at_risk':
      return { name: 'alert-circle-outline', color: '#B45309', bg: '#FFFBEB' };
    case 'alert':
      return { name: 'warning-outline', color: '#C53030', bg: '#FEE2E2' };
    default:
      return { name: 'time-outline', color: '#6B7280', bg: '#F3F4F6' };
  }
}

function protectedAreasIcon(clear: boolean, synced: boolean): {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
} {
  if (!synced) {
    return { name: 'cloud-upload-outline', color: '#6B7280', bg: '#F3F4F6' };
  }
  if (clear) {
    return { name: 'shield-checkmark-outline', color: '#0A7F59', bg: '#E8F8F1' };
  }
  return { name: 'shield-outline', color: '#B45309', bg: '#FFFBEB' };
}

export function PlotComplianceStatusCards({
  backendPlotId,
  backendStatus,
  deforestationScreening,
  sinaphOverlap,
  indigenousOverlap,
}: PlotComplianceStatusCardsProps) {
  const { t } = useLanguage();
  const synced = Boolean(backendPlotId);

  const deforestationState: DeforestationUiState = synced
    ? deforestationUiStateFromBackendStatus(backendStatus)
    : 'pending';

  const deforestationIconStyle = deforestationIcon(deforestationState);
  const screening = synced ? parseDeforestationScreening(deforestationScreening) : null;

  const protectedClear = !sinaphOverlap && !indigenousOverlap;
  const protectedIconStyle = protectedAreasIcon(protectedClear, synced);

  const deforestationTitle = t(deforestationTitleKey(deforestationState));
  const deforestationBody = synced
    ? t(deforestationBodyKey(deforestationState))
    : t('plot_deforestation_pending_offline_body');

  const protectedTitle = synced
    ? protectedClear
      ? t('plot_protected_areas_clear')
      : t('plot_protected_areas_review')
    : t('plot_protected_areas_pending');

  const protectedBody = synced
    ? protectedClear
      ? t('plot_protected_areas_clear_body')
      : t('plot_protected_areas_review_body', {
          overlaps: [
            sinaphOverlap ? t('plot_protected_overlap_sinaph') : null,
            indigenousOverlap ? t('plot_protected_overlap_indigenous') : null,
          ]
            .filter(Boolean)
            .join(', '),
        })
    : t('plot_protected_areas_pending_body');

  return (
    <View style={styles.stack}>
      <Card variant="outlined" style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: deforestationIconStyle.bg }]}>
            <Ionicons name={deforestationIconStyle.name} size={28} color={deforestationIconStyle.color} />
          </View>
          <View style={styles.body}>
            <ThemedText type="defaultSemiBold" style={{ color: deforestationIconStyle.color }}>
              {deforestationTitle}
            </ThemedText>
            <ThemedText type="default" style={styles.bodyText}>
              {deforestationBody}
            </ThemedText>
            {screening?.screenedAt ? (
              <ThemedText type="caption" style={styles.meta}>
                {t('plot_deforestation_screened_at', {
                  date: new Date(screening.screenedAt).toLocaleDateString(),
                })}
              </ThemedText>
            ) : null}
          </View>
        </View>
      </Card>

      <Card variant="outlined" style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: protectedIconStyle.bg }]}>
            <Ionicons name={protectedIconStyle.name} size={28} color={protectedIconStyle.color} />
          </View>
          <View style={styles.body}>
            <ThemedText type="defaultSemiBold" style={{ color: protectedIconStyle.color }}>
              {protectedTitle}
            </ThemedText>
            <ThemedText type="default" style={styles.bodyText}>
              {protectedBody}
            </ThemedText>
          </View>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 10,
  },
  card: {
    borderRadius: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 4,
  },
  bodyText: {
    color: '#374151',
    lineHeight: 22,
  },
  meta: {
    color: '#6B7280',
    marginTop: 2,
  },
});
