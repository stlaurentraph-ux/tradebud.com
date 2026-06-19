import { Alert } from 'react-native';

import type { TranslateFn } from '@/features/i18n/translate';

export { hasUnsavedMappingProgress, plotBoundaryPointsChanged } from './mappingProgress';
export type { MapCoordinate, MappingProgressSnapshot } from './mappingProgress';

export function runWithMappingDiscardConfirm(
  t: TranslateFn,
  hasProgress: boolean,
  onLeave: () => void,
): void {
  if (!hasProgress) {
    onLeave();
    return;
  }

  Alert.alert(t('mapping_discard_title'), t('mapping_discard_body'), [
    { text: t('cancel'), style: 'cancel' },
    { text: t('mapping_discard_leave'), style: 'destructive', onPress: onLeave },
  ]);
}
