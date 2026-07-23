/**
 * AuthContext.tsx — Auth + tema holati (web `src/context/AuthContext.jsx` porti).
 *
 * Farqlar (platforma sababli):
 *  - localStorage o'rniga AsyncStorage
 *  - `document.documentElement.classList` o'rniga darkMode flag —
 *    ranglar `useTheme()` hook orqali tarqatiladi
 *  - Tizim temasi: `Appearance` API (prefers-color-scheme ekvivalenti)
 */
import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setOnUnauthorized } from '@/services/api';
import { TOKEN_KEY, DARK_MODE_KEY } from '@/constants/config';
import type { Hotel, User } from '@/types/models';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  favorites: string[];
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: (accessToken: string) => Promise<User>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    phone: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  toggleFavorite: (hotelId: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  favorites: [],
  darkMode: false,
  setDarkMode: () => {},
  login: async () => ({}),
  loginWithGoogle: async () => ({}),
  register: async () => {},
  logout: async () => {},
  toggleFavorite: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  // Foydalanuvchi qo'lda tanlaganmi yoki tizim temasiga ergashyaptimi
  const [themeUserSet, setThemeUserSet] = useState(false);
  const [darkMode, setDarkModeRaw] = useState(false); // always light by default

  // Boshlang'ich tema: faqat foydalanuvchi qo'lda saqlagan tanlovni yuklash
  // Tizim (system) dark mode ga ergashmaymiz — default doim light
  useEffect(() => {
    AsyncStorage.getItem(DARK_MODE_KEY).then((saved) => {
      if (saved !== null) {
        setThemeUserSet(true);
        setDarkModeRaw(saved === 'true');
      }
      // saved === null bo'lsa default: false (light mode)
    });
  }, []);

  // Toggle bosilganda — foydalanuvchi tanlovini saqlash
  const setDarkMode = useCallback(
    (val: boolean | ((prev: boolean) => boolean)) => {
      setThemeUserSet(true);
      setDarkModeRaw((prev) => {
        const next = typeof val === 'function' ? val(prev) : val;
        AsyncStorage.setItem(DARK_MODE_KEY, String(next));
        return next;
      });
    },
    [],
  );

  const fetchFavorites = useCallback(async () => {
    try {
      const res = await api.get<(Hotel | string)[]>('/auth/favorites');
      setFavorites(
        res.data.filter(Boolean).map((f) => (typeof f === 'string' ? f : f._id)),
      );
    } catch {
      setFavorites([]);
    }
  }, []);

  // Sessiya tiklash — saqlangan token bilan /auth/me
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(TOKEN_KEY).then((token) => {
      if (!token) {
        if (mounted) setLoading(false);
        return;
      }
      api
        .get<User>('/auth/me')
        .then((res) => {
          if (!mounted) return;
          setUser(res.data);
          fetchFavorites();
        })
        .catch(() => AsyncStorage.removeItem(TOKEN_KEY))
        .finally(() => {
          if (mounted) setLoading(false);
        });
    });
    return () => {
      mounted = false;
    };
  }, [fetchFavorites]);

  // 401 => sessiya tugadi — user holatini tozalash
  useEffect(() => {
    setOnUnauthorized(() => {
      setUser(null);
      setFavorites([]);
    });
    return () => setOnUnauthorized(null);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      const res = await api.post('/auth/login', { email, password });
      await AsyncStorage.setItem(TOKEN_KEY, res.data.token);
      setUser(res.data.user);
      fetchFavorites();
      return res.data.user as User;
    },
    [fetchFavorites],
  );

  /** Google OAuth — access_token ni backendga yuborish (web bilan bir xil) */
  const loginWithGoogle = useCallback(
    async (accessToken: string): Promise<User> => {
      const res = await api.post('/auth/google', { access_token: accessToken });
      await AsyncStorage.setItem(TOKEN_KEY, res.data.token);
      setUser(res.data.user);
      fetchFavorites();
      return res.data.user as User;
    },
    [fetchFavorites],
  );

  const register = useCallback(
    async (userData: { name: string; email: string; password: string; role: string; phone: string }) => {
      const res = await api.post('/auth/register', userData);
      await AsyncStorage.setItem(TOKEN_KEY, res.data.token);
      setUser(res.data.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setFavorites([]);
  }, []);

  // Optimistik yangilash — xato bo'lsa orqaga qaytariladi
  const toggleFavorite = useCallback(
    async (hotelId: string) => {
      if (!user) return;
      let wasFav = false;
      setFavorites((prev) => {
        wasFav = prev.includes(hotelId);
        return wasFav ? prev.filter((id) => id !== hotelId) : [...prev, hotelId];
      });
      try {
        if (wasFav) await api.delete(`/auth/favorites/${hotelId}`);
        else await api.post(`/auth/favorites/${hotelId}`);
      } catch {
        setFavorites((prev) =>
          wasFav ? [...prev, hotelId] : prev.filter((id) => id !== hotelId),
        );
      }
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      favorites,
      darkMode,
      setDarkMode,
      login,
      loginWithGoogle,
      register,
      logout,
      toggleFavorite,
    }),
    [user, loading, favorites, darkMode, setDarkMode, login, loginWithGoogle, register, logout, toggleFavorite],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
