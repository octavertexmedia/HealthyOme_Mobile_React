import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StartDateCalendar, calendarDates } from './StartDateCalendar';
it('lays out month dates accurately without inventing holidays', () => {
  expect(calendarDates(2026, 9).filter(Boolean)).toHaveLength(31);
  expect(calendarDates(2026, 9).slice(0, 4)).toEqual([null, null, null, '2026-10-01']);
});
it('blocks past dates and Sundays, and returns the selected date', () => {
  const select = jest.fn(); render(<StartDateCalendar value="2026-10-12" minimum="2026-10-12" onChange={select} />);
  fireEvent.press(screen.getByLabelText('Choose subscription start date'));
  expect(screen.getByLabelText('2026-10-10')).toBeDisabled(); expect(screen.getByLabelText('2026-10-18')).toBeDisabled();
  fireEvent.press(screen.getByLabelText('2026-10-13')); expect(select).toHaveBeenCalledWith('2026-10-13');
});
