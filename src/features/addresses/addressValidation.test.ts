import {
  approvedPincodes,
  normalizePincode,
  validateAddressDraft,
  type AddressDraft,
} from './addressValidation';
import type { DeliveryArea } from '../delivery-areas/api/deliveryAreas.api';

const area: DeliveryArea = {
  id: 7,
  name: 'Wanawadi',
  description: '',
  is_accepted: true,
  pincodes: ['411040', '411 013', 'invalid'],
};

const draft: AddressDraft = {
  label: 'Home',
  address: '',
  address_line1: 'Flat 402',
  address_line2: 'Green Heights',
  pincode: '411040',
  landmark: 'Near the park',
  contact_number: '+91 98765 43210',
  delivery_area_id: 7,
  default_meal_time_ids: [2, 3],
};

describe('address validation', () => {
  it('normalizes and filters configured pincodes', () => {
    expect(normalizePincode('411 040')).toBe('411040');
    expect(approvedPincodes(area)).toEqual(['411040', '411013']);
  });

  it('builds the backend address contract from structured lines', () => {
    const result = validateAddressDraft(draft, area);
    expect(result).toEqual({
      ok: true,
      payload: {
        label: 'Home',
        address: 'Flat 402, Green Heights',
        address_line1: 'Flat 402',
        address_line2: 'Green Heights',
        pincode: '411040',
        landmark: 'Near the park',
        contact_number: '9876543210',
        delivery_area_id: 7,
        is_default: undefined,
        default_meal_time_ids: [2, 3],
      },
    });
  });

  it('rejects missing delivery areas and unsupported pincodes', () => {
    expect(validateAddressDraft({ ...draft, delivery_area_id: null }, null)).toEqual({
      ok: false,
      message: 'Select an area (delivery zone) we serve.',
    });
    expect(validateAddressDraft({ ...draft, pincode: '411999' }, area)).toEqual({
      ok: false,
      message: 'This pincode is not served by the selected delivery area.',
    });
  });

  it('allows an optional pincode when the area has no configured list', () => {
    const result = validateAddressDraft(
      { ...draft, pincode: '' },
      { ...area, pincodes: [] },
    );
    expect(result.ok).toBe(true);
  });
});
