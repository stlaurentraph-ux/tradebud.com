export type MapCoordinate = { latitude: number; longitude: number };

export type MappingProgressSnapshot = {
  isRecording: boolean;
  drawTracingActive: boolean;
  pointCount: number;
  originalPoints?: MapCoordinate[];
  currentPoints: MapCoordinate[];
  completionPhotoCount?: number;
  showCompletionPage?: boolean;
};

export function plotBoundaryPointsChanged(
  original: MapCoordinate[],
  current: MapCoordinate[],
): boolean {
  if (original.length !== current.length) return true;
  return original.some(
    (point, index) =>
      point.latitude !== current[index]?.latitude || point.longitude !== current[index]?.longitude,
  );
}

export function hasUnsavedMappingProgress(snapshot: MappingProgressSnapshot): boolean {
  if (snapshot.isRecording || snapshot.drawTracingActive) return true;
  if (snapshot.showCompletionPage && (snapshot.completionPhotoCount ?? 0) > 0) return true;
  if (snapshot.pointCount === 0) return false;
  if (!snapshot.originalPoints?.length) return snapshot.pointCount > 0;
  return plotBoundaryPointsChanged(snapshot.originalPoints, snapshot.currentPoints);
}
