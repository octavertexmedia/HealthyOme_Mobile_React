import type { HealthProfileInput } from './api/consultations.api';

export interface HealthDraft {
  client_full_name: string;
  age: string;
  height_cm: string;
  weight_kg: string;
  goal: string;
  medical_conditions: string;
}

export function validateHealthDraft(draft: HealthDraft):
  { data: HealthProfileInput; error?: never } | { error: string; data?: never } {
  if (!draft.client_full_name.trim() || !draft.goal.trim()) return { error: 'Enter your full name and goal.' };
  if (draft.client_full_name.trim().length > 200 || draft.goal.trim().length > 64 || draft.medical_conditions.length > 5000) return { error: 'Keep your name, goal and medical notes within the displayed limits.' };
  const age = Number(draft.age);
  if (!/^\d+$/.test(draft.age.trim()) || !Number.isInteger(age) || age < 1 || age > 120) return { error: 'Age must be a whole number between 1 and 120.' };
  const height = Number(draft.height_cm);
  const weight = Number(draft.weight_kg);
  if (!Number.isFinite(height) || !Number.isFinite(weight) || height <= 0 || weight <= 0) return { error: 'Enter positive numbers for height and weight.' };
  if ([draft.height_cm, draft.weight_kg].some((value) => !/^\d{1,4}(\.\d)?$/.test(value.trim()))) return { error: 'Use up to four digits and one decimal place for height and weight.' };
  return { data: {
    client_full_name: draft.client_full_name.trim(), age, height_cm: height, weight_kg: weight,
    goal: draft.goal.trim(), medical_conditions: draft.medical_conditions.trim(),
  } };
}
