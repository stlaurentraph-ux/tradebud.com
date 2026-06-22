import { ActionSheetIOS, Alert, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

export type PickedEvidenceFile = {
  uri: string;
  mimeType: string | null;
  name: string | null;
};

type PickMessages = {
  pick_source_title: string;
  pick_source_body: string;
  pick_browse_files: string;
  pick_photo_library: string;
  pick_take_photo: string;
  pick_cancel: string;
  pick_failed_title: string;
  pick_failed_body: string;
  perm_library_title: string;
  perm_library_body: string;
  perm_camera_title: string;
  perm_camera_body: string;
};

const defaultMessages: PickMessages = {
  pick_source_title: 'Add document',
  pick_source_body: 'Attach a PDF, Word file, or photo from your device.',
  pick_browse_files: 'Browse files',
  pick_photo_library: 'Photo library',
  pick_take_photo: 'Take photo',
  pick_cancel: 'Cancel',
  pick_failed_title: 'Could not open file picker',
  pick_failed_body: 'Choose a photo from your library or take a new picture instead.',
  perm_library_title: 'Permission needed',
  perm_library_body: 'Allow photo library access to attach documents.',
  perm_camera_title: 'Permission needed',
  perm_camera_body: 'Allow camera access to take a document photo.',
};

type PickSource = 'files' | 'library' | 'camera';

function offerPickSource(messages: PickMessages): Promise<PickSource | null> {
  const options = [
    messages.pick_cancel,
    messages.pick_take_photo,
    messages.pick_photo_library,
    messages.pick_browse_files,
  ];

  if (Platform.OS === 'ios') {
    return new Promise((resolve) => {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: messages.pick_source_title,
          message: messages.pick_source_body,
          options,
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) resolve('camera');
          else if (index === 2) resolve('library');
          else if (index === 3) resolve('files');
          else resolve(null);
        },
      );
    });
  }

  return new Promise((resolve) => {
    Alert.alert(messages.pick_source_title, messages.pick_source_body, [
      { text: messages.pick_cancel, style: 'cancel', onPress: () => resolve(null) },
      { text: messages.pick_take_photo, onPress: () => resolve('camera') },
      { text: messages.pick_photo_library, onPress: () => resolve('library') },
      { text: messages.pick_browse_files, onPress: () => resolve('files') },
    ]);
  });
}

async function pickFromDocuments(): Promise<PickedEvidenceFile | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    // MIME types only — iOS maps these to UTTypes (PDF, Word, images, etc.).
    type: '*/*',
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
}

async function pickFromLibrary(messages: PickMessages): Promise<PickedEvidenceFile | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(messages.perm_library_title, messages.perm_library_body);
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

async function pickFromCamera(messages: PickMessages): Promise<PickedEvidenceFile | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(messages.perm_camera_title, messages.perm_camera_body);
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
          void pickFromLibrary(messages).then(resolve);
        },
      },
      {
        text: messages.pick_take_photo,
        onPress: () => {
          void pickFromCamera(messages).then(resolve);
        },
      },
    ]);
  });
}

/**
 * Lets the user choose files (PDF/Word/images), photo library, or camera.
 */
export async function pickEvidenceFile(
  messages: Partial<PickMessages> = {},
): Promise<PickedEvidenceFile | null> {
  const m = { ...defaultMessages, ...messages };
  const source = await offerPickSource(m);
  if (!source) return null;

  if (source === 'library') {
    return pickFromLibrary(m);
  }
  if (source === 'camera') {
    return pickFromCamera(m);
  }

  try {
    return await pickFromDocuments();
  } catch {
    return offerPhotoFallback(m);
  }
}
