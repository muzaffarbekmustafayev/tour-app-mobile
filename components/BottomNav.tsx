/**
 * BottomNav.tsx — pastki navigatsiya (web `BottomNav.jsx` mobil ko'rinishining porti).
 * Rolga qarab tugmalar: GUEST — Kirish, CUSTOMER — Sevimli/Profil.
 * Aktiv tugma: gradient "pill" + oq ikonka (webdagi kabi).
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, useTheme } from '@/hooks/useTheme';
import { FONT } from '@/constants/theme';
import type { UserRole } from '@/types/models';

type FeatherName = keyof typeof Feather.glyphMap;

interface NavItem {
  route: string; // tab route nomi
  label: string;
  icon: FeatherName;
  push?: string; // tab bo'lmagan sahifa (masalan /login)
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  GUEST: [
    { route: 'index', label: 'Asosiy', icon: 'home' },
    { route: 'attractions', label: 'Joylar', icon: 'compass' },
    { route: 'search', label: 'Qidirish', icon: 'search' },
    { route: 'map', label: 'Xarita', icon: 'map' },
    { route: 'login', label: 'Kirish', icon: 'log-in', push: '/login' },
  ],
  CUSTOMER: [
    { route: 'index', label: 'Asosiy', icon: 'home' },
    { route: 'attractions', label: 'Joylar', icon: 'compass' },
    { route: 'search', label: 'Qidirish', icon: 'search' },
    { route: 'favorites', label: 'Sevimli', icon: 'heart' },
    { route: 'profile', label: 'Profil', icon: 'user' },
  ],
  HOTEL_OWNER: [
    { route: 'index', label: 'Asosiy', icon: 'home' },
    { route: 'attractions', label: 'Joylar', icon: 'compass' },
    { route: 'search', label: 'Qidirish', icon: 'search' },
    { route: 'map', label: 'Xarita', icon: 'map' },
    { route: 'profile', label: 'Profil', icon: 'user' },
  ],
  ADMIN: [
    { route: 'index', label: 'Asosiy', icon: 'home' },
    { route: 'attractions', label: 'Joylar', icon: 'compass' },
    { route: 'search', label: 'Qidirish', icon: 'search' },
    { route: 'map', label: 'Xarita', icon: 'map' },
    { route: 'profile', label: 'Admin', icon: 'settings' },
  ],
};

// @react-navigation/bottom-tabs prop'larining minimal strukturaviy tipi
interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    navigate(name: string): void;
    emit(event: { type: string; target?: string; canPreventDefault?: boolean }): {
      type?: string;
      defaultPrevented?: boolean;
    };
  };
}

export function BottomNav({ state, navigation }: TabBarProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const role: UserRole = (user?.role as UserRole) || 'GUEST';
  const items = NAV_ITEMS[role] || NAV_ITEMS.GUEST;
  const activeRoute = state.routes[state.index]?.name;

  const handlePress = (item: NavItem) => {
    if (item.push) {
      router.push(item.push);
      return;
    }
    const route = state.routes.find((r) => r.name === item.route);
    const event = navigation.emit({
      type: 'tabPress',
      target: route?.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(item.route);
    }
  };

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.navBg,
          borderTopColor: colors.navBorder,
          paddingBottom: insets.bottom,
        },
      ]}
      accessibilityLabel="Mobil navigatsiya"
    >
      <View style={styles.row}>
        {items.map((item) => {
          const active = !item.push && activeRoute === item.route;
          const inner = (
            <>
              <Feather
                name={item.icon}
                size={21}
                color={active ? '#fff' : colors.textMuted}
              />
              <Text
                style={[styles.label, { color: active ? '#fff' : colors.textMuted }]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </>
          );

          return (
            <Pressable
              key={item.route}
              onPress={() => handlePress(item)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.9 : 1 }] }]}
            >
              {active ? (
                <LinearGradient
                  colors={colors.gradientMain}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.item, styles.itemActive]}
                >
                  {inner}
                </LinearGradient>
              ) : (
                <View style={styles.item}>{inner}</View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  item: {
    minWidth: 56,
    paddingTop: 7,
    paddingBottom: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  itemActive: {
    shadowColor: '#4f46e5',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  label: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    letterSpacing: 0.2,
  },
});
