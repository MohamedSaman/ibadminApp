import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';
import { BASE_URL, ENDPOINTS } from '../constants/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log all requests (useful for debugging)
api.interceptors.request.use(
  async (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // ignore storage errors
    }
    return config;
  },
  (error) => {
    console.log('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Log all responses
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status}:`, response.data);
    return response;
  },
  async (error: AxiosError) => {
    console.log('[API] Response error:', error.message, error.response?.data);
    
    // Auto-refresh token on 401
    const originalRequest = error.config as any;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const res = await axios.post(`${BASE_URL}${ENDPOINTS.refresh}`, { refresh: refreshToken });
          const newAccess = res.data.access;
          await AsyncStorage.setItem('accessToken', newAccess);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear tokens
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper to format user-friendly error messages
export function getErrorMessage(error: any): string {
  if (axios.isAxiosError(error)) {
    // Network error (no response from server)
    if (!error.response) {
      return `Cannot connect to server. Check that:\n• Django is running on ${BASE_URL}\n• Your phone and PC are on the same Wi-Fi\n• Firewall allows port 8000`;
    }
    // Server responded with error
    const data = error.response.data;
    if (data?.detail) return data.detail;
    if (data?.non_field_errors) return data.non_field_errors.join(', ');

    // Collect ALL field-level errors (not just email/password)
    if (typeof data === 'object' && data !== null) {
      const fieldErrors: string[] = [];
      for (const [field, messages] of Object.entries(data)) {
        if (Array.isArray(messages)) {
          fieldErrors.push(`${field}: ${messages.join(', ')}`);
        } else if (typeof messages === 'string') {
          fieldErrors.push(`${field}: ${messages}`);
        }
      }
      if (fieldErrors.length > 0) return fieldErrors.join('\n');
    }

    if (typeof data === 'string') return data;
    return `Server error (${error.response.status})`;
  }
  return error?.message || 'An unexpected error occurred';
}

export async function loginRequest(email: string, password: string) {
  // Prefer explicit auth/login endpoint if backend exposes it, otherwise fall back to token endpoint
  const loginEndpoint = ENDPOINTS.login || ENDPOINTS.token;
  const res = await api.post(loginEndpoint, { email, password });
  const { access, refresh } = res.data;
  await AsyncStorage.setItem('accessToken', access);
  await AsyncStorage.setItem('refreshToken', refresh);
  return res.data;
}

// Quick connectivity check — returns the raw response if server reachable
export async function ping() {
  // GET root path; change to a lightweight health endpoint if available
  return api.get('');
}

// Verbose ping that returns diagnostics instead of throwing, useful for in-app testing
export async function pingVerbose() {
  const attemptedUrl = api.defaults.baseURL + '';
  try {
    const res = await api.get('');
    return { ok: true, url: attemptedUrl, status: res.status, data: res.data };
  } catch (err: any) {
    return {
      ok: false,
      url: attemptedUrl,
      message: err?.message || String(err),
      status: err?.response?.status,
      responseData: err?.response?.data,
    };
  }
}

export async function signupRequest(payload: any) {
  // Some backends use 'auth/signup/' and others use 'auth/register/'.
  // Try configured endpoint first, then fall back to common alternative.
  const candidates = [] as string[];
  if (ENDPOINTS.signup) candidates.push(ENDPOINTS.signup);
  // include a common alternative in case backend uses different path
  candidates.push('auth/register/');

  let lastError: any = null;
  for (const ep of candidates) {
    try {
      console.log('[API] Trying signup endpoint:', ep);
      const res = await api.post(ep, payload);
      console.log('[API] Signup success:', res.data);
      return res.data;
    } catch (err: any) {
      console.log('[API] Signup attempt failed for', ep, err?.message || err);
      lastError = err;
      // if 404, try next candidate; otherwise rethrow to surface server validation errors
      const status = (err as any)?.response?.status;
      if (status && status !== 404) throw err;
    }
  }
  // All attempts failed
  throw lastError;
}

export async function logout() {
  await AsyncStorage.removeItem('accessToken');
  await AsyncStorage.removeItem('refreshToken');
}

// Verify signup OTP
export async function verifySignupRequest(email: string, otp: string) {
  const res = await api.post(ENDPOINTS.verifySignup, { email, otp });
  return res.data;
}

// Resend signup OTP (uses same signup endpoint)
export async function resendSignupOTP(email: string) {
  const res = await api.post('auth/resend-otp/', { email });
  return res.data;
}

// Attempt to resolve a working baseURL from candidates and set api.defaults.baseURL
export async function initApi(candidates?: string[]) {
  const defaults = candidates || [BASE_URL, 'http://10.0.2.2:8000/', 'http://127.0.0.1:8000/'];
  for (const candidate of defaults) {
    try {
      // quick probe with short timeout
      const probe = axios.create({ baseURL: candidate, timeout: 3000 });
      const res = await probe.get('');
      if (res && (res.status >= 200 && res.status < 500)) {
        api.defaults.baseURL = candidate;
        console.log('[API] initApi: using baseURL', candidate);
        await AsyncStorage.setItem('baseUrl', candidate);
        return candidate;
      }
    } catch (e) {
      console.log('[API] initApi probe failed for', candidate, (e as any)?.message || e);
      // try next
    }
  }
  console.log('[API] initApi: no candidate reachable, leaving default', api.defaults.baseURL);
  return api.defaults.baseURL;
}

export default api;
