import Constants from 'expo-constants';

type AppEnv = 'development' | 'preview' | 'production';

type Extra = {
  apiUrl?: string;
  appEnv?: AppEnv;
};

const extra: Extra = (Constants.expoConfig?.extra ?? {}) as Extra;

const DEFAULT_API_URL = 'https://dev.healthyome.com/api/shop';

const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? DEFAULT_API_URL;

const appEnv: AppEnv =
  (process.env.EXPO_PUBLIC_APP_ENV as AppEnv | undefined) ??
  extra.appEnv ??
  'development';

export const env = {
  apiUrl,
  appEnv,
  isProd: appEnv === 'production',
};
