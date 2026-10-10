import { androidFcmToken } from './pushToken';

describe('androidFcmToken', () => {
  it('accepts a non-empty native Android token', () => {
    expect(androidFcmToken('android', { type: 'android', data: ' fcm-token:abc ' })).toBe(
      'fcm-token:abc'
    );
  });

  it('rejects APNs and non-Android platform tokens', () => {
    expect(androidFcmToken('ios', { type: 'ios', data: 'apns-token' })).toBeNull();
    expect(androidFcmToken('android', { type: 'ios', data: 'apns-token' })).toBeNull();
  });

  it('rejects Expo push tokens and malformed data', () => {
    expect(
      androidFcmToken('android', {
        type: 'android',
        data: 'ExponentPushToken[project-token]',
      })
    ).toBeNull();
    expect(androidFcmToken('android', { type: 'android', data: '' })).toBeNull();
    expect(androidFcmToken('android', { type: 'android', data: 123 })).toBeNull();
  });
});
