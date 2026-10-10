/**
 * Sentry init for React Native.
 *
 * Gated on EXPO_PUBLIC_SENTRY_DSN. If unset, collection remains disabled.
 *
 * Then call initSentry() once at the top of app/_layout.tsx.
 */
import { env } from '../config/env';
import * as Sentry from '@sentry/react-native';

let initialized = false;

export function initSentry(): void {
  if (initialized) return;

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: env.appEnv,
    enableAutoSessionTracking: true,
    tracesSampleRate: env.isProd ? 0.1 : 1.0,
    enableNative: true,
  });

  initialized = true;
}

export function reportError(err: unknown): void {
  if (!initialized) return;
  if (err instanceof Error) Sentry.captureException(err);
  else Sentry.captureMessage(String(err));
}
