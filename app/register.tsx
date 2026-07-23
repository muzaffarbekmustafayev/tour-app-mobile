/**
 * register.tsx — Ro'yxatdan o'tish (web `pages/Register.jsx` porti).
 * Ism / email / telefon / parol / rol tanlash + gradient submit.
 */
import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
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
import { AuthContext } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { FONT } from '@/constants/theme';
import { rs } from '@/constants/responsive';
import { APP_NAME } from '@/constants/config';
import { BackButton } from '@/components/ui/BackButton';

type FeatherName = keyof typeof Feather.glyphMap;

const ROLES = [
  { value: 'CUSTOMER', label: 'Sayohatchi / Mijoz' },
  { value: 'HOTEL_OWNER', label: 'Mehmonxona egasi' },
];

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CUSTOMER',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  const { register } = useContext(AuthContext);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const set = (key: keyof typeof formData, val: string) =>
    setFormData((p) => ({ ...p, [key]: val }));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await register(formData);
      router.replace('/');
    } catch (err) {
      setError((err as Error).message || "Ro'yxatdan o'tishda xatolik. Qayta urinib ko'ring.");
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

  const renderField = (
    key: 'name' | 'email' | 'phone',
    label: string,
    icon: FeatherName,
    placeholder: string,
    keyboardType: 'default' | 'email-address' | 'phone-pad' = 'default',
  ) => (
    <View style={{ marginBottom: 4 }}>
      <Text style={[styles.label, { color: colors.textMain }]}>{label}</Text>
      <View style={styles.inputWrap}>
        <Feather name={icon} size={20} color={colors.textMuted} style={styles.inputIcon} />
        <TextInput
          value={formData[key]}
          onChangeText={(v) => set(key, v)}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          autoCapitalize={key === 'name' ? 'words' : 'none'}
          onFocus={() => setFocused(key)}
          onBlur={() => setFocused(null)}
          style={inputStyle(key)}
        />
      </View>
    </View>
  );

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
          <Text style={[styles.title, { color: colors.textMain }]}>
            Ro'yxatdan o'tish
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {APP_NAME} orqali sayohatingizni boshlang
          </Text>
        </View>

        <View style={{ marginTop: 24 }}>
          {/* Xato */}
          {!!error && (
            <View style={styles.errorBanner}>
              <Feather name="alert-triangle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {renderField('name', "To'liq ism", 'user', 'Ism Familiya')}
          {renderField('email', 'Email manzil', 'mail', 'email@example.com', 'email-address')}
          {renderField('phone', 'Telefon raqam', 'phone', '+998 90 123 45 67', 'phone-pad')}

          {/* Parol */}
          <View style={{ marginBottom: 4 }}>
            <Text style={[styles.label, { color: colors.textMain }]}>Parol</Text>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                value={formData.password}
                onChangeText={(v) => set('password', v)}
                placeholder="Kuchli parol yarating"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                style={inputStyle('password')}
              />
              <Pressable
                onPress={() => setShowPassword((p) => !p)}
                style={styles.eyeBtn}
                hitSlop={10}
                accessibilityLabel={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
              >
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>

          <View style={{ marginBottom: 8 }}>
            <Text style={[styles.label, { color: colors.textMain }]}>Men...</Text>
            <View style={styles.roleRow}>
              {ROLES.map((r) => {
                const selected = formData.role === r.value;
                return (
                  <Pressable
                    key={r.value}
                    onPress={() => set('role', r.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={[
                      styles.roleChip,
                      {
                        backgroundColor: selected
                          ? colors.primary
                          : colors.bgCard,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        { color: selected ? '#fff' : colors.textMuted },
                      ]}
                    >
                      {r.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Yuborish */}
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
                {loading ? "Kutilmoqda..." : "Ro'yxatdan o'tish →"}
              </Text>
            </View>
          </Pressable>

          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Hisobingiz bormi?{' '}
            <Text style={styles.footerLink} onPress={() => router.push('/login')}>
              Kirish
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
    paddingTop: 24,
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
  card: {
    // Karta o'rniga oddiy view, padding container'dan keladi (16px)
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
  eyeBtn: {
    position: 'absolute',
    right: 12,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  roleChipText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    textAlign: 'center',
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
