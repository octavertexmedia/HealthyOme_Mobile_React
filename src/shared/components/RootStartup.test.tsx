import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import RootLayout from '../../../app/_layout';

const mockRestoreSession = jest.fn();
const mockRouter = { replace: jest.fn() };
const mockHideSplash = jest.fn().mockResolvedValue(undefined);
jest.mock('../../../global.css', () => ({}));
jest.mock('react-native-gesture-handler', () => ({}));
jest.mock('react-native-reanimated', () => ({}));
jest.mock('expo-router', () => {
  const React = jest.requireActual('react'); const { View } = jest.requireActual('react-native');
  const Stack = ({ children }: { children: React.ReactNode }) => React.createElement(View, { testID: 'ready-navigator' }, children);
  Stack.Screen = function MockStackScreen() { return null; };
  return { Stack, useRouter: () => mockRouter };
});
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: () => Promise.resolve(), hideAsync: () => mockHideSplash() }));
jest.mock('../../features/auth/store/auth.store', () => ({ useAuthStore: (select: (state: unknown) => unknown) => select({ restoreSession: mockRestoreSession, isAuthenticated: false }) }));
jest.mock('../api/client', () => ({ setAuthFailureHandler: jest.fn() }));
jest.mock('../config/env', () => ({ env: { readOnlyPreview: false } }));
jest.mock('../observability/sentry', () => ({ initSentry: jest.fn() }));
jest.mock('../../features/notifications/registerPushToken', () => ({ registerPushToken: () => Promise.resolve(), unregisterPushToken: () => Promise.resolve() }));
jest.mock('../../features/notifications/usePushDeepLink', () => ({ usePushDeepLink: jest.fn() }));
jest.mock('../../features/cart/hooks/useCartSync', () => ({ useCartSync: jest.fn() }));
jest.mock('../../providers/QueryProvider', () => ({ QueryProvider: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('./CustomerShell', () => ({ CustomerShell: ({ children }: { children: React.ReactNode }) => children }));

it('mounts no shell or navigator until auth restoration settles', async () => {
  let resolve!: () => void;
  mockRestoreSession.mockReturnValue(new Promise<void>((done) => { resolve = done; }));
  render(<RootLayout />);
  expect(screen.getByTestId('startup-screen')).toBeTruthy();
  expect(screen.queryByTestId('ready-navigator')).toBeNull();
  expect(mockHideSplash).not.toHaveBeenCalled();
  await act(async () => { resolve(); });
  expect(screen.queryByTestId('startup-screen')).toBeNull();
  expect(screen.getByTestId('ready-navigator')).toBeTruthy();
  expect(mockHideSplash).toHaveBeenCalledTimes(1);
});
it('unblocks native splash into a retry screen on failure instead of rendering navigation', async () => {
  mockRestoreSession.mockRejectedValueOnce(new Error('Secure storage unavailable')).mockResolvedValueOnce(false);
  render(<RootLayout />);
  await act(async () => {});
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.queryByTestId('ready-navigator')).toBeNull();
  expect(mockRestoreSession).toHaveBeenCalledTimes(1);
  expect(mockHideSplash).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByText('Retry startup'));
  await act(async () => {});
  expect(screen.getByTestId('ready-navigator')).toBeTruthy();
});
it('times out a stuck restore without an automatic retry or a navigation flash', async () => {
  jest.useFakeTimers();
  try {
    mockRestoreSession.mockReturnValue(new Promise(() => {}));
    render(<RootLayout />);
    await act(async () => { await jest.advanceTimersByTimeAsync(15000); });
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.queryByTestId('ready-navigator')).toBeNull();
    expect(mockRestoreSession).toHaveBeenCalledTimes(1);
  } finally {
    jest.useRealTimers();
  }
});
