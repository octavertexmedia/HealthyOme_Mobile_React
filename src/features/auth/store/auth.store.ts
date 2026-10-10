import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../../../shared/storage/mmkv';
import { tokenStore } from '../../../shared/storage/tokens';
import { authApi } from '../api/auth.api';
import { unregisterPushToken } from '../../notifications/registerPushToken';
import type { User } from '../types/auth.types';
import { queryClient } from '../../../shared/api/queryClient';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  sessionRevision: number;

  setAuth: (user: User, token: string, refreshToken: string) => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  clearSession: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      refreshToken: null,
      sessionRevision: 0,

      setAuth: async (user, token, refreshToken) => {
        await tokenStore.setPair(token, refreshToken);
        queryClient.clear();
        set({ user, isAuthenticated: true, token, refreshToken, sessionRevision: get().sessionRevision + 1 });
      },

      setUser: (user) => {
        set({ user });
      },

      clearSession: async () => {
        set({ user: null, isAuthenticated: false, token: null, refreshToken: null, sessionRevision: get().sessionRevision + 1 });
        queryClient.clear();
        await tokenStore.clear();
      },

      logout: async () => {
        try {
          await unregisterPushToken();
          const refresh = await tokenStore.getRefresh();
          if (refresh) {
            try {
              await authApi.logout(refresh);
            } catch {
              // The local session must end even when remote revocation fails.
            }
          }
        } finally {
          await get().clearSession();
        }
      },

      restoreSession: async () => {
        // Persisted display state is not proof of authentication. Keep the app
        // signed out until the server accepts the SecureStore token pair (the
        // Axios interceptor may refresh an expired access token once).
        const sessionRevision = get().sessionRevision + 1;
        set({ user: null, isAuthenticated: false, token: null, refreshToken: null, sessionRevision });
        queryClient.clear();

        const token = await tokenStore.getAccess();
        const refreshToken = await tokenStore.getRefresh();
        if (!token || !refreshToken) {
          return false;
        }

        try {
          const user = await authApi.getProfile();
          // A profile request can transparently rotate the access token.
          const currentToken = await tokenStore.getAccess();
          const currentRefreshToken = await tokenStore.getRefresh();
          if (!currentToken || !currentRefreshToken || get().sessionRevision !== sessionRevision) return false;

          set({
            user,
            isAuthenticated: true,
            token: currentToken,
            refreshToken: currentRefreshToken,
          });
          return true;
        } catch {
          // Never trust stale persisted auth. Network failures leave SecureStore
          // untouched so a later app start can validate the same session.
          if (get().sessionRevision === sessionRevision) {
            set({ user: null, isAuthenticated: false, token: null, refreshToken: null });
          }
          return false;
        }
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => zustandStorage),
      // Profiles now include health details; keep them only in memory and reload
      // them after SecureStore authentication. Ignore older persisted profiles.
      partialize: () => ({}),
      merge: (_persisted, current) => current,
    }
  )
);
