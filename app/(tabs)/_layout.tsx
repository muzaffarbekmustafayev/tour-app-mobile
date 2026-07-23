/**
 * (tabs)/_layout.tsx — Tab navigatsiya.
 * Standart tab bar o'rniga web dizayniga mos maxsus BottomNav ishlatiladi.
 */
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav } from '@/components/BottomNav';

export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <BottomNav state={props.state} navigation={props.navigation} />}
      >
        <Tabs.Screen name="index" options={{ title: 'Asosiy' }} />
        <Tabs.Screen name="attractions" options={{ title: 'Joylar' }} />
        <Tabs.Screen name="search" options={{ title: 'Qidirish' }} />
        <Tabs.Screen name="map" options={{ title: 'Xarita' }} />
        <Tabs.Screen name="favorites" options={{ title: 'Sevimli' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
      </Tabs>

      <Pressable
        onPress={() => router.push('/ai-chat')}
        style={[styles.floatingBtn, { bottom: (insets.bottom || 16) + 72 }]}
      >
        <LinearGradient
          colors={['#6366f1', '#a855f7']}
          style={styles.gradient}
        >
          <Ionicons name="sparkles" size={28} color="#fff" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingBtn: {
    position: 'absolute',
    right: 16,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    zIndex: 999,
  },
  gradient: {
    flex: 1,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
