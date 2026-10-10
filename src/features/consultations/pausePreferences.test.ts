import { addConsultationPauseDate, consultationPausePayload, PAUSE_PREFERENCES_NOTICE } from './pausePreferences';
it('validates calendar dates without accepting rollover or new past dates', () => {
  for (const date of ['2026-02-30', '2026-2-03', 'bad', '2026-10-09']) expect(() => addConsultationPauseDate([], date, '2026-10-10')).toThrow();
  expect(addConsultationPauseDate([], '2028-02-29', '2026-10-10')).toEqual(['2028-02-29']);
});
it('deduplicates dates and preserves existing historical preferences', () => {
  expect(addConsultationPauseDate(['2026-09-01', '2026-10-12'], '2026-10-12', '2026-10-10')).toEqual(['2026-09-01', '2026-10-12']);
  expect(consultationPausePayload(['2026-10-12', '2026-09-01'])).toEqual({ pause_dates: ['2026-09-01', '2026-10-12'] });
});
it('supports explicit clearing and rejects invalid persisted dates', () => {
  expect(consultationPausePayload([])).toEqual({ pause_dates: [] });
  expect(() => consultationPausePayload(['2026-04-31'])).toThrow('invalid');
});
it('labels these as preferences without promising operational schedule changes', () => {
  expect(PAUSE_PREFERENCES_NOTICE).toContain('They do not confirm a rescheduled appointment, extended plan, refund or carried-forward sessions.');
});
