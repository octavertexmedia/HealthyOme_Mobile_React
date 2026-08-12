import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';

/**
 * Key-value storage, backed by @react-native-async-storage/async-storage.
 *
 * NOTE: despite the legacy filename, this is NOT MMKV — react-native-mmkv is a
 * native module that only works in a dev/prod build (not Expo Go). To switch to
 * real (synchronous, faster) MMKV, install react-native-mmkv, do an
 * `expo prebuild`, and swap the implementations below — the public API
 * (`zustandStorage`, `storage`) can stay identical so no call sites change.
 */

// Zustand persist adapter.
export const zustandStorage: StateStorage = {
  getItem: async (name: string) => {
    return (await AsyncStorage.getItem(name)) ?? null;
  },
  setItem: async (name: string, value: string) => {
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name: string) => {
    await AsyncStorage.removeItem(name);
  },
};

/** @deprecated misleading name — use `zustandStorage`. Kept for compatibility. */
export const zustandMMKVStorage = zustandStorage;

// Simple string KV wrapper (used for tokens / onboarding flags).
export const storage = {
  getString: async (key: string) => await AsyncStorage.getItem(key),
  set: async (key: string, value: string) => await AsyncStorage.setItem(key, value),
  delete: async (key: string) => await AsyncStorage.removeItem(key),
};
