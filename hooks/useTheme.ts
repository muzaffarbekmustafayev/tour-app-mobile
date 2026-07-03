/**
 * useTheme.ts — joriy tema ranglarini qaytaradi.
 * Web'dagi `var(--...)` CSS variablelarining mobil ekvivalenti.
 */
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { lightColors, darkColors, type ThemeColors } from '@/constants/theme';

interface Theme {
  colors: ThemeColors;
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export function useTheme(): Theme {
  const { darkMode, setDarkMode } = useContext(AuthContext);
  return {
    colors: (darkMode ? darkColors : lightColors) as ThemeColors,
    darkMode,
    setDarkMode,
  };
}

export function useAuth() {
  return useContext(AuthContext);
}
