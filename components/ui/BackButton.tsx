/**
 * BackButton.tsx — "Orqaga" tugmasi (web `BackButton.jsx` porti).
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { FONT } from '@/constants/theme';

interface BackButtonProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function BackButton({ onPress, style }: BackButtonProps) {
  const router = useRouter();
  const { colors, darkMode } = useTheme();

  const handlePress = () => {
    if (onPress) return onPress();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Orqaga"
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: darkMode ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.8)',
          borderColor: darkMode ? '#374151' : '#f3f4f6',
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
        style,
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: darkMode ? '#334155' : '#f9fafb' },
        ]}
      >
        <Feather name="arrow-left" size={16} color={darkMode ? '#9ca3af' : '#6b7280'} />
      </View>
      <Text style={[styles.label, { color: darkMode ? '#e5e7eb' : '#374151' }]}>Orqaga</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: FONT.bold,
    fontSize: 14,
  },
});
