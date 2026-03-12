import axios from 'axios';
import { storage } from '../storage/mmkv';

const API_BASE_URL = 'https://dev.healthyome.com/api/shop';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = storage.getString('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 / token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = storage.getString('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/mobile/refresh/`, {
            refresh: refreshToken,
          });
          const newToken = response.data.access;
          storage.set('auth_token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens
          storage.delete('auth_token');
          storage.delete('refresh_token');
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
export { API_BASE_URL };
