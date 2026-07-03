/**
 * responsive.ts — moslashuvchan o'lchov tizimi.
 *
 * `rs(x)` — ekran kengligiga qarab o'lchamni moslashtiradi:
 *   - 360dp (oddiy telefon)  → 1.0x (asos)
 *   - 390–430dp (katta telefon) → ~1.08–1.15x (kattaroq ko'rinish)
 *   - ≥768dp (planshet)      → 1.3x gacha
 *   - juda kichik ekranlarda → 0.95x dan pastga tushmaydi
 *
 * Orientatsiya portret qilib qulflangan (app.json), shu sababli qiymatlar
 * modul yuklanganda bir marta hisoblanadi — StyleSheet'larda ham ishlaydi.
 */
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const SCREEN_WIDTH = width;
export const IS_TABLET = width >= 768;

const BASE_WIDTH = 360;
const factor = Math.min(Math.max(width / BASE_WIDTH, 0.95), IS_TABLET ? 1.3 : 1.15);

/** Responsive size — shrift, padding, ikonka o'lchamlari uchun */
export const rs = (size: number): number => Math.round(size * factor * 10) / 10;

/** Karta ro'yxatlari uchun ustunlar soni (web `hotel-grid` ekvivalenti) */
export const GRID_COLUMNS = width >= 900 ? 3 : width >= 600 ? 2 : 1;

/** Grid elementining foiz kengligi (gap 16px hisobida) */
export const GRID_ITEM_WIDTH: `${number}%` =
  GRID_COLUMNS === 3 ? '31.5%' : GRID_COLUMNS === 2 ? '48.5%' : '100%';

/** Planshetlarda kontent juda cho'zilib ketmasligi uchun maksimal kenglik */
export const CONTENT_MAX_WIDTH = 840;
