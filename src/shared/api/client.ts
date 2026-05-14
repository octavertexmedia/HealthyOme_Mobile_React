import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { env } from '../config/env';
import { tokenStore } from '../storage/tokens';

const API_BASE_URL = env.apiUrl;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await tokenStore.getAccess();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;
let onAuthFailure: (() => void) | null = null;

export function setAuthFailureHandler(fn: () => void) {
  onAuthFailure = fn;
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = await tokenStore.getRefresh();
  if (!refresh) return null;
  try {
    const res = await axios.post(
      `${API_BASE_URL}/auth/mobile/refresh/`,
      { refresh },
      { timeout: 15000 }
    );
    const newAccess: string | undefined = res.data?.access;
    const newRefresh: string | undefined = res.data?.refresh;
    if (!newAccess) return null;
    if (newRefresh) {
      await tokenStore.setPair(newAccess, newRefresh);
    } else {
      await tokenStore.setAccess(newAccess);
    }
    return newAccess;
  } catch {
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (!original || status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;

    if (!newToken) {
      await tokenStore.clear();
      onAuthFailure?.();
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${newToken}`;
    return apiClient(original as AxiosRequestConfig);
  }
);

export default apiClient;
export { API_BASE_URL };
