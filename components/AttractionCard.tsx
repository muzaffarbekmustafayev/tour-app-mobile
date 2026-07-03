/**
 * AttractionCard.tsx — tarixiy joy kartasi (web `AttractionCard.jsx` porti).
 * Amber "Tarixiy joy" badge, 360° belgisi, tuman + reyting, amber gradient CTA.
 */
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Feather, FontAwesome, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AMBER_GRADIENT, FONT } from '@/constants/theme';
import { FALLBACK_ATTRACTION_IMAGE, imgSrc } from '@/constants/config';
import { Shimmer } from '@/components/ui/Shimmer';
import type { Attraction } from '@/types/models';

interface AttractionCardProps {
  attraction: Attraction;
}

export const AttractionCard = memo(function AttractionCard({ attraction: a }: AttractionCardProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const name = a.name || "Nomi yo'q";
  const hasVideo = !!a.video360?.url;
  const accCount = a.accessibility ? Object.values(a.accessibility).filter(Boolean).length : 0;

  return (
    // Mobilda butun karta bosiladi (CTA tugma ham alohida ishlayveradi)
    <Pressable
      onPress={() => router.push(`/attraction/${a._id}`)}
      accessibilityLabel={`${name} tarixiy joyi`}
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
          source={{ uri: imgSrc(a.images?.[0], FALLBACK_ATTRACTION_IMAGE) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          accessibilityLabel={name}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'transparent', 'rgba(0,0,0,0.65)']}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Tepa-chap badge'lar */}
        <View style={styles.topLeft}>
          <View style={styles.landmarkPill}>
            <MaterialCommunityIcons name="bank" size={12} color="#fff" />
            <Text style={styles.pillText}>Tarixiy joy</Text>
          </View>
          {hasVideo && (
            <View style={styles.videoPill}>
              <Feather name="play-circle" size={12} color="#fff" />
              <Text style={styles.pillText}>360°</Text>
            </View>
          )}
        </View>

        {/* Tuman + reyting */}
        <View style={styles.bottomRow}>
          <View style={styles.darkPill}>
            <Feather name="map-pin" size={12} color="#fda4af" />
            <Text style={styles.districtText}>{a.district}</Text>
          </View>
          {typeof a.rating === 'number' && a.rating > 0 && (
            <View style={styles.darkPill}>
              <FontAwesome name="star" size={12} color="#fbbf24" />
              <Text style={styles.ratingText}>{a.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Kontent ── */}
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.textMain }]} numberOfLines={1}>
          {name}
        </Text>
        {!!a.descriptionShort && (
          <Text style={[styles.descShort, { color: colors.textMuted }]} numberOfLines={2}>
            {a.descriptionShort}
          </Text>
        )}

        <View style={styles.chipRow}>
          {!!a.entryFee && (
            <View style={styles.feeChip}>
              <Text style={styles.feeText}>{a.entryFee}</Text>
            </View>
          )}
          {accCount > 0 && (
            <View style={styles.accChip}>
              <MaterialIcons name="accessible" size={12} color="#6366f1" />
              <Text style={styles.accText}>{accCount} qulaylik</Text>
            </View>
          )}
        </View>

        {/* CTA */}
        <View style={[styles.ctaWrap, { borderTopColor: colors.border }]}>
          <Pressable
            onPress={() => router.push(`/attraction/${a._id}`)}
            accessibilityRole="button"
            accessibilityLabel={`${name} joyini batafsil ko'rish`}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <LinearGradient
              colors={AMBER_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaText}>360° ko'rish va atrofi</Text>
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
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
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
  landmarkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(217,119,6,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  videoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(79,70,229,0.85)',
  },
  pillText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: FONT.black,
  },
  bottomRow: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  darkPill: {
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
  districtText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: FONT.black,
  },
  ratingText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONT.black,
  },
  content: {
    flex: 1,
    padding: 14,
  },
  name: {
    fontSize: 16,
    fontFamily: FONT.extrabold,
    marginBottom: 4,
  },
  descShort: {
    fontSize: 12,
    fontFamily: FONT.regular,
    lineHeight: 18,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  feeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
  },
  feeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#059669',
  },
  accChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(99,102,241,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
  },
  accText: {
    fontSize: 10,
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
    minHeight: 46,
    borderRadius: 12,
    shadowColor: '#d97706',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  ctaText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONT.bold,
  },
});
