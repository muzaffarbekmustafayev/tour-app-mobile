/**
 * login.tsx — Kirish sahifasi (web `pages/Login.jsx` porti).
 * Glass karta, Google OAuth (expo-auth-session), email/parol forma.
 *
 * MUHIM: Google OAuth Expo Go'da ishlamaydi (Google `exp://` redirect'ni
 * qabul qilmaydi) — development build kerak: `npx expo run:android`.
 * Expo Go'da tugma bosilsa tushuntiruvchi xabar ko'rsatiladi.
 */
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { AuthContext } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { FONT } from '@/constants/theme';
import { rs } from '@/constants/responsive';
import { APP_NAME } from '@/constants/config';
import { BackButton } from '@/components/ui/BackButton';

// Brauzerdan qaytganda auth sessiyani yakunlash (expo-auth-session talabi)
WebBrowser.maybeCompleteAuthSession();

// Expo Go'da Google OAuth ishlamaydi — aniqlash uchun
const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Google Cloud Console'dan olingan Client ID'lar (.env orqali)
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

const GOOGLE_CONFIGURED = !!(
  GOOGLE_ANDROID_CLIENT_ID ||
  GOOGLE_IOS_CLIENT_ID ||
  GOOGLE_WEB_CLIENT_ID
);

/* Google "G" logotipi (web bilan bir xil SVG) */
function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </Svg>
  );
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  const { login, loginWithGoogle } = useContext(AuthContext);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const goNext = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  /* ── Google OAuth (expo-auth-session, PKCE) ── */
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    // Hech biri sozlanmagan bo'lsa hook xato tashlamasligi uchun zaxira qiymat
    clientId: GOOGLE_WEB_CLIENT_ID ?? 'not-configured.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
  });

  // Google'dan javob kelganda — access_token ni backendga yuborish (web bilan bir xil)
  useEffect(() => {
    if (response?.type === 'success' && response.authentication?.accessToken) {
      const token = response.authentication.accessToken;
      setGLoading(true);
      setError('');
      loginWithGoogle(token)
        .then(goNext)
        .catch((err) =>
          setError((err as Error).message || 'Google orqali kirishda xatolik.'),
        )
        .finally(() => setGLoading(false));
    } else if (response?.type === 'error') {
      setError('Google kirish bekor qilindi yoki xato yuz berdi.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const handleGooglePress = () => {
    if (IS_EXPO_GO) {
      Alert.alert(
        'Google bilan kirish',
        "Google login Expo Go'da ishlamaydi — Google xavfsizlik siyosati exp:// manzilini qabul qilmaydi.\n\nDevelopment build bilan ishga tushiring:\n\nnpx expo run:android\n\nBatafsil yo'riqnoma README'da.",
      );
      return;
    }
    if (!GOOGLE_CONFIGURED || !request) {
      setError(
        "Google Client ID sozlanmagan. `.env` fayliga EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID qo'shing (README'da yo'riqnoma bor).",
      );
      return;
    }
    setError('');
    promptAsync();
  };

  /* ── Email / parol login ── */
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      goNext();
    } catch (err) {
      setError((err as Error).message || "Email yoki parol noto'g'ri.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (name: string) => [
    styles.input,
    {
      backgroundColor: colors.bgCard,
      borderColor: focused === name ? colors.primary : colors.border,
      borderWidth: focused === name ? 1.5 : 1,
      color: colors.textMain,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bgMain }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
        ]}
      >
        {/* Back button — chap taraf tepada, absolute */}
        <View style={[styles.backBtnWrap, { top: insets.top + 12 }]}>
          <BackButton />
        </View>

        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: colors.textMain }]}>Xush kelibsiz!</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Profilingizga kirish uchun ma'lumotlarni kiriting
          </Text>
        </View>

        {/* Asosiy forma qismi (Flat dizayn) */}
        <View style={{ marginTop: 24 }}>

          {/* Xato xabari */}
          {!!error && (
            <View style={styles.errorBanner}>
              <Feather name="alert-triangle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}



          {/* ── Email ── */}
          <View style={{ marginBottom: 4 }}>
            <Text style={[styles.label, { color: colors.textMain }]}>Email manzil</Text>
            <View style={styles.inputWrap}>
              <Feather name="mail" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                style={inputStyle('email')}
              />
            </View>
          </View>

          {/* ── Parol ── */}
          <View style={{ marginBottom: 4 }}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.textMain, marginBottom: 0 }]}>Parol</Text>
              <Pressable onPress={() => router.push('/forgot-password')}>
                <Text style={styles.forgot}>Unutdingizmi?</Text>
              </Pressable>
            </View>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                autoComplete="password"
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                style={inputStyle('password')}
              />
              <Pressable
                onPress={() => setShowPass((p) => !p)}
                style={styles.eyeBtn}
                hitSlop={10}
                accessibilityLabel={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
              >
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>

          {/* Yuborish */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading || gLoading}
            style={({ pressed }) => [
              { transform: [{ scale: pressed ? 0.98 : 1 }], opacity: loading ? 0.75 : 1 },
            ]}
          >
            <View style={[styles.submitBtn, { backgroundColor: colors.primary }]}>
              {loading && <ActivityIndicator size="small" color="#fff" />}
              <Text style={styles.submitBtnText}>
                {loading ? 'Kirilmoqda...' : 'Kirish →'}
              </Text>
            </View>
          </Pressable>

          {/* Ajratuvchi */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>YOKI</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* ── Google tugmasi ── */}
          <Pressable
            onPress={handleGooglePress}
            disabled={loading || gLoading}
            style={({ pressed }) => [
              styles.googleBtn,
              {
                backgroundColor: '#ffffff',
                borderColor: '#e5e7eb',
                opacity: gLoading ? 0.75 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            {gLoading ? (
              <ActivityIndicator size="small" color="#4285F4" />
            ) : (
              <GoogleIcon />
            )}
            <Text style={[styles.googleBtnText, { color: '#374151' }]}>
              {gLoading ? 'Kirilmoqda...' : 'Google bilan davom etish'}
            </Text>
          </Pressable>

          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Hisobingiz yo'qmi?{' '}
            <Text style={styles.footerLink} onPress={() => router.push('/register')}>
              Ro'yxatdan o'tish
            </Text>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    position: 'relative',
  },
  headerContainer: {
    marginBottom: 8,
    alignItems: 'center',
    paddingTop: 8,
  },
  backBtnWrap: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  title: {
    fontSize: rs(28),
    fontFamily: FONT.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: rs(15),
    fontFamily: FONT.medium,
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    marginBottom: 20,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONT.semibold,
    color: '#ef4444',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  googleBtnText: {
    fontSize: 15,
    fontFamily: FONT.semibold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: FONT.semibold,
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  label: {
    fontSize: 13,
    fontFamily: FONT.semibold,
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  forgot: {
    fontSize: 13,
    fontFamily: FONT.semibold,
    color: '#6366F1',
  },
  inputWrap: {
    justifyContent: 'center',
    marginBottom: 16,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    paddingLeft: 44,
    paddingRight: 44,
    paddingVertical: rs(14),
    borderRadius: 12,
    fontSize: rs(15),
    fontFamily: FONT.medium,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: rs(16),
    fontFamily: FONT.bold,
  },
  footerText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 13,
    fontFamily: FONT.medium,
  },
  footerLink: {
    color: '#6366F1',
    fontFamily: FONT.extrabold,
  },
});
