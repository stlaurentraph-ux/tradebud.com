export const PLOT_LIST_THUMB_DISPLAY_SIZE = 88;
/** Render live tiles + view-shot at 3× for Retina list rows. */
export const PLOT_LIST_THUMB_RENDER_SCALE = 3;
export const PLOT_LIST_THUMB_CAPTURE_SIZE =
  PLOT_LIST_THUMB_DISPLAY_SIZE * PLOT_LIST_THUMB_RENDER_SCALE;

export function plotListThumbRenderSize(
  displaySize: number = PLOT_LIST_THUMB_DISPLAY_SIZE,
): number {
  return Math.round(displaySize * PLOT_LIST_THUMB_RENDER_SCALE);
}

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

export const PLOT_LIST_THUMB_LAYOUT_REV = 2;

export function plotListThumbnailUriWithLayoutRev(filePath: string): string {
  return `${filePath}?v=${PLOT_LIST_THUMB_LAYOUT_REV}`;
}

export function plotListThumbnailNeedsLayoutRefresh(listThumbnailUri?: string | null): boolean {
  const raw = listThumbnailUri?.trim();
  if (!raw) return false;
  return !raw.includes(`v=${PLOT_LIST_THUMB_LAYOUT_REV}`);
}

export const PLOT_LIST_THUMB_MIN_BYTES = 3_000;

export function plotNeedsListThumbnailBackfill(plot: {
  points: unknown[];
  listThumbnailUri?: string | null;
}): boolean {
  return plot.points.length > 0 && !plot.listThumbnailUri?.trim();
}
