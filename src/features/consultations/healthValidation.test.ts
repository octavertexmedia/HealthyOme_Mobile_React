import { validateHealthDraft } from './healthValidation';

const draft = { client_full_name: ' Customer ', age: '30', height_cm: '170.5', weight_kg: '70.2', goal: ' Fitness ', medical_conditions: '' };
it('validates and converts the full consultation health payload', () => {
  expect(validateHealthDraft(draft).data).toEqual({ client_full_name: 'Customer', age: 30, height_cm: 170.5, weight_kg: 70.2, goal: 'Fitness', medical_conditions: '' });
});
it.each([{ age: '0' }, { age: '121' }, { age: '25.5' }, { height_cm: '0' }, { weight_kg: 'Infinity' }, { goal: ' ' }, { client_full_name: '' }])('rejects invalid health details: %s', (change) => {
  expect(validateHealthDraft({ ...draft, ...change }).error).toBeDefined();
});
