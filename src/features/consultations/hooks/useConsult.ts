import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  consultationsApi,
  type CreateBookingInput,
  type HealthProfileInput,
} from '../api/consultations.api';
import { useAuthStore } from '../../auth/store/auth.store';

export const consultKeys = {
  dieticians: ['consult', 'dieticians'] as const,
  dietician: (slug: string) => ['consult', 'dietician', slug] as const,
  availability: (slug: string, from: string, to: string) =>
    ['consult', 'availability', slug, from, to] as const,
  plans: ['consult', 'plans'] as const,
  bookings: ['consult', 'bookings'] as const,
  booking: (id: number) => ['consult', 'booking', id] as const,
  mealPlan: (id: number) => ['consult', 'meal-plan', id] as const,
};

export const useDieticians = () =>
  useQuery({
    queryKey: consultKeys.dieticians,
    queryFn: consultationsApi.listDieticians,
    staleTime: 5 * 60 * 1000,
  });

export const useDietician = (slug: string | undefined) =>
  useQuery({
    queryKey: consultKeys.dietician(slug ?? ''),
    queryFn: () => consultationsApi.getDietician(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

export const useConsultPlans = () =>
  useQuery({
    queryKey: consultKeys.plans,
    queryFn: consultationsApi.listPlans,
    staleTime: 15 * 60 * 1000,
  });

export const useAvailability = (
  slug: string | undefined,
  from: string,
  to: string
) =>
  useQuery({
    queryKey: consultKeys.availability(slug ?? '', from, to),
    queryFn: () => consultationsApi.listAvailability(slug!, from, to),
    enabled: !!slug,
    staleTime: 30 * 1000,
  });

export const useMyBookings = () => {
  // GET /consult/bookings/ is JWT-required — only fire when authenticated so
  // signed-out users don't trigger a guaranteed 401.
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: consultKeys.bookings,
    queryFn: consultationsApi.listBookings,
    enabled: isAuthenticated,
  });
};

export const useBookingMealPlan = (id: number | undefined) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: consultKeys.mealPlan(id ?? 0),
    queryFn: () => consultationsApi.getBookingMealPlan(id!),
    enabled: isAuthenticated && !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateBooking = () =>
  useMutation({
    mutationFn: (input: CreateBookingInput) =>
      consultationsApi.createBooking(input),
  });

export const useCancelBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => consultationsApi.cancelBooking(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: consultKeys.bookings }),
  });
};

export const useSaveBookingHealth = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: number; profile: HealthProfileInput }) =>
      consultationsApi.saveBookingHealth(params.id, params.profile),
    onSuccess: () => qc.invalidateQueries({ queryKey: consultKeys.bookings }),
  });
};

export const useReviewBooking = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: number; rating: number; comment?: string }) =>
      consultationsApi.reviewBooking(params.id, {
        rating: params.rating,
        comment: params.comment,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: consultKeys.bookings }),
  });
};
