/**
 * api.ts — Markaziy HTTP klient (web `src/services/api.js` porti).
 *
 *  - Avtomatik Authorization header (token AsyncStorage'da)
 *  - 401 => tokenni tozalash (auth endpointlaridan tashqari)
 *  - So'rov vaqt chegarasi (timeout)
 *  - Tushunarli xato xabarlari (o'zbekcha)
 */
import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, API_TIMEOUT_MS, TOKEN_KEY } from '@/constants/config';

const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

// 401 bo'lganda AuthContext xabardor bo'lishi uchun callback
let onUnauthorized: (() => void) | null = null;
export const setOnUnauthorized = (fn: (() => void) | null): void => {
  onUnauthorized = fn;
};

// So'rov interceptori — tokenni qo'shish
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (__DEV__) {
      console.debug(`[API ->] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Javob interceptori — xatolarni o'zbekchaga o'girish
api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.debug(`[API <-] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    // 401 - Token muddati tugagan: avtomatik chiqish
    // Auth endpointlarida (login/register) chiqarmaymiz — u yerda 401 normal xato
    if (status === 401) {
      const requestUrl = error.config?.url || '';
      const isAuthEndpoint =
        requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');
      if (!isAuthEndpoint) {
        await AsyncStorage.removeItem(TOKEN_KEY);
        onUnauthorized?.();
      }
      return Promise.reject(new Error(message || 'Sessiya muddati tugadi. Qayta kiring.'));
    }

    // 403 - Ruxsat yo'q
    if (status === 403) {
      return Promise.reject(new Error(message || "Bu amalni bajarishga ruxsatingiz yo'q."));
    }

    // 404 - Topilmadi
    if (status === 404) {
      return Promise.reject(new Error(message || "Ma'lumot topilmadi."));
    }

    // 400 / 422 - Validatsiya xatosi
    if (status === 400 || status === 422) {
      return Promise.reject(new Error(message || "Ma'lumotlar noto'g'ri kiritilgan."));
    }

    // 500+ - Server xatosi
    if (status && status >= 500) {
      return Promise.reject(new Error("Server xatosi yuz berdi. Keyinroq urinib ko'ring."));
    }

    // Tarmoq xatosi
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return Promise.reject(new Error("So'rov vaqti tugadi. Internet aloqasini tekshiring."));
      }
      return Promise.reject(new Error("Serverga ulanib bo'lmadi. Internet aloqasini tekshiring."));
    }

    return Promise.reject(error);
  },
);

export default api;
