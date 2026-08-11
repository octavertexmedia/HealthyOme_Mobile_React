import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  functionalTrainingApi,
  type AvailabilityQuery,
  type CreateEnrollmentInput,
} from '../api/functionalTraining.api';

export const functionalTrainingKeys = {
  program: ['functional-training', 'program'] as const,
  trainers: ['functional-training', 'trainers'] as const,
  trainer: (slug: string) =>
    ['functional-training', 'trainer', slug] as const,
  timeSlots: ['functional-training', 'time-slots'] as const,
  availability: (query: AvailabilityQuery) =>
    [
      'functional-training',
      'availability',
      query.trainer_slug ?? '',
      query.from ?? '',
      query.to ?? '',
      query.slot_code ?? '',
    ] as const,
  enrollments: ['functional-training', 'enrollments'] as const,
  enrollment: (id: number) =>
    ['functional-training', 'enrollment', id] as const,
};

export const useProgram = () =>
  useQuery({
    queryKey: functionalTrainingKeys.program,
    queryFn: functionalTrainingApi.getProgram,
    staleTime: 5 * 60 * 1000,
  });

export const useTrainers = () =>
  useQuery({
    queryKey: functionalTrainingKeys.trainers,
    queryFn: functionalTrainingApi.listTrainers,
    staleTime: 5 * 60 * 1000,
  });

export const useTrainer = (slug: string | undefined) =>
  useQuery({
    queryKey: functionalTrainingKeys.trainer(slug ?? ''),
    queryFn: () => functionalTrainingApi.getTrainer(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

export const useTimeSlots = () =>
  useQuery({
    queryKey: functionalTrainingKeys.timeSlots,
    queryFn: functionalTrainingApi.listTimeSlots,
    staleTime: 15 * 60 * 1000,
  });

export const useAvailability = (
  query: AvailabilityQuery,
  enabled = true
) =>
  useQuery({
    queryKey: functionalTrainingKeys.availability(query),
    queryFn: () => functionalTrainingApi.listAvailability(query),
    enabled,
    staleTime: 30 * 1000,
  });

export const useMyEnrollments = (enabled = true) =>
  useQuery({
    queryKey: functionalTrainingKeys.enrollments,
    queryFn: functionalTrainingApi.listEnrollments,
    enabled,
  });

export const useCreateEnrollment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEnrollmentInput) =>
      functionalTrainingApi.createEnrollment(input),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: functionalTrainingKeys.enrollments }),
  });
};
