/**
 * Stub for the bare `expo` package in the vitest (node) environment.
 *
 * The real `expo` entry (`src/Expo.ts`) installs the "winter" runtime, which
 * does `require('./ImportMetaRegistry')` and assumes a native/Metro runtime —
 * this throws under the vite transform. Several native modules (e.g.
 * `expo-sqlite`) import `{ requireNativeModule } from 'expo'`, so logic tests
 * pull this in transitively. We provide the small surface those modules need.
 * Tests that exercise a specific native module still `vi.mock(...)` it.
 *
 * Only the bare `expo` specifier (and `expo/<subpath>`) is aliased here; the
 * `expo-*` packages (expo-modules-core, expo-constants, ...) resolve normally.
 */
const noopModule = () =>
  new Proxy(
    {},
    {
      get: () => () => undefined,
    },
  );

export const requireNativeModule = (): unknown => noopModule();
export const requireOptionalNativeModule = (): unknown => null;
export const requireNativeViewManager = (): unknown => null;
export const isRunningInExpoGo = (): boolean => false;
export const registerRootComponent = (): void => undefined;

export class EventEmitter {
  addListener() {
    return { remove: () => undefined };
  }
  removeAllListeners() {}
  removeSubscription() {}
  emit() {}
}

export class NativeModule extends EventEmitter {}
export class SharedObject extends EventEmitter {}
export class SharedRef extends SharedObject {}

export default {
  requireNativeModule,
  requireOptionalNativeModule,
  requireNativeViewManager,
  isRunningInExpoGo,
  registerRootComponent,
  EventEmitter,
  NativeModule,
  SharedObject,
  SharedRef,
};
