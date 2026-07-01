import { AppMetrics } from 'expo-observe';

import { shouldUseMaestroCiThinBoot } from '@/features/testing/maestroCiBootProfile';

let marked = false;

/** Records EAS Observe TTI once per session after native splash hide. */
export function markAppInteractive(): void {
  if (marked || shouldUseMaestroCiThinBoot()) return;
  marked = true;
  AppMetrics.markInteractive();
}
