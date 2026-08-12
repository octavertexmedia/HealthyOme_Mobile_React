import apiClient from '../../../shared/api/client';
import { env } from '../../../shared/config/env';

/**
 * Functional Training (personal coaching) API — matches the real Django "shop"
 * backend mounted at /api/shop/. Every route lives under /functional-training/*.
 * Field names and request bodies here mirror the backend contract exactly; do
 * not rename them.
 *
 * Ground-truth quirks baked in below (a naive port gets these wrong):
 *  - Trainer identity is the STRING slug returned as the object's `id` field
 *    (id === trainer.slug), NOT a numeric pk. Detail + enroll use that slug.
 *  - GET /trainers/ and GET /enrollments/ return BARE JSON ARRAYS (no
 *    { count, next, previous, results } pagination wrapper).
 *  - GET /time-slots/ and GET /availability/ return { results: [...] } WITHOUT
 *    count/next/previous — a partial wrapper, not DRF pagination.
 *  - Enroll POST body is FLAT snake_case: { trainer_slug, time_slot_code, notes }.
 *    time_slot_code is REQUIRED.
 *  - Catalog endpoints are public; enrollments (GET/POST) require a JWT (the
 *    shared apiClient attaches the bearer token automatically).
 */

// Trainer images come back as root-relative public paths served from the site
// origin — NOT from the /api/shop API base. Strip the API suffix to resolve.
const MEDIA_ORIGIN = env.apiUrl.replace(/\/api\/shop\/?$/, '');

export function resolveMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${MEDIA_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

// ─── Types (exact backend field names) ───────────────────────────────────────

export interface TimeSlot {
  code: string;
  label: string;
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
}

export interface Trainer {
  id: string; // this is the trainer SLUG (trainer.slug), NOT a numeric pk
  name: string;
  specialty: string;
  bio: string;
  image: string; // public path e.g. "/images/trainers/arjun.png"
  monthlyPriceInr: number;
  sessionsPerWeek: string; // e.g. "3–5" (en-dash)
  sessionsPerWeekMin: number;
  sessionsPerWeekMax: number;
  time_slots: TimeSlot[]; // shared active-slot list appended to every trainer
}

export interface AvailabilitySlot {
  id: number;
  date: string; // "YYYY-MM-DD"
  time_slot_code: string;
  time_slot_label: string;
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
}

export type EnrollmentStatus =
  | 'pending'
  | 'active'
  | 'cancelled'
  | 'completed';

export interface Enrollment {
  id: number;
  trainer_slug: string;
  trainer_name: string;
  time_slot_code: string;
  time_slot_label: string;
  status: EnrollmentStatus;
  starts_at: string; // "YYYY-MM-DD"
  ends_at: string; // "YYYY-MM-DD"
  monthly_price_inr: number | null;
  needs_payment: boolean; // true when status === "pending"
  created_at: string; // ISO-8601 datetime
}

export interface CreateEnrollmentInput {
  time_slot_code: string; // REQUIRED
  trainer_slug?: string; // falls back to first active trainer if blank/invalid
  notes?: string;
  starts_at?: string; // "YYYY-MM-DD"; defaults to today server-side
}

export interface AvailabilityQuery {
  trainer_slug?: string;
  from?: string; // "YYYY-MM-DD"
  to?: string; // "YYYY-MM-DD"
  slot_code?: string;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const functionalTrainingApi = {
  // GET /functional-training/program/ -> single Trainer (first active)
  async getProgram(): Promise<Trainer> {
    const { data } = await apiClient.get<Trainer>(
      '/functional-training/program/'
    );
    return data;
  },

  // GET /functional-training/trainers/ -> Trainer[] (no pagination wrapper)
  async listTrainers(): Promise<Trainer[]> {
    const { data } = await apiClient.get<Trainer[]>(
      '/functional-training/trainers/'
    );
    return Array.isArray(data) ? data : [];
  },

  // GET /functional-training/trainers/<slug>/ -> single Trainer
  async getTrainer(slug: string): Promise<Trainer> {
    const { data } = await apiClient.get<Trainer>(
      `/functional-training/trainers/${encodeURIComponent(slug)}/`
    );
    return data;
  },

  // GET /functional-training/time-slots/ -> { results: TimeSlot[] }
  async listTimeSlots(): Promise<TimeSlot[]> {
    const { data } = await apiClient.get<{ results?: TimeSlot[] }>(
      '/functional-training/time-slots/'
    );
    return Array.isArray(data?.results) ? data.results : [];
  },

  // GET /functional-training/availability/ -> { results: AvailabilitySlot[] }
  async listAvailability(
    query: AvailabilityQuery = {}
  ): Promise<AvailabilitySlot[]> {
    const params: Record<string, string> = {};
    if (query.trainer_slug) params.trainer_slug = query.trainer_slug;
    if (query.from) params.from = query.from;
    if (query.to) params.to = query.to;
    if (query.slot_code) params.slot_code = query.slot_code;
    const { data } = await apiClient.get<{ results?: AvailabilitySlot[] }>(
      '/functional-training/availability/',
      { params }
    );
    return Array.isArray(data?.results) ? data.results : [];
  },

  // GET /functional-training/enrollments/ -> Enrollment[] (jwt, no wrapper)
  async listEnrollments(): Promise<Enrollment[]> {
    const { data } = await apiClient.get<Enrollment[]>(
      '/functional-training/enrollments/'
    );
    return Array.isArray(data) ? data : [];
  },

  // POST /functional-training/enrollments/ -> Enrollment (jwt, status=pending)
  async createEnrollment(input: CreateEnrollmentInput): Promise<Enrollment> {
    const { data } = await apiClient.post<Enrollment>(
      '/functional-training/enrollments/',
      input
    );
    return data;
  },

  // GET /functional-training/enrollments/<id>/ -> Enrollment (jwt)
  async getEnrollment(id: number): Promise<Enrollment> {
    const { data } = await apiClient.get<Enrollment>(
      `/functional-training/enrollments/${id}/`
    );
    return data;
  },
};
