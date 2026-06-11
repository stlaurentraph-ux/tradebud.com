/** Show “Load demo data” in Settings (preview builds + local dev). */
export const storeDemoToolsEnabled =
  process.env.EXPO_PUBLIC_STORE_DEMO === '1' ||
  (typeof __DEV__ !== 'undefined' && __DEV__);
