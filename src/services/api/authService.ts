import { getLinkedInClientId, getLinkedInRedirectUri } from '../../config/env';
import { apiClient, setAuthToken } from './client';
import { AuthResponse, BaseResponse } from './models';

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_SCOPE = 'openid profile email';

export const authService = {
  checkEmail: async (email: string): Promise<boolean> => {
    const response = await apiClient.post<any, BaseResponse<boolean>>(
      `/auth/check-email?email=${encodeURIComponent(email)}`
    );
    return response.data;
  },

  sendLoginOtp: async (email: string): Promise<void> => {
    const response = await apiClient.post<any, BaseResponse<any>>('/auth/send-otp', { email });
    if (response.code !== 200) {
      throw new Error(response.message || 'Gửi OTP thất bại');
    }
  },

  loginByOtp: async (email: string, otp: string): Promise<AuthResponse> => {
    const response = await apiClient.post<any, BaseResponse<AuthResponse>>('/auth/verify-login-otp', {
      email,
      otp,
    });
    if (response.data?.token) {
      setAuthToken(response.data.token);
    }
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<any, BaseResponse<AuthResponse>>('/auth/login', { email, password });
    if (response.data?.token) {
      setAuthToken(response.data.token);
    }
    return response.data;
  },

  register: async (data: {
    email: string;
    password: string;
    fullName?: string;
    companyName?: string;
    phone?: string;
    roleName: string;
  }): Promise<string> => {
    const formData = new FormData();
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('roleName', data.roleName);
    if (data.fullName) formData.append('fullName', data.fullName);
    if (data.companyName) formData.append('companyName', data.companyName);
    if (data.phone) formData.append('phone', data.phone);

    const response = await apiClient.post<any, BaseResponse<any>>('/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.message;
  },

  verifyOtp: async (email: string, otp: string): Promise<string> => {
    const response = await apiClient.post<any, BaseResponse<any>>('/auth/verify-otp', {
      email,
      otp,
    });
    return response.message;
  },

  resendOtp: async (email: string): Promise<string> => {
    const response = await apiClient.post<any, BaseResponse<any>>('/auth/resend-otp', { email });
    return response.message;
  },

  getCurrentUser: async (): Promise<AuthResponse> => {
    const response = await apiClient.get<any, BaseResponse<AuthResponse>>('/auth/me');
    return response.data;
  },

  googleLogin: async (idToken: string, roleName: string = 'ROLE_JOBSEEKER'): Promise<AuthResponse> => {
    const response = await apiClient.post<any, BaseResponse<AuthResponse>>('/auth/google-login', {
      idToken,
      roleName,
    });
    if (response.data?.token) {
      setAuthToken(response.data.token);
    }
    return response.data;
  },

  getLinkedInAuthorizeUrl: (state: string, redirectUri?: string): string => {
    const clientId = getLinkedInClientId();
    const redirect = redirectUri ?? getLinkedInRedirectUri();
    if (!clientId) {
      throw new Error('Thiếu cấu hình LinkedIn OAuth (linkedinClientId)');
    }
    const query = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirect,
      scope: LINKEDIN_SCOPE,
      state,
    });
    return `${LINKEDIN_AUTH_URL}?${query.toString()}`;
  },

  linkedinLogin: async (
    code: string,
    roleName: string = 'ROLE_JOBSEEKER',
    redirectUri?: string
  ): Promise<AuthResponse> => {
    const redirect = redirectUri ?? getLinkedInRedirectUri();
    const response = await apiClient.post<any, BaseResponse<AuthResponse>>('/auth/linkedin-login', {
      code,
      roleName,
      redirectUri: redirect,
    });
    if (response.data?.token) {
      setAuthToken(response.data.token);
    }
    return response.data;
  },

  logout: () => {
    setAuthToken(null);
  },
};
