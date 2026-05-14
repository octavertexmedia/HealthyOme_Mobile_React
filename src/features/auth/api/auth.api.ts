import apiClient from '../../../shared/api/client';

export interface MobileAuthUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
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

  getProfile: async () => {
    const response = await apiClient.get('/profile/');
    return response.data;
  },

  updateProfile: async (data: { first_name?: string; last_name?: string; email?: string }) => {
    const response = await apiClient.patch('/profile/', data);
    return response.data;
  },
};
