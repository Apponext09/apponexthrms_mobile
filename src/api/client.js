import axios from 'axios';
import { ENV } from '@/config/env';
import { tokenStorage } from '@/utils/storage';
import { ENDPOINTS } from './endpoints';

// In-memory copy of the session tokens (persisted copy lives in the keychain)
let session = { accessToken: null, refreshToken: null };
let onSessionExpired = () => {};
// false when the user unticks "Keep me signed in": tokens stay in memory only
let persistSession = true;

export const setPersistSession = value => {
  persistSession = value;
};

export const setSessionTokens = tokens => {
  session = { ...session, ...tokens };
};
export const clearSessionTokens = () => {
  session = { accessToken: null, refreshToken: null };
};
export const setSessionExpiredHandler = fn => {
  onSessionExpired = fn;
};

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

apiClient.interceptors.request.use(config => {
  if (session.accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

// The backend returns refreshed tokens only as Set-Cookie headers
const readCookie = (setCookie, name) => {
  const list = Array.isArray(setCookie)
    ? setCookie
    : String(setCookie || '').split(/,(?=\s*\w+=)/);
  for (const c of list) {
    const m = String(c).match(new RegExp(`(?:^|\\s)${name}=([^;]+)`));
    if (m) return decodeURIComponent(m[1]);
  }
  return null;
};

let refreshPromise = null;

const refreshTokens = async () => {
  if (!session.refreshToken) throw new Error('No refresh token');
  const res = await axios.post(
    `${ENV.API_BASE_URL}${ENDPOINTS.auth.refresh}`,
    { refreshToken: session.refreshToken },
    { timeout: ENV.REQUEST_TIMEOUT_MS },
  );
  const setCookie = res.headers?.['set-cookie'];
  const accessToken =
    res.data?.data?.accessToken || readCookie(setCookie, 'accessToken');
  const refreshToken =
    res.data?.data?.refreshToken ||
    readCookie(setCookie, 'refreshToken') ||
    session.refreshToken;
  if (!accessToken) throw new Error('Refresh did not return an access token');
  session = { accessToken, refreshToken };
  if (persistSession) await tokenStorage.save(session);
  return accessToken;
};

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config || {};
    const status = error.response?.status;
    const isAuthCall = [ENDPOINTS.auth.login, ENDPOINTS.auth.refresh].some(p =>
      original.url?.includes(p),
    );

    if (status === 401 && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        refreshPromise = refreshPromise || refreshTokens();
        const token = await refreshPromise;
        original.headers = {
          ...original.headers,
          Authorization: `Bearer ${token}`,
        };
        return apiClient(original);
      } catch (refreshError) {
        onSessionExpired();
        return Promise.reject(error);
      } finally {
        refreshPromise = null;
      }
    }
    return Promise.reject(error);
  },
);

// Unwraps the { success, data } envelope used by every endpoint
export const unwrap = res => res?.data?.data ?? res?.data;
