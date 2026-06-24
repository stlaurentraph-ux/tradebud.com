import { parseAndMapBulkPlotImportGeoJson } from '@/lib/bulk-plot-import-geojson';

type KmlGeoJsonGeometry =
  | { type: 'Point'; coordinates: [number, number] }
  | { type: 'Polygon'; coordinates: [number, number][][] };

function elementsByLocalName(root: Element | Document, localName: string): Element[] {
  return [...root.getElementsByTagName('*')].filter((element) => element.localName === localName);
}

function firstByLocalName(root: Element, localName: string): Element | null {
  return elementsByLocalName(root, localName)[0] ?? null;
}

function textContent(element: Element | null): string {
  return element?.textContent?.trim() ?? '';
}

function parseCoordinatePair(token: string): [number, number] | null {
  const parts = token.split(',').map((part) => part.trim());
  if (parts.length < 2) return null;
  const longitude = Number(parts[0]);
  const latitude = Number(parts[1]);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
  return [longitude, latitude];
}

function parseCoordinateString(raw: string): [number, number][] {
  return raw
    .trim()
    .split(/\s+/)
    .map((token) => parseCoordinatePair(token))
    .filter((pair): pair is [number, number] => pair != null);
}

function parseKmlGeometry(placemark: Element): KmlGeoJsonGeometry | null {
  const point = firstByLocalName(placemark, 'Point');
  if (point) {
    const coordinates = parseCoordinateString(textContent(firstByLocalName(point, 'coordinates')));
    const pair = coordinates[0];
    if (!pair) return null;
    return { type: 'Point', coordinates: pair };
  }

  const polygon = firstByLocalName(placemark, 'Polygon');
  if (polygon) {
    const outerBoundary = firstByLocalName(polygon, 'outerBoundaryIs');
    const ringElement = outerBoundary ? firstByLocalName(outerBoundary, 'LinearRing') : null;
    const ring = parseCoordinateString(
      textContent(firstByLocalName(ringElement ?? polygon, 'coordinates')),
    );
    if (ring.length < 4) return null;
    return { type: 'Polygon', coordinates: [ring] };
  }

  const multiGeometry = firstByLocalName(placemark, 'MultiGeometry');
  if (multiGeometry) {
    for (const child of elementsByLocalName(multiGeometry, 'Point')) {
      const coordinates = parseCoordinateString(textContent(firstByLocalName(child, 'coordinates')));
      const pair = coordinates[0];
      if (pair) return { type: 'Point', coordinates: pair };
    }
    for (const child of elementsByLocalName(multiGeometry, 'Polygon')) {
      const outerBoundary = firstByLocalName(child, 'outerBoundaryIs');
      const ringElement = outerBoundary ? firstByLocalName(outerBoundary, 'LinearRing') : null;
      const ring = parseCoordinateString(
        textContent(firstByLocalName(ringElement ?? child, 'coordinates')),
      );
      if (ring.length >= 4) return { type: 'Polygon', coordinates: [ring] };
    }
  }

  return null;
}

function parseKmlProperties(placemark: Element): Record<string, string> {
  const properties: Record<string, string> = {};

  for (const dataNode of elementsByLocalName(placemark, 'Data')) {
    const name = dataNode.getAttribute('name')?.trim();
    const value = textContent(firstByLocalName(dataNode, 'value'));
    if (name && value) properties[name] = value;
  }

  for (const simpleData of elementsByLocalName(placemark, 'SimpleData')) {
    const name = simpleData.getAttribute('name')?.trim();
    const value = textContent(simpleData);
    if (name && value) properties[name] = value;
  }

  const placemarkName = textContent(firstByLocalName(placemark, 'name'));
  if (placemarkName && !properties.plot_name && !properties.name) {
    properties.plot_name = placemarkName;
  }

  return properties;
}

function placemarkToFeature(placemark: Element): {
  type: 'Feature';
  properties: Record<string, string>;
  geometry: KmlGeoJsonGeometry | null;
} | null {
  const geometry = parseKmlGeometry(placemark);
  const properties = parseKmlProperties(placemark);
  if (!geometry && !properties.client_plot_id && !properties.clientplotid && !properties.plot_id) {
    return null;
  }
  return {
    type: 'Feature',
    properties,
    geometry,
  };
}

export const BULK_PLOT_IMPORT_KML_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Finca Norte</name>
      <ExtendedData>
        <Data name="producer_full_name"><value>Maria Lopez</value></Data>
        <Data name="client_plot_id"><value>PLOT-001</value></Data>
        <Data name="declared_area_ha"><value>2.5</value></Data>
      </ExtendedData>
      <Point>
        <coordinates>-87.8494,14.6349,0</coordinates>
      </Point>
    </Placemark>
    <Placemark>
      <ExtendedData>
        <Data name="producer_full_name"><value>Juan Perez</value></Data>
        <Data name="client_plot_id"><value>PLOT-002</value></Data>
        <Data name="declared_area_ha"><value>8.2</value></Data>
      </ExtendedData>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              -87.1,14.1,0 -87.2,14.1,0 -87.2,14.2,0 -87.1,14.2,0 -87.1,14.1,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`;

export function kmlTextToGeoJsonText(text: string): string {
  if (typeof DOMParser === 'undefined') {
    throw new Error('KML parsing requires a browser DOMParser.');
  }
  const doc = new DOMParser().parseFromString(text.trim(), 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Invalid KML XML.');
  }

  const placemarks = elementsByLocalName(doc, 'Placemark');
  if (placemarks.length === 0) {
    throw new Error('KML must contain at least one Placemark.');
  }

  const features = placemarks
    .map((placemark) => placemarkToFeature(placemark))
    .filter((feature): feature is NonNullable<typeof feature> => feature != null);

  return JSON.stringify({ type: 'FeatureCollection', features });
}

export function parseAndMapBulkPlotImportKml(text: string) {
  return parseAndMapBulkPlotImportGeoJson(kmlTextToGeoJsonText(text));
}
