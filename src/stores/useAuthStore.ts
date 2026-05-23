import { create } from 'zustand';
import { User, AuthResponse } from '../services/api/models';
import { authService } from '../services/api/authService';
import { authStorage } from '../services/authStorage';
import { setAuthToken } from '../services/api/client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  isLoading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  loginByOtp: (email: string, otp: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithLinkedIn: (code: string, redirectUri: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setError: (err: string | null) => void;
  setLoading: (loading: boolean) => void;
}

function mapResponseToUser(response: AuthResponse | User): User {
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

async function persistAuth(response: AuthResponse): Promise<User> {
  const user = mapResponseToUser(response);
  if (response.token) {
    setAuthToken(response.token);
    await authStorage.saveSession(response.token, user);
  }
  return user;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrating: true,
  isLoading: false,
  error: null,

  hydrate: async () => {
    set({ isHydrating: true });
    try {
      const session = await authStorage.getSession();
      if (!session?.token) {
        set({ user: null, isAuthenticated: false, isHydrating: false });
        return;
      }
      setAuthToken(session.token);
      try {
        const me = await authService.getCurrentUser();
        if (me.role !== 'ROLE_JOBSEEKER') {
          await authStorage.clear();
          setAuthToken(null);
          set({ user: null, isAuthenticated: false, isHydrating: false });
          return;
        }
        const user = mapResponseToUser(me);
        if (me.token) {
          await authStorage.saveSession(me.token, user);
        } else {
          await authStorage.saveSession(session.token, user);
        }
        set({ user, isAuthenticated: true, isHydrating: false });
      } catch {
        await authStorage.clear();
        setAuthToken(null);
        set({ user: null, isAuthenticated: false, isHydrating: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isHydrating: false });
    }
  },

  login: async (email: string, pass: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(email, pass);
      if (response.role !== 'ROLE_JOBSEEKER') {
        throw new Error('Ứng dụng này chỉ dành cho Người tìm việc.');
      }
      const user = await persistAuth(response);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Đăng nhập thất bại';
      set({ error: message, isLoading: false });
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
      const user = await persistAuth(response);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Mã OTP không đúng hoặc đã hết hạn';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  loginWithGoogle: async (idToken: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.googleLogin(idToken, 'ROLE_JOBSEEKER');
      if (response.role !== 'ROLE_JOBSEEKER') {
        throw new Error('Ứng dụng này chỉ dành cho Người tìm việc.');
      }
      const user = await persistAuth(response);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Đăng nhập Google thất bại';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  loginWithLinkedIn: async (code: string, redirectUri: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.linkedinLogin(code, 'ROLE_JOBSEEKER', redirectUri);
      if (response.role !== 'ROLE_JOBSEEKER') {
        throw new Error('Ứng dụng này chỉ dành cho Người tìm việc.');
      }
      const user = await persistAuth(response);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Đăng nhập LinkedIn thất bại';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    authService.logout();
    await authStorage.clear();
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },

  setError: (err) => set({ error: err }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
