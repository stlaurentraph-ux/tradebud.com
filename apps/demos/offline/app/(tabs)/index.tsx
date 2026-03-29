import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Radius, Spacing } from '@/constants/theme';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brandRow}>
          <Ionicons name="leaf" size={26} color={Brand.primary} />
          <View>
            <ThemedText type="title" style={styles.brandTitle}>
              Tracebud
            </ThemedText>
            <ThemedText type="caption">Farmer Field App</ThemedText>
          </View>
        </View>

        <ThemedText style={styles.subtitle}>
          Interactive prototype for offline-first EUDR workflows.
        </ThemedText>

        <View style={styles.heroGrid}>
          <View style={styles.phoneMock}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=900&auto=format&fit=crop',
              }}
              style={styles.phoneImage}
            />
          </View>

          <View style={styles.featuresCard}>
            {[
              'Adaptive GPS mapping',
              'Ground-truth photo vault',
              'FPIC and labor attestations',
              'Yield-cap validation',
              'Digital compliance receipts',
              'Works offline in the field',
            ].map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color={Brand.primary} />
                <ThemedText>{feature}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.ctaRow}>
          <Link href="/record" asChild>
            <Pressable style={styles.primaryCta}>
              <ThemedText style={styles.primaryCtaText}>Open Interactive Demo</ThemedText>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FBF8',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing['2xl'],
    gap: Spacing.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  brandTitle: {
    color: Brand.primary,
  },
  subtitle: {
    marginTop: Spacing.sm,
    color: '#3F4A5A',
  },
  heroGrid: {
    gap: Spacing.lg,
  },
  phoneMock: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D6EEE5',
    backgroundColor: '#fff',
  },
  phoneImage: {
    width: '100%',
    height: 360,
  },
  featuresCard: {
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: '#D6EEE5',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ctaRow: {
    marginTop: Spacing.md,
  },
  primaryCta: {
    backgroundColor: Brand.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  primaryCtaText: {
    color: '#fff',
    fontWeight: '700',
  },
});
