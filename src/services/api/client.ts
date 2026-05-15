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
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data ?? response,
  (error: AxiosError<any>) => {
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'Request failed',
      statusCode: error.response?.status || 500,
      details: error.response?.data?.errors,
    };
    return Promise.reject(apiError);
  }
);
