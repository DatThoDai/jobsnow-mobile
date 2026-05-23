import { Alert, Linking, Share } from 'react-native';
import { PUBLIC_SITE_URL } from '../config/env';

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

export function buildJobShareUrl(jobId: number): string {
  return `${normalizeBaseUrl(PUBLIC_SITE_URL)}/s/jobs/${jobId}`;
}

export function buildHandbookShareUrl(slug: string): string {
  return `${normalizeBaseUrl(PUBLIC_SITE_URL)}/cam-nang-viec-lam/bai-viet/${encodeURIComponent(slug)}`;
}

export async function openFacebookShare(targetUrl: string): Promise<void> {
  const href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(targetUrl)}`;
  await openExternalUrl(href);
}

export async function openLinkedInShare(targetUrl: string): Promise<void> {
  const href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(targetUrl)}`;
  await openExternalUrl(href);
}

async function openExternalUrl(url: string): Promise<void> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('Không thể chia sẻ', 'Thiết bị không hỗ trợ mở liên kết chia sẻ.');
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert('Lỗi', 'Không thể mở trình duyệt chia sẻ.');
  }
}

export async function shareNative(title: string, url: string): Promise<void> {
  try {
    await Share.share({
      message: `${title}\n${url}`,
      url,
      title,
    });
  } catch {
    // user dismissed
  }
}
