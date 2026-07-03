/**
 * profile.tsx — Profil sozlamalari (web `pages/Profile.jsx` porti).
 * Avatar + statistika qatori + menyu + tungi rejim switch + chiqish.
 */
import React, { useContext, useEffect, useState, type ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import api from '@/services/api';
import { AuthContext } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { FONT } from '@/constants/theme';
import { rs } from '@/constants/responsive';
import { BackButton } from '@/components/ui/BackButton';
import { Loader } from '@/components/ui/Loader';
import type { User, UserRole } from '@/types/models';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
  HOTEL_OWNER: 'Mehmonxona egasi',
  CUSTOMER: 'Mijoz',
  GUEST: 'Mehmon',
};

const ROLE_COLORS: Record<string, { bg: string; bgDark: string; text: string; textDark: string }> = {
  ADMIN: { bg: '#e0e7ff', bgDark: 'rgba(49,46,129,0.4)', text: '#4338ca', textDark: '#818cf8' },
  HOTEL_OWNER: { bg: '#fef3c7', bgDark: 'rgba(120,53,15,0.4)', text: '#b45309', textDark: '#fbbf24' },
  CUSTOMER: { bg: '#d1fae5', bgDark: 'rgba(6,78,59,0.4)', text: '#047857', textDark: '#34d399' },
  GUEST: { bg: '#f1f5f9', bgDark: '#1e293b', text: '#334155', textDark: '#94a3b8' },
};

interface MenuItem {
  icon: ReactElement;
  iconBg: string;
  label: string;
  path: string;
  roles?: UserRole[];
}

export default function ProfileScreen() {
  const { user, loading: authLoading, logout, darkMode, setDarkMode } = useContext(AuthContext);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [profileData, setProfileData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api
      .get<User>('/auth/me')
      .then((res) => setProfileData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  // ProtectedRoute ekvivalenti
  if (!authLoading && !user) return <Redirect href="/login" />;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgMain, justifyContent: 'center' }}>
        <Loader message="Profil yuklanmoqda" />
      </View>
    );
  }

  const profile = profileData || user;
  const role = profile?.role || 'GUEST';
  const roleColor = ROLE_COLORS[role] || ROLE_COLORS.GUEST;

  const menuItems: MenuItem[] = [
    {
      icon: <Feather name="heart" size={20} color="#f43f5e" />,
      iconBg: darkMode ? 'rgba(136,19,55,0.3)' : '#ffe4e6',
      label: 'Sevimlilar',
      path: '/favorites',
      roles: ['CUSTOMER', 'ADMIN'] as UserRole[],
    },
  ].filter((item) => !item.roles || item.roles.includes(role as UserRole));

  const stats = [
    {
      icon: <Feather name="calendar" size={14} color="#94a3b8" />,
      label: 'YIL',
      value: profile?.createdAt ? String(new Date(profile.createdAt).getFullYear()) : '—',
    },
    {
      icon: <Feather name="shield" size={14} color="#94a3b8" />,
      label: 'HOLAT',
      value: profile?.blocked ? 'Bloklangan' : 'Faol',
    },
    {
      icon: <Feather name="user" size={14} color="#94a3b8" />,
      label: 'ROL',
      value: ROLE_LABELS[role] || 'Mehmon',
    },
  ];

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bgMain }}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingHorizontal: 20,
        paddingBottom: 112,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Sarlavha */}
      <View style={styles.header}>
        <View style={styles.headerBack}>
          <BackButton />
        </View>
        <Text style={[styles.headerTitle, { color: colors.textMain }]}>Profil sozlamalari</Text>
      </View>

      {/* Profil ma'lumoti */}
      <View style={styles.profileInfo}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: darkMode ? '#1e293b' : '#e2e8f0',
              borderColor: darkMode ? '#0f172a' : '#ffffff',
            },
          ]}
        >
          <Text style={[styles.avatarText, { color: darkMode ? '#cbd5e1' : '#334155' }]}>
            {profile?.name?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={[styles.name, { color: colors.textMain }]}>
          {profile?.name || 'Foydalanuvchi'}
        </Text>
        <Text style={[styles.contact, { color: colors.textMuted }]}>
          {profile?.phone || profile?.email || "Noma'lum manzil"}
        </Text>
        <View
          style={[
            styles.rolePill,
            { backgroundColor: darkMode ? roleColor.bgDark : roleColor.bg },
          ]}
        >
          <Text
            style={[
              styles.rolePillText,
              { color: darkMode ? roleColor.textDark : roleColor.text },
            ]}
          >
            {(ROLE_LABELS[role] || 'Mehmon').toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Statistika qatori */}
      <View style={[styles.statsCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        {stats.map((stat, idx) => (
          <View
            key={idx}
            style={[
              styles.statItem,
              idx > 0 && { borderLeftWidth: 1, borderLeftColor: colors.border },
            ]}
          >
            <View style={styles.statLabelRow}>
              {stat.icon}
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.textMain }]}>{stat.value}</Text>
          </View>
        ))}
      </View>

      {/* 1-bo'lim: menyu */}
      {menuItems.length > 0 && (
        <View style={[styles.listCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          {menuItems.map((item, idx) => (
            <Pressable
              key={idx}
              onPress={() => router.push(item.path)}
              style={({ pressed }) => [
                styles.listRow,
                idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                pressed && { backgroundColor: colors.bgHover },
              ]}
            >
              <View style={[styles.listIcon, { backgroundColor: item.iconBg }]}>{item.icon}</View>
              <Text style={[styles.listLabel, { color: colors.textMain }]}>{item.label}</Text>
              <Feather name="chevron-right" size={20} color={darkMode ? '#475569' : '#cbd5e1'} />
            </Pressable>
          ))}
        </View>
      )}

      {/* 2-bo'lim: sozlamalar */}
      <View style={[styles.listCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <Pressable
          onPress={() => setDarkMode(!darkMode)}
          style={({ pressed }) => [styles.listRow, pressed && { backgroundColor: colors.bgHover }]}
          accessibilityRole="switch"
          accessibilityState={{ checked: darkMode }}
        >
          <View
            style={[
              styles.listIcon,
              { backgroundColor: darkMode ? '#1e293b' : '#f1f5f9' },
            ]}
          >
            <Feather name={darkMode ? 'sun' : 'moon'} size={20} color={darkMode ? '#cbd5e1' : '#334155'} />
          </View>
          <Text style={[styles.listLabel, { color: colors.textMain }]}>Tungi Rejim</Text>
          {/* Switch (web dizayni bilan bir xil) */}
          <View
            style={[
              styles.switchTrack,
              { backgroundColor: darkMode ? '#6366f1' : '#e2e8f0' },
            ]}
          >
            <View
              style={[
                styles.switchKnob,
                { transform: [{ translateX: darkMode ? 20 : 0 }] },
              ]}
            />
          </View>
        </Pressable>
      </View>

      {/* 3-bo'lim: chiqish */}
      <View style={[styles.listCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutRow,
            pressed && { backgroundColor: darkMode ? 'rgba(136,19,55,0.1)' : '#fff1f2' },
          ]}
        >
          <Feather name="log-out" size={20} color="#f43f5e" />
          <Text style={styles.logoutText}>Tizimdan chiqish</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    minHeight: 44,
  },
  headerBack: {
    position: 'absolute',
    left: 0,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: rs(19),
    fontFamily: FONT.bold,
    textAlign: 'center',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: rs(86),
    height: rs(86),
    borderRadius: rs(43),
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  avatarText: {
    fontSize: rs(32),
    fontFamily: FONT.black,
  },
  name: {
    fontSize: rs(22),
    fontFamily: FONT.bold,
    marginBottom: 4,
  },
  contact: {
    fontSize: rs(15),
    fontFamily: FONT.medium,
    marginBottom: 12,
  },
  rolePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  rolePillText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    letterSpacing: 1.5,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  statItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: FONT.bold,
    letterSpacing: 1,
  },
  statValue: {
    fontSize: rs(15),
    fontFamily: FONT.bold,
  },
  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  listIcon: {
    padding: 8,
    borderRadius: 12,
  },
  listLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: rs(15),
    fontFamily: FONT.semibold,
  },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 3,
  },
  switchKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  logoutText: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#f43f5e',
  },
});
