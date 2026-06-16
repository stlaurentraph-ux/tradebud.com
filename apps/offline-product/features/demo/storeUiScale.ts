export function scaleText(n: number): number {
  return n;
}

/** @deprecated Use `scaleText` — kept for call-site compatibility. */
export function scaleUi(n: number): number {
  return scaleText(n);
}
