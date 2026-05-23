import * as SecureStore from 'expo-secure-store';

const LINKEDIN_STATE_KEY = 'linkedin_oauth_state';
const LINKEDIN_ROLE_KEY = 'linkedin_oauth_role';
const LINKEDIN_REDIRECT_KEY = 'linkedin_oauth_redirect_uri';

export const oauthStorage = {
  saveLinkedInSession: async (state: string, roleName: string, redirectUri: string) => {
    await SecureStore.setItemAsync(LINKEDIN_STATE_KEY, state);
    await SecureStore.setItemAsync(LINKEDIN_ROLE_KEY, roleName);
    await SecureStore.setItemAsync(LINKEDIN_REDIRECT_KEY, redirectUri);
  },

  getLinkedInSession: async () => {
    const [state, roleName, redirectUri] = await Promise.all([
      SecureStore.getItemAsync(LINKEDIN_STATE_KEY),
      SecureStore.getItemAsync(LINKEDIN_ROLE_KEY),
      SecureStore.getItemAsync(LINKEDIN_REDIRECT_KEY),
    ]);
    return { state, roleName, redirectUri };
  },

  clearLinkedInSession: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(LINKEDIN_STATE_KEY),
      SecureStore.deleteItemAsync(LINKEDIN_ROLE_KEY),
      SecureStore.deleteItemAsync(LINKEDIN_REDIRECT_KEY),
    ]);
  },
};
