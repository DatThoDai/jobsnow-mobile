import { Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import { downloadAsync, cacheDirectory } from 'expo-file-system/legacy';

export function safePdfFilename(baseName: string): string {
  const cleaned = (baseName || 'CV')
    .trim()
    .replace(/[^\w\u00C0-\u024F\s.-]/gi, '')
    .replace(/\s+/g, '_')
    .slice(0, 80);
  const stem = cleaned || 'CV';
  return stem.toLowerCase().endsWith('.pdf') ? stem : `${stem}.pdf`;
}

export async function downloadAndSharePdf(
  url: string,
  filename: string,
  headers?: Record<string, string>
): Promise<void> {
  const dir = cacheDirectory;
  if (!dir) {
    throw new Error('Không thể truy cập bộ nhớ tạm của thiết bị.');
  }

  const targetUri = `${dir}${filename}`;
  const result = await downloadAsync(url, targetUri, { headers });

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Tải file thất bại (mã ${result.status}).`);
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    Alert.alert('Đã tải', `File đã lưu tại bộ nhớ tạm:\n${result.uri}`);
    return;
  }

  await Sharing.shareAsync(result.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Lưu hoặc chia sẻ CV',
  });
}
