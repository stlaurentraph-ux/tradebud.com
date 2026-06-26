import type { ReactElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { AndroidMapsUnavailablePlaceholder } from '@/components/plot-map/AndroidMapsUnavailablePlaceholder';
import { shouldBlockNativeMapView } from '@/features/mapping/androidMapsConfig';

/** Renders a map placeholder on Android when the Google Maps SDK key is missing. */
export function FieldMapMountGate(props: {
  mapView: ReactElement;
  blockedStyle?: StyleProp<ViewStyle>;
  placeholderIconSize?: number;
}) {
  if (shouldBlockNativeMapView()) {
    return (
      <AndroidMapsUnavailablePlaceholder
        style={props.blockedStyle}
        iconSize={props.placeholderIconSize}
      />
    );
  }

  return props.mapView;
}
