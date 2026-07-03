/**
 * SectionCard.tsx — detal sahifalardagi bo'lim kartasi (web `Section` porti).
 * Sarlavha: rangli kvadrat ikonka + UPPERCASE matn + pastki chiziq.
 */
import React, { type ReactElement, type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FONT } from '@/constants/theme';

interface SectionCardProps {
  title?: string;
  icon?: ReactElement;
  accent?: 'indigo' | 'amber';
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function SectionCard({ title, icon, accent = 'indigo', children, style }: SectionCardProps) {
  const { colors, darkMode } = useTheme();

  const iconBg =
    accent === 'amber'
      ? darkMode
        ? 'rgba(180,83,9,0.25)'
        : '#fffbeb'
      : darkMode
        ? 'rgba(49,46,129,0.4)'
        : '#eef2ff';

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.bgCard, borderColor: colors.border },
        style,
      ]}
    >
      {title && (
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={[styles.iconBox, { backgroundColor: iconBg }]}>{icon}</View>
          <Text style={[styles.title, { color: colors.textMain }]}>{title.toUpperCase()}</Text>
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
    marginBottom: 24,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.black,
    letterSpacing: 0.8,
  },
});
