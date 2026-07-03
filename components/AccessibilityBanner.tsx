/**
 * AccessibilityBanner.tsx — inklyuziv turizm banneri (web porti).
 * Qorong'i gradient fon, 6 ta xususiyat chipi, CTA tugma, yopish (X).
 */
import React, { useEffect, useState, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FONT } from '@/constants/theme';
import { ACCESS_BANNER_KEY } from '@/constants/config';

interface Feature {
  icon: ReactElement;
  title: string;
  desc: string;
  color: string;
}

const FEATURES: Feature[] = [
  {
    icon: <MaterialIcons name="accessible" size={22} color="#6366f1" />,
    title: 'Harakatlanish',
    desc: "Lift, pandus, nogironlar aravachasi yo'li",
    color: '#6366f1',
  },
  {
    icon: <MaterialIcons name="hearing" size={22} color="#0ea5e9" />,
    title: 'Eshitish',
    desc: 'Ovozli signallar, imo-ishora tili xodimi',
    color: '#0ea5e9',
  },
  {
    icon: <MaterialIcons name="visibility" size={22} color="#10b981" />,
    title: "Ko'rish",
    desc: "Brayl, taktil yo'lakcha, yirik shrift",
    color: '#10b981',
  },
  {
    icon: <MaterialIcons name="self-improvement" size={22} color="#f59e0b" />,
    title: 'Kognitiv',
    desc: 'Sodda belgilar, shovqinsiz hudud',
    color: '#f59e0b',
  },
  {
    icon: <MaterialIcons name="family-restroom" size={22} color="#ec4899" />,
    title: 'Oila',
    desc: 'Bolalar aravachasi, emizish xonasi',
    color: '#ec4899',
  },
  {
    icon: <MaterialIcons name="elderly" size={22} color="#8b5cf6" />,
    title: 'Keksalar',
    desc: 'Tibbiy yordam, past balandlikdagi stendlar',
    color: '#8b5cf6',
  },
];

export function AccessibilityBanner() {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(ACCESS_BANNER_KEY).then((v) => setDismissed(v === '1'));
  }, []);

  const handleDismiss = () => {
    AsyncStorage.setItem(ACCESS_BANNER_KEY, '1');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <LinearGradient
      colors={['#0f172a', '#1e1b4b', '#0f172a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.banner}
      accessibilityLabel="Inklyuziv turizm haqida ma'lumot"
    >
      {/* Yopish tugmasi */}
      <Pressable
        onPress={handleDismiss}
        accessibilityRole="button"
        accessibilityLabel="Yopish"
        style={styles.dismiss}
      >
        <Feather name="x" size={16} color="#fff" />
      </Pressable>

      {/* ISA belgisi — orqa fon bezagi */}
      <View style={styles.watermark} pointerEvents="none">
        <MaterialIcons name="accessible" size={160} color="#fff" />
      </View>

      {/* Sarlavha */}
      <View style={styles.headerRow}>
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerIcon}
        >
          <MaterialIcons name="accessible" size={20} color="#fff" />
        </LinearGradient>
        <Text style={styles.kicker}>INKLYUZIV TURIZM · WCAG 2.1</Text>
      </View>

      <Text style={styles.title}>Hamma uchun qulay dam olish</Text>
      <Text style={styles.subtitle}>
        Navoiydagi mehmonxonalar maxsus ehtiyojlari bo'lgan mehmonlar uchun inklyuziv
        qulayliklarni taqdim etadi.
      </Text>

      {/* Xususiyat chiplari — 2 ustun */}
      <View style={styles.grid}>
        {FEATURES.map((f) => (
          <View
            key={f.title}
            style={[
              styles.chip,
              { backgroundColor: `${f.color}18`, borderColor: `${f.color}35` },
            ]}
          >
            {f.icon}
            <View style={styles.chipTextWrap}>
              <Text style={styles.chipTitle}>{f.title}</Text>
              <Text style={styles.chipDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* CTA */}
      <Pressable
        onPress={() => router.push('/search?accessibility=wheelchair')}
        accessibilityRole="button"
        accessibilityLabel="Inklyuziv mehmonxonalarni ko'rish"
        style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }], alignSelf: 'flex-start' }]}
      >
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>Inklyuziv mehmonxonalar</Text>
          <Feather name="arrow-right" size={16} color="#fff" />
        </LinearGradient>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 32,
    overflow: 'hidden',
    padding: 24,
    marginBottom: 48,
  },
  dismiss: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermark: {
    position: 'absolute',
    right: 16,
    bottom: -24,
    opacity: 0.05,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    fontSize: 10,
    fontFamily: FONT.black,
    letterSpacing: 2.5,
    color: '#a5b4fc',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontFamily: FONT.black,
    marginBottom: 4,
  },
  subtitle: {
    color: '#c7d2fe',
    fontSize: 14,
    fontFamily: FONT.regular,
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 420,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    width: '48.5%',
  },
  chipTextWrap: {
    flex: 1,
  },
  chipTitle: {
    color: '#fff',
    fontSize: 12,
    fontFamily: FONT.bold,
    marginBottom: 2,
  },
  chipDesc: {
    color: '#a5b4fc',
    fontSize: 10,
    fontFamily: FONT.medium,
    lineHeight: 13,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#6366f1',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  ctaText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONT.bold,
  },
});
