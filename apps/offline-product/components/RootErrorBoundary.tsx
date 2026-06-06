import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand } from '@/constants/theme';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[RootErrorBoundary]', error.message, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <ThemedText type="title" style={styles.title}>
              Tracebud could not start
            </ThemedText>
            <ThemedText type="default" style={styles.body}>
              The app hit an unexpected startup error. This usually means the beta build is missing
              production environment variables or needs a fresh install from a fixed build.
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.errorLabel}>
              Error details
            </ThemedText>
            <ThemedText type="caption" style={styles.errorText}>
              {this.state.error.message}
            </ThemedText>
            <ThemedText type="caption" style={styles.hint}>
              Share this screen with the Tracebud team. Required EAS build vars: EXPO_PUBLIC_API_URL,
              EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY.
            </ThemedText>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
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
  errorLabel: {
    marginTop: 8,
    color: Brand.warning,
  },
  errorText: {
    color: '#7C2D12',
    lineHeight: 20,
  },
  hint: {
    marginTop: 8,
    color: '#64748B',
    lineHeight: 20,
  },
});
