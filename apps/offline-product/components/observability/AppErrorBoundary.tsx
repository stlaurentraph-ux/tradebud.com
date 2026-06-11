import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/themed-text';
import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';
import { logError } from '@/features/errors/ErrorLogger';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logError(error, {
      context: 'react_error_boundary',
      componentStack: info.componentStack,
    });
    trackEvent(ANALYTICS_EVENTS.REACT_RENDER_ERROR, {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <ThemedText type="title" style={styles.title}>
            Something went wrong
          </ThemedText>
          <ThemedText type="default" style={styles.body}>
            The app hit an unexpected error. You can try again — your local data is still on this device.
          </ThemedText>
          <Button variant="primary" onPress={this.reset}>
            Try again
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    backgroundColor: '#fff',
  },
  title: {
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    opacity: 0.85,
  },
});
