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
  uri: string;
  mimeType: string | null;
  onPress: () => void;
};

export function DocumentListRow({
  label,
  dateLabel,
  badgeLabel,
  uri,
  mimeType,
  onPress,
}: DocumentListRowProps) {
  const showThumb = isImageDocumentUri(uri, mimeType);

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card variant="outlined" style={styles.rowCard}>
        <View style={styles.row}>
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
          </View>
          <Ionicons name="chevron-forward" size={18} color="#A3A3A3" />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rowCard: { padding: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
});
