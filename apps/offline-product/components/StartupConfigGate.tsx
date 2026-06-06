import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand } from '@/constants/theme';
import { collectStartupConfigIssues } from '@/features/api/runtimeGuards';

type Props = {
  children: ReactNode;
};

export function StartupConfigGate({ children }: Props) {
  const issues = collectStartupConfigIssues();
  if (issues.length === 0) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Beta build configuration required
        </ThemedText>
        <ThemedText type="default" style={styles.body}>
          This installed build is missing production settings, so Tracebud stopped instead of
          crashing silently. Install a rebuilt beta after the team sets EAS environment variables.
        </ThemedText>
        {issues.map((issue) => (
          <View key={issue.code} style={styles.issueCard}>
            <ThemedText type="defaultSemiBold" style={styles.issueCode}>
              {issue.code}
            </ThemedText>
            <ThemedText type="caption" style={styles.issueMessage}>
              {issue.message}
            </ThemedText>
          </View>
        ))}
        <ThemedText type="caption" style={styles.hint}>
          Expected API URL: https://api.tracebud.com/api
        </ThemedText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F3',
    paddingTop: 64,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  title: {
    color: '#0B4F3B',
  },
  body: {
    color: '#334155',
    lineHeight: 22,
  },
  issueCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F2C94C',
    backgroundColor: '#FFFBEB',
    padding: 12,
    gap: 6,
  },
  issueCode: {
    color: Brand.warning,
  },
  issueMessage: {
    color: '#7C2D12',
    lineHeight: 20,
  },
  hint: {
    marginTop: 8,
    color: '#64748B',
  },
});
