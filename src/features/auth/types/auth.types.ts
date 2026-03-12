export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  date_joined?: string;
}

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
