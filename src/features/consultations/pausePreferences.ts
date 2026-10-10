import { isCalendarDate, uniqueDates } from '../../shared/utils/calendarDates';

export const PAUSE_PREFERENCES_NOTICE = 'These dates are preferences shared with your dietician. They do not confirm a rescheduled appointment, extended plan, refund or carried-forward sessions. Contact your dietician to agree any schedule changes.';

export function addConsultationPauseDate(current: string[], input: string, today: string): string[] {
  const date = input.trim();
  if (!isCalendarDate(date)) throw new Error('Enter a valid date as YYYY-MM-DD.');
  if (date < today) throw new Error('Choose today or a future date.');
  return uniqueDates([...current, date]);
}

export function consultationPausePayload(dates: string[]): { pause_dates: string[] } {
  if (dates.some((date) => !isCalendarDate(date))) throw new Error('Remove invalid pause dates before saving.');
  // Existing historical preferences may be kept; [] explicitly clears the preference.
  return { pause_dates: uniqueDates(dates) };
}
