import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';

import { ThemedScrollView, ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActionButton as Button } from '@/components/ui/action-button';
import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
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
  const { lang } = useLanguage();

  const [profileDocs, setProfileDocs] = useState<PlotEvidenceItem[]>([]);

  useEffect(() => {
    const pid = farmer?.id ? `profile:${farmer.id}` : null;
    if (!pid) {
      setProfileDocs([]);
      return;
    }
    loadEvidenceForPlot(pid).then(setProfileDocs).catch(() => setProfileDocs([]));
  }, [farmer?.id]);

  const counts = useMemo(() => {
    const byKind = (items: PlotEvidenceItem[], kind: PlotEvidenceKind) =>
      items.filter((i) => i.kind === kind).length;
    return {
      total: profileDocs.length,
      fpic: byKind(profileDocs, 'fpic_repository'),
      labor: byKind(profileDocs, 'labor_evidence'),
      tenure: byKind(profileDocs, 'tenure_evidence'),
      permits: byKind(profileDocs, 'protected_area_permit'),
    };
  }, [profileDocs]);

  const addProfileDoc = async (kind: PlotEvidenceKind, label: string) => {
    if (!farmer?.id) return;
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf', '*/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (picked.canceled || !picked.assets?.[0]?.uri) return;
    const asset = picked.assets[0];
    persistPlotEvidenceItem({
      plotId: `profile:${farmer.id}`,
      kind,
      uri: asset.uri,
      mimeType: asset.mimeType ?? null,
      label: asset.name ?? label,
      takenAt: Date.now(),
    });
    const updated = await loadEvidenceForPlot(`profile:${farmer.id}`);
    setProfileDocs(updated);
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
              Back
            </ThemedText>
          </Pressable>
          <View style={{ flex: 1 }}>
            <ThemedText type="defaultSemiBold" style={{ color: colors.textInverse }}>
              Documents
            </ThemedText>
            <ThemedText type="caption" style={{ color: colors.textInverse, opacity: 0.9 }}>
              Identity + land + permits
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
            <ThemedText type="defaultSemiBold">My documents</ThemedText>
            <Badge variant="default" size="sm">
              {counts.total}
            </Badge>
          </View>
          <ThemedText type="caption">
            Upload and organize documents for FPIC, land tenure, permits, and labor compliance.
          </ThemedText>
        </Card>

        <Card variant="elevated" style={styles.card}>
          <View style={styles.rowHeader}>
            <ThemedText type="defaultSemiBold">FPIC repository</ThemedText>
            <Badge variant={counts.fpic > 0 ? 'info' : 'default'} size="sm">
              {counts.fpic}
            </Badge>
          </View>
          <ThemedText type="caption">Minutes, mapping, social agreements, and consent evidence.</ThemedText>
          <View style={{ gap: 10, marginTop: 10 }}>
            <Button title="Add FPIC doc/photo" variant="secondary" onPress={() => addProfileDoc('fpic_repository', 'fpic_doc')} />
          </View>
          {profileDocs.filter((d) => d.kind === 'fpic_repository').slice(0, 3).map((d) => (
            <Card key={d.id} variant="outlined" style={styles.rowCard}>
              <View style={styles.rowHeader}>
                <ThemedText type="defaultSemiBold">{d.label ?? 'FPIC document'}</ThemedText>
                <Badge variant="info" size="sm">
                  FPIC
                </Badge>
              </View>
              <ThemedText type="caption">{new Date(d.takenAt).toLocaleDateString()}</ThemedText>
            </Card>
          ))}
        </Card>

        <Card variant="elevated" style={styles.card}>
          <View style={styles.rowHeader}>
            <ThemedText type="defaultSemiBold">Land tenure</ThemedText>
            <Badge variant={counts.tenure > 0 ? 'info' : 'default'} size="sm">
              {counts.tenure}
            </Badge>
          </View>
          <ThemedText type="caption">Land titles, customary agreements, municipal letters, witness attestations.</ThemedText>
          <View style={{ gap: 10, marginTop: 10 }}>
            <Button title="Add tenure evidence" variant="secondary" onPress={() => addProfileDoc('tenure_evidence', 'tenure_doc')} />
          </View>
          {profileDocs.filter((d) => d.kind === 'tenure_evidence').slice(0, 3).map((d) => (
            <Card key={d.id} variant="outlined" style={styles.rowCard}>
              <View style={styles.rowHeader}>
                <ThemedText type="defaultSemiBold">{d.label ?? 'Tenure document'}</ThemedText>
                <Badge variant="default" size="sm">
                  Tenure
                </Badge>
              </View>
              <ThemedText type="caption">{new Date(d.takenAt).toLocaleDateString()}</ThemedText>
            </Card>
          ))}
        </Card>

        <Card variant="elevated" style={styles.card}>
          <View style={styles.rowHeader}>
            <ThemedText type="defaultSemiBold">Permits & management plans</ThemedText>
            <Badge variant={counts.permits > 0 ? 'info' : 'default'} size="sm">
              {counts.permits}
            </Badge>
          </View>
          <ThemedText type="caption">SINAPH buffer-zone permits, management plans, government approvals.</ThemedText>
          <View style={{ gap: 10, marginTop: 10 }}>
            <Button title="Add permit / plan" variant="secondary" onPress={() => addProfileDoc('protected_area_permit', 'permit_doc')} />
          </View>
          {profileDocs.filter((d) => d.kind === 'protected_area_permit').slice(0, 3).map((d) => (
            <Card key={d.id} variant="outlined" style={styles.rowCard}>
              <View style={styles.rowHeader}>
                <ThemedText type="defaultSemiBold">{d.label ?? 'Permit document'}</ThemedText>
                <Badge variant="warning" size="sm">
                  Permit
                </Badge>
              </View>
              <ThemedText type="caption">{new Date(d.takenAt).toLocaleDateString()}</ThemedText>
            </Card>
          ))}
        </Card>

        <Card variant="elevated" style={styles.card}>
          <View style={styles.rowHeader}>
            <ThemedText type="defaultSemiBold">Labor compliance</ThemedText>
            <Badge variant={counts.labor > 0 ? 'info' : 'default'} size="sm">
              {counts.labor}
            </Badge>
          </View>
          <ThemedText type="caption">Photos/docs of working conditions and ILO compliance evidence.</ThemedText>
          <View style={{ gap: 10, marginTop: 10 }}>
            <Button title="Add labor evidence" variant="secondary" onPress={() => addProfileDoc('labor_evidence', 'labor_doc')} />
          </View>
          {profileDocs.filter((d) => d.kind === 'labor_evidence').slice(0, 3).map((d) => (
            <Card key={d.id} variant="outlined" style={styles.rowCard}>
              <View style={styles.rowHeader}>
                <ThemedText type="defaultSemiBold">{d.label ?? 'Labor document'}</ThemedText>
                <Badge variant="default" size="sm">
                  Labor
                </Badge>
              </View>
              <ThemedText type="caption">{new Date(d.takenAt).toLocaleDateString()}</ThemedText>
            </Card>
          ))}
        </Card>

        <Card variant="elevated" style={styles.card}>
          <View style={styles.rowHeader}>
            <ThemedText type="defaultSemiBold">Plot documents</ThemedText>
            <Badge variant="info" size="sm">
              {plots.length}
            </Badge>
          </View>
          <ThemedText type="caption">Open a plot to manage land title, permits, FPIC repository, and photo vault.</ThemedText>
          <View style={{ gap: 10, marginTop: 10 }}>
            {plots.length === 0 ? (
              <ThemedText type="caption">No local plots yet. Register a plot first.</ThemedText>
            ) : (
              plots.slice(0, 10).map((p) => (
                <Pressable key={p.id} onPress={() => router.push(`/plot/${encodeURIComponent(p.id)}?sub=documents`)}>
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

