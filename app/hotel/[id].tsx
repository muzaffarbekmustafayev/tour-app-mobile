/**
 * hotel/[id].tsx — Mehmonxona detali (web `pages/HotelDetail.jsx` porti).
 * Galereya + sarlavha + tavsif (ovozli tinglash) + atmosfera + xonalar +
 * qulayliklar + sharhlar + bog'lanish + video/panorama modallari.
 */
import React, { useEffect, useRef, useState, type ReactElement } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import {
  Feather,
  FontAwesome5,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import api from '@/services/api';
import { useAuth, useTheme } from '@/hooks/useTheme';
import { FONT } from '@/constants/theme';
import { FALLBACK_DETAIL_IMAGE, imgSrc } from '@/constants/config';
import { calcAccessibilityScore, getScoreStyle } from '@/utils/accessibilityScore';
import { SectionCard } from '@/components/SectionCard';
import { BackButton } from '@/components/ui/BackButton';
import { Loader } from '@/components/ui/Loader';
import { StarRow } from '@/components/ui/StarRow';
import type { Hotel, Review } from '@/types/models';

type FeatherName = keyof typeof Feather.glyphMap;

/* Qulaylik nomlari uchun ikonkalar (web AMENITY_ICONS ekvivalenti) */
const AMENITY_ICONS: Record<string, FeatherName> = {
  'Free WiFi': 'wifi',
  Pool: 'droplet',
  Spa: 'heart',
  Restaurant: 'coffee',
  Gym: 'check-circle',
  Parking: 'map-pin',
  'Air Conditioning': 'wind',
  'Airport Shuttle': 'map',
  Bar: 'coffee',
  'Meeting Rooms': 'briefcase',
};

const getYouTubeEmbedUrl = (url?: string): string => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11
    ? `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`
    : url;
};

const ratingLabel = (rating?: number): string => {
  if (!rating) return 'Yaxshi';
  if (rating >= 4.7) return 'Mukammal';
  if (rating >= 4.3) return 'Juda yaxshi';
  if (rating >= 4.0) return 'Ajoyib';
  return 'Yaxshi';
};

export default function HotelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colors, darkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const galleryWidth = width - 32;

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [videoModal, setVideoModal] = useState(false);
  const [panoramaModal, setPanoramaModal] = useState<number | null>(null);
  // Web "sticky header" — 300px dan pastga scroll qilinganda ko'rinadi
  const [showSticky, setShowSticky] = useState(false);
  const galleryRef = useRef<FlatList<string>>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [h, r] = await Promise.all([
          api.get<Hotel>(`/hotels/${id}`),
          api.get<Review[]>(`/reviews/hotel/${id}`),
        ]);
        setHotel(h.data);
        setReviews(r.data);
      } catch {
        setError("Ma'lumotlarni yuklashda xatolik yuz berdi.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Sahifadan chiqishda ovozni to'xtatish
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  /* ── Ovozli tinglash (TTS) — qurilma ovozi, o'zbekcha urinish ── */
  const speakDescription = () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    const text = [hotel?.name, hotel?.description].filter(Boolean).join('. ');
    if (!text.trim()) return;
    setSpeaking(true);
    Speech.speak(text, {
      language: 'uz-UZ', // qurilmada o'zbek ovozi bo'lmasa standart ovoz ishlatiladi
      rate: 0.95,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgMain, justifyContent: 'center' }}>
        <Loader message="Yuklanmoqda..." />
      </View>
    );
  }

  if (error || !hotel) {
    return (
      <View style={[styles.errorScreen, { backgroundColor: colors.bgMain }]}>
        <Feather name="frown" size={48} color="#9ca3af" />
        <Text style={[styles.errorTitle, { color: colors.textMain }]}>Xatolik yuz berdi</Text>
        <Text style={[styles.errorSub, { color: colors.textMuted }]}>{error}</Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.errorBtn,
            { transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <Text style={styles.errorBtnText}>Orqaga</Text>
        </Pressable>
      </View>
    );
  }

  const images = hotel.images?.length ? hotel.images : [FALLBACK_DETAIL_IMAGE];
  const name = hotel.name;

  /* Inklyuziv xususiyatlar (web accessFeatures bilan bir xil) */
  const accessFeatures: [ReactElement, string][] = (
    [
      [hotel.accessibility?.mobility?.wheelchairAccessible, <MaterialCommunityIcons key="w" name="wheelchair-accessibility" size={16} color="#6366f1" />, "Aravacha uchun yo'l"],
      [hotel.accessibility?.mobility?.elevator, <MaterialIcons key="e" name="bolt" size={16} color="#8b5cf6" />, 'Keng liftlar'],
      [hotel.accessibility?.mobility?.accessibleParking, <MaterialIcons key="p" name="accessible" size={16} color="#3b82f6" />, 'Maxsus parking'],
      [hotel.accessibility?.visual?.brailleSigns, <FontAwesome5 key="b" name="braille" size={14} color="#10b981" />, 'Brayl yozuvlari'],
      [hotel.accessibility?.visual?.tactilePaving, <MaterialIcons key="t" name="visibility" size={16} color="#14b8a6" />, "Taktil yo'lakcha"],
      [hotel.accessibility?.visual?.highContrastSignage, <MaterialIcons key="c" name="visibility" size={16} color="#22c55e" />, 'Kontrast belgilar'],
      [hotel.accessibility?.auditory?.hearingAssistance, <MaterialCommunityIcons key="h" name="ear-hearing" size={16} color="#0ea5e9" />, 'Eshitish uskunalari'],
      [hotel.accessibility?.auditory?.signLanguageStaff, <FontAwesome5 key="s" name="sign-language" size={14} color="#06b6d4" />, 'Imo-ishora tili xodimi'],
      [hotel.accessibility?.auditory?.audioGuides, <MaterialIcons key="a" name="hearing" size={16} color="#60a5fa" />, "Ovozli yo'riqnoma"],
      [hotel.accessibility?.cognitive?.quietZones, <FontAwesome5 key="q" name="hand-paper" size={14} color="#f59e0b" />, 'Shovqinsiz hudud'],
      [hotel.familyAndElderly?.strollerAccessible, <MaterialIcons key="f" name="family-restroom" size={16} color="#ec4899" />, 'Bolalar aravachasi'],
      [hotel.familyAndElderly?.medicalServiceOnSite, <MaterialIcons key="m" name="local-hospital" size={16} color="#ef4444" />, 'Tibbiy yordam punkti'],
    ] as [boolean | undefined, ReactElement, string][]
  )
    .filter(([cond]) => cond)
    .map(([, icon, label]) => [icon, label] as [ReactElement, string]);

  const accScore = calcAccessibilityScore(hotel);
  const scoreStyle = getScoreStyle(accScore);
  const phone = hotel.contact?.phone || (typeof hotel.owner === 'object' ? hotel.owner?.phone : undefined);
  const email = hotel.contact?.email || (typeof hotel.owner === 'object' ? hotel.owner?.email : undefined);

  const categoryStyle =
    hotel.category === 'resort'
      ? { bg: darkMode ? 'rgba(6,78,59,0.4)' : '#ecfdf5', text: darkMode ? '#34d399' : '#059669' }
      : hotel.category === 'hostel'
        ? { bg: darkMode ? 'rgba(120,53,15,0.4)' : '#fffbeb', text: darkMode ? '#fbbf24' : '#d97706' }
        : { bg: darkMode ? 'rgba(49,46,129,0.4)' : '#eef2ff', text: darkMode ? '#818cf8' : '#4f46e5' };

  const categoryLabel =
    hotel.category === 'hotel'
      ? 'Mehmonxona'
      : hotel.category === 'resort'
        ? 'Dam olish maskani'
        : 'Hostel';

  const handleChat = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    Alert.alert('Egasi bilan suhbat', "Mobil ilovada chat tez orada qo'shiladi.");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgMain }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={(e) => setShowSticky(e.nativeEvent.contentOffset.y > 300)}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 120,
        }}
      >
        <View style={{ marginBottom: 16 }}>
          <BackButton />
        </View>

        {/* ── Sarlavha ── */}
        <View style={{ marginBottom: 24 }}>
          <View style={styles.pillRow}>
            <View style={[styles.categoryPill, { backgroundColor: categoryStyle.bg }]}>
              <Text style={[styles.categoryPillText, { color: categoryStyle.text }]}>
                {categoryLabel.toUpperCase()}
              </Text>
            </View>
            <View
              style={[
                styles.starsPill,
                { backgroundColor: colors.bgCard, borderColor: colors.border },
              ]}
            >
              <StarRow rating={hotel.stars || 0} />
            </View>
          </View>
          <Text style={[styles.title, { color: colors.textMain }]}>{name}</Text>
          <View style={styles.addressRow}>
            <Feather name="map-pin" size={16} color="#f43f5e" />
            <Text style={[styles.addressText, { color: colors.textMuted }]}>
              {hotel.address}, {hotel.city}
            </Text>
          </View>

          {/* Reyting kartasi */}
          <View
            style={[
              styles.ratingBox,
              {
                backgroundColor: darkMode ? 'rgba(49,46,129,0.2)' : '#eef2ff',
                borderColor: darkMode ? 'rgba(49,46,129,0.3)' : '#e0e7ff',
              },
            ]}
          >
            <View style={styles.ratingSquare}>
              <Text style={styles.ratingSquareText}>
                {typeof hotel.rating === 'number' ? hotel.rating.toFixed(1) : '0.0'}
              </Text>
            </View>
            <View>
              <Text style={[styles.ratingLabel, { color: darkMode ? '#c7d2fe' : '#1e1b4b' }]}>
                {ratingLabel(hotel.rating)}
              </Text>
              <Text style={[styles.ratingCount, { color: darkMode ? 'rgba(129,140,248,0.85)' : 'rgba(79,70,229,0.85)' }]}>
                {reviews.length} ta sharh
              </Text>
            </View>
          </View>
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
                source={{ uri: imgSrc(item, FALLBACK_DETAIL_IMAGE) }}
                style={{ width: galleryWidth, height: 280 }}
                contentFit="cover"
                transition={200}
              />
            )}
          />
          {/* Rasm soni */}
          <View style={styles.imgCounter}>
            <Text style={styles.imgCounterText}>
              {activeImg + 1} / {images.length}
            </Text>
          </View>
          {/* Media tugmalari */}
          <View style={styles.mediaBtns}>
            {!!hotel.videoTour?.url && (
              <Pressable onPress={() => setVideoModal(true)} style={styles.mediaBtn}>
                <Feather name="rotate-cw" size={14} color="#2563eb" />
                <Text style={[styles.mediaBtnText, { color: '#2563eb' }]}>Video tur</Text>
                {hotel.videoTour.captioned && (
                  <View style={styles.ccBadge}>
                    <Text style={styles.ccBadgeText}>CC</Text>
                  </View>
                )}
              </Pressable>
            )}
            {!!hotel.panoramas?.length && (
              <Pressable onPress={() => setPanoramaModal(0)} style={styles.mediaBtn}>
                <Feather name="maximize" size={14} color="#4f46e5" />
                <Text style={[styles.mediaBtnText, { color: '#4f46e5' }]}>360° Ko'rinish</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Kichik rasmlar */}
        {images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbRow}
          >
            {images.map((img, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  setActiveImg(i);
                  galleryRef.current?.scrollToOffset({ offset: i * galleryWidth, animated: true });
                }}
                style={[
                  styles.thumb,
                  { borderColor: activeImg === i ? '#2563eb' : 'transparent', opacity: activeImg === i ? 1 : 0.6 },
                ]}
              >
                <Image source={{ uri: imgSrc(img) }} style={styles.thumbImg} contentFit="cover" />
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* ── Mehmonxona haqida ── */}
        <SectionCard title="Mehmonxona haqida" icon={<Feather name="award" size={16} color={darkMode ? '#818cf8' : '#4f46e5'} />}>
          <Text style={[styles.desc, { color: darkMode ? '#cbd5e1' : '#374151' }]}>
            {hotel.description}
          </Text>
          {/* Ovozli tinglash */}
          <Pressable
            onPress={speakDescription}
            accessibilityLabel={speaking ? "Ovozli o'qishni to'xtatish" : 'Tavsifni ovozli tinglash'}
            style={({ pressed }) => [
              styles.ttsBtn,
              {
                backgroundColor: speaking
                  ? darkMode
                    ? 'rgba(136,19,55,0.3)'
                    : '#fff1f2'
                  : darkMode
                    ? 'rgba(30,58,138,0.3)'
                    : '#eff6ff',
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
            ]}
          >
            <Feather
              name={speaking ? 'x' : 'volume-2'}
              size={16}
              color={speaking ? '#e11d48' : '#2563eb'}
            />
            <Text style={[styles.ttsBtnText, { color: speaking ? '#e11d48' : '#2563eb' }]}>
              {speaking ? "To'xtatish" : 'Ovozli tinglash'}
            </Text>
          </Pressable>
        </SectionCard>

        {/* ── Joy atmosferasi ── */}
        {hotel.atmosphere &&
          (hotel.atmosphere.mood ||
            hotel.atmosphere.soundscape ||
            hotel.atmosphere.bestTimeOfDay ||
            hotel.atmosphere.localTip) && (
            <SectionCard title="Joy atmosferasi" icon={<Feather name="feather" size={16} color={darkMode ? '#818cf8' : '#4f46e5'} />}>
              <View style={{ gap: 16 }}>
                {!!hotel.atmosphere.mood && (
                  <View style={[styles.atmoCard, { backgroundColor: colors.bgHover, borderColor: colors.border }]}>
                    <Text style={styles.atmoEmoji}>🌿</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.atmoKicker, { color: colors.textMuted }]}>UMUMIY KAYFIYAT</Text>
                      <Text style={[styles.atmoText, { color: colors.textMain }]}>{hotel.atmosphere.mood}</Text>
                    </View>
                  </View>
                )}
                {!!hotel.atmosphere.bestTimeOfDay && (
                  <View style={[styles.atmoCard, { backgroundColor: colors.bgHover, borderColor: colors.border }]}>
                    <Text style={styles.atmoEmoji}>🕐</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.atmoKicker, { color: colors.textMuted }]}>ENG YAXSHI VAQT</Text>
                      <Text style={[styles.atmoText, { color: colors.textMain }]}>{hotel.atmosphere.bestTimeOfDay}</Text>
                    </View>
                  </View>
                )}
                {!!hotel.atmosphere.soundscape && (
                  <View style={[styles.atmoCard, { backgroundColor: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.15)' }]}>
                    <Text style={styles.atmoEmoji}>🎵</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.atmoKicker, { color: '#6366f1' }]}>OVOZ MANZARASI</Text>
                      <Text style={[styles.atmoText, styles.atmoItalic, { color: colors.textMain }]}>
                        "{hotel.atmosphere.soundscape}"
                      </Text>
                    </View>
                  </View>
                )}
                {!!hotel.atmosphere.localTip && (
                  <View style={[styles.atmoCard, { backgroundColor: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.15)' }]}>
                    <Text style={styles.atmoEmoji}>💡</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.atmoKicker, { color: '#d97706' }]}>MAHALLIY MASLAHAT</Text>
                      <Text style={[styles.atmoText, { color: colors.textMain }]}>{hotel.atmosphere.localTip}</Text>
                    </View>
                  </View>
                )}
              </View>
            </SectionCard>
          )}

        {/* ── Yaqin tarixiy joylar ── */}
        {Array.isArray(hotel.nearbyPlaces) && hotel.nearbyPlaces.length > 0 && (
          <SectionCard title="Yaqin tarixiy va diqqatga sazovor joylar" icon={<Feather name="map-pin" size={16} color={darkMode ? '#818cf8' : '#4f46e5'} />}>
            <View style={styles.placeChips}>
              {hotel.nearbyPlaces.map((place, i) => (
                <View key={i} style={styles.placeChip}>
                  <MaterialCommunityIcons name="bank" size={14} color="#d97706" />
                  <Text style={[styles.placeChipText, { color: colors.textMain }]}>{place}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        )}

        {/* ── Mavjud xonalar ── */}
        {!!hotel.rooms?.length && (
          <SectionCard title="Mavjud xonalar" icon={<Feather name="briefcase" size={16} color={darkMode ? '#818cf8' : '#4f46e5'} />}>
            <View style={{ gap: 16 }}>
              {hotel.rooms.map((r) => (
                <View
                  key={r._id}
                  style={[styles.roomCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                >
                  <Text style={[styles.roomName, { color: colors.textMain }]}>{r.name}</Text>
                  <View style={styles.roomMeta}>
                    <View style={[styles.roomTag, { backgroundColor: colors.bgHover, borderColor: colors.border }]}>
                      <Feather name="users" size={13} color="#6366f1" />
                      <Text style={[styles.roomTagText, { color: colors.textMuted }]}>{r.capacity} kishi</Text>
                    </View>
                    {!!r.areaSqMeters && (
                      <View style={[styles.roomTag, { backgroundColor: colors.bgHover, borderColor: colors.border }]}>
                        <Feather name="maximize" size={13} color="#8b5cf6" />
                        <Text style={[styles.roomTagText, { color: colors.textMuted }]}>{r.areaSqMeters} m²</Text>
                      </View>
                    )}
                    {!!r.bedType && (
                      <View style={[styles.roomTag, { backgroundColor: colors.bgHover, borderColor: colors.border }]}>
                        <Text style={[styles.roomTagText, { color: colors.textMuted, textTransform: 'capitalize' }]}>
                          {r.bedType}
                        </Text>
                      </View>
                    )}
                    {!!r.bathroomType && (
                      <View style={[styles.roomTag, { backgroundColor: colors.bgHover, borderColor: colors.border }]}>
                        <Text style={[styles.roomTagText, { color: colors.textMuted }]}>
                          {r.bathroomType === 'private' ? 'Alohida hammom' : 'Umumiy hammom'}
                        </Text>
                      </View>
                    )}
                  </View>
                  {!!r.amenities?.length && (
                    <View style={styles.roomAmenities}>
                      {r.amenities.slice(0, 4).map((a) => (
                        <View key={a} style={styles.roomAmenityChip}>
                          <Text style={styles.roomAmenityText}>{a}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </SectionCard>
        )}

        {/* ── Qulayliklar ── */}
        <SectionCard title="Qulayliklar" icon={<Feather name="check-circle" size={16} color={darkMode ? '#818cf8' : '#4f46e5'} />}>
          <View style={{ gap: 10 }}>
            {hotel.amenities?.map((a) => (
              <View key={a} style={styles.featureRow}>
                <Feather name={AMENITY_ICONS[a] || 'check'} size={16} color="#2563eb" />
                <Text style={[styles.featureText, { color: darkMode ? '#cbd5e1' : '#374151' }]}>{a}</Text>
              </View>
            ))}
            {!hotel.amenities?.length && (
              <Text style={[styles.noData, { color: colors.textMuted }]}>Ma'lumot mavjud emas</Text>
            )}
          </View>
        </SectionCard>

        {/* ── Inklyuziv qulayliklar ── */}
        <SectionCard title="Inklyuziv qulayliklar" icon={<MaterialIcons name="accessible" size={18} color={darkMode ? '#818cf8' : '#4f46e5'} />}>
          <View style={{ gap: 8 }}>
            {accessFeatures.length > 0 ? (
              accessFeatures.map(([icon, label]) => (
                <View key={label} style={styles.featureRow}>
                  {icon}
                  <Text style={[styles.featureText, { color: darkMode ? '#cbd5e1' : '#374151' }]}>{label}</Text>
                </View>
              ))
            ) : (
              <Text style={[styles.noData, { color: colors.textMuted }]}>Ma'lumot mavjud emas</Text>
            )}
          </View>
        </SectionCard>

        {/* ── Mijozlar fikri ── */}
        <SectionCard title="Mijozlar fikri" icon={<Feather name="star" size={16} color={darkMode ? '#818cf8' : '#4f46e5'} />}>
          <View style={{ gap: 24 }}>
            {reviews.map((rv) => (
              <View key={rv._id} style={[styles.reviewItem, { borderBottomColor: colors.border }]}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewUser}>
                    <LinearGradient
                      colors={['#6366f1', '#7c3aed']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.reviewAvatar}
                    >
                      <Text style={styles.reviewAvatarText}>
                        {rv.user?.name?.[0]?.toUpperCase() || 'M'}
                      </Text>
                    </LinearGradient>
                    <View>
                      <Text style={[styles.reviewName, { color: colors.textMain }]}>
                        {rv.user?.name || 'Mehmon'}
                      </Text>
                      <Text style={styles.reviewDate}>
                        {new Date(rv.createdAt).toLocaleDateString('uz-UZ')}
                      </Text>
                    </View>
                  </View>
                  <StarRow rating={rv.rating} />
                </View>
                <Text style={[styles.reviewComment, { color: darkMode ? '#cbd5e1' : '#374151' }]}>
                  "{rv.comment}"
                </Text>
              </View>
            ))}
            {reviews.length === 0 && (
              <Text style={[styles.noData, { color: colors.textMuted }]}>Hozircha sharhlar yo'q.</Text>
            )}
          </View>
        </SectionCard>

        {/* ── Bog'lanish ── */}
        <SectionCard title="Bog'lanish" icon={<Feather name="phone" size={16} color={darkMode ? '#818cf8' : '#4f46e5'} />}>
          {/* Egasi bilan suhbat */}
          <Pressable
            onPress={handleChat}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }], marginBottom: 16 }]}
          >
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.contactBtn}
            >
              <Feather name="message-circle" size={16} color="#fff" />
              <Text style={styles.contactBtnText}>Egasi bilan suhbat</Text>
            </LinearGradient>
          </Pressable>

          {/* Telefon */}
          {!!phone && (
            <Pressable
              onPress={() => Linking.openURL(`tel:${phone}`)}
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }], marginBottom: 20 }]}
            >
              <LinearGradient
                colors={colors.gradientMain}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.contactBtn}
              >
                <Feather name="phone" size={14} color="#fff" />
                <Text style={styles.contactBtnText}>{phone}</Text>
              </LinearGradient>
            </Pressable>
          )}

          {/* Email */}
          {!!email && (
            <Pressable
              onPress={() => Linking.openURL(`mailto:${email}`)}
              style={styles.emailRow}
            >
              <View style={[styles.emailIcon, { backgroundColor: darkMode ? 'rgba(49,46,129,0.2)' : '#eef2ff' }]}>
                <Feather name="mail" size={16} color={darkMode ? '#818cf8' : '#4f46e5'} />
              </View>
              <Text style={[styles.emailText, { color: darkMode ? '#cbd5e1' : '#374151' }]} numberOfLines={1}>
                {email}
              </Text>
            </Pressable>
          )}

          {/* Kirish / Chiqish */}
          <View style={[styles.checkRow, { borderTopColor: colors.border }]}>
            <View style={styles.checkItem}>
              <View style={styles.checkLabelRow}>
                <Feather name="calendar" size={14} color="#94a3b8" />
                <Text style={[styles.checkLabel, { color: colors.textMuted }]}>Kirish vaqti</Text>
              </View>
              <View style={[styles.checkValueBox, { backgroundColor: colors.bgHover, borderColor: colors.border }]}>
                <Text style={[styles.checkValue, { color: colors.textMain }]}>{hotel.checkIn || '14:00'}</Text>
              </View>
            </View>
            <View style={styles.checkItem}>
              <View style={styles.checkLabelRow}>
                <Feather name="calendar" size={14} color="#94a3b8" />
                <Text style={[styles.checkLabel, { color: colors.textMuted }]}>Chiqish vaqti</Text>
              </View>
              <View style={[styles.checkValueBox, { backgroundColor: colors.bgHover, borderColor: colors.border }]}>
                <Text style={[styles.checkValue, { color: colors.textMain }]}>{hotel.checkOut || '12:00'}</Text>
              </View>
            </View>
          </View>

          {/* Inklyuzivlik skori */}
          {accScore > 0 && (
            <View style={[styles.scoreWrap, { borderTopColor: colors.border }]}>
              <View style={[styles.scoreBox, { backgroundColor: scoreStyle.bg }]}>
                <MaterialIcons name="accessible" size={16} color={scoreStyle.color} />
                <Text style={[styles.scoreText, { color: scoreStyle.color }]}>
                  INKLYUZIVLIK: {accScore}% — {scoreStyle.label.toUpperCase()}
                </Text>
              </View>
              {accessFeatures.length > 0 && (
                <View style={styles.scoreCountRow}>
                  <MaterialIcons name="accessible" size={16} color={darkMode ? '#818cf8' : '#4f46e5'} />
                  <Text style={[styles.scoreCountText, { color: darkMode ? '#818cf8' : '#4f46e5' }]}>
                    {accessFeatures.length} TA MAXSUS QULAYLIK
                  </Text>
                </View>
              )}
            </View>
          )}
        </SectionCard>

        {/* ── Joylashuv ── */}
        <SectionCard title="Joylashuv" icon={<Feather name="map-pin" size={16} color="#f43f5e" />}>
          <Text style={[styles.locationText, { color: colors.textMuted }]}>
            {hotel.address}, {hotel.city}, O'zbekiston
          </Text>
          <Pressable
            onPress={() =>
              // route: '1' — xarita ochilishi bilan marshrut avtomatik chiziladi
              router.push({ pathname: '/(tabs)/map', params: { hotelId: hotel._id, route: '1' } })
            }
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <LinearGradient
              colors={colors.gradientMain}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.contactBtn}
            >
              <Feather name="navigation" size={16} color="#fff" />
              <Text style={styles.contactBtnText}>Yo'nalishni ko'rish</Text>
            </LinearGradient>
          </Pressable>
        </SectionCard>
      </ScrollView>

      {/* ── Yopishqoq sarlavha (web Sticky Mobile Header) ── */}
      {showSticky && (
        <View
          style={[
            styles.stickyHeader,
            {
              paddingTop: insets.top + 8,
              backgroundColor: colors.bgCard,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            hitSlop={8}
            accessibilityLabel="Orqaga"
            style={({ pressed }) => [
              styles.stickyBack,
              { backgroundColor: colors.bgHover, transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <Feather name="arrow-left" size={18} color={colors.textMain} />
          </Pressable>
          <Text style={[styles.stickyTitle, { color: colors.textMain }]} numberOfLines={1}>
            {name}
          </Text>
        </View>
      )}

      {/* ── Suzuvchi pastki panel (web Floating Mobile Bar) ── */}
      <View
        style={[
          styles.floatingBar,
          {
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
            bottom: insets.bottom + 10,
          },
        ]}
      >
        <View style={styles.floatingTimes}>
          <View>
            <Text style={styles.floatingLabel}>KIRISH</Text>
            <Text style={[styles.floatingValue, { color: colors.textMain }]}>
              {hotel.checkIn || '14:00'}
            </Text>
          </View>
          <View style={[styles.floatingDivider, { backgroundColor: colors.border }]} />
          <View>
            <Text style={styles.floatingLabel}>CHIQISH</Text>
            <Text style={[styles.floatingValue, { color: colors.textMain }]}>
              {hotel.checkOut || '12:00'}
            </Text>
          </View>
        </View>
        {!!phone && (
          <Pressable
            onPress={() => Linking.openURL(`tel:${phone}`)}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.96 : 1 }] }]}
          >
            <LinearGradient
              colors={colors.gradientMain}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.floatingCall}
            >
              <Feather name="phone" size={16} color="#fff" />
              <Text style={styles.floatingCallText}>Bog'lanish</Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>

      {/* ── Video modal ── */}
      <Modal visible={videoModal} animationType="fade" onRequestClose={() => setVideoModal(false)}>
        <View style={styles.videoModal}>
          <Pressable style={styles.modalClose} onPress={() => setVideoModal(false)}>
            <Feather name="x" size={20} color="#fff" />
          </Pressable>
          {!!hotel.videoTour?.url && (
            <WebView
              source={{ uri: getYouTubeEmbedUrl(hotel.videoTour.url) }}
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
          {hotel.videoTour?.captioned && (
            <View style={styles.ccFloating}>
              <Text style={styles.ccFloatingText}>CC — Subtitr mavjud</Text>
            </View>
          )}
        </View>
      </Modal>

      {/* ── Panorama modal ── */}
      <Modal
        visible={panoramaModal !== null}
        animationType="fade"
        onRequestClose={() => setPanoramaModal(null)}
      >
        <View style={styles.videoModal}>
          <Pressable style={styles.modalClose} onPress={() => setPanoramaModal(null)}>
            <Feather name="x" size={20} color="#fff" />
          </Pressable>
          {panoramaModal !== null && !!hotel.panoramas?.length && (
            <>
              <Image
                source={{ uri: imgSrc(hotel.panoramas[panoramaModal].url) }}
                style={{ flex: 1 }}
                contentFit="contain"
              />
              {!!hotel.panoramas[panoramaModal].caption && (
                <View style={styles.panoCaption}>
                  <Text style={styles.panoCaptionText}>
                    {hotel.panoramas[panoramaModal].caption}
                    {hotel.panoramas[panoramaModal].room
                      ? ` · ${hotel.panoramas[panoramaModal].room}`
                      : ''}
                  </Text>
                </View>
              )}
              {hotel.panoramas.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.panoThumbs}
                >
                  {hotel.panoramas.map((p, i) => (
                    <Pressable
                      key={i}
                      onPress={() => setPanoramaModal(i)}
                      style={[
                        styles.panoThumb,
                        {
                          borderColor: i === panoramaModal ? '#fff' : 'rgba(255,255,255,0.2)',
                          opacity: i === panoramaModal ? 1 : 0.6,
                        },
                      ]}
                    >
                      <Image source={{ uri: imgSrc(p.url) }} style={{ flex: 1 }} contentFit="cover" />
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </>
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
    backgroundColor: '#2563eb',
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
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  categoryPillText: {
    fontSize: 10,
    fontFamily: FONT.extrabold,
    letterSpacing: 0.8,
  },
  starsPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
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
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOpacity: 0.2,
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
    borderRadius: 12,
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
  mediaBtns: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
  },
  mediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  mediaBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  ccBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ccBadgeText: {
    color: '#1d4ed8',
    fontSize: 9,
    fontFamily: FONT.black,
  },
  thumbRow: {
    gap: 6,
    paddingVertical: 8,
    marginBottom: 16,
  },
  thumb: {
    width: 72,
    height: 52,
    borderRadius: 6,
    borderWidth: 2,
    overflow: 'hidden',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  desc: {
    fontSize: 14,
    fontFamily: FONT.regular,
    lineHeight: 22,
  },
  ttsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 16,
  },
  ttsBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
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
  placeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  placeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  placeChipText: {
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  roomCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  roomName: {
    fontSize: 18,
    fontFamily: FONT.extrabold,
    marginBottom: 8,
  },
  roomMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  roomTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  roomTagText: {
    fontSize: 12,
    fontFamily: FONT.semibold,
  },
  roomAmenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roomAmenityChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(99,102,241,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
  },
  roomAmenityText: {
    fontSize: 10,
    fontFamily: FONT.black,
    color: '#6366f1',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.medium,
  },
  noData: {
    fontSize: 12,
    fontFamily: FONT.regular,
    fontStyle: 'italic',
  },
  reviewItem: {
    paddingBottom: 24,
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
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#6366f1',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  contactBtnText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: FONT.black,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  emailIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONT.black,
  },
  checkRow: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 8,
    gap: 14,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkLabel: {
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  checkValueBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  checkValue: {
    fontSize: 12,
    fontFamily: FONT.extrabold,
  },
  scoreWrap: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  scoreText: {
    flex: 1,
    fontSize: 10,
    fontFamily: FONT.black,
  },
  scoreCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 4,
  },
  scoreCountText: {
    fontSize: 10,
    fontFamily: FONT.black,
    letterSpacing: 0.8,
  },
  locationText: {
    fontSize: 14,
    fontFamily: FONT.medium,
    marginBottom: 20,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 10,
    // O'ng yuqoridagi ThemeToggle bilan to'qnashmaslik uchun
    paddingRight: 64,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  stickyBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  floatingBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  floatingTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  floatingLabel: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#9ca3af',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  floatingValue: {
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  floatingDivider: {
    width: 1,
    height: 32,
  },
  floatingCall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  floatingCallText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONT.bold,
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
    backgroundColor: 'rgba(255,255,255,0.1)',
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
  ccFloating: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ccFloatingText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: FONT.black,
  },
  panoCaption: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  panoCaptionText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: FONT.semibold,
  },
  panoThumbs: {
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  panoThumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 2,
    overflow: 'hidden',
  },
});
