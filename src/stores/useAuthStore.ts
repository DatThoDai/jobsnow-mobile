import { create } from 'zustand';
import { User } from '../services/api/models';
import { authService } from '../services/api/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  loginByOtp: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setError: (err: string | null) => void;
  setLoading: (loading: boolean) => void;
}

function mapResponseToUser(response: any): User {
  return {
    userId: response.userId,
    email: response.email,
    fullName: response.fullName,
    phone: response.phone,
    role: response.role,
    avatar: response.avatar,
    profileId: response.profileId,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, pass: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(email, pass);
      if (response.role !== 'ROLE_JOBSEEKER') {
        throw new Error('Ứng dụng này chỉ dành cho Người tìm việc.');
      }
      set({
        user: mapResponseToUser(response),
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message || 'Đăng nhập thất bại', isLoading: false });
      throw error;
    }
  },

  loginByOtp: async (email: string, otp: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.loginByOtp(email, otp);
      if (response.role !== 'ROLE_JOBSEEKER') {
        throw new Error('Ứng dụng này chỉ dành cho Người tìm việc.');
      }
      set({
        user: mapResponseToUser(response),
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message || 'Mã OTP không đúng hoặc đã hết hạn', isLoading: false });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },

  setError: (err) => set({ error: err }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
