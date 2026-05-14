import apiClient from '../../../shared/api/client';

export interface Dietician {
  id: number;
  name: string;
  photo: string;
  specialty: string;
  bio: string;
  languages: string[];
  fee: number;
  rating: number;
  slot_minutes: number;
  daily_start_hour: number;
  daily_end_hour: number;
}

export interface ConsultationSlot {
  scheduled_at: string; // ISO-8601
  available: boolean;
}

export interface SlotsResponse {
  dietician_id: number;
  date: string;
  slot_minutes: number;
  slots: ConsultationSlot[];
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';
export type BookingPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Booking {
  id: number;
  dietician_id: number;
  dietician_name: string;
  scheduled_at: string;
  duration_minutes: number;
  phone: string;
  notes: string;
  status: BookingStatus;
  fee: number;
  payment_status: BookingPaymentStatus;
  payment_ref_id: string;
  paid_at: string | null;
  created_at: string;
}

export const consultationsApi = {
  async listDieticians(): Promise<Dietician[]> {
    const { data } = await apiClient.get<Dietician[]>('/consultations/dieticians/');
    return Array.isArray(data) ? data : [];
  },

  async listSlots(dieticianId: number, date: string): Promise<SlotsResponse> {
    const { data } = await apiClient.get<SlotsResponse>('/consultations/slots/', {
      params: { dietician_id: dieticianId, date },
    });
    return data;
  },

  async book(params: {
    dietician_id: number;
    scheduled_at: string;
    phone: string;
    notes?: string;
  }): Promise<Booking> {
    const { data } = await apiClient.post<Booking>('/consultations/book/', params);
    return data;
  },

  async myBookings(): Promise<Booking[]> {
    const { data } = await apiClient.get<Booking[]>('/consultations/my/');
    return Array.isArray(data) ? data : [];
  },

  async cancel(id: number): Promise<{ success: boolean }> {
    const { data } = await apiClient.post(`/consultations/my/${id}/cancel/`);
    return data;
  },
};
