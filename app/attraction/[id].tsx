/**
 * attraction/[id].tsx — Tarixiy joy detali (web `pages/AttractionDetail.jsx` porti).
 * Galereya + 360° video + atrofdagi joylar + atmosfera + sharh formasi +
 * yaqin tunash maskanlari.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Feather, FontAwesome, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import {
  addAttractionReview,
  fetchAttraction,
  fetchNearbyStays,
} from '@/services/attractions';
import { useAuth, useTheme } from '@/hooks/useTheme';
import { AMBER_GRADIENT, FONT } from '@/constants/theme';
import { FALLBACK_ATTRACTION_IMAGE, imgSrc } from '@/constants/config';
import { HotelCard } from '@/components/HotelCard';
import { SectionCard } from '@/components/SectionCard';
import { BackButton } from '@/components/ui/BackButton';
import { Loader } from '@/components/ui/Loader';
import { StarRow } from '@/components/ui/StarRow';
import type { Attraction, Hotel } from '@/types/models';

const TYPE_LABELS: Record<string, string> = {
  tabiat: '🌿 Tabiat',
  tarix: '🏛️ Tarix',
  bozor: '🛍️ Bozor',
  ovqat: '🍽️ Ovqat',
  diniy: '🕌 Diniy',
  boshqa: '📍 Boshqa',
};

const getYouTubeEmbedUrl = (url?: string): string => {
  if (!url) return '';
  const re = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const m = url.match(re);
  return m && m[2].length === 11 ? `https://www.youtube.com/embed/${m[2]}?autoplay=1&rel=0` : url;
};

export default function AttractionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colors, darkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const galleryWidth = width - 32;

  const [a, setA] = useState<Attraction | null>(null);
  const [nearby, setNearby] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const galleryRef = useRef<FlatList<string>>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAttraction(id);
        setA(data);
        const near = await fetchNearbyStays(id);
        setNearby(Array.isArray(near) ? near : near.data || []);
      } catch {
        setError("Ma'lumotni yuklashda xatolik yuz berdi.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const submitReview = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setSubmitting(true);
    try {
      await addAttractionReview(id, reviewForm);
      const fresh = await fetchAttraction(id);
      setA(fresh);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      if (__DEV__) console.error('[AttractionDetail] sharh xatosi:', (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgMain, justifyContent: 'center' }}>
        <Loader message="Yuklanmoqda..." />
      </View>
    );
  }

  if (error || !a) {
    return (
      <View style={[styles.errorScreen, { backgroundColor: colors.bgMain }]}>
        <Feather name="frown" size={48} color="#9ca3af" />
        <Text style={[styles.errorTitle, { color: colors.textMain }]}>Xatolik yuz berdi</Text>
        <Text style={[styles.errorSub, { color: colors.textMuted }]}>{error}</Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.errorBtn, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}
        >
          <Text style={styles.errorBtnText}>Orqaga</Text>
        </Pressable>
      </View>
    );
  }

  const images = a.images?.length ? a.images : [FALLBACK_ATTRACTION_IMAGE];

  const accFeatures = Object.entries({
    wheelchairAccessible: 'Aravacha uchun qulay',
    accessibleParking: 'Maxsus parking',
    accessibleToilet: 'Inklyuziv hojatxona',
    brailleSigns: 'Brayl yozuvlari',
    audioGuides: "Ovozli yo'riqnoma",
    signLanguageStaff: 'Imo-ishora tili',
    quietZones: 'Shovqinsiz hudud',
    serviceAnimalFriendly: "Yo'l-yo'riq hayvonlari",
  }).filter(([k]) => a.accessibility?.[k]);

  const reviews = (a.reviews || []).slice().reverse();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgMain }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 48,
        }}
      >
        <View style={{ marginBottom: 16 }}>
          <BackButton />
        </View>

        {/* ── Sarlavha ── */}
        <View style={{ marginBottom: 24 }}>
          <View style={styles.pillRow}>
            <View
              style={[
                styles.landmarkPill,
                { backgroundColor: darkMode ? 'rgba(120,53,15,0.4)' : '#fffbeb' },
              ]}
            >
              <MaterialCommunityIcons name="bank" size={12} color={darkMode ? '#fbbf24' : '#d97706'} />
              <Text style={[styles.landmarkPillText, { color: darkMode ? '#fbbf24' : '#d97706' }]}>
                TARIXIY JOY
              </Text>
            </View>
            <View style={styles.districtRow}>
              <Feather name="map-pin" size={14} color="#f43f5e" />
              <Text style={[styles.districtText, { color: colors.textMuted }]}>
                {a.district} tumani
              </Text>
            </View>
          </View>
          <Text style={[styles.title, { color: colors.textMain }]}>{a.name}</Text>
          {!!a.address && (
            <View style={styles.addressRow}>
              <Feather name="map-pin" size={16} color="#f43f5e" />
              <Text style={[styles.addressText, { color: colors.textMuted }]}>{a.address}</Text>
            </View>
          )}

          {/* Reyting kartasi */}
          {typeof a.rating === 'number' && a.rating > 0 && (
            <View
              style={[
                styles.ratingBox,
                {
                  backgroundColor: darkMode ? 'rgba(120,53,15,0.2)' : '#fffbeb',
                  borderColor: darkMode ? 'rgba(120,53,15,0.3)' : '#fef3c7',
                },
              ]}
            >
              <View style={styles.ratingSquare}>
                <Text style={styles.ratingSquareText}>{a.rating.toFixed(1)}</Text>
              </View>
              <View>
                <Text style={[styles.ratingLabel, { color: darkMode ? '#fde68a' : '#451a03' }]}>
                  Sayohatchilar bahosi
                </Text>
                <Text style={[styles.ratingCount, { color: darkMode ? 'rgba(251,191,36,0.85)' : 'rgba(217,119,6,0.85)' }]}>
                  {a.reviewsCount || 0} ta sharh
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Galereya ── */}
        <View style={[styles.gallery, { borderColor: colors.border }]}>
          <FlatList
            ref={galleryRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            onMomentumScrollEnd={(e) =>
              setActiveImg(Math.round(e.nativeEvent.contentOffset.x / galleryWidth))
            }
            renderItem={({ item }) => (
              <Image
                source={{ uri: imgSrc(item, FALLBACK_ATTRACTION_IMAGE) }}
                style={{ width: galleryWidth, height: 300 }}
                contentFit="cover"
                transition={200}
              />
            )}
          />
          {images.length > 1 && (
            <View style={styles.imgCounter}>
              <Text style={styles.imgCounterText}>
                {activeImg + 1} / {images.length}
              </Text>
            </View>
          )}
          {/* 360° video tugmasi */}
          {!!a.video360?.url && (
            <Pressable
              onPress={() => setVideoOpen(true)}
              accessibilityLabel="360° videoni ochish"
              style={({ pressed }) => [
                styles.videoBtn,
                { transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}
            >
              <Feather name="play-circle" size={18} color="#b45309" />
              <Text style={styles.videoBtnText}>360° video</Text>
              {a.video360.captioned && (
                <View style={styles.ccBadge}>
                  <Text style={styles.ccBadgeText}>CC</Text>
                </View>
              )}
            </Pressable>
          )}
        </View>

        {/* ── Joy haqida ── */}
        <SectionCard
          title="Joy haqida"
          accent="amber"
          icon={<Feather name="award" size={16} color={darkMode ? '#fbbf24' : '#d97706'} />}
          style={{ marginTop: 24 }}
        >
          <Text style={[styles.desc, { color: darkMode ? '#cbd5e1' : '#374151' }]}>
            {a.description}
          </Text>
          <View style={styles.metaChips}>
            {!!a.entryFee && (
              <View style={styles.feeChip}>
                <Text style={styles.feeChipText}>Kirish: {a.entryFee}</Text>
              </View>
            )}
            {!!a.bestSeason && (
              <View style={styles.seasonChip}>
                <Feather name="sun" size={14} color="#0369a1" />
                <Text style={styles.seasonChipText}>{a.bestSeason}</Text>
              </View>
            )}
          </View>
        </SectionCard>

        {/* ── Atrofda nima bor ── */}
        {!!a.thingsToSeeAround?.length && (
          <SectionCard
            title="Atrofda aylanishga arzigulik"
            accent="amber"
            icon={<Feather name="navigation" size={16} color={darkMode ? '#fbbf24' : '#d97706'} />}
          >
            <View style={{ gap: 16 }}>
              {a.thingsToSeeAround.map((t, i) => (
                <View
                  key={i}
                  style={[styles.thingCard, { backgroundColor: colors.bgHover, borderColor: colors.border }]}
                >
                  <View style={styles.thingHeader}>
                    <Text style={[styles.thingType, { color: colors.textMuted }]}>
                      {(TYPE_LABELS[t.type || ''] || t.type || '').toUpperCase()}
                    </Text>
                    {Number.isFinite(t.walkingMinutes) && (
                      <View style={styles.walkingRow}>
                        <Feather name="clock" size={12} color="#6366f1" />
                        <Text style={styles.walkingText}>{t.walkingMinutes} daq piyoda</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.thingTitle, { color: colors.textMain }]}>{t.title}</Text>
                  {!!t.description && (
                    <Text style={[styles.thingDesc, { color: colors.textMuted }]}>{t.description}</Text>
                  )}
                </View>
              ))}
            </View>
          </SectionCard>
        )}

        {/* ── Atmosfera ── */}
        {a.atmosphere &&
          (a.atmosphere.mood ||
            a.atmosphere.soundscape ||
            a.atmosphere.bestTimeOfDay ||
            a.atmosphere.localTip) && (
            <SectionCard
              title="Joy atmosferasi"
              accent="amber"
              icon={<Feather name="feather" size={16} color={darkMode ? '#fbbf24' : '#d97706'} />}
            >
              <View style={{ gap: 16 }}>
                {!!a.atmosphere.mood && (
                  <View style={[styles.atmoCard, { backgroundColor: colors.bgHover, borderColor: colors.border }]}>
                    <Text style={styles.atmoEmoji}>🌿</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.atmoKicker, { color: colors.textMuted }]}>KAYFIYAT</Text>
                      <Text style={[styles.atmoText, { color: colors.textMain }]}>{a.atmosphere.mood}</Text>
                    </View>
                  </View>
                )}
                {!!a.atmosphere.bestTimeOfDay && (
                  <View style={[styles.atmoCard, { backgroundColor: colors.bgHover, borderColor: colors.border }]}>
                    <Text style={styles.atmoEmoji}>🕐</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.atmoKicker, { color: colors.textMuted }]}>ENG YAXSHI VAQT</Text>
                      <Text style={[styles.atmoText, { color: colors.textMain }]}>
                        {a.atmosphere.bestTimeOfDay}
                      </Text>
                    </View>
                  </View>
                )}
                {!!a.atmosphere.soundscape && (
                  <View style={[styles.atmoCard, { backgroundColor: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.15)' }]}>
                    <Text style={styles.atmoEmoji}>🎵</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.atmoKicker, { color: '#6366f1' }]}>OVOZ MANZARASI</Text>
                      <Text style={[styles.atmoText, styles.atmoItalic, { color: colors.textMain }]}>
                        "{a.atmosphere.soundscape}"
                      </Text>
                    </View>
                  </View>
                )}
                {!!a.atmosphere.localTip && (
                  <View style={[styles.atmoCard, { backgroundColor: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.15)' }]}>
                    <Text style={styles.atmoEmoji}>💡</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.atmoKicker, { color: '#d97706' }]}>MAHALLIY MASLAHAT</Text>
                      <Text style={[styles.atmoText, { color: colors.textMain }]}>{a.atmosphere.localTip}</Text>
                    </View>
                  </View>
                )}
              </View>
            </SectionCard>
          )}

        {/* ── Inklyuziv qulayliklar ── */}
        {accFeatures.length > 0 && (
          <SectionCard
            title="Inklyuziv qulayliklar"
            accent="amber"
            icon={<MaterialIcons name="accessible" size={18} color={darkMode ? '#fbbf24' : '#d97706'} />}
          >
            <View style={{ gap: 8 }}>
              {accFeatures.map(([, label]) => (
                <View key={label} style={styles.featureRow}>
                  <Feather name="check" size={16} color="#10b981" />
                  <Text style={[styles.featureText, { color: darkMode ? '#cbd5e1' : '#374151' }]}>{label}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        )}

        {/* ── Sayohatchilar fikri ── */}
        <SectionCard
          title="Sayohatchilar fikri"
          accent="amber"
          icon={<Feather name="star" size={16} color={darkMode ? '#fbbf24' : '#d97706'} />}
        >
          {/* Sharh qoldirish */}
          <View style={[styles.reviewFormCard, { backgroundColor: colors.bgHover, borderColor: colors.border }]}>
            <View style={styles.ratingPicker}>
              <Text style={[styles.ratingPickerLabel, { color: colors.textMuted }]}>Bahongiz:</Text>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setReviewForm((p) => ({ ...p, rating: n }))}>
                  <FontAwesome
                    name={n <= reviewForm.rating ? 'star' : 'star-o'}
                    size={20}
                    color={n <= reviewForm.rating ? '#f59e0b' : '#cbd5e1'}
                  />
                </Pressable>
              ))}
            </View>
            <TextInput
              value={reviewForm.comment}
              onChangeText={(v) => setReviewForm((p) => ({ ...p, comment: v }))}
              placeholder="Bu joy haqida taassurotingiz..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={2}
              style={[
                styles.reviewInput,
                { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textMain },
              ]}
            />
            <Pressable
              onPress={submitReview}
              disabled={submitting}
              style={({ pressed }) => [
                { transform: [{ scale: pressed ? 0.97 : 1 }], opacity: submitting ? 0.5 : 1, alignSelf: 'flex-start' },
              ]}
            >
              <LinearGradient
                colors={AMBER_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.reviewSubmit}
              >
                {submitting && <ActivityIndicator size="small" color="#fff" />}
                <Text style={styles.reviewSubmitText}>
                  {submitting ? 'Yuborilmoqda...' : 'Sharh qoldirish'}
                </Text>
              </LinearGradient>
            </Pressable>
            {!user && (
              <Text style={[styles.loginHint, { color: colors.textMuted }]}>
                Sharh qoldirish uchun tizimga kirgan bo'lishingiz kerak.
              </Text>
            )}
          </View>

          {/* Sharhlar ro'yxati */}
          <View style={{ gap: 20 }}>
            {reviews.map((rv, i) => (
              <View key={rv._id || i} style={[styles.reviewItem, { borderBottomColor: colors.border }]}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewUser}>
                    <LinearGradient
                      colors={['#f59e0b', '#ea580c']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.reviewAvatar}
                    >
                      <Text style={styles.reviewAvatarText}>
                        {rv.name?.[0]?.toUpperCase() || 'M'}
                      </Text>
                    </LinearGradient>
                    <View>
                      <Text style={[styles.reviewName, { color: colors.textMain }]}>
                        {rv.name || 'Mehmon'}
                      </Text>
                      <Text style={styles.reviewDate}>
                        {rv.createdAt ? new Date(rv.createdAt).toLocaleDateString('uz-UZ') : ''}
                      </Text>
                    </View>
                  </View>
                  <StarRow rating={rv.rating} />
                </View>
                {!!rv.comment && (
                  <Text style={[styles.reviewComment, { color: darkMode ? '#cbd5e1' : '#374151' }]}>
                    "{rv.comment}"
                  </Text>
                )}
              </View>
            ))}
            {reviews.length === 0 && (
              <Text style={[styles.noData, { color: colors.textMuted }]}>
                Hozircha sharhlar yo'q. Birinchi bo'ling!
              </Text>
            )}
          </View>
        </SectionCard>

        {/* ── Yaqin tunash joylari ── */}
        <SectionCard
          title="Yaqin tunash joylari"
          icon={<Feather name="home" size={16} color={darkMode ? '#818cf8' : '#4f46e5'} />}
        >
          <Text style={[styles.nearbyHint, { color: colors.textMuted }]}>
            10 km radiusdagi dam olish maskanlari. Eng yaqini avtomatik tanlangan — egasi bilan
            suhbatlashing.
          </Text>

          {nearby.length > 0 ? (
            <View style={{ gap: 16 }}>
              {/* Eng yaqin tunash joyi */}
              <View
                style={[
                  styles.nearestWrap,
                  {
                    borderColor: darkMode ? 'rgba(67,56,202,0.6)' : '#a5b4fc',
                    backgroundColor: darkMode ? 'rgba(49,46,129,0.15)' : 'rgba(238,242,255,0.5)',
                  },
                ]}
              >
                <View style={styles.nearestHeader}>
                  <View style={styles.nearestBadge}>
                    <FontAwesome name="star" size={10} color="#fff" />
                    <Text style={styles.nearestBadgeText}>ENG YAQIN</Text>
                  </View>
                  {Number.isFinite(nearby[0].distanceKm) && (
                    <View style={styles.distanceRow}>
                      <Feather name="navigation" size={12} color={darkMode ? '#818cf8' : '#4f46e5'} />
                      <Text style={[styles.distanceText, { color: darkMode ? '#818cf8' : '#4f46e5' }]}>
                        {nearby[0].distanceKm} km
                      </Text>
                    </View>
                  )}
                </View>
                <HotelCard hotel={nearby[0]} />
              </View>

              {/* Qolgan yaqin joylar */}
              {nearby.length > 1 && (
                <>
                  <Text style={[styles.otherLabel, { color: colors.textMuted }]}>
                    BOSHQA YAQIN JOYLAR
                  </Text>
                  {nearby.slice(1).map((h) => (
                    <View key={h._id}>
                      <HotelCard hotel={h} />
                      {Number.isFinite(h.distanceKm) && (
                        <View style={[styles.distanceRow, { marginTop: 6, marginLeft: 4 }]}>
                          <Feather name="navigation" size={12} color="#6366f1" />
                          <Text style={[styles.distanceText, { color: '#6366f1' }]}>
                            Taxminan {h.distanceKm} km uzoqlikda
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </>
              )}
            </View>
          ) : (
            <Text style={[styles.noData, { color: colors.textMuted, textAlign: 'center', paddingVertical: 16 }]}>
              Yaqin atrofda tunash maskani topilmadi.
            </Text>
          )}
        </SectionCard>
      </ScrollView>

      {/* ── 360° video modal ── */}
      <Modal visible={videoOpen} animationType="fade" onRequestClose={() => setVideoOpen(false)}>
        <View style={styles.videoModal}>
          <Pressable style={styles.modalClose} onPress={() => setVideoOpen(false)}>
            <Feather name="x" size={20} color="#fff" />
          </Pressable>
          {!!a.video360?.url && (
            <WebView
              source={{
                uri:
                  a.video360.type === 'file'
                    ? imgSrc(a.video360.url)
                    : getYouTubeEmbedUrl(a.video360.url),
              }}
              style={{ flex: 1, backgroundColor: '#000' }}
              allowsFullscreenVideo
              startInLoadingState
              renderLoading={() => (
                <View style={styles.videoLoading}>
                  <ActivityIndicator size="large" color="#fff" />
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  errorScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: FONT.bold,
    marginTop: 16,
    marginBottom: 8,
  },
  errorSub: {
    fontSize: 14,
    fontFamily: FONT.regular,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorBtn: {
    backgroundColor: '#d97706',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  errorBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONT.semibold,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  landmarkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  landmarkPillText: {
    fontSize: 10,
    fontFamily: FONT.extrabold,
    letterSpacing: 0.8,
  },
  districtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  districtText: {
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: FONT.extrabold,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONT.semibold,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  ratingSquare: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  ratingSquareText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: FONT.black,
  },
  ratingLabel: {
    fontSize: 14,
    fontFamily: FONT.black,
  },
  ratingCount: {
    fontSize: 12,
    fontFamily: FONT.bold,
    marginTop: 2,
  },
  gallery: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imgCounter: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  imgCounterText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  videoBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.7)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  videoBtnText: {
    fontSize: 13,
    fontFamily: FONT.black,
    color: '#b45309',
  },
  ccBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ccBadgeText: {
    color: '#1d4ed8',
    fontSize: 9,
    fontFamily: FONT.black,
  },
  desc: {
    fontSize: 14,
    fontFamily: FONT.regular,
    lineHeight: 22,
  },
  metaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 20,
  },
  feeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  feeChipText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#047857',
  },
  seasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(14,165,233,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.25)',
  },
  seasonChipText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#0369a1',
  },
  thingCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  thingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  thingType: {
    fontSize: 10,
    fontFamily: FONT.black,
    letterSpacing: 1,
  },
  walkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  walkingText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#6366f1',
  },
  thingTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  thingDesc: {
    fontSize: 12,
    fontFamily: FONT.regular,
    lineHeight: 18,
    marginTop: 4,
  },
  atmoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  atmoEmoji: {
    fontSize: 20,
  },
  atmoKicker: {
    fontSize: 10,
    fontFamily: FONT.black,
    letterSpacing: 1,
    marginBottom: 4,
  },
  atmoText: {
    fontSize: 14,
    fontFamily: FONT.bold,
    lineHeight: 20,
  },
  atmoItalic: {
    fontStyle: 'italic',
    fontFamily: FONT.medium,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.medium,
  },
  reviewFormCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  ratingPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  ratingPickerLabel: {
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  reviewInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FONT.regular,
    minHeight: 64,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  reviewSubmit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  reviewSubmitText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  loginHint: {
    fontSize: 11,
    fontFamily: FONT.regular,
    marginTop: 8,
  },
  reviewItem: {
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONT.black,
  },
  reviewName: {
    fontSize: 14,
    fontFamily: FONT.black,
  },
  reviewDate: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#94a3b8',
    marginTop: 2,
  },
  reviewComment: {
    fontSize: 14,
    fontFamily: FONT.regular,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  noData: {
    fontSize: 12,
    fontFamily: FONT.regular,
    fontStyle: 'italic',
  },
  nearbyHint: {
    fontSize: 11,
    fontFamily: FONT.regular,
    lineHeight: 16,
    marginBottom: 16,
  },
  nearestWrap: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 10,
  },
  nearestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  nearestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4f46e5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  nearestBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: FONT.black,
    letterSpacing: 0.9,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 11,
    fontFamily: FONT.black,
  },
  otherLabel: {
    fontSize: 10,
    fontFamily: FONT.black,
    letterSpacing: 1,
    marginLeft: 4,
  },
  videoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 48,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
});
