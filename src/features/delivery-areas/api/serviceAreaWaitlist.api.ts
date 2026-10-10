import apiClient from '../../../shared/api/client';

export interface ServiceAreaWaitlistPayload {
  email?: string;
  whatsapp_phone?: string;
  requested_area_text?: string;
  source: 'address_flow';
}

export interface ServiceAreaWaitlistResponse {
  ok: boolean;
}

export const serviceAreaWaitlistApi = {
  async join(payload: ServiceAreaWaitlistPayload): Promise<ServiceAreaWaitlistResponse> {
    const { data } = await apiClient.post<ServiceAreaWaitlistResponse>(
      '/service-area-waitlist/',
      payload,
    );
    return data;
  },
};
