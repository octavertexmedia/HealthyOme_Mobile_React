import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMMKVStorage } from '../../../shared/storage/mmkv';
import { tokenStore } from '../../../shared/storage/tokens';
import { authApi } from '../api/auth.api';
import { unregisterPushToken } from '../../notifications/registerPushToken';
import type { User } from '../types/auth.types';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;

  setAuth: (user: User, token: string, refreshToken: string) => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      refreshToken: null,

      setAuth: async (user, token, refreshToken) => {
        await tokenStore.setPair(token, refreshToken);
        set({ user, isAuthenticated: true, token, refreshToken });
      },

      setUser: (user) => {
        set({ user });
      },

      logout: async () => {
        await unregisterPushToken();
        const refresh = await tokenStore.getRefresh();
        if (refresh) {
          try {
            await authApi.logout(refresh);
          } catch {
            // best effort — blacklist may fail if token already expired; clear locally regardless
          }
        }
        await tokenStore.clear();
        set({ user: null, isAuthenticated: false, token: null, refreshToken: null });
      },

      restoreSession: async () => {
        const token = await tokenStore.getAccess();
        const refreshToken = await tokenStore.getRefresh();
        if (token && refreshToken) {
          set({ isAuthenticated: true, token, refreshToken });
          return true;
        }
        return false;
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => zustandMMKVStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
