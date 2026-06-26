/**
 * Stub for `@sentry/react-native` in the vitest (node) environment.
 *
 * The real package does `import { NativeModules, Platform } from 'react-native'`
 * and reads native modules at load time, pulling the real (Flow-typed) react-
 * native through Node's externalized resolver where the resolve.alias does not
 * apply. The observability layer (`sentryClient.ts`) only needs these named
 * exports; tests that assert telemetry behaviour mock `sentryClient` directly.
 */
export const init = (): void => undefined;
export const captureException = (): string => '';
export const captureMessage = (): string => '';
export const addBreadcrumb = (): void => undefined;
export const setUser = (): void => undefined;
export const withScope = (callback: (scope: unknown) => void): void => {
  const scope = {
    setTag: () => undefined,
    setExtra: () => undefined,
    setExtras: () => undefined,
    setContext: () => undefined,
    setLevel: () => undefined,
    setUser: () => undefined,
    addBreadcrumb: () => undefined,
  };
  callback(scope);
};
export const setTag = (): void => undefined;
export const setExtra = (): void => undefined;
export const setContext = (): void => undefined;
export const flush = async (): Promise<boolean> => true;
export const close = async (): Promise<boolean> => true;

export default {
  init,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  withScope,
  setTag,
  setExtra,
  setContext,
  flush,
  close,
};
