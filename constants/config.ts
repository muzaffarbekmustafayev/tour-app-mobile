/**
 * config.ts — Markaziy konfiguratsiya (web `src/config/app.js` bilan birga-bir).
 *
 * API manzili: telefon "localhost" ni ko'rmaydi, shu sababli dev rejimda
 * Expo hostUri orqali kompyuter IP manzili avtomatik aniqlanadi.
 * Qo'lda o'rnatish uchun: `.env` faylida EXPO_PUBLIC_API_URL=http://192.168.x.x:5000/api
 */
import Constants from 'expo-constants';

// ── Ilova identifikatori ──────────────────────────────────────
export const APP_NAME = 'Tourism for everyone';
export const APP_DESCRIPTION = 'Navoiy viloyatidagi mehmonxonalarni qidiring';

// ── API ulanish sozlamalari ───────────────────────────────────
const devHost = Constants.expoConfig?.hostUri?.split(':')[0];

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (devHost ? `http://${devHost}:5000/api` : 'http://localhost:5000/api');

export const API_TIMEOUT_MS = 15_000; // 15 soniya

// Server ildizi — nisbiy rasm yo'llarini to'liq URL ga aylantirish uchun
export const SERVER_ROOT = API_URL;

// ── Saqlash kalitlari ─────────────────────────────────────────
export const TOKEN_KEY = 'token';
export const DARK_MODE_KEY = 'darkMode';
export const ACCESS_BANNER_KEY = 'accessBannerDismissed';

// ── Pagination ────────────────────────────────────────────────
export const PAGE_SIZE = 12;

// ── Rasm fallback (web bilan bir xil) ─────────────────────────
export const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800';

export const FALLBACK_ATTRACTION_IMAGE =
  'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80&w=800';

export const FALLBACK_DETAIL_IMAGE =
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1000';

// ── Til ───────────────────────────────────────────────────────
export const DEFAULT_LOCALE = 'uz-UZ';
export const CURRENCY = 'UZS';

export const imgSrc = (src?: string | null, fallback: string = FALLBACK_IMAGE): string => {
  if (!src) return fallback;
  if (src.startsWith('http')) return src;
  const cleanSrc = src.startsWith('/') ? src.slice(1) : src;
  return `${SERVER_ROOT}/${cleanSrc}`;
};
