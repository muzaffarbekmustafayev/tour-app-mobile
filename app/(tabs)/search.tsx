/**
 * search.tsx — Qidiruv sahifasi (web `pages/SearchPage.jsx` porti).
 * Qidiruv paneli + mobil filtr drawer (accordion guruhlari, reyting radiolari).
 */
import React, { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import api from '@/services/api';
import { useTheme } from '@/hooks/useTheme';
import { FONT } from '@/constants/theme';
import { GRID_COLUMNS, rs } from '@/constants/responsive';
import { HotelCard } from '@/components/HotelCard';
import { BackButton } from '@/components/ui/BackButton';
import { Shimmer } from '@/components/ui/Shimmer';
import type { Hotel } from '@/types/models';

/* ── Filtr guruhlari (web FILTER_GROUPS bilan bir xil) ── */
interface FilterOption {
  key: string;
  label: string;
  param: string;
}

interface FilterGroup {
  id: string;
  label: string;
  icon: (color: string) => ReactElement;
  options: FilterOption[];
}

const FILTER_GROUPS: FilterGroup[] = [
  {
    id: 'mobility',
    label: 'Harakatlanish',
    icon: (c) => <MaterialCommunityIcons name="wheelchair-accessibility" size={16} color={c} />,
    options: [
      { key: 'wheelchair', label: 'Nogironlar aravachasi', param: 'wheelchair' },
      { key: 'accessibleRooms', label: 'Maxsus moslashtirilgan xona', param: 'accessibleRooms' },
      { key: 'accessibleParking', label: 'Maxsus parking', param: 'accessibleParking' },
    ],
  },
  {
    id: 'visual',
    label: "Ko'rish va yo'naltirish",
    icon: (c) => <MaterialIcons name="visibility" size={16} color={c} />,
    options: [
      { key: 'tactilePaving', label: "Taktil yo'lakchalar", param: 'tactilePaving' },
      { key: 'highContrastSignage', label: 'Yuqori kontrastli belgilar', param: 'highContrastSignage' },
      { key: 'brailleSigns', label: 'Brayl yozuvi', param: 'brailleSigns' },
    ],
  },
  {
    id: 'auditory',
    label: 'Eshitish',
    icon: (c) => <MaterialIcons name="hearing" size={16} color={c} />,
    options: [
      { key: 'audioGuides', label: "Ovozli yo'riqnomalar", param: 'audioGuides' },
      { key: 'vibrationAlerts', label: 'Vibro-signal tizimi', param: 'vibrationAlerts' },
      { key: 'signLanguageStaff', label: 'Imo-ishora tili xodimi', param: 'signLanguageStaff' },
    ],
  },
  {
    id: 'cognitive',
    label: 'Kognitiv qulaylik',
    icon: (c) => <MaterialIcons name="self-improvement" size={16} color={c} />,
    options: [
      { key: 'quietZones', label: 'Shovqinsiz hududlar', param: 'quietZones' },
      { key: 'easyToReadSignage', label: 'Sodda piktogramma belgilari', param: 'easyToReadSignage' },
    ],
  },
  {
    id: 'family',
    label: 'Oila va keksalar',
    icon: (c) => <MaterialIcons name="family-restroom" size={16} color={c} />,
    options: [
      { key: 'strollerAccessible', label: "Bolalar aravachasi uchun yo'l", param: 'strollerAccessible' },
      { key: 'medicalServiceOnSite', label: 'Tibbiy yordam punkti', param: 'medicalServiceOnSite' },
      { key: 'nursingRoom', label: 'Ona va bola xonasi', param: 'nursingRoom' },
    ],
  },
  {
    id: 'digital',
    label: 'Raqamli qulaylik',
    icon: (c) => <MaterialIcons name="wifi" size={16} color={c} />,
    options: [
      { key: 'offlineDataSupport', label: 'Oflayn rejim (PWA)', param: 'offlineDataSupport' },
      { key: 'lowDataMode', label: 'Past internet rejimi', param: 'lowDataMode' },
    ],
  },
];

const ALL_ACCESS_KEYS = FILTER_GROUPS.flatMap((g) => g.options.map((o) => o.key));

const RATING_OPTIONS: { v: string; l: string; icon: (c: string) => ReactElement }[] = [
  { v: '0.9', l: "9+ / 10 — A'lo", icon: () => <Feather name="award" size={14} color="#f59e0b" /> },
  { v: '0.8', l: '8+ / 10 — Yaxshi', icon: () => <Feather name="thumbs-up" size={14} color="#3b82f6" /> },
  { v: '0.7', l: '7+ / 10 — Qoniqarli', icon: () => <Feather name="smile" size={14} color="#22c55e" /> },
];

interface Filters {
  search: string;
  city: string;
  minRating: string;
  access: Record<string, boolean>;
}

const initAccess = (activeKey?: string): Record<string, boolean> => {
  const init: Record<string, boolean> = {};
  ALL_ACCESS_KEYS.forEach((k) => {
    init[k] = k === activeKey;
  });
  return init;
};

/* ── Skeleton karta ── */
function Skeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.skeletonCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <Shimmer style={{ height: 208 }} borderRadius={0} />
      <View style={{ padding: 20, gap: 12 }}>
        <Shimmer style={{ height: 16, width: '75%' }} borderRadius={999} />
        <Shimmer style={{ height: 12, width: '50%' }} borderRadius={999} />
        <Shimmer style={{ height: 40, width: '100%', marginTop: 8 }} borderRadius={16} />
      </View>
    </View>
  );
}

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string; city?: string; accessibility?: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [totalHotels, setTotalHotels] = useState(0);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ mobility: true });

  const [filters, setFilters] = useState<Filters>({
    search: typeof params.q === 'string' ? params.q : '',
    city: typeof params.city === 'string' ? params.city : '',
    minRating: '',
    access: initAccess(typeof params.accessibility === 'string' ? params.accessibility : undefined),
  });

  // Boshqa sahifadan yangi parametrlar bilan kelinsa — filtrlarni yangilash
  useEffect(() => {
    setFilters((p) => ({
      ...p,
      search: typeof params.q === 'string' ? params.q : p.search,
      city: typeof params.city === 'string' ? params.city : p.city,
      access:
        typeof params.accessibility === 'string'
          ? initAccess(params.accessibility)
          : p.access,
    }));
  }, [params.q, params.city, params.accessibility]);

  const fetchHotels = useCallback(async (f: Filters) => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (f.search) p.set('search', f.search);
      if (f.city) p.set('city', f.city);
      if (f.minRating) p.set('minRating', f.minRating);
      // Accessibility filtrlari — backend ACC_MAP bilan mos keladi
      Object.entries(f.access).forEach(([key, active]) => {
        if (active) {
          const opt = FILTER_GROUPS.flatMap((g) => g.options).find((o) => o.key === key);
          if (opt) p.set(opt.param, 'true');
        }
      });
      p.set('limit', '50');
      const res = await api.get(`/hotels?${p.toString()}`);
      const data: Hotel[] = Array.isArray(res.data)
        ? res.data
        : res.data.data || res.data.hotels || [];
      const total: number = res.data.total ?? data.length;
      setHotels(data);
      setTotalHotels(total);
    } catch (err) {
      if (__DEV__) console.error('[Search] Qidiruv xatosi:', (err as Error).message);
      setHotels([]);
      setTotalHotels(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtr o'zgarganda qidirish (matn uchun 400ms debounce)
  useEffect(() => {
    const t = setTimeout(() => fetchHotels(filters), 400);
    return () => clearTimeout(t);
  }, [filters, fetchHotels]);

  const set = (key: keyof Filters, val: string) => setFilters((p) => ({ ...p, [key]: val }));
  const toggleAccess = (key: string) =>
    setFilters((p) => ({ ...p, access: { ...p.access, [key]: !p.access[key] } }));
  const clearFilters = () =>
    setFilters({ search: '', city: '', minRating: '', access: initAccess() });
  const toggleGroup = (id: string) => setOpenGroups((p) => ({ ...p, [id]: !p[id] }));

  const activeCount =
    Object.values(filters.access).filter(Boolean).length +
    [filters.minRating, filters.city].filter(Boolean).length;

  const title = filters.search
    ? `"${filters.search}" natijalari`
    : filters.city
      ? `${filters.city} mehmonxonalari`
      : 'Barcha mehmonxonalar';

  const listHeader = useMemo(
    () => (
      <View>
        {/* ── Yuqori panel ── */}
        <View style={styles.topBar}>
          <BackButton />
          <View style={styles.searchWrap}>
            <Feather name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              value={filters.search}
              onChangeText={(v) => set('search', v)}
              placeholder="Mehmonxona yoki shahar..."
              placeholderTextColor={colors.textMuted}
              style={[
                styles.searchInput,
                {
                  backgroundColor: colors.bgCard,
                  borderColor: colors.border,
                  color: colors.textMain,
                },
              ]}
            />
          </View>
          <Pressable
            onPress={() => setShowFilters(true)}
            style={[
              styles.filterBtn,
              {
                backgroundColor: activeCount > 0 ? '#6366f1' : colors.bgCard,
                borderColor: colors.border,
              },
            ]}
          >
            <Feather name="filter" size={16} color={activeCount > 0 ? '#fff' : colors.textMain} />
            {activeCount > 0 && <Text style={styles.filterCount}>{activeCount}</Text>}
          </Pressable>
        </View>

        {/* ── Natija sarlavhasi ── */}
        <View style={styles.resultHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.resultTitle, { color: colors.textMain }]}>{title}</Text>
            <Text style={[styles.resultCount, { color: colors.textMuted }]}>
              {loading ? 'Qidirilmoqda...' : `${totalHotels} ta mehmonxona topildi`}
            </Text>
          </View>
          {activeCount > 0 && (
            <Pressable onPress={clearFilters} style={styles.clearChip}>
              <Feather name="x" size={14} color="#f43f5e" />
              <Text style={styles.clearChipText}>Filtrlarni tozalash</Text>
            </Pressable>
          )}
        </View>
      </View>
    ),
    [colors, filters.search, activeCount, title, loading, totalHotels],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgMain, paddingTop: insets.top + 12 }}>
      <FlatList
        // Qayta qidiruv paytida eski natijalar ko'rinib turadi (lipillamaydi) —
        // skeletonlar faqat birinchi yuklanishda chiqadi
        data={hotels}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) =>
          GRID_COLUMNS > 1 ? (
            <View style={{ flex: 1 / GRID_COLUMNS }}>
              <HotelCard hotel={item} />
            </View>
          ) : (
            <HotelCard hotel={item} />
          )
        }
        {...(GRID_COLUMNS > 1
          ? { numColumns: GRID_COLUMNS, columnWrapperStyle: { gap: 16 } }
          : {})}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={10}
        removeClippedSubviews
        ListEmptyComponent={
          loading ? (
            <View style={{ gap: 16 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} />
              ))}
            </View>
          ) : (
            <View style={[styles.empty, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={styles.emptyIcon}>
                <Feather name="alert-circle" size={36} color="#a5b4fc" />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textMain }]}>Hech narsa topilmadi</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Mavjud filtrlar bo'yicha mos mehmonxonalar yo'q. Boshqa shartlar kiritib ko'ring.
              </Text>
              <Pressable onPress={clearFilters} style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
                <LinearGradient
                  colors={colors.gradientMain}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyBtn}
                >
                  <Text style={styles.emptyBtnText}>Filtrlarni tozalash</Text>
                </LinearGradient>
              </Pressable>
            </View>
          )
        }
      />

      {/* ── Filtr drawer (pastdan chiqadigan modal) ── */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setShowFilters(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setShowFilters(false)} />
        <View
          style={[
            styles.drawer,
            { backgroundColor: colors.bgMain, paddingBottom: insets.bottom + 32 },
          ]}
        >
          {/* Tortish dastasi */}
          <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Sarlavha */}
            <View style={styles.drawerHeader}>
              <View style={styles.drawerTitleRow}>
                <Feather name="sliders" size={16} color="#6366f1" />
                <Text style={[styles.drawerTitle, { color: colors.textMain }]}>Filtrlar</Text>
                {activeCount > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{activeCount}</Text>
                  </View>
                )}
              </View>
              <View style={styles.drawerActions}>
                {activeCount > 0 && (
                  <Pressable onPress={clearFilters}>
                    <Text style={styles.clearText}>Tozalash</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => setShowFilters(false)}
                  hitSlop={8}
                  style={[styles.closeBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                >
                  <Feather name="x" size={16} color={colors.textMuted} />
                </Pressable>
              </View>
            </View>

            {/* Maxsus qulayliklar */}
            <Text style={styles.sectionKicker}>MAXSUS QULAYLIKLAR</Text>
            <View style={{ gap: 8 }}>
              {FILTER_GROUPS.map((group) => {
                const active = group.options.filter((o) => filters.access[o.key]).length;
                const open = !!openGroups[group.id];
                return (
                  <View
                    key={group.id}
                    style={[styles.accordion, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                  >
                    <Pressable style={styles.accordionHeader} onPress={() => toggleGroup(group.id)}>
                      <View style={styles.accordionTitleRow}>
                        {group.icon(colors.primary)}
                        <Text style={[styles.accordionTitle, { color: colors.textMain }]}>
                          {group.label}
                        </Text>
                        {active > 0 && (
                          <View style={styles.countBadge}>
                            <Text style={styles.countBadgeText}>{active}</Text>
                          </View>
                        )}
                      </View>
                      <Feather
                        name={open ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={colors.textMuted}
                      />
                    </Pressable>
                    {open && (
                      <View style={[styles.accordionBody, { borderTopColor: colors.border }]}>
                        {group.options.map((opt) => {
                          const checked = !!filters.access[opt.key];
                          return (
                            <Pressable
                              key={opt.key}
                              style={styles.checkRow}
                              onPress={() => toggleAccess(opt.key)}
                              accessibilityRole="checkbox"
                              accessibilityState={{ checked }}
                            >
                              <View
                                style={[
                                  styles.checkbox,
                                  {
                                    backgroundColor: checked ? colors.primary : colors.bgMain,
                                    borderColor: checked ? colors.primary : colors.border,
                                  },
                                ]}
                              >
                                {checked && <Feather name="check" size={12} color="#fff" />}
                              </View>
                              <Text style={[styles.checkLabel, { color: colors.textMuted }]}>
                                {opt.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Minimal reyting */}
            <View
              style={[
                styles.ratingSection,
                { backgroundColor: colors.bgCard, borderColor: colors.border },
              ]}
            >
              <Text style={styles.ratingKicker}>
                <Feather name="star" size={12} color="#6366f1" /> MINIMAL REYTING
              </Text>
              <View style={{ gap: 12 }}>
                {RATING_OPTIONS.map((r) => {
                  const selected = filters.minRating === r.v;
                  return (
                    <Pressable
                      key={r.v}
                      style={styles.radioRow}
                      onPress={() => set('minRating', r.v)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                    >
                      <View
                        style={[
                          styles.radio,
                          {
                            borderColor: selected ? colors.primary : colors.border,
                            borderWidth: selected ? 5 : 2,
                            backgroundColor: colors.bgCard,
                          },
                        ]}
                      />
                      {r.icon(colors.primary)}
                      <Text style={[styles.radioLabel, { color: colors.textMain }]}>{r.l}</Text>
                    </Pressable>
                  );
                })}
                {!!filters.minRating && (
                  <Pressable onPress={() => set('minRating', '')}>
                    <Text style={styles.clearText}>Bekor qilish</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Qo'llash tugmasi */}
            <Pressable
              onPress={() => setShowFilters(false)}
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }], marginTop: 16 }]}
            >
              <LinearGradient
                colors={colors.gradientMain}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.applyBtn}
              >
                <Text style={styles.applyBtnText}>
                  {loading ? 'Qidirilmoqda...' : `${totalHotels} ta natijani ko'rish`}
                </Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 112,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    // O'ng yuqoridagi global tema tugmasi (ThemeToggle) bilan to'qnashmaslik uchun
    paddingRight: 52,
  },
  searchWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  searchInput: {
    height: rs(52),
    borderRadius: 32,
    borderWidth: 1,
    paddingLeft: 44,
    paddingRight: 20,
    fontSize: rs(16),
    fontFamily: FONT.bold,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: rs(52),
    minWidth: rs(52),
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterCount: {
    color: '#fff',
    fontSize: 12,
    fontFamily: FONT.black,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: rs(22),
    fontFamily: FONT.black,
    lineHeight: rs(28),
  },
  resultCount: {
    fontSize: rs(14),
    fontFamily: FONT.medium,
    marginTop: 4,
  },
  clearChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(244,63,94,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.2)',
  },
  clearChipText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#f43f5e',
  },
  skeletonCard: {
    borderRadius: 32,
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
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99,102,241,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: FONT.black,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONT.regular,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 24,
  },
  emptyBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawer: {
    maxHeight: '88%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  drawerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  drawerTitle: {
    fontSize: 16,
    fontFamily: FONT.extrabold,
  },
  drawerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#f43f5e',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionKicker: {
    fontSize: 10,
    fontFamily: FONT.black,
    letterSpacing: 2,
    color: '#6366f1',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  countBadge: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    minWidth: 20,
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: FONT.black,
  },
  accordion: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  accordionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accordionTitle: {
    fontSize: rs(15),
    fontFamily: FONT.bold,
  },
  accordionBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLabel: {
    flex: 1,
    fontSize: rs(15),
    fontFamily: FONT.semibold,
    lineHeight: rs(19),
  },
  ratingSection: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginTop: 12,
  },
  ratingKicker: {
    fontSize: 10,
    fontFamily: FONT.black,
    letterSpacing: 2,
    color: '#6366f1',
    marginBottom: 12,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  radioLabel: {
    fontSize: 14,
    fontFamily: FONT.semibold,
  },
  applyBtn: {
    paddingVertical: rs(15),
    borderRadius: 16,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: rs(15),
    fontFamily: FONT.extrabold,
  },
});
