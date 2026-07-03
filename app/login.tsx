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
import { LinearGradient } from 'expo-linear-gradient';
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
      backgroundColor:
        focused === name ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)',
      borderColor: focused === name ? '#6366F1' : colors.border,
      color: colors.textMain,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bgMain }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Bezak bloblar */}
        <View style={[styles.blob, styles.blobTop]} pointerEvents="none" />
        <View style={[styles.blob, styles.blobBottom]} pointerEvents="none" />

        <View style={{ marginBottom: 20 }}>
          <BackButton />
        </View>

        {/* Karta */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          {/* Brend */}
          <View style={styles.brand}>
            <LinearGradient
              colors={colors.gradientMain}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.brandIcon}
            >
              <Feather name="map-pin" size={28} color="#fff" />
            </LinearGradient>
            <Text style={[styles.title, { color: colors.textMain }]}>Xush kelibsiz!</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Sevimlilar va profilni boshqarish uchun kiring.
            </Text>
          </View>

          {/* Xato xabari */}
          {!!error && (
            <View style={styles.errorBanner}>
              <Feather name="alert-triangle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* ── Google tugmasi ── */}
          <Pressable
            onPress={handleGooglePress}
            disabled={loading || gLoading}
            style={({ pressed }) => [
              styles.googleBtn,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
                opacity: gLoading ? 0.75 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
            ]}
          >
            {gLoading ? (
              <ActivityIndicator size="small" color="#818cf8" />
            ) : (
              <GoogleIcon />
            )}
            <Text style={[styles.googleBtnText, { color: colors.textMain }]}>
              {gLoading ? 'Kirilmoqda...' : 'Google bilan kirish'}
            </Text>
          </Pressable>

          {/* Ajratuvchi */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>YOKI</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* ── Email ── */}
          <View style={{ marginBottom: 20 }}>
            <Text style={[styles.label, { color: colors.textMuted }]}>EMAIL MANZIL</Text>
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
          <View style={{ marginBottom: 20 }}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.textMuted, marginBottom: 0 }]}>PAROL</Text>
              <Text style={styles.forgot}>Unutdingizmi?</Text>
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
            <LinearGradient
              colors={colors.gradientMain}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitBtn}
            >
              {loading && <ActivityIndicator size="small" color="#fff" />}
              <Text style={styles.submitBtnText}>
                {loading ? 'Kirilmoqda...' : 'Kirish →'}
              </Text>
            </LinearGradient>
          </Pressable>

          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Hisobingiz yo'qmi?{' '}
            <Text style={styles.footerLink} onPress={() => router.push('/register')}>
              Ro'yxatdan o'tish
            </Text>
          </Text>
        </View>

        {/* Pastki havolalar */}
        <View style={styles.bottomLinks}>
          <Text
            style={[styles.bottomLink, { color: colors.textMuted }]}
            onPress={() => router.replace('/')}
          >
            ← BOSH SAHIFA
          </Text>
          <View style={[styles.dot, { backgroundColor: colors.border }]} />
          <Text style={[styles.bottomLink, { color: colors.textMuted }]}>YORDAM</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobTop: {
    top: -120,
    right: -120,
    width: 384,
    height: 384,
    backgroundColor: 'rgba(99,102,241,0.12)',
  },
  blobBottom: {
    bottom: -100,
    left: -100,
    width: 320,
    height: 320,
    backgroundColor: 'rgba(236,72,153,0.1)',
  },
  card: {
    borderRadius: 32,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#1f2687',
    shadowOpacity: 0.05,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#4f46e5',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontFamily: FONT.black,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
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
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  googleBtnText: {
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    letterSpacing: 1.5,
  },
  label: {
    fontSize: 11,
    fontFamily: FONT.extrabold,
    letterSpacing: 2,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  forgot: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#6366F1',
  },
  inputWrap: {
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    paddingLeft: 48,
    paddingRight: 48,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    fontSize: 15,
    fontFamily: FONT.semibold,
  },
  eyeBtn: {
    position: 'absolute',
    right: 16,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#4f46e5',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONT.black,
  },
  footerText: {
    marginTop: 28,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: FONT.medium,
  },
  footerLink: {
    color: '#6366F1',
    fontFamily: FONT.extrabold,
  },
  bottomLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 20,
  },
  bottomLink: {
    fontSize: 11,
    fontFamily: FONT.extrabold,
    letterSpacing: 1.6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
