/**
 * Shimmer.tsx — skeleton yuklanish effekti.
 * Web `.shimmer` CSS animatsiyasining RN Animated ekvivalenti.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';

interface ShimmerProps {
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
}

export function Shimmer({ style, borderRadius = 12 }: ShimmerProps) {
  const { colors } = useTheme();
  const translate = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(translate, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [translate]);

  const translateX = translate.interpolate({
    inputRange: [-1, 1],
    outputRange: [-600, 600],
  });

  return (
    <Animated.View
      style={[
        styles.base,
        { backgroundColor: colors.shimmerBase, borderRadius },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={['transparent', colors.shimmerHighlight, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
