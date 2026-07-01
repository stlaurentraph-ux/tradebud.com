export const PLOT_LIST_THUMB_DISPLAY_SIZE = 88;
/** 2× capture for crisp list rows at 88 logical px. */
export const PLOT_LIST_THUMB_CAPTURE_SIZE = 176;

export const PLOT_LIST_THUMBS_DIR = 'plot-list-thumbs';

export function plotListThumbnailFilePath(plotId: string, documentDirectory = ''): string {
  const base = documentDirectory ? `${documentDirectory}${PLOT_LIST_THUMBS_DIR}` : PLOT_LIST_THUMBS_DIR;
  return `${base}/${plotId}.png`;
}

/** Strip cache-buster query from persisted list thumbnail URI. */
export function plotListThumbnailUriBasePath(uri: string): string {
  const trimmed = uri.trim();
  const q = trimmed.indexOf('?');
  return q >= 0 ? trimmed.slice(0, q) : trimmed;
}

export const PLOT_LIST_THUMB_MIN_BYTES = 3_000;

export function plotNeedsListThumbnailBackfill(plot: {
  points: unknown[];
  listThumbnailUri?: string | null;
}): boolean {
  return plot.points.length > 0 && !plot.listThumbnailUri?.trim();
}
