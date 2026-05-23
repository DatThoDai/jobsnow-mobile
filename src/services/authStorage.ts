import * as SecureStore from 'expo-secure-store';
import { User } from './api/models';

const TOKEN_KEY = 'jobsnow_auth_token';
const USER_KEY = 'jobsnow_auth_user';

export interface StoredSession {
  token: string;
  user: User;
}

export const authStorage = {
  async saveSession(token: string, user: User): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },

  async getSession(): Promise<StoredSession | null> {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const userJson = await SecureStore.getItemAsync(USER_KEY);
    if (!token || !userJson) return null;
    try {
      return { token, user: JSON.parse(userJson) as User };
    } catch {
      return null;
    }
  },

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};
