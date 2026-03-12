import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMMKVStorage, storage } from '../../../shared/storage/mmkv';
import type { User } from '../types/auth.types';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  
  setAuth: (user: User, token: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  restoreSession: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      refreshToken: null,

      setAuth: (user, token, refreshToken) => {
        storage.set('auth_token', token);
        storage.set('refresh_token', refreshToken);
        set({ user, isAuthenticated: true, token, refreshToken });
      },

      setUser: (user) => {
        set({ user });
      },

      logout: () => {
        storage.delete('auth_token');
        storage.delete('refresh_token');
        set({ user: null, isAuthenticated: false, token: null, refreshToken: null });
      },

      restoreSession: () => {
        const token = storage.getString('auth_token');
        const refreshToken = storage.getString('refresh_token');
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
