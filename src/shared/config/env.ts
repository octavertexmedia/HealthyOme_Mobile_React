import appConfig from '../../../app.json';

type AppEnv = 'development' | 'preview' | 'production';

type Extra = {
  apiUrl?: string;
  appEnv?: AppEnv;
  readOnlyPreview?: boolean;
};

// Source config also applies to native debug builds served by Metro.
const extra: Extra = appConfig.expo.extra as Extra;

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
  readOnlyPreview: extra.readOnlyPreview === true,
};
