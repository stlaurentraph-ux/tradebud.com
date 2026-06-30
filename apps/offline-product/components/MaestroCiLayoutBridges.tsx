import { AutoPlotUploadBridge } from '@/components/AutoPlotUploadBridge';
import { ConsentPushBridge } from '@/components/ConsentPushBridge';
import { PushRegistrationBridge } from '@/components/PushRegistrationBridge';
import { shouldUseMaestroCiThinBoot } from '@/features/testing/maestroCiBootProfile';

/**
 * Background bridges deferred on Maestro CI builds to shorten emulator JS boot.
 */
export function MaestroCiLayoutBridges() {
  if (shouldUseMaestroCiThinBoot()) {
    return null;
  }

  return (
    <>
      <AutoPlotUploadBridge />
      <PushRegistrationBridge />
      <ConsentPushBridge />
    </>
  );
}
