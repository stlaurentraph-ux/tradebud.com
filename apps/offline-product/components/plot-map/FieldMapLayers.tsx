import { Platform } from 'react-native';
import { UrlTile } from 'react-native-maps';

import {
  FIELD_MAP_TILE_MAX_ZOOM,
  getFieldMapUrlTemplate,
  resolveFieldMapTileMode,
} from '@/features/mapping/fieldMapTiles';

export function FieldMapLayers(props: {
  lowDataMap: boolean;
  offlineTilesEnabled: boolean;
  offlineTilesPackId: string | null;
}) {
  const mode = resolveFieldMapTileMode(props);
  const urlTemplate = getFieldMapUrlTemplate(mode, props.offlineTilesPackId);
  if (!urlTemplate) return null;

  return (
    <UrlTile
      urlTemplate={urlTemplate}
      maximumZ={FIELD_MAP_TILE_MAX_ZOOM}
      maximumNativeZ={FIELD_MAP_TILE_MAX_ZOOM}
      flipY={false}
      opacity={1}
      shouldReplaceMapContent
      zIndex={Platform.OS === 'android' ? 1 : undefined}
    />
  );
}
