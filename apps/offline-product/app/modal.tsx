import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedScrollView contentContainerStyle={styles.scroll}>
        <Card variant="default" style={[styles.card, { borderWidth: 0 }]}>
          <CardContent>
            <SectionHeader
              title="Modal"
              subtitle="This screen is kept for navigation testing."
            />
            <View style={{ marginTop: 12 }}>
              <Link href="/" dismissTo asChild>
                <Button variant="secondary" fullWidth>
                  Go to home screen
                </Button>
              </Link>
            </View>
          </CardContent>
        </Card>
      </ThemedScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  card: { marginTop: 0 },
});
