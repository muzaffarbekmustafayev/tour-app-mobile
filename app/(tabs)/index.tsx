/**
 * index.tsx — Bosh sahifa (web `pages/Home.jsx` birga-bir porti).
 * Hero → tumanlar → kategoriyalar → xarita havolasi → tarixiy joylar →
 * inklyuziv banner → tavsiyalar → tumanlar bo'yicha guruhlar → mehmonxonalar.
 */
import React, { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import {
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { setStatusBarStyle } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather, FontAwesome, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import api from '@/services/api';
import { fetchAttractions } from '@/services/attractions';
import { useTheme } from '@/hooks/useTheme';
import { FONT } from '@/constants/theme';
import { CONTENT_MAX_WIDTH, GRID_ITEM_WIDTH, GRID_COLUMNS, rs } from '@/constants/responsive';
import { imgSrc } from '@/constants/config';
import { HotelCard } from '@/components/HotelCard';
import { AttractionCard } from '@/components/AttractionCard';
import { AccessibilityBanner } from '@/components/AccessibilityBanner';
import { AIRecommendations } from '@/components/AIRecommendations';
import { GradientText } from '@/components/ui/GradientText';
import { Shimmer } from '@/components/ui/Shimmer';
import type { Attraction, Hotel } from '@/types/models';

/* ── Kategoriya chiplari (web CATEGORIES bilan bir xil) ── */
interface Category {
  name: string;
  query: string;
  color: string;
  accessKey?: string;
  icon: (color: string) => ReactElement;
}

const CATEGORIES: Category[] = [
  { name: 'Hashamatli', query: 'luxury', color: '#f59e0b', icon: (c) => <Feather name="award" size={20} color={c} /> },
  { name: 'Resort', query: 'resort', color: '#10b981', icon: (c) => <Feather name="sun" size={20} color={c} /> },
  { name: 'Arzon', query: 'budget', color: '#6366f1', icon: (c) => <Feather name="dollar-sign" size={20} color={c} /> },
  { name: 'Oilaviy', query: 'family', color: '#ec4899', icon: (c) => <MaterialIcons name="family-restroom" size={20} color={c} /> },
  { name: 'Butik', query: 'boutique', color: '#8b5cf6', icon: (c) => <Feather name="home" size={20} color={c} /> },
  { name: 'Biznes', query: 'business', color: '#0ea5e9', icon: (c) => <Feather name="briefcase" size={20} color={c} /> },
  { name: 'Aravacha', query: 'wheelchair', color: '#7c3aed', accessKey: 'wheelchair', icon: (c) => <MaterialCommunityIcons name="wheelchair-accessibility" size={20} color={c} /> },
  { name: 'Eshitish', query: 'audioGuides', color: '#06b6d4', accessKey: 'audioGuides', icon: (c) => <MaterialIcons name="hearing" size={20} color={c} /> },
  { name: "Ko'rish", query: 'tactilePaving', color: '#059669', accessKey: 'tactilePaving', icon: (c) => <MaterialIcons name="visibility" size={20} color={c} /> },
  { name: 'Keksalar', query: 'family', color: '#d97706', icon: (c) => <MaterialIcons name="elderly" size={20} color={c} /> },
];

const DISTRICT_COLORS = ['#6366f1', '#f43f5e', '#f59e0b'];

/* ── Skeleton karta ── */
function SkeletonCard() {
  const { colors } = useTheme();
  return (
    <View style={[skeletonStyles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <Shimmer style={skeletonStyles.image} borderRadius={0} />
      <View style={skeletonStyles.body}>
        <Shimmer style={skeletonStyles.line} borderRadius={999} />
        <Shimmer style={skeletonStyles.lineShort} borderRadius={999} />
        <Shimmer style={skeletonStyles.button} borderRadius={16} />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: { borderRadius: 32, borderWidth: 1, overflow: 'hidden' },
  image: { height: 208 },
  body: { padding: 20, gap: 12 },
  line: { height: 16, width: '75%' },
  lineShort: { height: 12, width: '50%' },
  button: { height: 32, width: '100%', marginTop: 8 },
});

export default function HomeScreen() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTop, setShowTop] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const router = useRouter();
  const { colors, darkMode } = useTheme();
  const { width, height } = useWindowDimensions();

  // clamp(400px, 72svh, 720px)
  const heroHeight = Math.min(Math.max(height * 0.72, 400), 720);
  // Web mobil h1: clamp(1.5rem, 7vw, 2.5rem)
  const titleSize = Math.round(Math.min(Math.max(width * 0.07, 24), 40));
  const titleLineHeight = Math.round(titleSize * 1.15);

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/hotels');
      setHotels(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch {
      setError('Mehmonxonalarni yuklashda xatolik yuz berdi.');
      setHotels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAttractions = useCallback(async () => {
    try {
      const res = await fetchAttractions({ limit: 6 });
      setAttractions(Array.isArray(res) ? res : res.data || []);
    } catch {
      setAttractions([]);
    }
  }, []);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  useEffect(() => {
    loadAttractions();
  }, [loadAttractions]);

  // Pastga tortib yangilash
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchHotels(), loadAttractions()]);
    setRefreshing(false);
  }, [fetchHotels, loadAttractions]);

  // Hero qorong'i — bu ekranda status bar oq bo'lsin
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle(darkMode ? 'light' : 'dark');
    }, [darkMode]),
  );

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setShowTop(e.nativeEvent.contentOffset.y > 400);
  };

  const districts = [...new Set(hotels.map((h) => h.city).filter(Boolean))] as string[];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgMain }}>
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 96 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            colors={['#6366f1']}
            progressViewOffset={40}
          />
        }
      >
        {/* ══════════════ HERO — Navoiy vibe ══════════════ */}
        <ImageBackground
          source={require('../../assets/images/hero.png')}
          style={[styles.hero, { height: heroHeight }]}
          resizeMode="cover"
        >
          {/* Chuqur gradient — Navoiy tun osmoni ranglari */}
          <LinearGradient
            colors={['rgba(10,8,45,0.72)', 'rgba(30,20,80,0.45)', 'rgba(8,6,35,0.92)']}
            locations={[0, 0.4, 1]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Bezak doiralar */}


          <View style={styles.heroContent}>
            {/* Joylashuv pilli */}
            <View style={styles.locationPill}>
              <Feather name="map-pin" size={14} color="#fbbf24" />
              <Text style={styles.locationPillText}>NAVOIY · O'ZBEKISTON</Text>
            </View>

            {/* Asosiy sarlavha */}
            <Text style={[styles.heroTitle, { fontSize: titleSize, lineHeight: titleLineHeight }]}>
              Navoiy viloyatidagi
            </Text>
            <GradientText
              text="Ko'ngil ochar maskanlar"
              colors={['#fbbf24', '#f59e0b', '#a78bfa']}
              style={[
                styles.heroTitleGradient,
                { fontSize: titleSize, lineHeight: titleLineHeight },
              ]}
            />

            {/* Izoh */}
            <Text style={styles.heroSubtitle}>
              Eng sara mehmonxonalar, resortlar va dam olish maskanlarini kashf eting.
            </Text>

            {/* Qidiruv tugmasi */}
            <Pressable
              onPress={() => router.push('/search')}
              style={({ pressed }) => [
                styles.searchShortcut,
                { transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
            >
              <View style={styles.searchIconBox}>
                <Feather name="search" size={16} color="#fff" />
              </View>
              <Text style={styles.searchShortcutText}>Mehmonxona qidirish...</Text>
              <Feather name="arrow-right" size={16} color="rgba(255,255,255,0.6)" />
            </Pressable>
          </View>

          {/* Pastki to'lqin */}
          <LinearGradient
            colors={['transparent', colors.bgMain]}
            style={styles.bottomWave}
            pointerEvents="none"
          />
        </ImageBackground>

        <View style={styles.main}>
          {/* ── Hududlar (tumanlar) ── */}
          {!loading && districts.length > 0 && (
            <View style={styles.districtGrid}>
              {districts.map((district, i) => {
                const count = hotels.filter((h) => h.city === district).length;
                const color = DISTRICT_COLORS[i % DISTRICT_COLORS.length];
                return (
                  <Pressable
                    key={district}
                    onPress={() => router.push({ pathname: '/search', params: { city: district } })}
                    accessibilityLabel={`${district} tumanidagi joylar`}
                    style={({ pressed }) => [
                      styles.districtCard,
                      {
                        backgroundColor: colors.bgCard,
                        borderColor: colors.border,
                        borderTopColor: color,
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                      },
                    ]}
                  >
                    <Feather name="map-pin" size={18} color={color} />
                    <Text style={[styles.districtName, { color }]}>{district}</Text>
                    <Text style={[styles.districtCount, { color: colors.textMuted }]}>
                      {count} TA MASKAN
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* ── Kategoriyalar ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Kategoriyalar</Text>
              <Pressable onPress={() => router.push('/search')} style={styles.seeAll}>
                <Text style={styles.seeAllText}>Barchasi</Text>
                <Feather name="chevron-right" size={16} color="#6366f1" />
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.name}
                  onPress={() =>
                    router.push({
                      pathname: '/search',
                      params: cat.accessKey ? { accessibility: cat.accessKey } : { q: cat.query },
                    })
                  }
                  accessibilityLabel={`${cat.name} mehmonxonalarini qidirish`}
                  style={({ pressed }) => [
                    styles.categoryChip,
                    {
                      backgroundColor: `${cat.color}12`,
                      borderColor: `${cat.color}25`,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    },
                  ]}
                >
                  {cat.icon(cat.color)}
                  <Text style={[styles.categoryText, { color: cat.color }]}>{cat.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* ── Xarita havolasi ── */}
          <Pressable
            onPress={() => router.push('/map')}
            style={({ pressed }) => [
              styles.mapLink,
              { transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
          >
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mapLinkIcon}
            >
              <Feather name="map" size={22} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={[styles.mapLinkTitle, { color: colors.textMain }]}>
                Mehmonxonalar xaritasi
              </Text>
              <Text style={[styles.mapLinkSub, { color: colors.textMuted }]} numberOfLines={1}>
                Barcha dam olish maskanlarini xaritada ko'ring
              </Text>
            </View>
            <Feather name="arrow-right" size={18} color="#818cf8" />
          </Pressable>

          {/* ── Diqqatga sazovor (tarixiy) joylar ── */}
          {attractions.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <MaterialCommunityIcons name="bank" size={24} color={darkMode ? '#f59e0b' : '#d97706'} />
                  <Text style={[styles.sectionTitle, { color: colors.textMain }]}>
                    Diqqatga sazovor joylar
                  </Text>
                </View>
                <Pressable onPress={() => router.push('/attractions')} style={styles.seeAll}>
                  <Text style={[styles.seeAllText, { color: '#d97706' }]}>Barchasi</Text>
                  <Feather name="chevron-right" size={16} color="#d97706" />
                </Pressable>
              </View>
              <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                360° video bilan kashf eting — har joyga yaqin tunash maskanlari tavsiya qilinadi
              </Text>
              <View style={styles.cardGrid}>
                {attractions.slice(0, 3).map((a) => (
                  <View key={a._id} style={styles.gridItem}>
                    <AttractionCard attraction={a} />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Inklyuziv banner ── */}
          <AccessibilityBanner />

          {/* ── AI tavsiyalar ── */}
          <View style={styles.section}>
            <AIRecommendations />
          </View>

          {/* ── Tarixiy joylar bo'yicha dam olish maskanlari ── */}
          {!loading && hotels.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <MaterialCommunityIcons name="bank" size={24} color={darkMode ? '#f59e0b' : '#d97706'} />
                <Text style={[styles.sectionTitle, { color: colors.textMain, flex: 1 }]}>
                  Tarixiy joylar va yaqin maskanlar
                </Text>
              </View>
              <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                Har bir tarixiy yoki sayohatbop joyga eng yaqin dam olish maskanlari
              </Text>

              <View style={{ gap: 24 }}>
                {districts.map((district) => {
                  const group = hotels.filter((h) => h.city === district);
                  const places = [...new Set(group.flatMap((h) => h.nearbyPlaces || []))];
                  return (
                    <View
                      key={district}
                      style={[
                        styles.districtPanel,
                        { backgroundColor: colors.bgCard, borderColor: colors.border },
                      ]}
                    >
                      <View style={styles.districtPanelHeader}>
                        <Feather name="map-pin" size={16} color="#f43f5e" />
                        <Text style={[styles.districtPanelTitle, { color: colors.textMain }]}>
                          {district} tumani
                        </Text>
                      </View>
                      {places.length > 0 && (
                        <View style={styles.placeChips}>
                          {places.map((p, i) => (
                            <View key={i} style={styles.placeChip}>
                              <MaterialCommunityIcons name="bank" size={12} color="#d97706" />
                              <Text style={styles.placeChipText}>{p}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      <Text style={[styles.nearbyLabel, { color: colors.textMuted }]}>
                        YAQIN DAM OLISH MASKANLARI
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 12, paddingRight: 16 }}
                      >
                        {group.map((h) => (
                          <Pressable
                            key={h._id}
                            onPress={() => router.push(`/hotel/${h._id}`)}
                            style={({ pressed }) => [
                              styles.miniCard,
                              {
                                backgroundColor: colors.bgCard,
                                borderColor: colors.border,
                                transform: [{ scale: pressed ? 0.98 : 1 }],
                              },
                            ]}
                          >
                            {!!h.images?.[0] && (
                              <Image
                                source={{ uri: imgSrc(h.images[0]) }}
                                style={styles.miniCardImage}
                                contentFit="cover"
                                transition={200}
                              />
                            )}
                            <View style={styles.miniCardBody}>
                              <Text
                                style={[styles.miniCardName, { color: colors.textMain }]}
                                numberOfLines={1}
                              >
                                {h.name}
                              </Text>
                              <View style={styles.miniCardMeta}>
                                <Text style={[styles.miniCardCategory, { color: colors.textMuted }]}>
                                  {h.category}
                                </Text>
                                <View style={styles.miniCardRating}>
                                  <FontAwesome name="star" size={11} color="#f59e0b" />
                                  <Text style={styles.miniCardRatingText}>
                                    {typeof h.rating === 'number' ? h.rating.toFixed(1) : h.rating}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Mashhur mehmonxonalar ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Feather name="trending-up" size={20} color="#f43f5e" />
                <Text style={[styles.sectionTitle, { color: colors.textMain }]}>
                  Mashhur mehmonxonalar
                </Text>
              </View>
              {!loading && hotels.length > 0 && (
                <Pressable onPress={() => router.push('/search')} style={styles.seeAll}>
                  <Text style={styles.seeAllText}>Hammasi</Text>
                  <Feather name="chevron-right" size={16} color="#6366f1" />
                </Pressable>
              )}
            </View>

            {error && (
              <View style={styles.errorBanner}>
                <Feather name="alert-triangle" size={18} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
                <Pressable
                  onPress={fetchHotels}
                  style={({ pressed }) => [
                    styles.retryBtn,
                    { transform: [{ scale: pressed ? 0.95 : 1 }] },
                  ]}
                >
                  <Feather name="rotate-cw" size={12} color="#fff" />
                  <Text style={styles.retryBtnText}>Qayta urinish</Text>
                </Pressable>
              </View>
            )}

            {loading ? (
              <View style={styles.cardGrid}>
                {[1, 2, 3, 4].map((i) => (
                  <View key={i} style={styles.gridItem}>
                    <SkeletonCard />
                  </View>
                ))}
              </View>
            ) : hotels.length > 0 ? (
              <View style={styles.cardGrid}>
                {hotels.map((hotel) => (
                  <View key={hotel._id} style={styles.gridItem}>
                    <HotelCard hotel={hotel} />
                  </View>
                ))}
              </View>
            ) : !error ? (
              <View
                style={[styles.empty, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              >
                <Feather name="frown" size={56} color="#d1d5db" />
                <Text style={[styles.emptyTitle, { color: colors.textMain }]}>
                  Mehmonxonalar topilmadi
                </Text>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  Ma'lumot qo'shish uchun backend'da `npm run seed` ni ishga tushiring.
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {/* ── Yuqoriga qaytish ── */}
      {showTop && (
        <Pressable
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
          accessibilityLabel="Yuqoriga"
          style={({ pressed }) => [
            styles.scrollTopWrap,
            { transform: [{ scale: pressed ? 0.92 : 1 }] },
          ]}
        >
          <LinearGradient
            colors={colors.gradientMain}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scrollTop}
          >
            <Feather name="arrow-up" size={20} color="#fff" />
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    overflow: 'hidden',
  },

  heroContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 64,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 16,
  },
  locationPillText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: FONT.black,
    letterSpacing: 2.4,
  },
  heroTitle: {
    color: '#fff',
    fontFamily: FONT.black,
    textAlign: 'center',
    letterSpacing: -0.7,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 8 },
    textShadowRadius: 40,
  },
  heroTitleGradient: {
    fontFamily: FONT.black,
    textAlign: 'center',
    letterSpacing: -0.7,
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 24,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: rs(15),
    lineHeight: rs(23),
    fontFamily: FONT.medium,
    textAlign: 'center',
    maxWidth: rs(340),
    marginBottom: 24,
  },
  searchShortcut: {
    width: '100%',
    maxWidth: 384,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  searchIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchShortcutText: {
    flex: 1,
    color: 'rgba(255,255,255,0.85)',
    fontSize: rs(15),
    fontFamily: FONT.bold,
  },
  bottomWave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 96,
  },
  main: {
    paddingHorizontal: 16,
    // Planshetlarda kontent cho'zilib ketmasin
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  districtGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: -32,
    marginBottom: 32,
    paddingHorizontal: 4,
    zIndex: 10,
  },
  districtCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  districtName: {
    fontSize: rs(16),
    fontFamily: FONT.black,
    textAlign: 'center',
  },
  districtCount: {
    fontSize: rs(9.5),
    fontFamily: FONT.bold,
    letterSpacing: 0.9,
  },
  section: {
    marginBottom: 48,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  sectionTitle: {
    fontSize: rs(21),
    fontFamily: FONT.black,
  },
  sectionSub: {
    fontSize: rs(13),
    fontFamily: FONT.medium,
    marginTop: -14,
    marginBottom: 20,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: rs(15),
    fontFamily: FONT.bold,
    color: '#6366f1',
  },
  categoryRow: {
    gap: 12,
    paddingRight: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: rs(18),
    paddingVertical: rs(12),
    borderRadius: 16,
    borderWidth: 1.5,
  },
  categoryText: {
    fontSize: rs(15),
    fontFamily: FONT.bold,
  },
  mapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(99,102,241,0.09)',
    borderWidth: 1.5,
    borderColor: 'rgba(99,102,241,0.22)',
    marginBottom: 40,
  },
  mapLinkIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  mapLinkTitle: {
    fontSize: rs(16),
    fontFamily: FONT.extrabold,
    marginBottom: 2,
  },
  mapLinkSub: {
    fontSize: rs(13),
    fontFamily: FONT.medium,
  },
  // Web `hotel-grid` ekvivalenti: telefonda 1, keng ekranlarda 2-3 ustun
  cardGrid: {
    gap: 16,
    flexDirection: GRID_COLUMNS > 1 ? 'row' : 'column',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: GRID_ITEM_WIDTH,
  },
  districtPanel: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  districtPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  districtPanelTitle: {
    fontSize: 16,
    fontFamily: FONT.black,
  },
  placeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  placeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
  },
  placeChipText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#d97706',
  },
  nearbyLabel: {
    fontSize: 10,
    fontFamily: FONT.black,
    letterSpacing: 1,
    marginBottom: 8,
  },
  miniCard: {
    width: rs(190),
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  miniCardImage: {
    width: '100%',
    height: rs(104),
  },
  miniCardBody: {
    padding: rs(11),
  },
  miniCardName: {
    fontSize: rs(15),
    fontFamily: FONT.bold,
  },
  miniCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  miniCardCategory: {
    fontSize: 11,
    fontFamily: FONT.medium,
    textTransform: 'capitalize',
  },
  miniCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  miniCardRatingText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#f59e0b',
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
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: FONT.bold,
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
  scrollTopWrap: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    zIndex: 50,
  },
  scrollTop: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
});
