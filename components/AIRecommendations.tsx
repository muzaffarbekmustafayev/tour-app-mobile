/**
 * AIRecommendations.tsx — tavsiya etilgan mehmonxonalar (web porti).
 * Ko'k-indigo gradient panel, top-3 reyting bo'yicha kartalar.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '@/services/api';
import { FONT } from '@/constants/theme';
import { imgSrc } from '@/constants/config';
import { Shimmer } from '@/components/ui/Shimmer';
import type { Hotel } from '@/types/models';

const RANK_LABELS = ['Top', "2-o'rin", "3-o'rin"];

export function AIRecommendations() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api
      .get('/hotels?minRating=0&limit=3&sortBy=rating&order=desc')
      .then((res) => {
        const data: Hotel[] = Array.isArray(res.data)
          ? res.data
          : res.data.data || res.data.hotels || [];
        setHotels(data.slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && hotels.length === 0) return null;

  return (
    <LinearGradient
      colors={['#2563eb', '#4338ca']}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.panel}
    >
      <Text style={styles.title}>Tavsiya etilgan mehmonxonalar</Text>

      <View style={styles.list}>
        {loading
          ? [1, 2, 3].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <Shimmer style={styles.skeletonImage} borderRadius={12} />
                <Shimmer style={styles.skeletonLine} borderRadius={999} />
                <Shimmer style={styles.skeletonLineShort} borderRadius={999} />
              </View>
            ))
          : hotels.map((hotel, i) => (
              <Pressable
                key={hotel._id}
                onPress={() => router.push(`/hotel/${hotel._id}`)}
                style={({ pressed }) => [
                  styles.card,
                  { transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>{RANK_LABELS[i]}</Text>
                  </View>
                  <Text style={styles.rating}>
                    ★ {typeof hotel.rating === 'number' ? hotel.rating.toFixed(1) : '—'}
                  </Text>
                </View>
                {!!hotel.images?.[0] && (
                  <Image
                    source={{ uri: imgSrc(hotel.images[0]) }}
                    style={styles.image}
                    contentFit="cover"
                    transition={200}
                  />
                )}
                <Text style={styles.name} numberOfLines={1}>
                  {hotel.name}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.meta} numberOfLines={1}>
                    {hotel.city}
                  </Text>
                  {!!hotel.nearbyPlaces?.[0] && (
                    <>
                      <Text style={styles.meta}>·</Text>
                      <MaterialCommunityIcons name="bank" size={12} color="rgba(255,255,255,0.7)" />
                      <Text style={[styles.meta, { flex: 1 }]} numberOfLines={1}>
                        {hotel.nearbyPlaces[0]}
                      </Text>
                    </>
                  )}
                </View>
              </Pressable>
            ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontFamily: FONT.bold,
    marginBottom: 16,
  },
  list: {
    gap: 16,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rankBadge: {
    backgroundColor: '#4ade80',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  rankText: {
    color: '#14532d',
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  rating: {
    color: '#fde047',
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  image: {
    width: '100%',
    height: 80,
    borderRadius: 12,
    marginBottom: 8,
    opacity: 0.9,
  },
  name: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONT.bold,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontFamily: FONT.regular,
  },
  skeletonCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 16,
    gap: 8,
  },
  skeletonImage: {
    width: '100%',
    height: 80,
  },
  skeletonLine: {
    height: 16,
    width: '75%',
  },
  skeletonLineShort: {
    height: 12,
    width: '50%',
  },
});
