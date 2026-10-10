import type { ServiceAreaWaitlistPayload } from './api/serviceAreaWaitlist.api';

export type WaitlistValidationResult =
  | { ok: true; payload: ServiceAreaWaitlistPayload }
  | { ok: false; message: string };

export function buildWaitlistPayload(input: {
  email: string;
  whatsappPhone: string;
  requestedArea: string;
}): WaitlistValidationResult {
  const email = input.email.trim().toLowerCase();
  const phone = input.whatsappPhone.replace(/\D/g, '').slice(-10);
  const requestedArea = input.requestedArea.trim().slice(0, 200);

  if (!email && !phone) {
    return { ok: false, message: 'Enter an email or WhatsApp number.' };
  }
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    return { ok: false, message: 'Enter a valid email address.' };
  }
  if (input.whatsappPhone.trim() && phone.length !== 10) {
    return { ok: false, message: 'Enter a valid 10-digit WhatsApp number.' };
  }

  return {
    ok: true,
    payload: {
      ...(email ? { email } : {}),
      ...(phone ? { whatsapp_phone: phone } : {}),
      ...(requestedArea ? { requested_area_text: requestedArea } : {}),
      source: 'address_flow',
    },
  };
}
