import apiClient from '../../../shared/api/client';
import { env } from '../../../shared/config/env';

/**
 * Consult (dietician consultations) API — matches the real Django "shop"
 * backend mounted at /api/shop/. Every route lives under /consult/* (there is
 * NO /consultations/* namespace on the server). Field names and request bodies
 * here mirror the backend contract exactly; do not rename them.
 */

// Dietician/meal images come back as root-relative public paths
// (e.g. "/images/dieticians/priya.png"), served from the site origin — NOT
// from the /api/shop API base. Strip the API suffix to resolve them.
const MEDIA_ORIGIN = env.apiUrl.replace(/\/api\/shop\/?$/, '');

export function resolveMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${MEDIA_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

// ─── Types (exact backend field names) ───────────────────────────────────────

export interface DieticianReview {
  id: number;
  rating: number;
  comment: string;
  reviewerName: string;
  createdAt: string; // ISO
}

export interface Dietician {
  id: string; // this is the slug, NOT a numeric pk
  name: string;
  specialty: string;
  rating: number;
  experience: string; // e.g. "10+ Year Exp"
  happyUsers: string; // e.g. "+200 Happy User"
  image: string; // public path e.g. "/images/dieticians/priya.png"
  bio: string;
  servicesDescription: string;
  sessionFeeInr: number;
  dietPlanFeeInr: number;
}

export interface DieticianDetail extends Dietician {
  reviews: DieticianReview[];
  reviewCount: number;
}

export interface AvailabilitySlot {
  id: number;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
}

export type ConsultPlanCategory = 'diet' | 'session';

export interface ConsultPlan {
  code: string;
  title: string;
  durationWeeks: number;
  price: number; // INR rupees (not paise)
  category: ConsultPlanCategory | string;
  recommended: boolean;
  features: string[];
  discountLabel?: string;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Booking {
  id: number;
  dietician_id: string; // the dietician's SLUG or "" — NOT numeric
  dietician_name: string;
  plan_code: string;
  slot_start: string; // ISO datetime
  notes: string;
  whatsapp_updates: boolean;
  remind_before_end: boolean;
  pause_dates: string[];
  status: BookingStatus;
  client_full_name: string;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal: string;
  medical_conditions: string;
  health_complete: boolean;
  needs_payment: boolean;
  created_at: string; // ISO
}

export interface MealPlanMeal {
  id: number;
  name: string;
  price: number | null;
  calories: number | null;
  image: string;
}

export interface MealPlanSuggestion {
  goal: string;
  notes: string;
  dieticianName: string;
  meals: MealPlanMeal[];
  updatedAt: string; // ISO
}

export interface CreateBookingInput {
  dietician_slug: string;
  dietician_name?: string;
  plan_code: string;
  slot_start: string; // ISO
  notes?: string;
}

export interface HealthProfileInput {
  client_full_name: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  goal: string;
  medical_conditions?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build the ISO `slot_start` the backend expects from an availability slot
 * (which exposes date + startTime separately). The server accepts a local
 * ISO string (no trailing "Z" required).
 */
export function slotStartISO(slot: AvailabilitySlot): string {
  return `${slot.date}T${slot.startTime}:00`;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const consultationsApi = {
  // GET /consult/dieticians/ -> Dietician[] (no pagination wrapper)
  async listDieticians(): Promise<Dietician[]> {
    const { data } = await apiClient.get<Dietician[]>('/consult/dieticians/');
    return Array.isArray(data) ? data : [];
  },

  // GET /consult/dieticians/<slug>/ -> DieticianDetail
  async getDietician(slug: string): Promise<DieticianDetail> {
    const { data } = await apiClient.get<DieticianDetail>(
      `/consult/dieticians/${encodeURIComponent(slug)}/`
    );
    return data;
  },

  // GET /consult/dieticians/<slug>/availability/?from=&to= -> { results: [...] }
  async listAvailability(
    slug: string,
    from?: string,
    to?: string
  ): Promise<AvailabilitySlot[]> {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const { data } = await apiClient.get<{ results?: AvailabilitySlot[] }>(
      `/consult/dieticians/${encodeURIComponent(slug)}/availability/`,
      { params }
    );
    return Array.isArray(data?.results) ? data.results : [];
  },

  // GET /consult/plans/ -> ConsultPlan[] (no pagination wrapper)
  async listPlans(): Promise<ConsultPlan[]> {
    const { data } = await apiClient.get<ConsultPlan[]>('/consult/plans/');
    return Array.isArray(data) ? data : [];
  },

  // GET /consult/bookings/ -> Booking[] (current user, no pagination wrapper)
  async listBookings(): Promise<Booking[]> {
    const { data } = await apiClient.get<Booking[]>('/consult/bookings/');
    return Array.isArray(data) ? data : [];
  },

  // POST /consult/bookings/ -> Booking (created status=pending, unpaid)
  async createBooking(input: CreateBookingInput): Promise<Booking> {
    const { data } = await apiClient.post<Booking>('/consult/bookings/', input);
    return data;
  },

  // GET /consult/bookings/<id>/ -> Booking
  async getBooking(id: number): Promise<Booking> {
    const { data } = await apiClient.get<Booking>(`/consult/bookings/${id}/`);
    return data;
  },

  // PATCH /consult/bookings/<id>/ -> Booking (partial update)
  async patchBooking(
    id: number,
    body: Partial<{
      status: 'cancelled';
      notes: string;
      whatsapp_updates: boolean;
      remind_before_end: boolean;
      pause_dates: string[];
      client_full_name: string;
      age: number;
      height_cm: number;
      weight_kg: number;
      goal: string;
      medical_conditions: string;
    }>
  ): Promise<Booking> {
    const { data } = await apiClient.patch<Booking>(
      `/consult/bookings/${id}/`,
      body
    );
    return data;
  },

  // Cancellation is a PATCH with { status: "cancelled" } — there is NO POST cancel.
  async cancelBooking(id: number): Promise<Booking> {
    return this.patchBooking(id, { status: 'cancelled' });
  },

  // Saving the health profile is also a PATCH on the booking.
  async saveBookingHealth(
    id: number,
    profile: HealthProfileInput
  ): Promise<Booking> {
    return this.patchBooking(id, {
      client_full_name: profile.client_full_name,
      age: profile.age,
      height_cm: profile.height_cm,
      weight_kg: profile.weight_kg,
      goal: profile.goal,
      medical_conditions: profile.medical_conditions ?? '',
    });
  },

  // POST /consult/bookings/<id>/review/ -> { success, id, rating }
  async reviewBooking(
    id: number,
    body: { rating: number; comment?: string }
  ): Promise<{ success: boolean; id: number; rating: number }> {
    const { data } = await apiClient.post<{
      success: boolean;
      id: number;
      rating: number;
    }>(`/consult/bookings/${id}/review/`, body);
    return data;
  },

  // GET /consult/bookings/<id>/meal-plan/ -> { suggestion: ... | null }
  async getBookingMealPlan(
    id: number
  ): Promise<MealPlanSuggestion | null> {
    const { data } = await apiClient.get<{ suggestion: MealPlanSuggestion | null }>(
      `/consult/bookings/${id}/meal-plan/`
    );
    return data?.suggestion ?? null;
  },
};
