/**
 * attractions.ts — Tarixiy joylar (Attraction) API yordamchilari.
 * (web `src/services/attractions.js` porti)
 */
import api from './api';
import type { Attraction, Hotel } from '@/types/models';

export const DISTRICTS = ['Nurota', 'Xatirchi', 'Qiziltepa'] as const;

// Public
export const fetchAttractions = (params: Record<string, string | number> = {}) =>
  api.get<Attraction[] | { data: Attraction[] }>('/attractions', { params }).then((r) => r.data);

export const fetchAttraction = (id: string) =>
  api.get<Attraction>(`/attractions/${id}`).then((r) => r.data);

export const fetchNearbyStays = (id: string) =>
  api.get<Hotel[] | { data: Hotel[] }>(`/attractions/${id}/nearby-stays`).then((r) => r.data);

// Customer
export const addAttractionReview = (id: string, payload: { rating: number; comment: string }) =>
  api.post(`/attractions/${id}/reviews`, payload).then((r) => r.data);
