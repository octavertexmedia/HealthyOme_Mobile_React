import { buildWaitlistPayload } from './serviceAreaWaitlistValidation';

describe('service-area waitlist validation', () => {
  it('requires at least one contact channel', () => {
    expect(buildWaitlistPayload({ email: '', whatsappPhone: '', requestedArea: 'Camp' })).toEqual({
      ok: false,
      message: 'Enter an email or WhatsApp number.',
    });
  });

  it('normalizes a user-initiated waitlist request', () => {
    expect(
      buildWaitlistPayload({
        email: ' PERSON@Example.COM ',
        whatsappPhone: '+91 98765 43210',
        requestedArea: '  Undri  ',
      }),
    ).toEqual({
      ok: true,
      payload: {
        email: 'person@example.com',
        whatsapp_phone: '9876543210',
        requested_area_text: 'Undri',
        source: 'address_flow',
      },
    });
  });

  it('rejects malformed optional contacts', () => {
    expect(buildWaitlistPayload({ email: 'bad', whatsappPhone: '', requestedArea: '' }).ok).toBe(false);
    expect(buildWaitlistPayload({ email: '', whatsappPhone: '123', requestedArea: '' }).ok).toBe(false);
  });
});
