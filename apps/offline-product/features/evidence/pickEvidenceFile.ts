import { Alert, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

export type PickedEvidenceFile = {
  uri: string;
  mimeType: string | null;
  name: string | null;
};

type PickMessages = {
  pick_failed_title: string;
  pick_failed_body: string;
  pick_photo_library: string;
  pick_take_photo: string;
  pick_cancel: string;
  perm_library_title: string;
  perm_library_body: string;
  perm_camera_title: string;
  perm_camera_body: string;
};

const defaultMessages: PickMessages = {
  pick_failed_title: 'Could not open file picker',
  pick_failed_body: 'Choose a photo from your library or take a new picture instead.',
  pick_photo_library: 'Photo library',
  pick_take_photo: 'Take photo',
  pick_cancel: 'Cancel',
  perm_library_title: 'Permission needed',
  perm_library_body: 'Allow photo library access to attach documents.',
  perm_camera_title: 'Permission needed',
  perm_camera_body: 'Allow camera access to take a document photo.',
};

async function pickFromLibrary(): Promise<PickedEvidenceFile | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(defaultMessages.perm_library_title, defaultMessages.perm_library_body);
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85,
  });
  if (result.canceled || !result.assets?.[0]?.uri) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
    name: asset.fileName ?? 'photo.jpg',
  };
}

async function pickFromCamera(): Promise<PickedEvidenceFile | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(defaultMessages.perm_camera_title, defaultMessages.perm_camera_body);
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
  if (result.canceled || !result.assets?.[0]?.uri) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
    name: asset.fileName ?? 'camera-photo.jpg',
  };
}

function offerPhotoFallback(messages: PickMessages): Promise<PickedEvidenceFile | null> {
  return new Promise((resolve) => {
    Alert.alert(messages.pick_failed_title, messages.pick_failed_body, [
      { text: messages.pick_cancel, style: 'cancel', onPress: () => resolve(null) },
      {
        text: messages.pick_photo_library,
        onPress: () => {
          void pickFromLibrary().then(resolve);
        },
      },
      {
        text: messages.pick_take_photo,
        onPress: () => {
          void pickFromCamera().then(resolve);
        },
      },
    ]);
  });
}

/**
 * Opens the system document picker; falls back to photo library / camera when unavailable
 * (common on iOS standalone builds without iCloud document-picker entitlements).
 */
export async function pickEvidenceFile(
  messages: Partial<PickMessages> = {},
): Promise<PickedEvidenceFile | null> {
  const m = { ...defaultMessages, ...messages };
  try {
    const picked = await DocumentPicker.getDocumentAsync({
      type:
        Platform.OS === 'ios'
          ? ['public.image', 'com.adobe.pdf', 'public.data', 'public.content']
          : ['image/*', 'application/pdf', '*/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (picked.canceled || !picked.assets?.[0]?.uri) return null;
    const asset = picked.assets[0];
    return {
      uri: asset.uri,
      mimeType: asset.mimeType ?? null,
      name: asset.name ?? null,
    };
  } catch {
    return offerPhotoFallback(m);
  }
}
