import { ApiError } from '../services/api/client';

export function getApiErrorMessage(error: unknown, fallback = 'Đã xảy ra lỗi'): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = String((error as ApiError).message);
    if (msg) return msg;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function getSubscriptionHint(statusCode: number): string | null {
  if (statusCode === 402 || statusCode === 403) {
    return 'Có thể bạn cần nâng cấp gói đăng ký để dùng tính năng AI.';
  }
  return null;
}
