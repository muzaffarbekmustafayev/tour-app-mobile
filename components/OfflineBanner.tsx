import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT } from '@/constants/theme';

export function OfflineBanner() {
  const [isConnected, setIsConnected] = useState(true);
  const translateY = new Animated.Value(-100);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected && state.isInternetReachable !== false;
      setIsConnected(connected ?? true);

      if (!connected) {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 12,
        }).start();
      } else {
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    });

    return () => unsubscribe();
  }, []);

  if (isConnected) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top > 0 ? insets.top : 20,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.content}>
        <Feather name="wifi-off" size={20} color="#fff" />
        <Text style={styles.text}>
          Internetga ulanish yo'q. Iltimos, tarmoqni tekshiring.
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ef4444',
    zIndex: 9999,
    paddingBottom: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  text: {
    color: '#fff',
    fontFamily: FONT.medium,
    fontSize: 14,
    flex: 1,
  },
});
