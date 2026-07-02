import * as FileSystem from 'expo-file-system';
import { Platform, type View } from 'react-native';
import { captureRef, type CaptureOptions } from 'react-native-view-shot';

import {
  PLOT_LIST_THUMB_CAPTURE_SIZE,
  plotListThumbnailFilePath,
} from '@/features/mapping/plotListThumbnailStore';

export {
  PLOT_LIST_THUMB_CAPTURE_SIZE,
  PLOT_LIST_THUMB_DISPLAY_SIZE,
  plotNeedsListThumbnailBackfill,
} from '@/features/mapping/plotListThumbnailStore';

const fsAny = FileSystem as { documentDirectory?: string | null };
export const PLOT_LIST_THUMBS_DIR = `${fsAny.documentDirectory ?? ''}plot-list-thumbs`;

const CAPTURE_OPTIONS: CaptureOptions = {
  format: 'png',
  quality: 0.92,
  width: PLOT_LIST_THUMB_CAPTURE_SIZE,
  height: PLOT_LIST_THUMB_CAPTURE_SIZE,
  result: 'tmpfile',
};

/** Wait for map tiles and overlays to paint before view-shot. */
export const PLOT_LIST_THUMB_CAPTURE_DELAY_MS = 450;

export async function ensurePlotListThumbsDir(): Promise<void> {
  if (!fsAny.documentDirectory) return;
  await FileSystem.makeDirectoryAsync(PLOT_LIST_THUMBS_DIR, { intermediates: true }).catch(
    () => undefined,
  );
}

export async function captureAndPersistPlotListThumbnail(
  captureTarget: View | null,
  plotId: string,
): Promise<string | null> {
  if (Platform.OS === 'web' || !captureTarget || !fsAny.documentDirectory) {
    return null;
  }
  await new Promise<void>((resolve) => setTimeout(resolve, PLOT_LIST_THUMB_CAPTURE_DELAY_MS));
  try {
    await ensurePlotListThumbsDir();
    const tmpUri = await captureRef(captureTarget, CAPTURE_OPTIONS);
    if (!tmpUri) return null;
    const dest = plotListThumbnailFilePath(plotId, fsAny.documentDirectory);
    await FileSystem.deleteAsync(dest, { idempotent: true }).catch(() => undefined);
    await FileSystem.copyAsync({ from: tmpUri, to: dest });
    return dest;
  } catch {
    return null;
  }
}

export async function deletePlotListThumbnailFile(plotId: string): Promise<void> {
  if (Platform.OS === 'web' || !fsAny.documentDirectory) return;
  await FileSystem.deleteAsync(plotListThumbnailFilePath(plotId, fsAny.documentDirectory), {
    idempotent: true,
  }).catch(() => undefined);
}
