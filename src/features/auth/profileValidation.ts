import type { ProfileUpdate, User } from './types/auth.types';

export interface ProfileDraft {
  first_name: string;
  last_name: string;
  email: string;
  gender: NonNullable<User['gender']>;
  date_of_birth: string;
  age: string;
  weight_kg: string;
  bio: string;
  goal: string;
  allergies: string;
  lifestyle: string;
  remarks: string;
}

export function profileDraft(user: User): ProfileDraft {
  return {
    first_name: user.first_name, last_name: user.last_name, email: user.email,
    gender: user.gender ?? '', date_of_birth: user.date_of_birth ?? '',
    age: user.age == null ? '' : String(user.age),
    weight_kg: user.weight_kg == null ? '' : String(user.weight_kg),
    bio: user.bio ?? '', goal: user.goal ?? '', allergies: user.allergies ?? '',
    lifestyle: user.lifestyle ?? '', remarks: user.remarks ?? '',
  };
}

export function profileUpdateFromDraft(draft: ProfileDraft):
  { data: ProfileUpdate; error?: never } | { error: string; data?: never } {
  const email = draft.email.trim().toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Enter a valid email address.' };
  const age = draft.age.trim() ? Number(draft.age) : null;
  if (age !== null && (!/^\d+$/.test(draft.age.trim()) || !Number.isInteger(age) || age < 1 || age > 120)) {
    return { error: 'Age must be a whole number between 1 and 120.' };
  }
  const weight = draft.weight_kg.trim() ? Number(draft.weight_kg) : null;
  if (weight !== null && (!Number.isFinite(weight) || weight <= 0)) return { error: 'Weight must be a positive number in kilograms.' };
  const birthDate = draft.date_of_birth.trim();
  if (birthDate) {
    const parsed = new Date(`${birthDate}T00:00:00`);
    const [year, month, day] = birthDate.split('-').map(Number);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || Number.isNaN(parsed.getTime()) ||
      parsed.getFullYear() !== year || parsed.getMonth() + 1 !== month || parsed.getDate() !== day || parsed > new Date()) {
      return { error: 'Enter a valid date of birth as YYYY-MM-DD, no later than today.' };
    }
  }
  return { data: {
    first_name: draft.first_name.trim(), last_name: draft.last_name.trim(),
    // The backend does not support clearing an account email through this route.
    ...(email ? { email } : {}),
    gender: draft.gender, date_of_birth: birthDate || null, age, weight_kg: weight,
    bio: draft.bio.trim(), goal: draft.goal.trim(), allergies: draft.allergies.trim(),
    lifestyle: draft.lifestyle.trim(), remarks: draft.remarks.trim(),
  } };
}
