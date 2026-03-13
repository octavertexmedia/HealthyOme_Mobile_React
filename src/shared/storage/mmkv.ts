import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';

// Zustand persist adapter for AsyncStorage
export const zustandMMKVStorage: StateStorage = {
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

// Async Storage wrapper for tokens
export const storage = {
  getString: async (key: string) => await AsyncStorage.getItem(key),
  set: async (key: string, value: string) => await AsyncStorage.setItem(key, value),
  delete: async (key: string) => await AsyncStorage.removeItem(key),
};
