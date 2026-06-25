import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
  formatOAuthDiagnosticReport,
  getOAuthDiagnosticEvents,
  subscribeOAuthDiagnostics,
} from '@/features/auth/oauthDiagnosticsStore';
import {
  collectOAuthRuntimeDiagnostics,
  snapshotOAuthRuntimeDiagnosticsLines,
} from '@/features/auth/oauthRuntimeDiagnostics';
import { useAppColors } from '@/features/theme/useThemedStyles';

const EXPANDED_MAX_HEIGHT = 140;

type OAuthDevDiagnosticsPanelProps = {
  /** Expand automatically (e.g. after OAuth failure). */
  defaultExpanded?: boolean;
  surface: 'create_account' | 'sign_in' | 'settings';
};

export function OAuthDevDiagnosticsPanel(props: OAuthDevDiagnosticsPanelProps) {
  // Dev-only panel. The guard lives in this hook-free wrapper so the inner component can call its
  // hooks unconditionally (rules-of-hooks); in production the inner never mounts.
  if (typeof __DEV__ === 'undefined' || !__DEV__) return null;
  return <OAuthDevDiagnosticsPanelContent {...props} />;
}

function OAuthDevDiagnosticsPanelContent({
  defaultExpanded = false,
  surface,
}: OAuthDevDiagnosticsPanelProps) {
  const colors = useAppColors();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [, forceRefresh] = useState(0);

  useEffect(() => subscribeOAuthDiagnostics(() => forceRefresh((n) => n + 1)), []);

  useEffect(() => {
    if (defaultExpanded) setExpanded(true);
  }, [defaultExpanded]);

  // Cheap, dev-only reads computed on each render; `forceRefresh` re-renders when diagnostics emit.
  const snapshot = collectOAuthRuntimeDiagnostics();
  const events = getOAuthDiagnosticEvents();

  const shareReport = useCallback(async () => {
    const message = formatOAuthDiagnosticReport(snapshotOAuthRuntimeDiagnosticsLines());
    await Share.share({ message, title: 'Tracebud OAuth diagnostics' }).catch(() => undefined);
  }, []);

  const borderColor = colors.border ?? '#ccc';
  const warnColor = '#b45309';
  const collapsedSummary = `intentFilter=${snapshot.hasGoogleIntentFilterInConfig ? 'yes' : 'NO'} · native=${snapshot.useNativeGoogleSignIn ? 'yes' : 'no'}`;

  return (
    <View
      testID={`oauth-dev-diagnostics-${surface}`}
      style={{
        marginTop: Spacing.xs,
        borderWidth: 1,
        borderColor,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: Spacing.sm,
          paddingVertical: Spacing.xs,
          backgroundColor: colors.backgroundSecondary ?? '#f4f4f5',
          gap: Spacing.xs,
        }}
        accessibilityRole="button"
      >
        <View style={{ flex: 1 }}>
          <ThemedText type="caption" style={{ fontWeight: '600' }}>
            OAuth diagnostics (dev)
          </ThemedText>
          {!expanded ? (
            <ThemedText type="caption" numberOfLines={1} style={{ color: colors.textMuted }}>
              {collapsedSummary}
            </ThemedText>
          ) : null}
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.iconMuted} />
      </Pressable>

      {expanded ? (
        <ScrollView
          nestedScrollEnabled
          style={{ maxHeight: EXPANDED_MAX_HEIGHT }}
          contentContainerStyle={{ padding: Spacing.sm, gap: Spacing.xs }}
        >
          <ThemedText type="caption" selectable>
            {`native redirect: ${snapshot.nativeRedirectUri ?? 'n/a'}`}
          </ThemedText>
          <ThemedText type="caption" selectable>
            {`supabase redirect: ${snapshot.supabaseRedirectUri}`}
          </ThemedText>
          <ThemedText type="caption" selectable>
            {`client: ${snapshot.androidClientIdSuffix ?? 'missing'} | ${collapsedSummary}`}
          </ThemedText>

          {snapshot.warnings.map((warning) => (
            <ThemedText key={warning} type="caption" style={{ color: warnColor }}>
              ⚠ {warning}
            </ThemedText>
          ))}

          {snapshot.checklist.map((item) => (
            <ThemedText key={item} type="caption" selectable>
              • {item}
            </ThemedText>
          ))}

          {events.length > 0 ? (
            <View style={{ gap: 2 }}>
              <ThemedText type="caption" style={{ fontWeight: '600' }}>
                Recent events
              </ThemedText>
              {events.slice(-4).map((event) => (
                <ThemedText key={`${event.ts}-${event.kind}`} type="caption" selectable>
                  {event.kind}: {event.detail}
                </ThemedText>
              ))}
            </View>
          ) : null}

          <Pressable onPress={() => void shareReport()} accessibilityRole="button">
            <ThemedText type="link">Share full report</ThemedText>
          </Pressable>
        </ScrollView>
      ) : null}
    </View>
  );
}
