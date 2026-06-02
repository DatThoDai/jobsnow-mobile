import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { PUBLIC_SITE_URL } from '../config/env';

/** Injected into public CV WebView to capture styled HTML for native PDF export. */
export const CV_EXPORT_HTML_INJECT = `
(function(){
  try {
    var root = document.querySelector('[data-cv-root="true"]');
    if (!root) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'cv-export-error', message: 'Không tìm thấy nội dung CV.' }));
      return;
    }
    root.style.transform = 'none';
    root.style.transformOrigin = 'top center';
    var css = 'body{margin:0;padding:0;background:#fff;}';
    document.querySelectorAll('style').forEach(function(s){ css += (s.textContent || ''); });
    document.querySelectorAll('link[rel="stylesheet"]').forEach(function(link){
      if (link.href) css += '@import url("' + link.href + '");';
    });
    var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' + css + '</style></head><body>' + root.outerHTML + '</body></html>';
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'cv-export-html', html: html }));
  } catch (e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'cv-export-error', message: String(e && e.message ? e.message : e) }));
  }
})();
true;
`;

export async function printHtmlToPdfAndShare(html: string, dialogTitle = 'Lưu hoặc chia sẻ CV'): Promise<void> {
  const { uri } = await Print.printToFileAsync({
    html,
    baseUrl: PUBLIC_SITE_URL.replace(/\/+$/, '/'),
    width: 595,
    height: 842,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    Alert.alert('Đã tạo PDF', `File đã lưu tại:\n${uri}`);
    return;
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle,
  });
}
