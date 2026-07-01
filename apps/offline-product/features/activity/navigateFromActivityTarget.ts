import { router, type Href } from 'expo-router';

import type { FarmerActivityNavigateTarget } from './farmerActivityTypes';

export function navigateFromActivityTarget(target: FarmerActivityNavigateTarget): void {
  switch (target.screen) {
    case 'plot': {
      const path = target.plotSub
        ? `/plot/${encodeURIComponent(target.plotId)}?sub=${encodeURIComponent(target.plotSub)}`
        : `/plot/${encodeURIComponent(target.plotId)}`;
      router.push(path as Href);
      return;
    }
    case 'data-sharing':
      router.push('/data-sharing');
      return;
    case 'documents':
      router.push('/documents');
      return;
    case 'backup':
      router.navigate('/(tabs)/settings?focus=backup');
      return;
    default:
      return;
  }
}
