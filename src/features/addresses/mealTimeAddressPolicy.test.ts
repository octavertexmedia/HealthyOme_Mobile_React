import { standingMealTimes, validateMealTimeAddressSelection } from './mealTimeAddressPolicy';
import type { DeliveryArea } from '../delivery-areas/api/deliveryAreas.api';
import type { MealTimeRef } from '../subscription/api/subscription.api';

const area: DeliveryArea = { id: 1, name: 'Area', description: '', is_accepted: true, pincodes: ['411040'] };
const options: MealTimeRef[] = [{ id: 42, name: 'Lunch' }, { id: 91, name: 'Dinner' }, { id: 12, name: 'Inactive', is_active: false }, { id: 13, name: 'Quick only', available_for_subscription: false }];
it('uses actual active subscription IDs and removes duplicate assignments', () => {
  expect(standingMealTimes(options).map((item) => item.id)).toEqual([42, 91]);
  expect(validateMealTimeAddressSelection([91, 42, 42], area, options)).toEqual([42, 91]);
});
it('rejects unknown/inactive IDs rather than substituting hard-coded lunch/dinner IDs', () => {
  for (const id of [2, 3, 12, 13, -1, 1.5]) expect(() => validateMealTimeAddressSelection([id], area, options)).toThrow('unavailable');
});
it('fails closed on quick-only/missing areas and unavailable catalogues', () => {
  expect(() => validateMealTimeAddressSelection([42], { ...area, is_accepted: false }, options)).toThrow('subscription delivery area');
  expect(() => validateMealTimeAddressSelection([42], null, options)).toThrow('subscription delivery area');
  expect(() => validateMealTimeAddressSelection([42], area)).toThrow('Load the available');
});
it('allows explicit clearing even without an accepted area or loaded catalogue', () => {
  expect(validateMealTimeAddressSelection([], null)).toEqual([]);
});
