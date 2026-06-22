import { Image, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Brand } from '@/constants/theme';
import { isImageDocumentUri } from '@/features/evidence/documentPreview';
import { useAppColors, useThemedStyles } from '@/features/theme/useThemedStyles';
import { createDocumentListRowStyles } from '@/components/evidence/documentListRowStyles';

type DocumentListRowProps = {
  label: string;
  dateLabel: string;
  badgeLabel?: string;
  statusLabel?: string;
  statusVariant?: 'success' | 'warning' | 'info' | 'default';
  uri: string;
  mimeType: string | null;
  onPress: () => void;
  onDelete?: () => void;
  deleteAccessibilityLabel?: string;
};

export function DocumentListRow({
  label,
  dateLabel,
  badgeLabel,
  statusLabel,
  statusVariant = 'default',
  uri,
  mimeType,
  onPress,
  onDelete,
  deleteAccessibilityLabel,
}: DocumentListRowProps) {
  const colors = useAppColors();
  const styles = useThemedStyles(createDocumentListRowStyles);
  const showThumb = Boolean(uri?.trim()) && isImageDocumentUri(uri, mimeType);

  return (
    <Card variant="outlined" style={styles.rowCard}>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" onPress={onPress} style={styles.pressableMain}>
          {showThumb ? (
            <Image source={{ uri }} style={styles.thumb} />
          ) : (
            <View style={styles.fileIcon}>
              <Ionicons name="document-text-outline" size={22} color={colors.icon} />
            </View>
          )}
          <View style={styles.textCol}>
            <View style={styles.header}>
              <ThemedText type="defaultSemiBold" style={styles.title} numberOfLines={2}>
                {label}
              </ThemedText>
              {badgeLabel ? (
                <View style={styles.badgeWrap}>
                  <Badge variant="default" size="sm">
                    {badgeLabel}
                  </Badge>
                </View>
              ) : null}
            </View>
            <ThemedText type="caption">{dateLabel}</ThemedText>
            {statusLabel ? (
              <View style={styles.statusWrap}>
                <Badge variant={statusVariant} size="sm">
                  {statusLabel}
                </Badge>
              </View>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.iconMuted} />
        </Pressable>
        {onDelete ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={deleteAccessibilityLabel}
            onPress={onDelete}
            style={styles.deleteBtn}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={20} color={Brand.deforestationDetected} />
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

