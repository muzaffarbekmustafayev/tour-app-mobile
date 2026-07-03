/**
 * StarRow.tsx — 5 yulduzli baho qatori (web `StarRow` porti).
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface StarRowProps {
  rating?: number;
  size?: number;
}

export function StarRow({ rating = 0, size = 14 }: StarRowProps) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((i) => (
        <FontAwesome
          key={i}
          name={i <= rating ? 'star' : 'star-o'}
          size={size}
          color={i <= rating ? '#f59e0b' : '#e2e8f0'}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
