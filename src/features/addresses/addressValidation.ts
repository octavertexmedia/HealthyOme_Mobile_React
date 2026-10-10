import type { CreateAddressPayload } from './api/addresses.api';
import type { DeliveryArea } from '../delivery-areas/api/deliveryAreas.api';

export interface AddressDraft extends CreateAddressPayload {
  address_line1: string;
  address_line2: string;
  pincode: string;
}

export type AddressValidationResult =
  | { ok: true; payload: CreateAddressPayload }
  | { ok: false; message: string };

export function normalizePincode(value: string | null | undefined): string {
  return String(value ?? '').replace(/\D/g, '').slice(0, 6);
}

export function normalizePhone(value: string | null | undefined): string {
  return String(value ?? '').replace(/\D/g, '').slice(-10);
}

export function approvedPincodes(area: DeliveryArea | null | undefined): string[] {
  return (area?.pincodes ?? [])
    .map((value) => normalizePincode(String(value)))
    .filter((value) => value.length === 6);
}

export function validateAddressDraft(
  draft: AddressDraft,
  area: DeliveryArea | null | undefined
): AddressValidationResult {
  const line1 = draft.address_line1.trim();
  const line2 = draft.address_line2.trim();
  const pincode = normalizePincode(draft.pincode);
  const phone = normalizePhone(draft.contact_number);
  const allowedPincodes = approvedPincodes(area);

  if (!draft.delivery_area_id || !area || area.id !== draft.delivery_area_id) {
    return { ok: false, message: 'Select an area (delivery zone) we serve.' };
  }
  if (!line1) {
    return { ok: false, message: 'Enter your flat, building or street address.' };
  }
  if (draft.contact_number?.trim() && phone.length !== 10) {
    return { ok: false, message: 'Enter a valid 10-digit contact number.' };
  }
  if (allowedPincodes.length > 0) {
    if (pincode.length !== 6) {
      return { ok: false, message: 'Enter a valid 6-digit pincode for this delivery area.' };
    }
    if (!allowedPincodes.includes(pincode)) {
      return { ok: false, message: 'This pincode is not served by the selected delivery area.' };
    }
  } else if (pincode && pincode.length !== 6) {
    return { ok: false, message: 'Enter a valid 6-digit pincode.' };
  }

  const address = [line1, line2].filter(Boolean).join(', ');
  return {
    ok: true,
    payload: {
      label: draft.label?.trim() || 'Home',
      address,
      address_line1: line1,
      address_line2: line2,
      pincode,
      landmark: draft.landmark?.trim() || '',
      contact_number: phone,
      delivery_area_id: area.id,
      is_default: draft.is_default,
      default_meal_time_ids: draft.default_meal_time_ids ?? [],
    },
  };
}
