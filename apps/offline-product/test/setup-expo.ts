/**
 * vitest setup: install the `globalThis.expo` host object that
 * `expo-modules-core` expects on a native runtime.
 *
 * In the node test environment the `./polyfill` shim is a no-op, so
 * `expo-modules-core` reads `globalThis.expo.EventEmitter` and
 * `globalThis.expo.modules[name]` against an undefined global and throws at
 * import time. We provide benign stubs so Expo-backed modules can be imported
 * by logic tests. Tests that need real behaviour still `vi.mock(...)` the
 * specific Expo package.
 */
class StubEventEmitter {
  addListener() {
    return { remove: () => undefined };
  }
  removeAllListeners() {}
  removeSubscription() {}
  emit() {}
  startObserving() {}
  stopObserving() {}
}

class StubNativeModule extends StubEventEmitter {}
class StubSharedObject extends StubEventEmitter {}
class StubSharedRef extends StubSharedObject {}

const nativeModuleStub = () =>
  new Proxy(
    {},
    {
      get: () => () => undefined,
    },
  );

const modules = new Proxy({} as Record<string, unknown>, {
  get: () => nativeModuleStub(),
  has: () => true,
});

const g = globalThis as Record<string, unknown>;

if (!g.expo) {
  g.expo = {
    EventEmitter: StubEventEmitter,
    NativeModule: StubNativeModule,
    SharedObject: StubSharedObject,
    SharedRef: StubSharedRef,
    modules,
    uuidv4: () => '00000000-0000-0000-0000-000000000000',
    uuidv5: () => '00000000-0000-0000-0000-000000000000',
    getViewConfig: () => undefined,
    reloadAppAsync: async () => undefined,
  };
}
