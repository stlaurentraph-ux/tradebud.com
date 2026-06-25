import path from 'node:path';
import { defineConfig } from 'vitest/config';

const reactNativeStub = path.resolve(__dirname, 'features/testing/reactNativeTestStub.ts');

export default defineConfig({
  resolve: {
    alias: [
      // `react-native` (and any deep subpath like `react-native/Libraries/...`) is Flow-typed and
      // cannot be parsed by Vitest/Rollup. Unit tests never render UI, so resolve everything under
      // `react-native` to a Node-safe stub. Tests can still `vi.mock('react-native', ...)`.
      // NOTE: third-party `react-native-*` packages and Expo packages are intentionally NOT aliased
      // globally — tests that touch them mock the specific package or the heavy app module that
      // pulls them in (see e.g. phoneOtpSignIn.test.ts / syncAuthSession.test.ts).
      { find: /^react-native(\/.*)?$/, replacement: reactNativeStub },
      { find: '@', replacement: path.resolve(__dirname, '.') },
    ],
  },
  define: {
    __DEV__: false,
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', 'design/**', 'features/testing/**'],
  },
});
