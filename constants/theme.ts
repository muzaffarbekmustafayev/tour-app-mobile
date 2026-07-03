/**
 * theme.ts — Dizayn tokenlari.
 * Web `src/index.css` dagi `:root` va `.dark` CSS variablelarining
 * birga-bir nusxasi. Rang qiymatlari o'zgartirilmagan.
 */

export const lightColors = {
  primary: '#4f46e5',
  primaryHover: '#4338ca',
  primaryLight: '#e0e7ff',
  accent: '#f43f5e',
  amber: '#f59e0b',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  rose: '#f43f5e',

  bgMain: '#fcfcfd',
  bgCard: '#ffffff',
  bgHover: '#f1f5f9',
  textMain: '#0f172a',
  textMuted: '#64748b',
  border: 'rgba(226,232,240,0.8)',

  glassBg: 'rgba(255,255,255,0.7)',
  glassBorder: 'rgba(255,255,255,0.9)',

  // linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)
  gradientMain: ['#4f46e5', '#7c3aed'] as const,

  shimmerBase: 'rgba(203,213,225,0.35)',
  shimmerHighlight: 'rgba(226,232,240,0.75)',

  navBg: 'rgba(255,255,255,0.97)',
  navBorder: 'rgba(226,232,240,0.4)',
} as const;

export const darkColors = {
  primary: '#818cf8',
  primaryHover: '#a5b4fc',
  primaryLight: 'rgba(129,140,248,0.1)',
  accent: '#fb7185',
  amber: '#fbbf24',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  rose: '#f43f5e',

  bgMain: '#0B1120',
  bgCard: '#121A2F',
  bgHover: '#0d1526',
  textMain: '#ffffff',
  textMuted: '#94a3b8',
  border: 'rgba(30,41,59,0.8)',

  glassBg: 'rgba(18,26,47,0.6)',
  glassBorder: 'rgba(255,255,255,0.05)',

  // linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)
  gradientMain: ['#6366f1', '#8b5cf6'] as const,

  shimmerBase: 'rgba(30,41,59,0.45)',
  shimmerHighlight: 'rgba(51,65,85,0.75)',

  navBg: 'rgba(11,17,32,0.97)',
  navBorder: 'rgba(30,41,59,0.6)',
} as const;

export type ThemeColors = {
  [K in keyof typeof lightColors]: (typeof lightColors)[K] extends readonly string[]
    ? readonly [string, string]
    : string;
};

/**
 * Shriftlar — web'dagi 'Outfit' Google Font.
 * Tailwind og'irliklari: medium=500, semibold=600, bold=700,
 * extrabold=800, black=900.
 */
export const FONT = {
  light: 'Outfit_300Light',
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
  extrabold: 'Outfit_800ExtraBold',
  black: 'Outfit_900Black',
} as const;

/** Amber gradient — attraction tugmalari: linear-gradient(135deg,#f59e0b,#d97706) */
export const AMBER_GRADIENT = ['#f59e0b', '#d97706'] as const;
