import { useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView, ThemedScrollView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/features/state/LanguageContext';
import { useAppState } from '@/features/state/AppStateContext';
import { getAuthCredentials, setAuthCredentials } from '@/features/api/postPlot';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Brand, Spacing, Radius } from '@/constants/theme';

export default function SettingsScreen() {
  const { lang, setLang } = useLanguage();
  const { farmer } = useAppState();
  const insets = useSafeAreaInsets();
  
  const initialAuth = getAuthCredentials();
  const [email, setEmail] = useState(initialAuth.email);
  const [password, setPassword] = useState(initialAuth.password);
  const [saved, setSaved] = useState(false);

  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const cardBackground = useThemeColor({}, 'backgroundCard');
  const borderColor = useThemeColor({}, 'border');

  const handleSaveCredentials = () => {
    setAuthCredentials(email, password);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBackground }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="settings" size={24} color={Brand.primary} />
            <ThemedText type="title" style={styles.headerTitle}>Settings</ThemedText>
          </View>
          <ThemedText type="caption">Manage your app preferences and account</ThemedText>
        </View>
      </View>

      <ThemedScrollView 
        style={[styles.scrollView, { backgroundColor }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Current User Info */}
        {farmer && (
          <Card variant="elevated" style={styles.card}>
            <CardContent>
              <View style={styles.userCard}>
                <View style={styles.userAvatar}>
                  <Ionicons name="person" size={32} color={Brand.primary} />
                </View>
                <View style={styles.userInfo}>
                  <ThemedText type="defaultSemiBold">
                    {farmer.name || 'Farmer'}
                  </ThemedText>
                  <ThemedText type="caption">{farmer.id}</ThemedText>
                  <View style={styles.userBadges}>
                    <Badge variant="success" size="sm">Verified</Badge>
                    {farmer.fpicConsent && <Badge variant="info" size="sm">FPIC</Badge>}
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Language Selection */}
        <Card variant="elevated" style={styles.card}>
          <CardHeader>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="language-outline" size={20} color={Brand.primary} />
              <ThemedText type="subtitle">Language / Idioma</ThemedText>
            </View>
          </CardHeader>
          <CardContent>
            <View style={styles.languageOptions}>
              <Pressable
                onPress={() => setLang('en')}
                style={[
                  styles.languageOption,
                  { borderColor: lang === 'en' ? Brand.primary : borderColor },
                  lang === 'en' && styles.languageOptionSelected,
                ]}
              >
                <View style={styles.languageContent}>
                  <ThemedText type="defaultSemiBold">English</ThemedText>
                  <ThemedText type="caption">App language</ThemedText>
                </View>
                {lang === 'en' && (
                  <Ionicons name="checkmark-circle" size={24} color={Brand.primary} />
                )}
              </Pressable>

              <Pressable
                onPress={() => setLang('es')}
                style={[
                  styles.languageOption,
                  { borderColor: lang === 'es' ? Brand.primary : borderColor },
                  lang === 'es' && styles.languageOptionSelected,
                ]}
              >
                <View style={styles.languageContent}>
                  <ThemedText type="defaultSemiBold">Español</ThemedText>
                  <ThemedText type="caption">Idioma de la app</ThemedText>
                </View>
                {lang === 'es' && (
                  <Ionicons name="checkmark-circle" size={24} color={Brand.primary} />
                )}
              </Pressable>
            </View>
            <ThemedText type="caption" style={styles.languageHint}>
              This only changes texts inside the mobile app. Data stored in the backend is not translated.
            </ThemedText>
          </CardContent>
        </Card>

        {/* Backend Account */}
        <Card variant="elevated" style={styles.card}>
          <CardHeader>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="cloud-outline" size={20} color={Brand.primary} />
              <ThemedText type="subtitle">Backend Account</ThemedText>
            </View>
            <ThemedText type="caption" style={styles.headerHint}>
              The email you use determines your role on the backend (farmer, agent, exporter).
            </ThemedText>
          </CardHeader>
          <CardContent>
            <Input
              label="Email"
              placeholder="your@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              label="Password"
              placeholder="Enter password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              containerStyle={styles.inputSpacing}
            />
          </CardContent>
          <CardFooter>
            <Button
              variant="primary"
              onPress={handleSaveCredentials}
              fullWidth
              icon={saved ? <Ionicons name="checkmark" size={18} color="#fff" /> : undefined}
            >
              {saved ? 'Saved!' : 'Use This Account'}
            </Button>
          </CardFooter>
        </Card>

        {/* Role Tips */}
        <Card variant="outlined" style={styles.card}>
          <CardHeader>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="bulb-outline" size={20} color={Brand.accent} />
              <ThemedText type="subtitle">Testing Different Roles</ThemedText>
            </View>
          </CardHeader>
          <CardContent>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <View style={[styles.tipDot, { backgroundColor: Brand.primary }]} />
                <View style={styles.tipContent}>
                  <ThemedText type="defaultSemiBold">Farmer</ThemedText>
                  <ThemedText type="caption">Default role - record plots and harvests</ThemedText>
                </View>
              </View>
              <View style={styles.tipItem}>
                <View style={[styles.tipDot, { backgroundColor: Brand.accent }]} />
                <View style={styles.tipContent}>
                  <ThemedText type="defaultSemiBold">Agent</ThemedText>
                  <ThemedText type="caption">Use agent+demo@... email format</ThemedText>
                </View>
              </View>
              <View style={styles.tipItem}>
                <View style={[styles.tipDot, { backgroundColor: '#3182CE' }]} />
                <View style={styles.tipContent}>
                  <ThemedText type="defaultSemiBold">Exporter</ThemedText>
                  <ThemedText type="caption">Use exporter+demo@... email format</ThemedText>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card variant="outlined" style={styles.card}>
          <CardHeader>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="information-circle-outline" size={20} color={Brand.primary} />
              <ThemedText type="subtitle">About Tracebud</ThemedText>
            </View>
          </CardHeader>
          <CardContent>
            <View style={styles.appInfoRow}>
              <ThemedText type="caption">Version</ThemedText>
              <ThemedText type="defaultSemiBold">1.0.0</ThemedText>
            </View>
            <View style={styles.appInfoRow}>
              <ThemedText type="caption">Build</ThemedText>
              <ThemedText type="defaultSemiBold">Offline Field App</ThemedText>
            </View>
            <View style={styles.appInfoRow}>
              <ThemedText type="caption">Environment</ThemedText>
              <Badge variant="info" size="sm">Development</Badge>
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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DFD4',
  },
  headerContent: {
    gap: Spacing.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['5xl'],
    gap: Spacing.md,
  },
  card: {
    marginBottom: 0,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E6F7EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  userBadges: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerHint: {
    marginTop: Spacing.xs,
  },
  languageOptions: {
    gap: Spacing.sm,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 2,
  },
  languageOptionSelected: {
    backgroundColor: '#E6F7EF',
  },
  languageContent: {
    gap: 2,
  },
  languageHint: {
    marginTop: Spacing.md,
  },
  inputSpacing: {
    marginTop: Spacing.md,
  },
  tipsList: {
    gap: Spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  tipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  tipContent: {
    flex: 1,
    gap: 2,
  },
  appInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DFD4',
  },
});
