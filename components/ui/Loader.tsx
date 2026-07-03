/**
 * Loader.tsx — premium yuklanish indikatori (web `Loader.jsx` porti).
 * Aylanuvchi halqa + markazda xarita ikonkasi + progress chiziq.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { FONT } from '@/constants/theme';
import { APP_NAME } from '@/constants/config';

interface LoaderProps {
  fullScreen?: boolean;
  message?: string;
}

export function Loader({ fullScreen = false, message }: LoaderProps) {
  const { colors, darkMode } = useTheme();
  const msg = message ?? `${APP_NAME} yuklanmoqda...`;

  const spin = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const progressLoop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    spinLoop.start();
    progressLoop.start();
    return () => {
      spinLoop.stop();
      progressLoop.stop();
    };
  }, [spin, progress]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const progressX = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-128, 0, 128] });

  const content = (
    <View style={styles.content}>
      <View style={styles.ringWrap}>
        {/* statik halqa */}
        <View
          style={[
            styles.ring,
            { borderColor: darkMode ? 'rgba(129,140,248,0.15)' : '#e0e7ff' },
          ]}
        />
        {/* aylanuvchi halqa */}
        <Animated.View
          style={[
            styles.ring,
            {
              borderColor: colors.primary,
              borderTopColor: 'transparent',
              transform: [{ rotate }],
            },
          ]}
        />
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: colors.bgCard,
              borderColor: darkMode ? 'rgba(129,140,248,0.2)' : '#f1f5f9',
            },
          ]}
        >
          <Feather name="map" size={34} color={colors.primary} />
        </View>
      </View>

      <Text style={[styles.message, { color: colors.primary }]}>{msg.toUpperCase()}</Text>

      <View
        style={[
          styles.progressTrack,
          { backgroundColor: darkMode ? '#1e293b' : '#f1f5f9' },
        ]}
      >
        <Animated.View
          style={[
            styles.progressBar,
            { backgroundColor: colors.primary, transform: [{ translateX: progressX }] },
          ]}
        />
      </View>
    </View>
  );

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: colors.bgMain }]}>{content}</View>
    );
  }

  return <View style={styles.inline}>{content}</View>;
}

const styles = StyleSheet.create({
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  inline: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 32,
  },
  ringWrap: {
    width: 104,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 3,
    borderRadius: 52,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  message: {
    fontFamily: FONT.extrabold,
    fontSize: 12,
    letterSpacing: 3.6,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  progressTrack: {
    width: 128,
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBar: {
    width: 128,
    height: 4,
    borderRadius: 999,
  },
});
