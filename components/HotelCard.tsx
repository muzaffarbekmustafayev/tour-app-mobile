/**
 * HotelCard.tsx — mehmonxona kartasi (web `HotelCard.jsx` birga-bir porti).
 * Rasm 4:3, tepada inklyuziv badge'lar, pastda reyting, kontent va gradient CTA.
 */
import React, { memo, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Feather,
  FontAwesome,
  FontAwesome5,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import { useAuth, useTheme } from '@/hooks/useTheme';
import { FONT } from '@/constants/theme';
import { rs } from '@/constants/responsive';
import { FALLBACK_IMAGE, imgSrc } from '@/constants/config';
import { calcAccessibilityScore, getScoreStyle } from '@/utils/accessibilityScore';
import { Shimmer } from '@/components/ui/Shimmer';
import type { Hotel } from '@/types/models';

interface AccessBadge {
  icon: ReactElement;
  label: string;
  color: string;
  bg: string;
}

const buildAccessBadges = (hotel: Hotel): AccessBadge[] =>
  [
    hotel.accessibility?.mobility?.wheelchairAccessible && {
      icon: <MaterialCommunityIcons name="wheelchair-accessibility" size={14} color="#6366f1" />,
      label: 'Nogironlar aravachasi',
      color: '#6366f1',
      bg: 'rgba(99,102,241,0.12)',
    },
    hotel.accessibility?.mobility?.elevator && {
      icon: <MaterialIcons name="bolt" size={14} color="#8b5cf6" />,
      label: 'Lift mavjud',
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.12)',
    },
    hotel.accessibility?.auditory?.audioGuides && {
      icon: <MaterialCommunityIcons name="ear-hearing" size={14} color="#0ea5e9" />,
      label: "Ovozli yo'riqnoma",
      color: '#0ea5e9',
      bg: 'rgba(14,165,233,0.12)',
    },
    hotel.accessibility?.auditory?.signLanguageStaff && {
      icon: <FontAwesome5 name="sign-language" size={13} color="#06b6d4" />,
      label: 'Imo-ishora tili',
      color: '#06b6d4',
      bg: 'rgba(6,182,212,0.12)',
    },
    hotel.accessibility?.visual?.brailleSigns && {
      icon: <FontAwesome5 name="braille" size={12} color="#10b981" />,
      label: 'Brayl yozuvi',
      color: '#10b981',
      bg: 'rgba(16,185,129,0.12)',
    },
    hotel.accessibility?.cognitive?.quietZones && {
      icon: <FontAwesome5 name="hand-paper" size={13} color="#f59e0b" />,
      label: 'Shovqinsiz hudud',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
    },
    hotel.familyAndElderly?.strollerAccessible && {
      icon: <MaterialIcons name="family-restroom" size={14} color="#ec4899" />,
      label: 'Oila uchun',
      color: '#ec4899',
      bg: 'rgba(236,72,153,0.12)',
    },
    hotel.familyAndElderly?.medicalServiceOnSite && {
      icon: <MaterialIcons name="local-hospital" size={14} color="#ef4444" />,
      label: 'Tibbiy yordam',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.12)',
    },
  ].filter(Boolean) as AccessBadge[];

interface HotelCardProps {
  hotel: Hotel;
}

export const HotelCard = memo(function HotelCard({ hotel }: HotelCardProps) {
  const { user, favorites, toggleFavorite } = useAuth();
  const { colors } = useTheme();
  const gradient = colors.gradientMain;
  const router = useRouter();

  const isFav = favorites.includes(hotel._id);
  const name = hotel.name || "Nomi yo'q";
  const accessBadges = buildAccessBadges(hotel);
  const accScore = calcAccessibilityScore(hotel);
  const scoreStyle = getScoreStyle(accScore);

  return (
    // Mobilda butun karta bosiladi (CTA tugma ham alohida ishlayveradi)
    <Pressable
      onPress={() => router.push(`/hotel/${hotel._id}`)}
      accessibilityLabel={`${name} mehmonxonasi`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      {/* ── Rasm ── */}
      <View style={styles.imageWrap}>
        <Shimmer style={StyleSheet.absoluteFill} borderRadius={0} />
        <Image
          source={{ uri: imgSrc(hotel.image || hotel.images?.[0], FALLBACK_IMAGE) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          accessibilityLabel={`${name} mehmonxonasi`}
        />
        {/* Gradient qoplama */}
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'transparent', 'rgba(0,0,0,0.65)']}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Tepа-chap badge'lar */}
        <View style={styles.topLeft}>
          {accessBadges.length > 0 && (
            <View style={styles.accessPill}>
              <MaterialIcons name="accessible" size={12} color="#fff" />
              <Text style={styles.accessPillText}>{accessBadges.length} qulaylik</Text>
            </View>
          )}
          {accScore > 0 && (
            <View
              style={[
                styles.scorePill,
                { backgroundColor: scoreStyle.bg, borderColor: `${scoreStyle.color}40` },
              ]}
            >
              <Text style={[styles.scorePillText, { color: scoreStyle.color }]}>
                ♿ {accScore}%
              </Text>
            </View>
          )}
        </View>

        {/* Sevimli tugmasi */}
        {user && (
          <Pressable
            onPress={() => toggleFavorite(hotel._id)}
            accessibilityRole="button"
            hitSlop={8}
            accessibilityLabel={
              isFav ? `${name} sevimlilardan olib tashlash` : `${name} sevimlilarga qo'shish`
            }
            style={({ pressed }) => [
              styles.favBtn,
              {
                backgroundColor: isFav ? '#ef4444' : 'rgba(255,255,255,0.2)',
                borderColor: isFav ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.3)',
                transform: [{ scale: pressed ? 0.9 : 1 }],
              },
            ]}
          >
            <FontAwesome name={isFav ? 'heart' : 'heart-o'} size={14} color="#fff" />
          </Pressable>
        )}

        {/* Pastki qator: reyting */}
        {typeof hotel.rating === 'number' && hotel.rating > 0 && (
          <View style={styles.ratingBadge}>
            <View style={styles.ratingStar}>
              <FontAwesome name="star" size={10} color="#fff" />
            </View>
            <Text style={styles.ratingText}>{hotel.rating.toFixed(1)}</Text>
            {typeof hotel.reviewsCount === 'number' && hotel.reviewsCount > 0 && (
              <Text style={styles.ratingCount}>({hotel.reviewsCount})</Text>
            )}
          </View>
        )}
      </View>

      {/* ── Kontent ── */}
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.textMain }]} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={12} color={colors.textMuted} />
          <Text style={[styles.locationText, { color: colors.textMuted }]} numberOfLines={1}>
            {[hotel.city, hotel.country].filter(Boolean).join(', ')}
          </Text>
        </View>

        {/* Qisqa hissiy tavsif */}
        {!!hotel.descriptionShort && (
          <Text style={[styles.descShort, { color: colors.textMuted }]} numberOfLines={2}>
            {hotel.descriptionShort}
          </Text>
        )}

        {/* Inklyuziv ikonkalar */}
        {accessBadges.length > 0 && (
          <View style={styles.badgeRow} accessibilityLabel="Inklyuziv qulayliklar">
            {accessBadges.slice(0, 4).map((b, i) => (
              <View
                key={i}
                accessibilityLabel={b.label}
                style={[
                  styles.badgeIcon,
                  { backgroundColor: b.bg, borderColor: `${b.color}25` },
                ]}
              >
                {b.icon}
              </View>
            ))}
            {accessBadges.length > 4 && (
              <View
                style={[
                  styles.badgeIcon,
                  {
                    backgroundColor: 'rgba(99,102,241,0.08)',
                    borderColor: 'rgba(99,102,241,0.2)',
                  },
                ]}
              >
                <Text style={styles.badgeMore}>+{accessBadges.length - 4}</Text>
              </View>
            )}
          </View>
        )}

        {/* Qulayliklar chiplari */}
        {!!hotel.amenities?.length && (
          <View style={styles.amenityRow}>
            {hotel.amenities.slice(0, 3).map((a) => (
              <View key={a} style={styles.amenityChip}>
                <Text style={styles.amenityText}>{a}</Text>
              </View>
            ))}
            {hotel.amenities.length > 3 && (
              <View style={styles.amenityChip}>
                <Text style={styles.amenityText}>+{hotel.amenities.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        {/* CTA */}
        <View style={[styles.ctaWrap, { borderTopColor: colors.border }]}>
          <Pressable
            onPress={() => router.push(`/hotel/${hotel._id}`)}
            accessibilityRole="button"
            accessibilityLabel={`${name} mehmonxonasini batafsil ko'rish`}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaText}>Batafsil ko'rish</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  imageWrap: {
    aspectRatio: 4 / 3,
    overflow: 'hidden',
  },
  topLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    gap: 6,
    alignItems: 'flex-start',
  },
  accessPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(79,70,229,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  accessPillText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: FONT.black,
  },
  scorePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  scorePillText: {
    fontSize: 10,
    fontFamily: FONT.black,
  },
  favBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ratingStar: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONT.black,
  },
  ratingCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontFamily: FONT.medium,
  },
  content: {
    flex: 1,
    padding: rs(20),
  },
  name: {
    fontSize: rs(19),
    fontFamily: FONT.extrabold,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  locationText: {
    flex: 1,
    fontSize: rs(13),
    fontFamily: FONT.medium,
  },
  descShort: {
    fontSize: rs(13),
    fontFamily: FONT.regular,
    lineHeight: rs(19),
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  badgeIcon: {
    width: rs(30),
    height: rs(30),
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeMore: {
    fontSize: rs(11),
    fontFamily: FONT.black,
    color: '#6366f1',
  },
  amenityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  amenityChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(99,102,241,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
  },
  amenityText: {
    fontSize: rs(11),
    fontFamily: FONT.bold,
    color: '#6366f1',
  },
  ctaWrap: {
    marginTop: 'auto',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: rs(54),
    borderRadius: 16,
    shadowColor: '#6366f1',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  ctaText: {
    color: '#fff',
    fontSize: rs(16),
    fontFamily: FONT.bold,
  },
});
