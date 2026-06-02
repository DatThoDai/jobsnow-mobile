import * as Print from 'expo-print';
import { PUBLIC_SITE_URL } from '../config/env';
import { saveLocalPdfToDevice, type SavePdfResult } from './savePdfToDevice';

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

export async function printHtmlToPdfAndSave(
  html: string,
  filename: string
): Promise<SavePdfResult> {
  const { uri } = await Print.printToFileAsync({
    html,
    baseUrl: PUBLIC_SITE_URL.replace(/\/+$/, '/'),
    width: 595,
    height: 842,
  });

  return saveLocalPdfToDevice(uri, filename);
}
