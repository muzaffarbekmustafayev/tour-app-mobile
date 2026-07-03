/**
 * (tabs)/_layout.tsx — Tab navigatsiya.
 * Standart tab bar o'rniga web dizayniga mos maxsus BottomNav ishlatiladi.
 */
import React from 'react';
import { Tabs } from 'expo-router';
import { BottomNav } from '@/components/BottomNav';

export default function TabsLayout() {
  return (
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
  );
}
