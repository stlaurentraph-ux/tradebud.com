/** Store-demo screenshot builds: scale text and numbers only (not layout chrome). */
export const STORE_TEXT_SCALE = process.env.EXPO_PUBLIC_STORE_DEMO === '1' ? 1.2 : 1;

export function scaleText(n: number): number {
  return Math.round(n * STORE_TEXT_SCALE);
}

/** Legacy alias — prefer `scaleText` for font sizes. */
export function scaleUi(n: number): number {
  return scaleText(n);
}
