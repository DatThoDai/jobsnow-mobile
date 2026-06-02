import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../../config/env';

export interface ApiError {
  message: string;
  statusCode: number;
  details?: unknown;
}

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  // Let axios set multipart boundary (manual Content-Type breaks RN uploads).
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (
      data != null &&
      typeof data === 'object' &&
      'code' in data &&
      (data as { code?: number }).code !== undefined &&
      (data as { code: number }).code !== 200
    ) {
      const body = data as { code: number; message?: string; errors?: unknown };
      const apiError: ApiError = {
        message: body.message ?? 'Có lỗi xảy ra',
        statusCode: body.code,
        details: body.errors,
      };
      return Promise.reject(apiError);
    }
    return data;
  },
  (error: AxiosError<{ message?: string; code?: number; errors?: unknown }>) => {
    const responseData = error.response?.data;
    const apiError: ApiError = {
      message:
        responseData?.message ||
        error.message ||
        'Không thể kết nối máy chủ. Kiểm tra mạng hoặc API URL.',
      statusCode: responseData?.code ?? error.response?.status ?? 500,
      details: responseData?.errors,
    };
    return Promise.reject(apiError);
  }
);
