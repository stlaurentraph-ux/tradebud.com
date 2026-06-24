import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brand } from '@/constants/theme';
import { ProvisionalMemberSheet } from '@/components/enumeration/ProvisionalMemberSheet';
import { EnumerationTileBootstrapGate } from '@/components/enumeration/EnumerationTileBootstrapGate';
import { useEnumeration } from '@/features/enumeration/EnumerationContext';
import { useAppState } from '@/features/state/AppStateContext';
import { useLanguage } from '@/features/state/LanguageContext';
import { useSignInSheet } from '@/features/auth/SignInSheetContext';

export function EnumerationHomePanel() {
  const { t } = useLanguage();
  const { plots } = useAppState();
  const { openSignIn } = useSignInSheet();
  const {
    roster,
    activeMember,
    rosterLoading,
    packPrefetching,
    selectMember,
    refreshRoster,
    prefetchRoster,
    syncProvisionalMembers,
  } = useEnumeration();
  const [provisionalOpen, setProvisionalOpen] = useState(false);
  const [prefetchMessage, setPrefetchMessage] = useState<string | null>(null);

  const plotCountByFarmer = useMemo(() => {
    const counts = new Map<string, number>();
    for (const plot of plots) {
      counts.set(plot.farmerId, (counts.get(plot.farmerId) ?? 0) + 1);
    }
    return counts;
  }, [plots]);

  return (
    <View style={styles.wrap}>
      <EnumerationTileBootstrapGate />
      <Card variant="outlined" style={styles.heroCard}>
        <View style={styles.heroIconWrap}>
          <Ionicons name="people-outline" size={24} color={Brand.primary} />
        </View>
        <ThemedText type="defaultSemiBold">{t('enumeration_home_title')}</ThemedText>
        <ThemedText type="caption" style={styles.heroBody}>
          {t('enumeration_home_body')}
        </ThemedText>
      </Card>

      <View style={styles.prefetchRow}>
        <View style={styles.prefetchButtonWrap}>
          <Button
          testID="enumeration-prefetch-roster"
          variant="outline"
          disabled={packPrefetching}
          onPress={() => {
            setPrefetchMessage(null);
            void prefetchRoster().then((result) => {
              if (result.ok) {
                setPrefetchMessage(
                  t('enumeration_prefetch_success', { n: result.memberCount }),
                );
                return;
              }
              setPrefetchMessage(result.message ?? t('enumeration_prefetch_failed'));
            });
          }}
        >
          {packPrefetching ? t('enumeration_prefetching') : t('enumeration_prefetch_roster')}
        </Button>
        </View>
        <Pressable
          testID="enumeration-sync-provisionals"
          onPress={() => {
            void syncProvisionalMembers().then(({ synced, failed }) => {
              setPrefetchMessage(
                t('enumeration_provisional_sync_result', { synced, failed }),
              );
            });
          }}
          hitSlop={8}
        >
          <Ionicons name="cloud-upload-outline" size={22} color={Brand.primary} />
        </Pressable>
      </View>
      {prefetchMessage ? (
        <ThemedText type="caption" style={styles.prefetchMessage}>
          {prefetchMessage}
        </ThemedText>
      ) : null}

      {activeMember ? (
        <Card variant="outlined" style={styles.activeCard}>
          <ThemedText type="caption" style={styles.activeLabel}>
            {t('enumeration_active_member')}
          </ThemedText>
          <ThemedText type="defaultSemiBold">{activeMember.fullName}</ThemedText>
          <ThemedText type="caption">{activeMember.village}</ThemedText>
          <Button
            testID="enumeration-map-active"
            style={styles.mapButton}
            onPress={() => router.navigate('/(tabs)/record')}
          >
            {t('enumeration_map_for_member')}
          </Button>
        </Card>
      ) : null}

      <View style={styles.sectionHeader}>
        <ThemedText type="defaultSemiBold">{t('enumeration_member_queue')}</ThemedText>
        <Pressable onPress={() => void refreshRoster()} hitSlop={8}>
          <Ionicons name="refresh-outline" size={20} color={Brand.primary} />
        </Pressable>
      </View>

      {rosterLoading ? (
        <ActivityIndicator style={styles.loader} color={Brand.primary} />
      ) : roster.length === 0 ? (
        <Card variant="outlined" style={styles.emptyCard}>
          <ThemedText type="caption">{t('enumeration_queue_empty')}</ThemedText>
        </Card>
      ) : (
        roster.map((entry) => {
          const selected = entry.farmerId === activeMember?.farmerId;
          const plotCount = plotCountByFarmer.get(entry.farmerId) ?? 0;
          return (
            <Pressable
              key={entry.farmerId}
              testID={`enumeration-member-${entry.farmerId}`}
              onPress={() => void selectMember(entry.farmerId)}
              style={({ pressed }) => [pressed && styles.rowPressed]}
            >
              <Card
                variant="outlined"
                style={[styles.memberRow, selected && styles.memberRowSelected]}
              >
                <View style={styles.memberRowTop}>
                  <ThemedText type="defaultSemiBold">{entry.fullName}</ThemedText>
                  <ThemedText type="caption">
                    {entry.source === 'provisional'
                      ? t('enumeration_source_provisional')
                      : t('enumeration_source_roster')}
                  </ThemedText>
                </View>
                <ThemedText type="caption">{entry.village}</ThemedText>
                <ThemedText type="caption" style={styles.memberMeta}>
                  {t('enumeration_member_plots', { n: plotCount })} · {t(`enumeration_status_${entry.status}`)}
                </ThemedText>
              </Card>
            </Pressable>
          );
        })
      )}

      <Button
        testID="enumeration-add-member"
        variant="outline"
        onPress={() => setProvisionalOpen(true)}
      >
        {t('enumeration_add_member')}
      </Button>

      <ProvisionalMemberSheet
        visible={provisionalOpen}
        onClose={() => setProvisionalOpen(false)}
        onRequireSignIn={() => openSignIn({ variant: 'general' })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
    paddingBottom: 24,
  },
  heroCard: {
    padding: 16,
    gap: 8,
  },
  heroIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(16,185,129,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBody: {
    marginTop: 4,
  },
  prefetchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prefetchButtonWrap: {
    flex: 1,
  },
  prefetchMessage: {
    marginTop: -4,
  },
  activeCard: {
    padding: 16,
    gap: 4,
    borderColor: Brand.primary,
  },
  activeLabel: {
    color: Brand.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  mapButton: {
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  loader: {
    marginVertical: 16,
  },
  emptyCard: {
    padding: 16,
  },
  memberRow: {
    padding: 14,
    marginBottom: 10,
    gap: 4,
  },
  memberRowSelected: {
    borderColor: Brand.primary,
    backgroundColor: 'rgba(16,185,129,0.06)',
  },
  rowPressed: {
    opacity: 0.92,
  },
  memberRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  memberMeta: {
    marginTop: 2,
  },
});
