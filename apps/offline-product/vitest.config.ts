import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // NOTE: @rollup/plugin-alias matches the first entry whose `find` equals the
    // importee or is a path-segment prefix of it, so order matters: the specific
    // `@/features/auth/*.native` entries MUST precede the broad `@` entry.
    alias: [
      // The OAuth orchestrator imports the platform-native sign-in providers,
      // which pull the native-only Expo tree (expo-apple-authentication ships
      // JSX the vite transform cannot parse). Logic tests never run native
      // sign-in, so cut the chain at the choke point. The dedicated
      // googleSignIn.native.test imports via a relative path and is unaffected.
      {
        find: '@/features/auth/appleSignIn.native',
        replacement: path.resolve(__dirname, 'test/stubs/oauthNativeSignIn.ts'),
      },
      {
        find: '@/features/auth/googleSignIn.native',
        replacement: path.resolve(__dirname, 'test/stubs/oauthNativeSignIn.ts'),
      },
      { find: '@', replacement: path.resolve(__dirname, '.') },
      // The real react-native entry ships Flow syntax the vite transform cannot
      // parse and expects a native runtime; the (inlined) expo packages and app
      // code import the bare `react-native` specifier, which resolves to a
      // lightweight stub. A string `find` is used (not a regex) because regex
      // aliases are not reliably applied to imports originating inside
      // node_modules. Tests needing real behaviour still vi.mock('react-native').
      { find: 'react-native', replacement: path.resolve(__dirname, 'test/stubs/react-native.ts') },
      // The bare `expo` entry installs the native "winter" runtime that throws
      // under the vite transform; some native modules import it transitively. A
      // string `find` matches `expo` and `expo/<subpath>` but not the `expo-*`
      // packages (which resolve normally / are aliased individually below).
      { find: 'expo', replacement: path.resolve(__dirname, 'test/stubs/expo.ts') },
      // The persistence/push-token TypeScript barrels re-export their `.native`
      // implementations, which import these native-only packages. expo-sqlite
      // ships JSX the transform cannot parse; expo-notifications pulls the real
      // react-native networking core + abort-controller polyfill and runs a
      // top-level native side effect. Tests that exercise them still vi.mock(...).
      { find: 'expo-sqlite', replacement: path.resolve(__dirname, 'test/stubs/expo-sqlite.ts') },
      { find: 'expo-notifications', replacement: path.resolve(__dirname, 'test/stubs/expo-notifications.ts') },
      // The Sentry RN SDK reads native modules at load time and pulls the real
      // react-native through Node's externalized resolver. Logic tests never
      // emit telemetry; observability tests mock `sentryClient` directly.
      { find: '@sentry/react-native', replacement: path.resolve(__dirname, 'test/stubs/sentry-react-native.ts') },
    ],
  },
  define: {
    __DEV__: false,
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', 'design/**', 'features/testing/**', 'test/**'],
    setupFiles: [path.resolve(__dirname, 'test/setup-expo.ts')],
    server: {
      deps: {
        // These Expo packages `import { Platform } from 'react-native'`
        // internally. Vitest externalizes node_modules by default, so their
        // internal imports bypass the resolve.alias above and load the real
        // (Flow-typed, native) react-native. Inlining them runs the imports
        // through the vite transform so the react-native/expo stubs apply.
        inline: [/[\\/]node_modules[\\/](@expo[\\/]|expo-|@react-native[\\/]|react-native-)/],
      },
    },
  },
});
