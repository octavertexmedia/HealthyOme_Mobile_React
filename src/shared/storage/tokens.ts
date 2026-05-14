import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'ho_access_token';
const REFRESH_KEY = 'ho_refresh_token';

export const tokenStore = {
  async getAccess(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_KEY);
  },
  async getRefresh(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_KEY);
  },
  async setAccess(token: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_KEY, token);
  },
  async setRefresh(token: string): Promise<void> {
    await SecureStore.setItemAsync(REFRESH_KEY, token);
  },
  async setPair(access: string, refresh: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, access),
      SecureStore.setItemAsync(REFRESH_KEY, refresh),
    ]);
  },
  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  },
};
