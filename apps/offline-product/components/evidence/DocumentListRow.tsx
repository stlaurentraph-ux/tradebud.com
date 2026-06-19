import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { isImageDocumentUri } from '@/features/evidence/documentPreview';

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
  const showThumb = Boolean(uri?.trim()) && isImageDocumentUri(uri, mimeType);

  return (
    <Card variant="outlined" style={styles.rowCard}>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" onPress={onPress} style={styles.pressableMain}>
          {showThumb ? (
            <Image source={{ uri }} style={styles.thumb} />
          ) : (
            <View style={styles.fileIcon}>
              <Ionicons name="document-text-outline" size={22} color="#4B5563" />
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
          <Ionicons name="chevron-forward" size={18} color="#A3A3A3" />
        </Pressable>
        {onDelete ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={deleteAccessibilityLabel}
            onPress={onDelete}
            style={styles.deleteBtn}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={20} color="#B91C1C" />
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  rowCard: { padding: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pressableMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#EEE',
    flexShrink: 0,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  badgeWrap: {
    flexShrink: 0,
    maxWidth: '42%',
  },
  statusWrap: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  deleteBtn: {
    padding: 6,
    flexShrink: 0,
  },
});
