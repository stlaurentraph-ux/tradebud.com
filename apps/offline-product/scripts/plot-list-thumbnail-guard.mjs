#!/usr/bin/env node
/**
 * Audit H19 — plot list rows must not mount native MapView per row.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const offlineRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relPath) {
  return readFileSync(path.join(offlineRoot, relPath), 'utf8');
}

const listThumb = read('components/plot-map/PlotListThumbnail.tsx');
if (listThumb.includes('PlotMapPreview') || listThumb.includes('react-native-maps')) {
  console.error('plot-list-thumbnail-guard: PlotListThumbnail must not use MapView or PlotMapPreview');
  process.exit(1);
}
if (!listThumb.includes('PlotBoundaryThumbnail')) {
  console.error('plot-list-thumbnail-guard: PlotListThumbnail must render PlotBoundaryThumbnail');
  process.exit(1);
}

const boundaryThumb = read('components/plot-map/PlotBoundaryThumbnail.tsx');
if (!boundaryThumb.includes('react-native-svg')) {
  console.error('plot-list-thumbnail-guard: PlotBoundaryThumbnail must use react-native-svg');
  process.exit(1);
}
if (boundaryThumb.includes('react-native-maps')) {
  console.error('plot-list-thumbnail-guard: PlotBoundaryThumbnail must not import react-native-maps');
  process.exit(1);
}

console.log('plot-list-thumbnail-guard: OK');
