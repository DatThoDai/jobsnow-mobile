export const APPLICATION_LANGUAGE_LABELS_VI: Record<string, string> = {
  VIETNAMESE: 'Tiếng Việt',
  ENGLISH: 'Tiếng Anh',
  JAPANESE: 'Tiếng Nhật',
  KOREAN: 'Tiếng Hàn',
  CHINESE: 'Tiếng Trung',
  ANY: 'Bất kỳ',
};

export const GENDER_REQUIREMENT_LABELS_VI: Record<string, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  ANY: 'Bất kỳ',
};

export const SOCIAL_PLATFORM_LABELS_VI: Record<string, string> = {
  FACEBOOK: 'Facebook',
  LINKEDIN: 'LinkedIn',
  TWITTER: 'Twitter',
  YOUTUBE: 'YouTube',
  TIKTOK: 'TikTok',
  ZALO: 'Zalo',
  GITHUB: 'GitHub',
  OTHER: 'Khác',
};

function normKey(value: string | undefined): string {
  if (!value) return '';
  return value.toUpperCase().replace(/-/g, '_');
}

export function getApplicationLanguageLabel(value: string | undefined): string {
  if (!value) return '—';
  const k = normKey(value);
  return APPLICATION_LANGUAGE_LABELS_VI[k] || value;
}

export function getGenderRequirementLabel(value: string | undefined): string {
  if (!value) return '—';
  const k = normKey(value);
  return GENDER_REQUIREMENT_LABELS_VI[k] || value;
}

export function getSocialPlatformLabel(value: string | undefined): string {
  if (!value) return 'Liên kết';
  const k = normKey(value);
  return SOCIAL_PLATFORM_LABELS_VI[k] || value;
}
