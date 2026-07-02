import { useEffect, type ComponentType, type ReactNode } from 'react';
import { requireOptionalNativeModule } from 'expo';

type AppMetricsNative = {
  markFirstRender?: () => void;
  markInteractive?: (attributes?: Record<string, unknown>) => void;
};

function getAppMetricsNative(): AppMetricsNative | null {
  return requireOptionalNativeModule<AppMetricsNative>('ExpoAppMetrics');
}

/** Root wrapper — no-ops when the dev client was built before expo-app-metrics was linked. */
function AppMetricsRootOptional({ children }: { children: ReactNode }) {
  useEffect(() => {
    getAppMetricsNative()?.markFirstRender?.();
  }, []);
  return children;
}

function wrapWithOptionalAppMetrics<P extends object>(
  Component: ComponentType<P>,
): ComponentType<P> {
  function Wrapped(props: P) {
    return (
      <AppMetricsRootOptional>
        <Component {...props} />
      </AppMetricsRootOptional>
    );
  }
  Wrapped.displayName = `AppMetricsRoot(${Component.displayName || Component.name || 'Component'})`;
  return Wrapped;
}

/** EAS Observe TTI — skipped when ExpoAppMetrics is not in the native binary. */
export function markAppInteractiveNative(attributes?: Record<string, unknown>): void {
  const native = getAppMetricsNative();
  if (!native?.markInteractive) return;
  native.markFirstRender?.();
  native.markInteractive(attributes);
}

export function wrapRootLayoutWithOptionalAppMetrics<P extends object>(
  RootLayout: ComponentType<P>,
  skipWrap: boolean,
): ComponentType<P> {
  if (skipWrap || !getAppMetricsNative()) {
    return RootLayout;
  }
  return wrapWithOptionalAppMetrics(RootLayout);
}
