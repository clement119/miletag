import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import { processTrack, type ProcessedRoute } from './geometry';
import { parseGpx } from './gpx';

/** Lets the user pick a .gpx file and returns the processed route, or null if cancelled. */
export async function pickGpxRoute(): Promise<ProcessedRoute | null> {
  const result = await DocumentPicker.getDocumentAsync({
    // GPX has no reliably registered MIME type across platforms.
    type: Platform.OS === 'web' ? ['.gpx', 'application/gpx+xml'] : '*/*',
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  const xml =
    Platform.OS === 'web' && asset.file ? await asset.file.text() : await new File(asset.uri).text();
  return processTrack(parseGpx(xml));
}
