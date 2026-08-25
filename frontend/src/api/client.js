import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
const TOKEN_KEY = 'procurio.accessToken';
const REFRESH_KEY = 'procurio.refreshToken';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: ({ accessToken, refreshToken }) => {
    if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A single in-flight refresh shared by every queued 401.
let refreshing = null;

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const { response, config } = error;

    if (response?.status === 401 && !config._retried && !config.url.includes('/auth/')) {
      config._retried = true;
      try {
        refreshing ||= api
          .post('/auth/refresh', { refreshToken: tokenStore.getRefresh() })
          .finally(() => { refreshing = null; });
        const result = await refreshing;
        tokenStore.set(result.data);
        config.headers.Authorization = `Bearer ${result.data.accessToken}`;
        return api(config);
      } catch {
        tokenStore.clear();
        if (!window.location.pathname.startsWith('/login')) {
          window.location.assign('/login');
        }
      }
    }

    return Promise.reject({
      status: response?.status ?? 0,
      message: response?.data?.message || error.message || 'Network error',
      code: response?.data?.code,
      errors: response?.data?.errors,
    });
  },
);

/** Multipart upload helper — returns the stored attachment descriptors. */
export const uploadFiles = async (bucket, files) => {
  const form = new FormData();
  [...files].forEach((f) => form.append(bucket === 'logo' ? 'file' : 'files', f));
  const result = await api.post(`/uploads/${bucket}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return result.data;
};
