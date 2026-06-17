import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/features/state/LanguageContext';

/** One expandable note — replaces duplicate “Sync documents” banners on the plot tab. */
export function DocumentUploadHint() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <Card variant="outlined" style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        style={styles.header}
      >
        <ThemedText type="defaultSemiBold" style={styles.title}>
          {t('evidence_sync_title')}
        </ThemedText>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color="#0A7F59" />
      </Pressable>
      {open ? (
        <View style={styles.body}>
          <ThemedText type="caption">{t('plot_documents_auto_upload_banner')}</ThemedText>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    flex: 1,
    color: '#3A3A3A',
  },
  body: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D9D9D9',
  },
});
