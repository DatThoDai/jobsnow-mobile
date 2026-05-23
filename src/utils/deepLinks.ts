import * as Linking from 'expo-linking';
import { NavigationContainerRef } from '@react-navigation/native';
import { authService } from '../services/api/authService';
import { oauthStorage } from '../services/oauthStorage';
import { getLinkedInRedirectUri } from '../config/env';
import { RootStackParamList } from '../navigation/RootNavigator';

/** Deep link target for web bridge at /callbacks (must match jobs-now-reactjs LinkedInCallbackPage). */
export const MOBILE_LINKEDIN_CALLBACK_URL = 'jobsnowapp://linkedin-callback';

export function parsePaymentResult(url: string): {
  status?: string;
  txnRef?: string;
  flow?: string;
} | null {
  const parsed = Linking.parse(url);
  if (!parsed.path?.includes('payment-result')) return null;
  const q = parsed.queryParams ?? {};
  return {
    status: typeof q.status === 'string' ? q.status : undefined,
    txnRef: typeof q.txnRef === 'string' ? q.txnRef : undefined,
    flow: typeof q.flow === 'string' ? q.flow : undefined,
  };
}

function isLinkedInCallbackUrl(url: string): boolean {
  const redirectUri = getLinkedInRedirectUri();
  try {
    const actual = new URL(url);
    if (actual.protocol === 'jobsnowapp:') {
      const host = actual.hostname || actual.pathname.replace(/^\//, '');
      return host.includes('linkedin-callback');
    }
    const path = actual.pathname.replace(/\/$/, '') || '/';
    if (path.endsWith('/callbacks') || path.includes('linkedin-callback')) {
      return true;
    }
    if (!redirectUri) return false;
    const expected = new URL(redirectUri);
    const expectedPath = expected.pathname.replace(/\/$/, '') || '/';
    return actual.origin === expected.origin && path === expectedPath;
  } catch {
    const parsed = Linking.parse(url);
    const path = parsed.path ?? '';
    const hostname = parsed.hostname ?? '';
    return (
      path.includes('linkedin-callback') ||
      path.includes('callbacks') ||
      hostname.includes('linkedin-callback')
    );
  }
}

function readLinkedInCallbackParams(url: string): {
  code?: string;
  state?: string;
  error?: string;
} {
  try {
    const u = new URL(url);
    return {
      code: u.searchParams.get('code') ?? undefined,
      state: u.searchParams.get('state') ?? undefined,
      error: u.searchParams.get('error') ?? undefined,
    };
  } catch {
    const q = Linking.parse(url).queryParams ?? {};
    return {
      code: typeof q.code === 'string' ? q.code : undefined,
      state: typeof q.state === 'string' ? q.state : undefined,
      error: typeof q.error === 'string' ? q.error : undefined,
    };
  }
}

export function parseLinkedInCallback(url: string): { code?: string; state?: string; error?: string } | null {
  if (!isLinkedInCallbackUrl(url)) return null;
  const params = readLinkedInCallbackParams(url);
  if (!params.code && !params.state && !params.error) return null;
  return params;
}

export async function handleDeepLink(
  url: string,
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList> | null>,
  onLinkedInAuth: (code: string) => Promise<void>
): Promise<boolean> {
  const payment = parsePaymentResult(url);
  if (payment?.status) {
    navigationRef.current?.navigate('PaymentResult', {
      status: payment.status,
      txnRef: payment.txnRef,
      flow: payment.flow,
    });
    return true;
  }

  const linkedIn = parseLinkedInCallback(url);
  if (linkedIn) {
    if (linkedIn.error) return true;
    if (!linkedIn.code || !linkedIn.state) return true;

    const session = await oauthStorage.getLinkedInSession();
    if (!session.state || session.state !== linkedIn.state) {
      await oauthStorage.clearLinkedInSession();
      return true;
    }

    await onLinkedInAuth(linkedIn.code);
    await oauthStorage.clearLinkedInSession();
    return true;
  }

  return false;
}

export function buildLinkedInAuthUrl(state: string): string {
  return authService.getLinkedInAuthorizeUrl(state, getLinkedInRedirectUri());
}
