import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { MealTimeAddressSelector } from './MealTimeAddressSelector';
const options = [{ id: 42, name: 'Lunch' }, { id: 91, name: 'Dinner' }];
it('uses the selected catalogue ID rather than a positional ID', () => {
  const onChange = jest.fn();
  render(<MealTimeAddressSelector options={options} selected={[]} acceptedArea disabled={false} onChange={onChange} />);
  fireEvent.press(screen.getByRole('checkbox', { name: 'Usual address for Dinner' }));
  expect(onChange).toHaveBeenCalledWith([91]);
});
it('blocks new assignments outside subscription areas while allowing existing ones to be removed', () => {
  const onChange = jest.fn();
  render(<MealTimeAddressSelector options={options} selected={[42]} acceptedArea={false} disabled={false} onChange={onChange} />);
  expect(screen.getByRole('checkbox', { name: 'Usual address for Dinner' })).toBeDisabled();
  fireEvent.press(screen.getByRole('checkbox', { name: 'Usual address for Lunch' }));
  expect(onChange).toHaveBeenCalledWith([]);
});
it('shows unavailable saved assignments so they can be explicitly cleared', () => {
  const onChange = jest.fn();
  render(<MealTimeAddressSelector options={options} selected={[333]} acceptedArea disabled={false} onChange={onChange} />);
  fireEvent.press(screen.getByRole('checkbox', { name: 'Usual address for Unavailable meal time (#333)' }));
  expect(onChange).toHaveBeenCalledWith([]);
});
