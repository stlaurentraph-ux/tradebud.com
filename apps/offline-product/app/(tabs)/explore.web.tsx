import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { Card, CardContent } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { Badge } from '@/components/ui/badge';

export default function ExploreWebFallback() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';

  return (
    <ThemedView style={styles.container}>
      <ThemedScrollView contentContainerStyle={styles.scroll}>
        <SectionHeader
          title="Explore (web)"
          subtitle="This app is designed for iOS/Android. Map capture, camera, and barcode scanning are not supported on web."
        />

        <Card variant="default" style={[styles.card, { borderWidth: 0 }]}>
          <CardContent>
            <View style={styles.rowHeader}>
              <ThemedText type="defaultSemiBold">API URL</ThemedText>
              <Badge variant={apiUrl ? 'success' : 'warning'} size="sm">
                {apiUrl ? 'set' : 'missing'}
              </Badge>
            </View>
            <ThemedText type="caption">{apiUrl || 'EXPO_PUBLIC_API_URL is not configured.'}</ThemedText>
          </CardContent>
        </Card>
      </ThemedScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32, gap: 12 },
  card: { marginTop: 0 },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
});

