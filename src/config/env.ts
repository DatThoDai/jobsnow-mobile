import Constants from 'expo-constants';

type EnvExtra = {
  apiBaseUrl?: string;
  publicSiteUrl?: string;
  algoliaAppId?: string;
  algoliaSearchKey?: string;
  googleWebClientId?: string;
  googleIosClientId?: string;
  googleAndroidClientId?: string;
  linkedinClientId?: string;
  linkedinRedirectUri?: string;
};

/** Read app.json `extra` at call time (avoids stale values after config changes). */
export function readEnvExtra(): EnvExtra {
  const expoExtra = Constants.expoConfig?.extra as EnvExtra | undefined;
  const manifest2Extra = (
    Constants as unknown as { manifest2?: { extra?: EnvExtra } }
  ).manifest2?.extra;
  const legacyExtra = (Constants as unknown as { manifest?: { extra?: EnvExtra } }).manifest
    ?.extra;
  return { ...legacyExtra, ...manifest2Extra, ...expoExtra };
}

// export const API_BASE_URL = readEnvExtra().apiBaseUrl ?? 'https://jobsnow.onrender.com';
export const API_BASE_URL = readEnvExtra().apiBaseUrl ?? 'http://192.168.1.34:8082';
export const PUBLIC_SITE_URL = readEnvExtra().publicSiteUrl ?? 'https://jobsnow.id.vn';

export function getAlgoliaAppId(): string {
  return readEnvExtra().algoliaAppId ?? '';
}
export function getAlgoliaSearchKey(): string {
  return readEnvExtra().algoliaSearchKey ?? '';
}
export function hasAlgolia(): boolean {
  return Boolean(getAlgoliaAppId() && getAlgoliaSearchKey());
}

export function getGoogleWebClientId(): string {
  return readEnvExtra().googleWebClientId?.trim() ?? '';
}
export function getGoogleIosClientId(): string {
  return readEnvExtra().googleIosClientId?.trim() ?? '';
}
export function getGoogleAndroidClientId(): string {
  return readEnvExtra().googleAndroidClientId?.trim() ?? '';
}
/** Android native Sign-In needs Web client ID for idToken; iOS not enabled yet. */
export function hasGoogleAuth(): boolean {
  return Boolean(getGoogleWebClientId());
}

export function getLinkedInClientId(): string {
  return readEnvExtra().linkedinClientId?.trim() ?? '';
}

export function getLinkedInRedirectUri(): string {
  return readEnvExtra().linkedinRedirectUri?.trim() ?? 'jobsnowapp://linkedin-callback';
}

export function hasLinkedInAuth(): boolean {
  return Boolean(getLinkedInClientId());
}

/** @deprecated Use getGoogleWebClientId() — kept for existing imports */
export const GOOGLE_WEB_CLIENT_ID = getGoogleWebClientId();
export const GOOGLE_IOS_CLIENT_ID = getGoogleIosClientId();
export const GOOGLE_ANDROID_CLIENT_ID = getGoogleAndroidClientId();
export const HAS_GOOGLE_AUTH = hasGoogleAuth();

/** @deprecated Use getLinkedInClientId() */
export const LINKEDIN_CLIENT_ID = getLinkedInClientId();
/** @deprecated Use getLinkedInRedirectUri() */
export const LINKEDIN_REDIRECT_URI = getLinkedInRedirectUri();
/** @deprecated Use hasLinkedInAuth() */
export const HAS_LINKEDIN_AUTH = hasLinkedInAuth();

export const ALGOLIA_APP_ID = getAlgoliaAppId();
export const ALGOLIA_SEARCH_KEY = getAlgoliaSearchKey();
export const HAS_ALGOLIA = hasAlgolia();

export const APP_SCHEME = 'jobsnowapp';

export const ENABLE_SOCIAL_OAUTH = true;
