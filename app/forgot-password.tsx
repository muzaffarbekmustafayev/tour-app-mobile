import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { FONT } from '@/constants/theme';
import { rs } from '@/constants/responsive';
import { API_URL } from '@/constants/config';
import { BackButton } from '@/components/ui/BackButton';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email) {
      setError("Iltimos, email manzilni kiriting.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Xatolik yuz berdi');
      }
      
      setSuccess(true);
    } catch (err) {
      setError((err as Error).message || "Xatolik yuz berdi. Qayta urinib ko'ring.");
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
          <Text style={[styles.title, { color: colors.textMain }]}>Parolni tiklash</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Email manzilingizni kiriting. Biz sizga parolni tiklash havolasini yuboramiz.
          </Text>
        </View>

        <View style={{ marginTop: 24 }}>
          {!!error && (
            <View style={styles.errorBanner}>
              <Feather name="alert-triangle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {success ? (
            <View style={styles.successBanner}>
              <Feather name="check-circle" size={48} color="#10B981" style={{ marginBottom: 16 }} />
              <Text style={[styles.successTitle, { color: colors.textMain }]}>Havola yuborildi</Text>
              <Text style={[styles.successText, { color: colors.textMuted }]}>
                {email} manziliga parolni tiklash bo'yicha ko'rsatmalar yuborildi. Pochtangizni tekshiring.
              </Text>
              <Pressable onPress={() => router.push('/login')} style={{ marginTop: 24 }}>
                <Text style={styles.footerLink}>Tizimga qaytish</Text>
              </Pressable>
            </View>
          ) : (
            <>
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

              <Pressable
                onPress={handleSubmit}
                disabled={loading}
                style={({ pressed }) => [
                  { transform: [{ scale: pressed ? 0.98 : 1 }], opacity: loading ? 0.75 : 1 },
                ]}
              >
                <View style={[styles.submitBtn, { backgroundColor: colors.primary }]}>
                  {loading && <ActivityIndicator size="small" color="#fff" />}
                  <Text style={styles.submitBtnText}>
                    {loading ? 'Yuborilmoqda...' : 'Havolani yuborish'}
                  </Text>
                </View>
              </Pressable>
            </>
          )}
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONT.semibold,
    color: '#ef4444',
  },
  successBanner: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(16,185,129,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
    marginTop: 16,
  },
  successTitle: {
    fontSize: rs(20),
    fontFamily: FONT.black,
    marginBottom: 8,
  },
  successText: {
    fontSize: rs(14),
    fontFamily: FONT.medium,
    textAlign: 'center',
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontFamily: FONT.semibold,
    marginBottom: 6,
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
  footerLink: {
    color: '#6366F1',
    fontFamily: FONT.extrabold,
    fontSize: 15,
  },
});
