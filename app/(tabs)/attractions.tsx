/**
 * attractions.tsx — Tarixiy joylar ro'yxati (web `pages/Attractions.jsx` porti).
 * Tuman filtri chiplari + AttractionCard ro'yxati.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchAttractions, DISTRICTS } from '@/services/attractions';
import { useTheme } from '@/hooks/useTheme';
import { AMBER_GRADIENT, FONT } from '@/constants/theme';
import { CONTENT_MAX_WIDTH, GRID_COLUMNS, GRID_ITEM_WIDTH, rs } from '@/constants/responsive';
import { AttractionCard } from '@/components/AttractionCard';
import { BackButton } from '@/components/ui/BackButton';
import { Shimmer } from '@/components/ui/Shimmer';
import type { Attraction } from '@/types/models';

function Skeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.skeleton, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <Shimmer style={{ height: 176 }} borderRadius={0} />
      <View style={{ padding: 16, gap: 12 }}>
        <Shimmer style={{ height: 16, width: '75%' }} borderRadius={999} />
        <Shimmer style={{ height: 12, width: '50%' }} borderRadius={999} />
        <Shimmer style={{ height: 32, width: '100%', marginTop: 8 }} borderRadius={16} />
      </View>
    </View>
  );
}

export default function AttractionsScreen() {
  const { colors, darkMode } = useTheme();
  const insets = useSafeAreaInsets();

  const [district, setDistrict] = useState('');
  const [items, setItems] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAttractions(district ? { district } : {});
      setItems(Array.isArray(res) ? res : res.data || []);
    } catch {
      setError('Tarixiy joylarni yuklashda xatolik yuz berdi.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [district]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bgMain }}
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingHorizontal: 16,
        paddingBottom: 112,
        width: '100%',
        maxWidth: CONTENT_MAX_WIDTH,
        alignSelf: 'center',
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#d97706']} />
      }
    >
      <View style={{ marginBottom: 20 }}>
        <BackButton />
      </View>

      <View style={styles.titleRow}>
        <MaterialCommunityIcons name="bank" size={28} color={darkMode ? '#f59e0b' : '#d97706'} />
        <Text style={[styles.title, { color: colors.textMain }]}>Tarixiy joylar</Text>
      </View>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Navoiy viloyatining diqqatga sazovor joylari — 360° video, atrofidagi ko'rgazmalar va
        yaqin tunash maskanlari bilan.
      </Text>

      {/* Tuman filtri chiplari */}
      <View style={styles.chipRow}>
        <Pressable
          onPress={() => setDistrict('')}
          style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
        >
          {!district ? (
            <LinearGradient
              colors={colors.gradientMain}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.chip}
            >
              <Text style={styles.chipTextActive}>Barchasi</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.chip, styles.chipInactive, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.chipText, { color: colors.textMuted }]}>Barchasi</Text>
            </View>
          )}
        </Pressable>
        {DISTRICTS.map((d) => (
          <Pressable
            key={d}
            onPress={() => setDistrict(d)}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            {district === d ? (
              <LinearGradient
                colors={AMBER_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.chip, styles.chipWithIcon]}
              >
                <Feather name="map-pin" size={14} color="#fff" />
                <Text style={styles.chipTextActive}>{d}</Text>
              </LinearGradient>
            ) : (
              <View
                style={[
                  styles.chip,
                  styles.chipWithIcon,
                  styles.chipInactive,
                  { backgroundColor: colors.bgCard, borderColor: colors.border },
                ]}
              >
                <Feather name="map-pin" size={14} color={colors.textMuted} />
                <Text style={[styles.chipText, { color: colors.textMuted }]}>{d}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Feather name="alert-triangle" size={18} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.grid}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.gridItem}>
              <Skeleton />
            </View>
          ))}
        </View>
      ) : items.length > 0 ? (
        <View style={styles.grid}>
          {items.map((a) => (
            <View key={a._id} style={styles.gridItem}>
              <AttractionCard attraction={a} />
            </View>
          ))}
        </View>
      ) : !error ? (
        <View style={[styles.empty, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Feather name="frown" size={56} color="#d1d5db" />
          <Text style={[styles.emptyTitle, { color: colors.textMain }]}>Tarixiy joy topilmadi</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            {district ? `${district} tumani bo'yicha hozircha joy yo'q.` : "Ma'lumot qo'shilishini kuting."}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: rs(26),
    fontFamily: FONT.black,
  },
  subtitle: {
    fontSize: rs(15),
    fontFamily: FONT.medium,
    lineHeight: rs(21),
    marginBottom: 24,
  },
  grid: {
    gap: 16,
    flexDirection: GRID_COLUMNS > 1 ? 'row' : 'column',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: GRID_ITEM_WIDTH,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 32,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipWithIcon: {
    flexDirection: 'row',
    gap: 6,
  },
  chipInactive: {
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: rs(15),
    fontFamily: FONT.bold,
  },
  chipTextActive: {
    fontSize: rs(15),
    fontFamily: FONT.bold,
    color: '#fff',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(239,68,68,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    marginBottom: 24,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONT.semibold,
    color: '#ef4444',
  },
  skeleton: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
    borderRadius: 32,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: FONT.bold,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONT.regular,
    textAlign: 'center',
  },
});
