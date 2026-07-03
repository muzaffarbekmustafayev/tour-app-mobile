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
import { LinearGradient } from 'expo-linear-gradient';
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
      backgroundColor:
        focused === name ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)',
      borderColor: focused === name ? '#6366F1' : colors.border,
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
    <View style={{ marginBottom: 16 }}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
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
            <Text style={[styles.title, { color: colors.textMain }]}>
              {APP_NAME}'ga qo'shiling
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Sevimli mehmonxonalarni saqlash va profilingizni boshqarish uchun ro'yxatdan o'ting.
            </Text>
          </View>

          {/* Xato */}
          {!!error && (
            <View style={styles.errorBanner}>
              <Feather name="alert-triangle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {renderField('name', "TO'LIQ ISM", 'user', 'Ism Familiya')}
          {renderField('email', 'EMAIL MANZIL', 'mail', 'email@example.com', 'email-address')}
          {renderField('phone', 'TELEFON RAQAM', 'phone', '+998 90 123 45 67', 'phone-pad')}

          {/* Parol */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.label, { color: colors.textMuted }]}>PAROL</Text>
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

          {/* Rol tanlash */}
          <View style={{ marginBottom: 20 }}>
            <Text style={[styles.label, { color: colors.textMuted }]}>MEN...</Text>
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
                          ? 'rgba(99,102,241,0.12)'
                          : 'rgba(99,102,241,0.05)',
                        borderColor: selected ? '#6366F1' : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        { color: selected ? '#6366F1' : colors.textMuted },
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
            <LinearGradient
              colors={colors.gradientMain}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitBtn}
            >
              {loading && <ActivityIndicator size="small" color="#fff" />}
              <Text style={styles.submitBtnText}>
                {loading ? "Ro'yxatdan o'tilmoqda..." : "Ro'yxatdan o'tish →"}
              </Text>
            </LinearGradient>
          </Pressable>

          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Hisobingiz bormi?{' '}
            <Text style={styles.footerLink} onPress={() => router.push('/login')}>
              Kirish
            </Text>
          </Text>
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
    left: -120,
    width: 384,
    height: 384,
    backgroundColor: 'rgba(124,58,237,0.1)',
  },
  blobBottom: {
    bottom: -100,
    right: -100,
    width: 320,
    height: 320,
    backgroundColor: 'rgba(99,102,241,0.08)',
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
    fontSize: rs(26),
    fontFamily: FONT.black,
    marginBottom: 6,
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
  label: {
    fontSize: 11,
    fontFamily: FONT.extrabold,
    letterSpacing: 2,
    marginBottom: 7,
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
    paddingVertical: rs(14),
    borderRadius: 16,
    borderWidth: 1.5,
    fontSize: rs(16),
    fontFamily: FONT.semibold,
  },
  eyeBtn: {
    position: 'absolute',
    right: 16,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  roleChipText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    textAlign: 'center',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 4,
    shadowColor: '#4f46e5',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: rs(17),
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
});
