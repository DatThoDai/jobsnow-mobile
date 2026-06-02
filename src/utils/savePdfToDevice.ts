import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';

const { StorageAccessFramework } = FileSystem;

const DOWNLOADS_SAF_URI_KEY = 'jobsnow_cv_downloads_saf_uri';
const CV_DOCUMENTS_FOLDER = 'CV';

export type SavePdfResult = {
  savedUri: string;
  message: string;
};

export function safePdfFilename(baseName: string): string {
  const cleaned = (baseName || 'CV')
    .trim()
    .replace(/[^\w\u00C0-\u024F\s.-]/gi, '')
    .replace(/\s+/g, '_')
    .slice(0, 80);
  const stem = cleaned || 'CV';
  return stem.toLowerCase().endsWith('.pdf') ? stem : `${stem}.pdf`;
}

function filenameWithoutExtension(filename: string): string {
  return filename.replace(/\.pdf$/i, '') || 'CV';
}

async function ensureIosCvFolder(): Promise<string> {
  const base = FileSystem.documentDirectory;
  if (!base) {
    throw new Error('Không thể truy cập bộ nhớ thiết bị.');
  }
  const dir = `${base}${CV_DOCUMENTS_FOLDER}/`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

async function readFileBase64(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

async function resolveAndroidDownloadsUri(forceReprompt = false): Promise<string | null> {
  if (!forceReprompt) {
    const cached = await SecureStore.getItemAsync(DOWNLOADS_SAF_URI_KEY);
    if (cached) return cached;
  } else {
    await SecureStore.deleteItemAsync(DOWNLOADS_SAF_URI_KEY);
  }

  const initial = StorageAccessFramework.getUriForDirectoryInRoot('Download');
  const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync(initial);
  if (!permissions.granted) {
    return null;
  }

  await SecureStore.setItemAsync(DOWNLOADS_SAF_URI_KEY, permissions.directoryUri);
  return permissions.directoryUri;
}

async function saveBase64ToAndroidDownloads(
  base64: string,
  filename: string
): Promise<string> {
  const trySave = async (parentUri: string) => {
    const destUri = await StorageAccessFramework.createFileAsync(
      parentUri,
      filenameWithoutExtension(filename),
      'application/pdf'
    );
    await StorageAccessFramework.writeAsStringAsync(destUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return destUri;
  };

  let parentUri = await resolveAndroidDownloadsUri();
  if (!parentUri) {
    throw new Error('Cần quyền lưu vào thư mục Tải xuống (Downloads) để tải CV.');
  }

  try {
    return await trySave(parentUri);
  } catch {
    parentUri = await resolveAndroidDownloadsUri(true);
    if (!parentUri) {
      throw new Error('Không thể lưu vào thư mục Tải xuống. Vui lòng thử lại.');
    }
    return await trySave(parentUri);
  }
}

async function cleanupTempFile(uri: string): Promise<void> {
  const cache = FileSystem.cacheDirectory;
  if (!cache || !uri.startsWith(cache)) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // ignore
  }
}

/** Save a local PDF (file://) to device storage. */
export async function saveLocalPdfToDevice(
  localUri: string,
  filename: string
): Promise<SavePdfResult> {
  const safeName = safePdfFilename(filename);

  if (Platform.OS === 'android') {
    const base64 = await readFileBase64(localUri);
    const savedUri = await saveBase64ToAndroidDownloads(base64, safeName);
    await cleanupTempFile(localUri);
    return {
      savedUri,
      message: `Đã lưu "${safeName}" vào thư mục Tải xuống (Downloads).`,
    };
  }

  const dir = await ensureIosCvFolder();
  const dest = `${dir}${safeName}`;
  await FileSystem.copyAsync({ from: localUri, to: dest });
  await cleanupTempFile(localUri);

  return {
    savedUri: dest,
    message: `Đã lưu "${safeName}". Mở app Files → Trên iPhone → JobsNow → CV.`,
  };
}

/** Download remote PDF URL then save to device storage. */
export async function downloadPdfToDevice(
  url: string,
  filename: string,
  headers?: Record<string, string>
): Promise<SavePdfResult> {
  const cache = FileSystem.cacheDirectory;
  if (!cache) {
    throw new Error('Không thể truy cập bộ nhớ tạm của thiết bị.');
  }

  const safeName = safePdfFilename(filename);
  const tempUri = `${cache}${safeName}`;
  const result = await FileSystem.downloadAsync(url, tempUri, { headers });

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Tải file thất bại (mã ${result.status}).`);
  }

  return saveLocalPdfToDevice(result.uri, safeName);
}
