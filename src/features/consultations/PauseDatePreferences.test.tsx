import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PauseDatePreferences } from './PauseDatePreferences';
it('does not add malformed dates and shows an actionable error', () => {
  const onChange = jest.fn();
  render(<PauseDatePreferences dates={[]} disabled={false} onChange={onChange} />);
  fireEvent.changeText(screen.getByLabelText('Pause preference date'), '2099-02-30');
  fireEvent.press(screen.getByRole('button', { name: 'Add date to preferences' }));
  expect(onChange).not.toHaveBeenCalled();
  expect(screen.getByText('Enter a valid date as YYYY-MM-DD.')).toBeTruthy();
});
it('allows explicit removal and explains that preferences do not reschedule appointments', () => {
  const onChange = jest.fn();
  render(<PauseDatePreferences dates={['2026-10-15']} disabled={false} onChange={onChange} />);
  fireEvent.press(screen.getByRole('button', { name: 'Remove pause preference 2026-10-15' }));
  expect(onChange).toHaveBeenCalledWith([]);
  expect(screen.getByText(/They do not confirm a rescheduled appointment/)).toBeTruthy();
});
