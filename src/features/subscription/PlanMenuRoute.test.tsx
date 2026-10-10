import React from 'react';
import { render } from '@testing-library/react-native';
import PlanMenu from './PlanMenu';
const mockDetails = jest.fn();
const mockRouter = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => mockRouter() }));
jest.mock('./PlanDetails', () => function Details(props: unknown) { mockDetails(props); return null; });
it('opens the same plan sheet for saved links without a route-changing dismissal callback', () => {
  render(<PlanMenu />);
  expect(mockDetails).toHaveBeenCalledWith({ menuInitiallyOpen: true });
  expect(mockRouter).not.toHaveBeenCalled();
});
