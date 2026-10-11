import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import type { PhotoAsset } from './photo';

/** Long edge of the preview copy. Enough for a sharp phone preview, small enough to decode fast. */
const PREVIEW_MAX_PX = 2048;

/** Lets the user pick a photo. Returns null if they cancel. */
export async function pickPhoto(): Promise<PhotoAsset | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    // Full quality: the original is what gets printed. We crop in our own editor.
    quality: 1,
    allowsEditing: false,
  });
  if (result.canceled) return null;

  const { uri, width, height } = result.assets[0];
  return { uri, previewUri: await makePreview(uri, width, height), width, height };
}

async function makePreview(uri: string, width: number, height: number): Promise<string> {
  if (Math.max(width, height) <= PREVIEW_MAX_PX) return uri;
  try {
    const resize = width >= height ? { width: PREVIEW_MAX_PX } : { height: PREVIEW_MAX_PX };
    const image = await ImageManipulator.manipulate(uri).resize(resize).renderAsync();
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.9 });
    return saved.uri;
  } catch {
    // The preview is only a convenience; fall back to the original.
    return uri;
  }
}
