export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  date_joined?: string;
  gender?: '' | 'male' | 'female' | 'other' | 'prefer_not_to_say';
  date_of_birth?: string | null;
  age?: number | null;
  weight_kg?: number | null;
  bio?: string;
  goal?: string;
  allergies?: string;
  lifestyle?: string;
  remarks?: string;
  notify_offers_promotions?: boolean;
  notify_reward_updates?: boolean;
  notify_push?: boolean;
  notify_whatsapp?: boolean;
}

export type NotificationPreferenceKey =
  | 'notify_offers_promotions'
  | 'notify_reward_updates'
  | 'notify_push'
  | 'notify_whatsapp';

export type ProfileUpdate = Partial<Pick<User,
  'first_name' | 'last_name' | 'email' | 'gender' | 'date_of_birth' | 'age' |
  'weight_kg' | 'bio' | 'goal' | 'allergies' | 'lifestyle' | 'remarks' |
  NotificationPreferenceKey
>>;

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  refreshToken: string | null;
}

export interface OTPSendResponse {
  success: boolean;
  message: string;
  session_id?: string;
}

export interface OTPVerifyResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  refresh_token?: string;
}
