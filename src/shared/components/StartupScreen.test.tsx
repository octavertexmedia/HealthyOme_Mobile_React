import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { StartupScreen } from './StartupScreen';
import SplashRoute from '../../../app/index';
import { storage } from '../storage/mmkv';

const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
jest.mock('../storage/mmkv', () => ({ storage: { getString: jest.fn() } }));

it('shows only one original, undistorted brand mark while starting', () => {
  render(<StartupScreen />);
  expect(screen.getAllByLabelText('HealthyOme')).toHaveLength(1);
  expect(screen.getByLabelText('HealthyOme').props.resizeMode).toBe('contain');
  expect(screen.getByLabelText('HealthyOme').props.source).toEqual(require('../../../assets/images/branding/healthyome-logo.png'));
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.queryByRole('tablist')).toBeNull();
});
it.each([['true', '/(tabs)'], [null, '/onboarding']])('resolves onboarding %s without an artificial splash delay', async (stored, destination) => {
  (storage.getString as jest.Mock).mockResolvedValue(stored);
  render(<SplashRoute />);
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(destination));
});
it('keeps failed onboarding reads out of Home and retries only when asked', async () => {
  (storage.getString as jest.Mock).mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValueOnce('true');
  render(<SplashRoute />);
  await screen.findByText('Could not finish starting the app. Please try again.');
  expect(mockReplace).not.toHaveBeenCalled();
  expect(storage.getString).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByText('Retry startup'));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)'));
});
it('does not redirect after the splash has unmounted for a deep link', async () => {
  let resolve!: (value: string) => void;
  (storage.getString as jest.Mock).mockReturnValue(new Promise<string>((done) => { resolve = done; }));
  const view = render(<SplashRoute />);
  await act(async () => {});
  view.unmount();
  await act(async () => { resolve('true'); });
  expect(mockReplace).not.toHaveBeenCalled();
});
