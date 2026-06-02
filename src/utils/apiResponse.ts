import type { BaseResponse } from '../services/api/models';

/** Extract payload from JobsNow BaseResponse after axios interceptor. */
export function unwrapApiData<T>(response: unknown): T {
  if (response == null) {
    throw new Error('Empty API response');
  }
  if (typeof response === 'object' && 'data' in response) {
    const wrapped = response as BaseResponse<T>;
    if (wrapped.data !== undefined && wrapped.data !== null) {
      return wrapped.data;
    }
  }
  return response as T;
}
