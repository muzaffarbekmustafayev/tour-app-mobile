/**
 * ThemeToggle.tsx — global tema almashtirish tugmasi (web `ThemeToggle.jsx` porti).
 * Barcha sahifalarda o'ng yuqori burchakda, safe-area hisobga olingan.
 */
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { colors, darkMode, setDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={() => setDarkMode((prev) => !prev)}
      accessibilityRole="button"
      accessibilityLabel={darkMode ? "Yorug' rejimga o'tish" : "Tungi rejimga o'tish"}
      style={({ pressed }) => [
        styles.button,
        {
          top: insets.top + 12,
          right: insets.right + 12,
          backgroundColor: darkMode ? 'rgba(30,41,59,0.85)' : 'rgba(255,255,255,0.85)',
          borderColor: colors.border,
          transform: [{ scale: pressed ? 0.9 : 1 }],
        },
      ]}
    >
      <Feather
        name={darkMode ? 'moon' : 'sun'}
        size={20}
        color={darkMode ? '#818cf8' : '#f59e0b'}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    zIndex: 150,
    width: 40,
    height: 40,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
