import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/card';
import { ThemedText } from '@/components/themed-text';
import { useLanguage } from '@/features/state/LanguageContext';
import type { AppColors } from '@/features/theme/useThemedStyles';
import { useAppColors, useThemedStyles } from '@/features/theme/useThemedStyles';
import { createPlotComplianceStatusCardsStyles } from '@/components/compliance/plotComplianceStatusCardsStyles';
import {
  deforestationBodyKey,
  deforestationTitleKey,
  deforestationUiStateFromBackendStatus,
  parseDeforestationScreening,
  resolveBackendPlotComplianceStatus,
  type DeforestationUiState,
} from '@/features/compliance/plotDeforestationStatus';

type PlotComplianceStatusCardsProps = {
  backendPlotId: string | null;
  backendStatus: unknown;
  deforestationScreening: unknown;
  sinaphOverlap: boolean;
  indigenousOverlap: boolean;
};

function deforestationIcon(c: AppColors, state: DeforestationUiState): {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
} {
  switch (state) {
    case 'passed':
      return { name: 'leaf-outline', color: c.link, bg: c.surfaceAccent };
    case 'under_review':
    case 'at_risk':
      return { name: 'alert-circle-outline', color: c.textWarningStrong, bg: c.surfaceWarning };
    case 'alert':
      return { name: 'warning-outline', color: c.error, bg: c.surfaceWarning };
    default:
      return { name: 'time-outline', color: c.textMuted, bg: c.backgroundSecondary };
  }
}

function protectedAreasIcon(c: AppColors, clear: boolean, synced: boolean): {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
} {
  if (!synced) {
    return { name: 'cloud-upload-outline', color: c.textMuted, bg: c.backgroundSecondary };
  }
  if (clear) {
    return { name: 'shield-checkmark-outline', color: c.link, bg: c.surfaceAccent };
  }
  return { name: 'shield-outline', color: c.textWarningStrong, bg: c.surfaceWarning };
}

export function PlotComplianceStatusCards({
  backendPlotId,
  backendStatus,
  deforestationScreening,
  sinaphOverlap,
  indigenousOverlap,
}: PlotComplianceStatusCardsProps) {
  const colors = useAppColors();
  const styles = useThemedStyles(createPlotComplianceStatusCardsStyles);
  const { t } = useLanguage();
  const synced = Boolean(backendPlotId);

  const deforestationState: DeforestationUiState = synced
    ? deforestationUiStateFromBackendStatus(
        resolveBackendPlotComplianceStatus({
          status: backendStatus,
          deforestation_screening: deforestationScreening,
        }),
      )
    : 'pending';

  const deforestationIconStyle = deforestationIcon(colors, deforestationState);
  const screening = synced ? parseDeforestationScreening(deforestationScreening) : null;

  const protectedClear = !sinaphOverlap && !indigenousOverlap;
  const protectedIconStyle = protectedAreasIcon(colors, protectedClear, synced);

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

