import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SubscriptionDatePicker } from './SubscriptionDatePicker';
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

it('requires an explicit selection and submits only the checked resume dates', () => {
  const onSubmit = jest.fn();
  render(<SubscriptionDatePicker action="resume" dates={['2026-10-12', '2026-10-15']} busy={false} onSubmit={onSubmit} onClose={jest.fn()} />);
  expect(screen.getByRole('button', { name: 'Resume selected dates (0)' })).toBeDisabled();
  fireEvent.press(screen.getByRole('checkbox', { name: '2026-10-15' }));
  fireEvent.press(screen.getByRole('button', { name: 'Resume selected dates (1)' }));
  expect(onSubmit).toHaveBeenCalledWith(['2026-10-15']);
  expect(screen.getByText(/Other paused dates will stay paused/)).toBeTruthy();
});
it('disables stale selections after a refreshed schedule and blocks edits while saving', () => {
  const props = { action: 'pause' as const, busy: false, onSubmit: jest.fn(), onClose: jest.fn() };
  const { rerender } = render(<SubscriptionDatePicker {...props} dates={['2026-10-12']} />);
  fireEvent.press(screen.getByRole('checkbox', { name: '2026-10-12' }));
  rerender(<SubscriptionDatePicker {...props} dates={[]} />);
  expect(screen.getByRole('button', { name: 'Pause selected dates (0)' })).toBeDisabled();
  rerender(<SubscriptionDatePicker {...props} busy dates={['2026-10-12']} />);
  expect(screen.getByRole('checkbox', { name: '2026-10-12' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Updating…' })).toBeDisabled();
});
