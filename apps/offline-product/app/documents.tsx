import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';

import { ProducerAttestationsCard } from '@/components/compliance/ProducerAttestationsCard';
import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActionButton as Button } from '@/components/ui/action-button';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { producerEvidenceScopeId } from '@/features/evidence/evidenceScope';
import { useAppState } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';
import {
  loadEvidenceForPlot,
  persistPlotEvidenceItem,
  type PlotEvidenceItem,
  type PlotEvidenceKind,
} from '@/features/state/persistence';

export default function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { farmer, plots } = useAppState();
  const { lang, t } = useLanguage();

  const [profileDocs, setProfileDocs] = useState<PlotEvidenceItem[]>([]);

  useEffect(() => {
    if (!farmer?.id) {
      setProfileDocs([]);
      return;
    }
    loadEvidenceForPlot(producerEvidenceScopeId(farmer.id))
      .then(setProfileDocs)
      .catch(() => setProfileDocs([]));
  }, [farmer?.id]);

  const counts = useMemo(() => {
    const byKind = (items: PlotEvidenceItem[], kind: PlotEvidenceKind) =>
      items.filter((i) => i.kind === kind).length;
    return {
      total: profileDocs.length,
      fpic: byKind(profileDocs, 'fpic_repository'),
      labor: byKind(profileDocs, 'labor_evidence'),
    };
  }, [profileDocs]);

  const addProfileDoc = async (kind: PlotEvidenceKind, label: string) => {
    if (!farmer?.id) return;
    const picked = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (picked.canceled || !picked.assets?.[0]?.uri) return;
    const asset = picked.assets[0];
    try {
      await persistPlotEvidenceItem({
        plotId: producerEvidenceScopeId(farmer.id),
        kind,
        uri: asset.uri,
        mimeType: asset.mimeType ?? null,
        label: asset.name ?? label,
        takenAt: Date.now(),
      });
      const updated = await loadEvidenceForPlot(producerEvidenceScopeId(farmer.id));
      setProfileDocs(updated);
    } catch {
      Alert.alert(t('documents_save_failed_title'), t('documents_save_failed_body'));
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <LinearGradient
        colors={['#0A7F59', '#0B6F50']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backPill}>
            <Ionicons name="chevron-back" size={18} color={colors.textInverse} />
            <ThemedText type="caption" style={{ color: colors.textInverse }}>
              {t('back')}
            </ThemedText>
          </Pressable>
          <View style={{ flex: 1 }}>
            <ThemedText type="defaultSemiBold" style={{ color: colors.textInverse }}>
              {t('documents_my_docs')}
            </ThemedText>
            <ThemedText type="caption" style={{ color: colors.textInverse, opacity: 0.9 }}>
              {t('documents_producer_scope_subtitle')}
            </ThemedText>
          </View>
          <View style={styles.langPill}>
            <Ionicons name="language" size={16} color={colors.textInverse} />
            <ThemedText type="caption" style={{ color: colors.textInverse }}>
              {String(lang).toUpperCase()}
            </ThemedText>
          </View>
        </View>
      </LinearGradient>

      <ThemedScrollView contentContainerStyle={styles.container}>
        <Card variant="elevated" style={styles.card}>
          <View style={styles.rowHeader}>
            <ThemedText type="defaultSemiBold">{t('documents_producer_scope_title')}</ThemedText>
            <Badge variant="default" size="sm">
              {counts.total}
            </Badge>
          </View>
          <ThemedText type="caption">{t('documents_producer_scope_body')}</ThemedText>
        </Card>

        <ProducerAttestationsCard />

        <Card variant="elevated" style={styles.card}>
          <View style={styles.rowHeader}>
            <ThemedText type="defaultSemiBold">{t('documents_fpic_section')}</ThemedText>
            <Badge variant={counts.fpic > 0 ? 'info' : 'default'} size="sm">
              {counts.fpic}
            </Badge>
          </View>
          <ThemedText type="caption">{t('documents_fpic_body')}</ThemedText>
          <View style={{ gap: 10, marginTop: 10 }}>
            <Button
              title={t('documents_add_fpic')}
              variant="secondary"
              onPress={() => void addProfileDoc('fpic_repository', 'fpic_doc')}
            />
          </View>
          {profileDocs
            .filter((d) => d.kind === 'fpic_repository')
            .slice(0, 6)
            .map((d) => (
              <Card key={d.id} variant="outlined" style={styles.rowCard}>
                <View style={styles.rowHeader}>
                  <ThemedText type="defaultSemiBold">{d.label ?? t('documents_fpic_fallback')}</ThemedText>
                  <Badge variant="info" size="sm">
                    {t('documents_badge_fpic')}
                  </Badge>
                </View>
                <ThemedText type="caption">{new Date(d.takenAt).toLocaleDateString()}</ThemedText>
              </Card>
            ))}
        </Card>

        <Card variant="elevated" style={styles.card}>
          <View style={styles.rowHeader}>
            <ThemedText type="defaultSemiBold">{t('documents_labor_section')}</ThemedText>
            <Badge variant={counts.labor > 0 ? 'info' : 'default'} size="sm">
              {counts.labor}
            </Badge>
          </View>
          <ThemedText type="caption">{t('documents_labor_body')}</ThemedText>
          <View style={{ gap: 10, marginTop: 10 }}>
            <Button
              title={t('documents_add_labor')}
              variant="secondary"
              onPress={() => void addProfileDoc('labor_evidence', 'labor_doc')}
            />
          </View>
          {profileDocs
            .filter((d) => d.kind === 'labor_evidence')
            .slice(0, 6)
            .map((d) => (
              <Card key={d.id} variant="outlined" style={styles.rowCard}>
                <View style={styles.rowHeader}>
                  <ThemedText type="defaultSemiBold">{d.label ?? t('documents_labor_fallback')}</ThemedText>
                  <Badge variant="default" size="sm">
                    {t('documents_badge_labor')}
                  </Badge>
                </View>
                <ThemedText type="caption">{new Date(d.takenAt).toLocaleDateString()}</ThemedText>
              </Card>
            ))}
        </Card>

        <Card variant="elevated" style={styles.card}>
          <View style={styles.rowHeader}>
            <ThemedText type="defaultSemiBold">{t('documents_plot_scope_title')}</ThemedText>
            <Badge variant="info" size="sm">
              {plots.length}
            </Badge>
          </View>
          <ThemedText type="caption">{t('documents_plot_scope_body')}</ThemedText>
          <View style={{ gap: 10, marginTop: 10 }}>
            {plots.length === 0 ? (
              <ThemedText type="caption">{t('documents_no_plots')}</ThemedText>
            ) : (
              plots.slice(0, 10).map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() =>
                    router.push(
                      `/plot/${encodeURIComponent(p.id)}?sub=documents&from=documents`,
                    )
                  }
                >
                  <Card variant="outlined" style={styles.rowCard}>
                    <View style={styles.rowHeader}>
                      <ThemedText type="defaultSemiBold">{p.name}</ThemedText>
                      <Badge variant={p.kind === 'polygon' ? 'info' : 'default'} size="sm">
                        {p.kind}
                      </Badge>
                    </View>
                    <ThemedText type="caption">{p.areaHectares.toFixed(4)} ha</ThemedText>
                  </Card>
                </Pressable>
              ))
            )}
          </View>
        </Card>
      </ThemedScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingTop: 6, paddingBottom: 4 },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  container: { padding: 16, paddingBottom: 32, gap: 12 },
  card: { marginTop: 2 },
  rowCard: { padding: 12 },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
});
