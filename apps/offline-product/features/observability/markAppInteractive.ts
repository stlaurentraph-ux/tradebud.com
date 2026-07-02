import { markAppInteractiveNative } from '@/features/observability/appMetricsNativeBridge';
import { shouldUseMaestroCiThinBoot } from '@/features/testing/maestroCiBootProfile';

let marked = false;

/** Records EAS Observe TTI once per session after native splash hide. */
export function markAppInteractive(): void {
  if (marked || shouldUseMaestroCiThinBoot()) return;
  marked = true;
  markAppInteractiveNative();
}
