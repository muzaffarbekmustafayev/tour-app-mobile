/**
 * _layout.tsx — Root layout (web `App.jsx` + `main.jsx` ekvivalenti).
 * Shriftlar (Outfit), AuthProvider, global ThemeToggle va Stack navigatsiya.
 */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  Outfit_900Black,
} from '@expo-google-fonts/outfit';
import { AuthProvider } from '@/context/AuthContext';
import { useAuth, useTheme } from '@/hooks/useTheme';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Loader } from '@/components/ui/Loader';
import { APP_NAME } from '@/constants/config';

SplashScreen.preventAutoHideAsync();

function RootContent() {
  const { loading } = useAuth();
  const { colors, darkMode } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgMain }}>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      {loading ? (
        <Loader fullScreen message={`${APP_NAME} tizimi yuklanmoqda...`} />
      ) : (
        <>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bgMain },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="hotel/[id]" />
            <Stack.Screen name="attraction/[id]" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
          </Stack>
          {/* Tema almashtirish — barcha sahifalarda ko'rinadi (web bilan bir xil) */}
          <ThemeToggle />
        </>
      )}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Outfit_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
