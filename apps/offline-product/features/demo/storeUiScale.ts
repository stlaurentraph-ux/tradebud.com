/** Bump typography, spacing, and icons in store-demo builds for App Store screenshots. */
export const STORE_UI_SCALE = process.env.EXPO_PUBLIC_STORE_DEMO === '1' ? 1.14 : 1;

export function scaleUi(n: number): number {
  return Math.round(n * STORE_UI_SCALE);
}
