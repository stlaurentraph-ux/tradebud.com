import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/** Read a local evidence URI into bytes — avoids RN `fetch(file://)` false network errors. */
export async function readLocalEvidenceBytes(localUri: string): Promise<ArrayBuffer> {
  const uri = localUri.trim();
  if (!uri) {
    throw new Error('Photo file path is empty.');
  }

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Could not read photo file (${response.status}).`);
    }
    return response.arrayBuffer();
  }

  const fsAny = FileSystem as typeof FileSystem & {
    EncodingType?: { Base64: string };
  };
  const encoding = fsAny.EncodingType?.Base64 ?? 'base64';

  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: encoding as 'base64',
    });
    return base64ToArrayBuffer(base64);
  } catch (firstError) {
    try {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Could not read photo file (${response.status}).`);
      }
      return response.arrayBuffer();
    } catch {
      const message = firstError instanceof Error ? firstError.message : String(firstError);
      throw new Error(
        message.includes('does not exist') || message.includes('No such file')
          ? 'Photo file missing on this phone — open the plot and add the photo again.'
          : `Could not read photo file: ${message}`,
      );
    }
  }
}

const fsAny = FileSystem as { documentDirectory?: string | null };

/** Copy picked evidence into app storage so sync survives cache cleanup / Metro reload. */
export async function copyEvidenceUriToAppStorage(params: {
  sourceUri: string;
  plotId: string;
  kind: string;
  mimeType?: string | null;
  name?: string | null;
}): Promise<string> {
  if (Platform.OS === 'web') {
    return params.sourceUri;
  }

  const plotId = params.plotId.trim();
  if (!plotId) {
    return params.sourceUri;
  }

  const root = fsAny.documentDirectory ?? '';
  if (!root) {
    return params.sourceUri;
  }

  const hint = `${params.name ?? ''} ${params.mimeType ?? ''} ${params.sourceUri}`.toLowerCase();
  const ext = hint.includes('.heic')
    ? 'heic'
    : hint.includes('.heif')
      ? 'heif'
      : hint.includes('.png')
        ? 'png'
        : hint.includes('.pdf')
          ? 'pdf'
          : hint.includes('.webp')
            ? 'webp'
            : 'jpg';

  const dir = `${root}evidence/${plotId}/${params.kind}/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => undefined);
  const dest = `${dir}${Date.now()}.${ext}`;
  await FileSystem.copyAsync({ from: params.sourceUri, to: dest });
  return dest;
}
