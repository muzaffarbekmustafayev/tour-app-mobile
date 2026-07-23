/**
 * BottomNav.tsx — pastki navigatsiya (premium dizayn).
 * Rolga qarab tugmalar. Aktiv tugma: gradient "pill" + oq ikonka.
 * Dizayn: Floating style, katta ikonkalar, chiroyli shadow.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, useTheme } from '@/hooks/useTheme';
import { FONT } from '@/constants/theme';
import { rs } from '@/constants/responsive';
import type { UserRole } from '@/types/models';

type FeatherName = keyof typeof Feather.glyphMap;

interface NavItem {
  route: string;
  label: string;
  icon: FeatherName;
  push?: string;
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
          backgroundColor: '#ffffff',
          borderTopColor: 'rgba(226,232,240,0.5)',
          paddingBottom: insets.bottom + 12,
        },
      ]}
    >
      <View style={styles.row}>
        {items.map((item) => {
          const active = !item.push && activeRoute === item.route;

          return (
            <Pressable
              key={item.route}
              onPress={() => handlePress(item)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.itemWrap,
                { transform: [{ scale: pressed ? 0.88 : 1 }], opacity: pressed ? 0.9 : 1 },
              ]}
            >
              {active ? (
                <LinearGradient
                  colors={['#4f46e5', '#7c3aed']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.itemActive}
                >
                  <Feather name={item.icon} size={rs(18)} color="#ffffff" />
                  <Text style={[styles.label, styles.labelActive]} numberOfLines={1}>
                    {item.label}
                  </Text>
                </LinearGradient>
              ) : (
                <View style={styles.itemInactive}>
                  <Feather name={item.icon} size={rs(18)} color="#94a3b8" />
                  <Text style={[styles.label, { color: '#94a3b8' }]} numberOfLines={1}>
                    {item.label}
                  </Text>
                </View>
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
    shadowColor: '#4f46e5',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    paddingTop: 6,
  },
  itemWrap: {
    flex: 1,
    alignItems: 'center',
  },
  itemActive: {
    paddingTop: rs(6),
    paddingBottom: rs(5),
    paddingHorizontal: rs(12),
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minWidth: rs(52),
    shadowColor: '#4f46e5',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  itemInactive: {
    paddingTop: rs(6),
    paddingBottom: rs(5),
    paddingHorizontal: rs(12),
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minWidth: rs(52),
  },
  label: {
    fontSize: rs(8.5),
    fontFamily: FONT.bold,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: '#ffffff',
  },
});
