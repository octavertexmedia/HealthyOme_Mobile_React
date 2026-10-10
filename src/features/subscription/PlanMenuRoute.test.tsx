import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import PlanMenu from './PlanMenu';
const mockBack = jest.fn(); const mockReplace = jest.fn(); let mockCanGoBack = false;
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ slug: 'sample' }), useRouter: () => ({ back: mockBack, replace: mockReplace, canGoBack: () => mockCanGoBack }) }));
jest.mock('./PlanDetails', () => {
  const { Button } = jest.requireActual('react-native');
  return function Details({ menuInitiallyOpen, onMenuDismiss }: { menuInitiallyOpen: boolean; onMenuDismiss: () => void }) {
    return menuInitiallyOpen ? <Button title="Dismiss compatibility menu" onPress={onMenuDismiss} /> : null;
  };
});
it('opens the shared sheet for old links and replaces with its plan when there is no history', () => {
  mockCanGoBack = false; render(<PlanMenu />); fireEvent.press(screen.getByText('Dismiss compatibility menu'));
  expect(mockReplace).toHaveBeenCalledWith({ pathname: '/subscription/plans/[slug]', params: { slug: 'sample' } });
});
it('returns to the previous screen when a legacy menu link has history', () => {
  mockCanGoBack = true; render(<PlanMenu />); fireEvent.press(screen.getByText('Dismiss compatibility menu'));
  expect(mockBack).toHaveBeenCalledTimes(1); expect(mockReplace).not.toHaveBeenCalled();
});
