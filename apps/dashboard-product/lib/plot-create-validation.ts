/** EUDR policy — plots at or above this area require polygon geometry (not a point). */
export const PLOT_POINT_MAX_AREA_HA = 4;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface PlotCreateFormInput {
  farmerId: string;
  linkedContactId?: string;
  clientPlotId: string;
  declaredAreaHa: string;
  latitude: string;
  longitude: string;
}

export function validatePlotCreateInput(input: PlotCreateFormInput): string | null {
  if (!input.linkedContactId?.trim()) {
    return 'Select a producer from your directory before registering this plot.';
  }

  const farmerId = input.farmerId.trim();
  if (!farmerId) {
    return 'Assign a producer reference (select from directory or use “New producer reference”).';
  }
  if (!UUID_REGEX.test(farmerId)) {
    return 'Producer reference is invalid. Select from your directory or create a new reference.';
  }

  const clientPlotId = input.clientPlotId.trim();
  if (!clientPlotId) {
    return 'Client Plot ID is required (a unique label for this plot, e.g. PLOT-001).';
  }

  const areaRaw = input.declaredAreaHa.trim();
  if (!areaRaw) {
    return 'Area (ha) is required.';
  }
  const area = Number(areaRaw.replace(',', '.'));
  if (!Number.isFinite(area) || area <= 0) {
    return 'Area (ha) must be a positive number.';
  }
  if (area >= PLOT_POINT_MAX_AREA_HA) {
    return `Plots of ${PLOT_POINT_MAX_AREA_HA} hectares or more need a walked polygon boundary in the field app — point-only capture is only allowed below ${PLOT_POINT_MAX_AREA_HA} ha.`;
  }

  const latRaw = input.latitude.trim();
  const lonRaw = input.longitude.trim();
  if (!latRaw || !lonRaw) {
    return 'Latitude and longitude are required.';
  }

  const latitude = Number(latRaw.replace(',', '.'));
  const longitude = Number(lonRaw.replace(',', '.'));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return 'Latitude and longitude must be valid decimal numbers.';
  }
  if (latitude < -90 || latitude > 90) {
    return `Latitude must be between -90 and 90 (you entered ${latitude}).`;
  }
  if (longitude < -180 || longitude > 180) {
    return `Longitude must be between -180 and 180 (you entered ${longitude}).`;
  }

  return null;
}
