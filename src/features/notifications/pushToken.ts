export interface NativePushTokenLike {
  type?: string;
  data?: unknown;
}

/**
 * The backend sends through Firebase Admin, so only Android's native FCM token
 * is compatible. Expo tokens and iOS APNs tokens must never be stored in its
 * `fcm_token` field.
 */
export function androidFcmToken(
  platform: string,
  token: NativePushTokenLike | null | undefined
): string | null {
  if (platform !== 'android' || token?.type !== 'android') return null;
  if (typeof token.data !== 'string') return null;

  const value = token.data.trim();
  if (!value) return null;
  if (/^(ExponentPushToken|ExpoPushToken)\[/i.test(value)) return null;
  return value;
}
