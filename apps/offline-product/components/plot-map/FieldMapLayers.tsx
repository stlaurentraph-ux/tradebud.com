import { Platform } from 'react-native';
import { LocalTile, UrlTile } from 'react-native-maps';

import {
  FIELD_MAP_TILE_MAX_ZOOM,
  getFieldMapUrlTemplate,
  resolveFieldMapTileMode,
  toLocalTilePathTemplate,
} from '@/features/mapping/fieldMapTiles';

export function FieldMapLayers(props: {
  lowDataMap: boolean;
  offlineTilesEnabled: boolean;
  offlineTilesPackId: string | null;
}) {
  const mode = resolveFieldMapTileMode(props);
  const urlTemplate = getFieldMapUrlTemplate(mode, props.offlineTilesPackId);
  if (!urlTemplate) return null;

  if (mode === 'offline') {
    // Offline packs are local `file://` tiles. `UrlTile` does NOT load `file://` templates on iOS
    // (Apple Maps / MKTileOverlay), so the basemap renders blank there. `LocalTile` reads tiles
    // straight off the filesystem on both iOS and Android.
    return (
      <LocalTile
        pathTemplate={toLocalTilePathTemplate(urlTemplate)}
        tileSize={256}
        zIndex={Platform.OS === 'android' ? 1 : undefined}
      />
    );
  }

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
