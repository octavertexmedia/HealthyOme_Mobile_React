/**
 * Sentry init for React Native.
 *
 * Gated on EXPO_PUBLIC_SENTRY_DSN. If unset or @sentry/react-native is not
 * installed, this is a no-op. Production builds set the env var via EAS.
 *
 * Install:
 *   npm i @sentry/react-native
 *   npx expo prebuild --clean        # native config plugin requires it
 *
 * Then call initSentry() once at the top of app/_layout.tsx.
 */
import { env } from '../config/env';

let initialized = false;

export function initSentry(): void {
  if (initialized) return;

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';
  if (!dsn) return;

  let Sentry: any;
  try {
    Sentry = require('@sentry/react-native');
  } catch {
    return; // SDK not installed yet — safe no-op
  }

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
  let Sentry: any;
  try {
    Sentry = require('@sentry/react-native');
  } catch {
    return;
  }
  if (err instanceof Error) Sentry.captureException(err);
  else Sentry.captureMessage(String(err));
}
