/**
 * favorites.tsx — Sevimlilar (web `pages/Favorites.jsx` porti).
 * Login talab qilinadi (web ProtectedRoute ekvivalenti).
 */
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, FontAwesome } from '@expo/vector-icons';
import api from '@/services/api';
import { AuthContext } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { FONT } from '@/constants/theme';
import { CONTENT_MAX_WIDTH, GRID_COLUMNS, GRID_ITEM_WIDTH, rs } from '@/constants/responsive';
import { imgSrc } from '@/constants/config';
import { BackButton } from '@/components/ui/BackButton';
import { Shimmer } from '@/components/ui/Shimmer';
import type { Hotel } from '@/types/models';

/* ── Skeleton karta ── */
function SkeletonCard() {
  const { colors } = useTheme();
  return (
    <View style={[styles.skeleton, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <Shimmer style={{ height: 208 }} borderRadius={0} />
      <View style={{ padding: 20, gap: 12 }}>
        <Shimmer style={{ height: 16, width: '75%' }} borderRadius={999} />
        <Shimmer style={{ height: 12, width: '50%' }} borderRadius={999} />
        <Shimmer style={{ height: 12, width: '33%', marginTop: 8 }} borderRadius={999} />
      </View>
    </View>
  );
}

/* ── Sevimli mehmonxona kartasi (web FavCard porti) ── */
function FavCard({ hotel, onRemove }: { hotel: Hotel; onRemove: (id: string) => void }) {
  const { colors } = useTheme();
  const router = useRouter();
  const name = hotel.name || "Nomi yo'q";

  return (
    <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      {/* Rasm */}
      <View style={styles.cardImageWrap}>
        <Shimmer style={StyleSheet.absoluteFill} borderRadius={0} />
        <Image
          source={{ uri: imgSrc(hotel.images?.[0]) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
        <LinearGradient
          colors={['transparent', 'rgba(8,8,30,0.75)']}
          locations={[0.4, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Reyting */}
        {typeof hotel.rating === 'number' && hotel.rating > 0 && (
          <View style={styles.ratingBadge}>
            <View style={styles.ratingStar}>
              <FontAwesome name="star" size={11} color="#fff" />
            </View>
            <Text style={styles.ratingText}>{hotel.rating.toFixed(1)}</Text>
          </View>
        )}

        {/* Yulduzlar */}
        {typeof hotel.stars === 'number' && hotel.stars > 0 && (
          <View style={styles.starsRow}>
            {Array.from({ length: hotel.stars }).map((_, i) => (
              <FontAwesome key={i} name="star" size={12} color="#fbbf24" />
            ))}
          </View>
        )}

        {/* O'chirish tugmasi */}
        <Pressable
          onPress={() => onRemove(hotel._id)}
          accessibilityLabel="Sevimlilardan olib tashlash"
          hitSlop={8}
          style={({ pressed }) => [
            styles.removeBtn,
            { transform: [{ scale: pressed ? 0.9 : 1 }] },
          ]}
        >
          <Feather name="trash-2" size={16} color="#fff" />
        </Pressable>
      </View>

      {/* Ma'lumot */}
      <View style={styles.cardBody}>
        <Text style={[styles.cardName, { color: colors.textMain }]} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={14} color="#818cf8" />
          <Text style={[styles.locationText, { color: colors.textMuted }]} numberOfLines={1}>
            {hotel.city}
            {hotel.country ? `, ${hotel.country}` : ''}
          </Text>
        </View>

        {!!hotel.amenities?.length && (
          <View style={styles.amenityRow}>
            {hotel.amenities.slice(0, 3).map((a) => (
              <View key={a} style={styles.amenityChip}>
                <Text style={styles.amenityText}>{a}</Text>
              </View>
            ))}
          </View>
        )}

        {/* CTA */}
        <View style={[styles.ctaWrap, { borderTopColor: colors.border }]}>
          <Pressable
            onPress={() => router.push(`/hotel/${hotel._id}`)}
            style={({ pressed }) => [{ flex: 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <LinearGradient
              colors={colors.gradientMain}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaButton}
            >
              <Feather name="zap" size={16} color="#fff" />
              <Text style={styles.ctaText}>Batafsil ko'rish</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function FavoritesScreen() {
  const { user, loading: authLoading, toggleFavorite } = useContext(AuthContext);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = useCallback(async () => {
    try {
      const res = await api.get<Hotel[]>('/auth/favorites');
      setHotels(res.data.filter(Boolean));
    } catch {
      setHotels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(loadFavorites, 150);
    return () => clearTimeout(t);
  }, [user, loadFavorites]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  }, [loadFavorites]);

  // ProtectedRoute ekvivalenti
  if (!authLoading && !user) return <Redirect href="/login" />;

  const handleRemove = (hotelId: string) => {
    toggleFavorite(hotelId);
    setHotels((prev) => prev.filter((h) => h._id !== hotelId));
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bgMain }}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingHorizontal: 16,
        paddingBottom: 128,
        width: '100%',
        maxWidth: CONTENT_MAX_WIDTH,
        alignSelf: 'center',
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f43f5e']} />
      }
    >
      {/* Sarlavha */}
      <View style={{ marginBottom: 32 }}>
        <BackButton style={{ marginBottom: 12 }} />
        <View style={styles.headerRow}>
          <View>
            <View style={styles.titleRow}>
              <FontAwesome name="heart" size={26} color="#f43f5e" />
              <Text style={[styles.title, { color: colors.textMain }]}>Sevimlilar</Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {loading ? 'Yuklanmoqda...' : `${hotels.length} ta saqlangan mehmonxona`}
            </Text>
          </View>
          {!loading && hotels.length > 0 && (
            <View style={styles.countChip}>
              <Text style={styles.countChipText}>{hotels.length} ta</Text>
            </View>
          )}
        </View>
      </View>

      {/* Yuklanish skeletlari */}
      {loading && (
        <View style={styles.grid}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.gridItem}>
              <SkeletonCard />
            </View>
          ))}
        </View>
      )}

      {/* Kartalar */}
      {!loading && hotels.length > 0 && (
        <View style={styles.grid}>
          {hotels.map((hotel) => (
            <View key={hotel._id} style={styles.gridItem}>
              <FavCard hotel={hotel} onRemove={handleRemove} />
            </View>
          ))}
        </View>
      )}

      {/* Bo'sh holat */}
      {!loading && hotels.length === 0 && (
        <View style={styles.empty}>
          <View style={styles.emptyCircle}>
            <FontAwesome name="heart-o" size={48} color="#fda4af" />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textMain }]}>
            Hali hech narsa saqlanmagan
          </Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Yoqtirgan mehmonxonangizni saqlash uchun kartochkadagi yurak belgisini bosing.
          </Text>
          <Pressable
            onPress={() => router.push('/search')}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.96 : 1 }] }]}
          >
            <LinearGradient
              colors={colors.gradientMain}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyBtn}
            >
              <Feather name="search" size={16} color="#fff" />
              <Text style={styles.emptyBtnText}>Mehmonxonalarni ko'rish</Text>
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: rs(31),
    fontFamily: FONT.black,
  },
  subtitle: {
    fontSize: rs(14),
    fontFamily: FONT.medium,
    marginTop: 4,
  },
  grid: {
    gap: 24,
    flexDirection: GRID_COLUMNS > 1 ? 'row' : 'column',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: GRID_ITEM_WIDTH,
  },
  countChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(244,63,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.2)',
  },
  countChipText: {
    fontSize: 12,
    fontFamily: FONT.black,
    color: '#f43f5e',
  },
  skeleton: {
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
  },
  card: {
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardImageWrap: {
    height: 200,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  ratingStar: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONT.black,
  },
  starsRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 2,
  },
  removeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239,68,68,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 16,
  },
  cardName: {
    fontSize: rs(17),
    fontFamily: FONT.extrabold,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONT.medium,
  },
  amenityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  amenityChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(99,102,241,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
  },
  amenityText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#6366f1',
  },
  ctaWrap: {
    marginTop: 'auto',
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: rs(48),
    borderRadius: 16,
  },
  ctaText: {
    color: '#fff',
    fontSize: rs(15),
    fontFamily: FONT.bold,
  },
  empty: {
    alignItems: 'center',
    marginTop: 64,
    paddingHorizontal: 16,
  },
  emptyCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(244,63,94,0.08)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(244,63,94,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: FONT.black,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONT.medium,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 32,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONT.bold,
  },
});
