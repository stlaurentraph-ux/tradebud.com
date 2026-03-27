// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    rules: {
      // Expo's metro/babel alias resolution can differ from eslint-plugin-import's resolver.
      // TS/Metro will still typecheck/bundle these paths correctly.
      'import/no-unresolved': 'off',
    },
  },
]);
