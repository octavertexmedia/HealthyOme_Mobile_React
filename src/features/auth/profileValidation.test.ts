import { profileDraft, profileUpdateFromDraft } from './profileValidation';

const user = { id: 1, username: 'customer', first_name: 'First', last_name: 'Last', email: 'customer@example.com' };

describe('profile form validation', () => {
  it('normalizes values and preserves optional clearing without writing the phone number', () => {
    const result = profileUpdateFromDraft({ ...profileDraft(user), first_name: ' First ', email: 'Customer@Example.COM ', age: '', weight_kg: '', allergies: ' peanuts ' });
    expect(result.data).toMatchObject({ first_name: 'First', email: 'customer@example.com', age: null, weight_kg: null, allergies: 'peanuts', date_of_birth: null });
    expect(result.data).not.toHaveProperty('phone_number');
  });
  it.each(['2024-02-30', '2023-02-29', '2100-01-01', 'not a date'])('rejects invalid or future birth date %s', (date_of_birth) => {
    expect(profileUpdateFromDraft({ ...profileDraft(user), date_of_birth }).error).toBeDefined();
  });
  it('accepts a valid leap day', () => {
    expect(profileUpdateFromDraft({ ...profileDraft(user), date_of_birth: '2024-02-29' }).data?.date_of_birth).toBe('2024-02-29');
  });
  it.each(['0', '121', '2.5', 'NaN'])('rejects invalid age %s', (age) => {
    expect(profileUpdateFromDraft({ ...profileDraft(user), age }).error).toBeDefined();
  });
  it('rejects malformed email and nonfinite weight', () => {
    expect(profileUpdateFromDraft({ ...profileDraft(user), email: 'invalid' }).error).toBeDefined();
    expect(profileUpdateFromDraft({ ...profileDraft(user), weight_kg: 'Infinity' }).error).toBeDefined();
  });
});
