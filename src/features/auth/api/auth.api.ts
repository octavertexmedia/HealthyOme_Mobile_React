import apiClient from '../../../shared/api/client';
import type { ProfileUpdate, User } from '../types/auth.types';

export interface MobileAuthUser extends User {
  is_new_user?: boolean;
}

export interface MobileAuthResponse {
  success: boolean;
  user: MobileAuthUser;
  tokens: { access: string; refresh: string };
  is_new_user?: boolean;
}

export const authApi = {
  sendOTP: async (phone: string) => {
    const response = await apiClient.post('/auth/otp/send/', { phone_number: phone });
    return response.data;
  },

  verifyOTP: async (phone: string, otp: string): Promise<MobileAuthResponse> => {
    const response = await apiClient.post('/auth/mobile/otp/verify/', { phone_number: phone, otp_code: otp });
    return response.data;
  },

  resendOTP: async (phone: string) => {
    const response = await apiClient.post('/auth/otp/resend/', { phone_number: phone });
    return response.data;
  },

  sendEmailOTP: async (email: string) => {
    const response = await apiClient.post('/auth/email-otp/send/', { email });
    return response.data;
  },

  verifyEmailOTP: async (email: string, otp: string): Promise<MobileAuthResponse> => {
    const response = await apiClient.post('/auth/mobile/email-otp/verify/', { email, otp_code: otp });
    return response.data;
  },

  resendEmailOTP: async (email: string) => {
    const response = await apiClient.post('/auth/email-otp/resend/', { email });
    return response.data;
  },

  checkAuthStatus: async () => {
    const response = await apiClient.get('/auth/status/');
    return response.data;
  },

  logout: async (refresh: string) => {
    const response = await apiClient.post('/auth/mobile/logout/', { refresh });
    return response.data;
  },

  getProfile: async (): Promise<MobileAuthUser> => {
    const response = await apiClient.get<MobileAuthUser>('/profile/');
    return response.data;
  },

  updateProfile: async (data: ProfileUpdate): Promise<User> => {
    const response = await apiClient.patch<{ success: boolean; user: User }>('/profile/', data);
    if (!response.data.success || !response.data.user?.id) {
      throw new Error('The profile update was not confirmed. Please try again.');
    }
    return response.data.user;
  },
};
