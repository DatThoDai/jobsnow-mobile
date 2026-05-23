import { Platform } from 'react-native';
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { getGoogleWebClientId } from '../../config/env';

let configured = false;

export function configureGoogleSignIn(): void {
  const webClientId = getGoogleWebClientId();
  if (!webClientId || configured) return;

  GoogleSignin.configure({
    webClientId,
    offlineAccess: false,
  });
  configured = true;
}

export function isGoogleNativeSignInAvailable(): boolean {
  return Platform.OS === 'android' && Boolean(getGoogleWebClientId());
}

export class GoogleSignInCancelledError extends Error {
  constructor() {
    super('Đăng nhập Google đã hủy');
    this.name = 'GoogleSignInCancelledError';
  }
}

export async function signInWithGoogleNative(): Promise<string> {
  if (Platform.OS !== 'android') {
    throw new Error('Đăng nhập Google qua app hiện chỉ hỗ trợ Android.');
  }

  const webClientId = getGoogleWebClientId();
  if (!webClientId) {
    throw new Error(
      'Thiếu googleWebClientId (OAuth Web client) trong app.json. Cần cho đăng nhập Google trên Android.'
    );
  }

  configureGoogleSignIn();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const result = await GoogleSignin.signIn();
  if (result.type === 'cancelled') {
    throw new GoogleSignInCancelledError();
  }

  let idToken = result.data?.idToken ?? null;
  if (!idToken) {
    const tokens = await GoogleSignin.getTokens();
    idToken = tokens.idToken;
  }
  if (!idToken) {
    throw new Error('Không lấy được token Google. Kiểm tra Web client ID và SHA-1 trên Google Cloud.');
  }

  return idToken;
}

export function resolveGoogleSignInError(error: unknown): string {
  if (error instanceof GoogleSignInCancelledError) {
    return error.message;
  }
  if (isErrorWithCode(error)) {
    switch (error.code) {
      case statusCodes.SIGN_IN_CANCELLED:
        return 'Đăng nhập Google đã hủy';
      case statusCodes.IN_PROGRESS:
        return 'Đang xử lý đăng nhập Google';
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return 'Google Play Services không khả dụng trên thiết bị này';
      default:
        break;
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Đăng nhập Google thất bại';
}
