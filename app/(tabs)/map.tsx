/**
 * map.tsx — Mehmonxonalar xaritasi + ilova ichida marshrut
 * (web `pages/HotelsMap.jsx` + `MapRouteOverlay.jsx` + `mapUtils.jsx` porti).
 *
 *  - Xarita: Leaflet (WebView) — Expo Go'da ishlaydi
 *  - Marshrut: OSRM (router.project-osrm.org) — webdagi kabi, ilova ICHIDA chiziladi
 *  - Joylashuv: expo-location (yashil puls markeri — webdagi userIcon)
 *  - Yo'riqnoma: o'zbekcha turn-by-turn qadamlar (web MANEUVER_UZ porti)
 */
import React, { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '@/services/api';
import { useTheme } from '@/hooks/useTheme';
import { FONT } from '@/constants/theme';
import { imgSrc } from '@/constants/config';
import { Loader } from '@/components/ui/Loader';
import type { Hotel } from '@/types/models';

const CARD_WIDTH = 220;
const CARD_GAP = 12;

/* ══════════ Marshrut yordamchilari (web mapUtils.jsx porti) ══════════ */

// OSRM manevr turini o'zbekcha yo'riqnomaga aylantirish
const MANEUVER_UZ: Record<string, string> = {
  'turn-left': 'Chapga buriling',
  'turn-right': "O'ngga buriling",
  'turn-slight left': 'Bir oz chapga buriling',
  'turn-slight right': "Bir oz o'ngga buriling",
  'turn-sharp left': 'Keskin chapga buriling',
  'turn-sharp right': "Keskin o'ngga buriling",
  'turn-straight': "To'g'riga davom eting",
  'turn-uturn': 'Orqaga qayting (U burilish)',
  depart: "Yo'lni boshlang",
  arrive: 'Manzilga yetib keldingiz',
  roundabout: "Aylanma yo'lga kiring",
  rotary: "Aylanma yo'lga kiring",
  merge: "Yo'lga qo'shiling",
  'fork-left': 'Ayriliqda chapni tanlang',
  'fork-right': "Ayriliqda o'ngni tanlang",
  'end of road-left': "Yo'l oxirida chapga buriling",
  'end of road-right': "Yo'l oxirida o'ngga buriling",
};

interface OsrmStep {
  maneuver?: { type?: string; modifier?: string };
  name?: string;
  distance: number;
}

interface RouteStep {
  text: string;
  type: string;
  modifier: string;
  distance: number;
}

interface RouteData {
  coords: [number, number][];
  distance: number;
  duration: number;
  steps: RouteStep[];
}

const maneuverText = (step: OsrmStep): string => {
  const m = step.maneuver || {};
  const key = `${m.type}-${m.modifier || ''}`.trim().replace(/-$/, '');
  const base = MANEUVER_UZ[key] || MANEUVER_UZ[m.type || ''] || "To'g'riga davom eting";
  const road = step.name ? ` — ${step.name}` : '';
  return base + road;
};

/** OSRM'dan marshrut olish (web fetchRoute bilan bir xil) */
async function fetchRoute(
  from: [number, number],
  to: [number, number],
  profile = 'driving',
): Promise<RouteData> {
  const url =
    `https://router.project-osrm.org/route/v1/${profile}/` +
    `${from[1]},${from[0]};${to[1]},${to[0]}` +
    `?overview=full&geometries=geojson&steps=true`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) throw new Error('Marshrut topilmadi');
    const r = data.routes[0];
    const steps: RouteStep[] = (r.legs?.[0]?.steps || []).map((s: OsrmStep) => ({
      text: maneuverText(s),
      type: s.maneuver?.type || 'continue',
      modifier: s.maneuver?.modifier || '',
      distance: s.distance,
    }));
    return {
      coords: r.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
      distance: r.distance,
      duration: r.duration,
      steps,
    };
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

const fmtDist = (m: number): string =>
  m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;

const fmtTime = (s: number): string =>
  s < 60
    ? `${Math.round(s)} sek`
    : s < 3600
      ? `${Math.round(s / 60)} daq`
      : `${Math.floor(s / 3600)}s ${Math.round((s % 3600) / 60)}d`;

/** Manevr turiga mos ikonka (web stepIcon porti) */
const stepIcon = (step: RouteStep, muted: string): ReactElement => {
  const mod = step.modifier || '';
  if (step.type === 'arrive') return <Feather name="flag" size={15} color="#16a34a" />;
  if (step.type === 'depart') return <Feather name="map-pin" size={15} color="#2563eb" />;
  if (mod.includes('left')) return <Feather name="corner-up-left" size={15} color={muted} />;
  if (mod.includes('right')) return <Feather name="corner-up-right" size={15} color={muted} />;
  return <Feather name="arrow-up" size={15} color={muted} />;
};

/* ══════════ Leaflet HTML ══════════ */

const buildMapHtml = (hotels: Hotel[], darkMode: boolean): string => {
  const points = hotels.map((h) => ({
    id: h._id,
    name: (h.name || '').replace(/["\\]/g, ''),
    lat: h.location!.lat!,
    lng: h.location!.lng!,
  }));

  const tileUrl = darkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  const bg = darkMode ? '#0B1120' : '#fcfcfd';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { margin: 0; padding: 0; height: 100%; background: ${bg}; }
  .leaflet-control-attribution { font-size: 9px; opacity: 0.7; }

  /* Teardrop pin — web createHotelIcon dizayni */
  .pin-wrap { position: relative; width: 30px; height: 38px;
    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
    transition: transform 0.2s ease; transform-origin: 50% 100%; }
  .pin-body { position: absolute; top: 0; left: 0; width: 30px; height: 30px;
    background: #4f46e5; border: 2px solid #fff; border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg); box-shadow: inset 0 0 4px rgba(0,0,0,0.2);
    transition: background 0.2s ease; }
  .pin-dot { position: absolute; top: 10px; left: 10px; width: 10px; height: 10px;
    background: #fff; border-radius: 50%; z-index: 2; }
  .pin-wrap.active { transform: scale(1.3); }
  .pin-wrap.active .pin-body { background: #f43f5e; }

  /* Foydalanuvchi markeri — yashil puls (web userIcon) */
  @keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.9); opacity: 0; } }
  .user-dot { position: absolute; inset: 0; background: #10b981; border-radius: 50%;
    border: 3px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.3); z-index: 2; }
  .user-ring { position: absolute; inset: -10px; background: rgba(16,185,129,0.3);
    border-radius: 50%; z-index: 1; animation: pulse-ring 2s infinite cubic-bezier(0.215,0.61,0.355,1); }
  .user-ring2 { position: absolute; inset: -20px; background: rgba(16,185,129,0.15);
    border-radius: 50%; z-index: 0; animation: pulse-ring 2s infinite cubic-bezier(0.215,0.61,0.355,1); animation-delay: 1s; }

  /* Marshrut chizig'i — web animate-route-dash */
  @keyframes routeDash { to { stroke-dashoffset: -24; } }
  .route-line { stroke-dasharray: 10 14; animation: routeDash 1.2s linear infinite; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var hotels = ${JSON.stringify(points)};
  var map = L.map('map', { zoomControl: false, attributionControl: true })
    .setView([40.0842, 65.3791], 8);
  L.tileLayer('${tileUrl}', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(map);

  var markers = {};
  hotels.forEach(function (h) {
    var icon = L.divIcon({
      className: '',
      html: '<div class="pin-wrap" id="pin-' + h.id + '"><div class="pin-body"></div><div class="pin-dot"></div></div>',
      iconSize: [30, 38],
      iconAnchor: [15, 38]
    });
    var m = L.marker([h.lat, h.lng], { icon: icon, title: h.name }).addTo(map);
    m.on('click', function () {
      selectPin(h.id);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'select', id: h.id }));
      }
    });
    markers[h.id] = m;
  });

  function selectPin(id) {
    var pins = document.querySelectorAll('.pin-wrap');
    for (var i = 0; i < pins.length; i++) pins[i].classList.remove('active');
    var el = document.getElementById('pin-' + id);
    if (el) el.classList.add('active');
    Object.keys(markers).forEach(function (k) { markers[k].setZIndexOffset(k === id ? 1000 : 0); });
  }

  function focusHotel(id) {
    var h = null;
    for (var i = 0; i < hotels.length; i++) if (hotels[i].id === id) h = hotels[i];
    if (!h) return;
    selectPin(id);
    map.flyTo([h.lat, h.lng], 13, { duration: 0.6 });
  }
  window.focusHotel = focusHotel;

  /* ── Marshrut chizish (RN tarafdan chaqiriladi) ── */
  var routeCasing = null, routeLine = null, userMarker = null;

  window.showRoute = function (coords, fromLat, fromLng, hotelId) {
    window.clearRoute();
    if (hotelId) selectPin(hotelId);
    // Ostki qalin "casing" + ustki animatsiyali chiziq
    routeCasing = L.polyline(coords, { color: '#4f46e5', weight: 9, opacity: 0.18, lineCap: 'round' }).addTo(map);
    routeLine = L.polyline(coords, { color: '#6366f1', weight: 5, opacity: 0.95, lineCap: 'round', className: 'route-line' }).addTo(map);
    var userIcon = L.divIcon({
      className: '',
      html: '<div style="position:relative;width:22px;height:22px;"><div class="user-dot"></div><div class="user-ring"></div><div class="user-ring2"></div></div>',
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
    userMarker = L.marker([fromLat, fromLng], { icon: userIcon, zIndexOffset: 2000 }).addTo(map);
    // Panel (tepada) va karusel (pastda) uchun joy qoldirib qamrab olish
    map.fitBounds(routeLine.getBounds(), {
      paddingTopLeft: [30, 230],
      paddingBottomRight: [30, 210]
    });
  };

  window.clearRoute = function () {
    if (routeCasing) { map.removeLayer(routeCasing); routeCasing = null; }
    if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
    if (userMarker) { map.removeLayer(userMarker); userMarker = null; }
  };

  if (hotels.length > 1) {
    var group = L.featureGroup(Object.keys(markers).map(function (k) { return markers[k]; }));
    map.fitBounds(group.getBounds().pad(0.25));
  } else if (hotels.length === 1) {
    map.setView([hotels[0].lat, hotels[0].lng], 12);
  }
</script>
</body>
</html>`;
};

/* ══════════ Ekran ══════════ */

interface MapMessage {
  type: 'select';
  id: string;
}

type GuideStatus = 'locating' | 'routing' | 'ready' | 'error';

interface Guidance {
  status: GuideStatus;
  hotel: Hotel;
  data: RouteData | null;
  error: string | null;
}

export default function MapScreen() {
  const { colors, darkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // hotel/[id] dan: hotelId — fokus, route='1' — marshrutni avtomatik chizish
  const { hotelId, route } = useLocalSearchParams<{ hotelId?: string; route?: string }>();

  const webRef = useRef<WebView>(null);
  const carouselRef = useRef<ScrollView>(null);
  const autoRouteDone = useRef(false);

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [guidance, setGuidance] = useState<Guidance | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    api
      .get('/hotels')
      .then((res) => {
        const data: Hotel[] = Array.isArray(res.data) ? res.data : res.data.data || [];
        setHotels(data.filter((h) => h.location?.lat && h.location?.lng));
      })
      .catch(() => setHotels([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (typeof hotelId === 'string' && hotelId) setSelectedId(hotelId);
  }, [hotelId]);

  const html = useMemo(
    () => (hotels.length ? buildMapHtml(hotels, darkMode) : ''),
    [hotels, darkMode],
  );

  const scrollToCard = (id: string) => {
    const idx = hotels.findIndex((h) => h._id === id);
    if (idx >= 0) {
      carouselRef.current?.scrollTo({ x: idx * (CARD_WIDTH + CARD_GAP), animated: true });
    }
  };

  const focusHotel = (id: string) => {
    setSelectedId(id);
    webRef.current?.injectJavaScript(`window.focusHotel && window.focusHotel('${id}'); true;`);
  };

  /** Ilova ichida marshrut chizish: joylashuv → OSRM → xaritaga chizish */
  const drawRoute = async (hotel: Hotel) => {
    setSelectedId(hotel._id);
    setShowSteps(false);
    setGuidance({ status: 'locating', hotel, data: null, error: null });
    try {
      // 1. Joylashuvga ruxsat
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGuidance({
          status: 'error',
          hotel,
          data: null,
          error: "Joylashuvga ruxsat berilmadi. Sozlamalardan ruxsat bering.",
        });
        return;
      }
      // 2. Joriy joylashuv (sekin bo'lsa oxirgi ma'lum joy)
      let pos = await Location.getLastKnownPositionAsync();
      if (!pos) {
        pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }
      const from: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      const to: [number, number] = [hotel.location!.lat!, hotel.location!.lng!];

      // 3. OSRM marshrut
      setGuidance({ status: 'routing', hotel, data: null, error: null });
      const data = await fetchRoute(from, to, 'driving');

      // 4. Xaritaga chizish
      webRef.current?.injectJavaScript(
        `window.showRoute && window.showRoute(${JSON.stringify(data.coords)}, ${from[0]}, ${from[1]}, '${hotel._id}'); true;`,
      );
      setGuidance({ status: 'ready', hotel, data, error: null });
      scrollToCard(hotel._id);
    } catch {
      setGuidance({
        status: 'error',
        hotel,
        data: null,
        error: "Marshrutni hisoblab bo'lmadi. Internetni tekshirib qayta urinib ko'ring.",
      });
    }
  };

  const clearGuidance = () => {
    setGuidance(null);
    setShowSteps(false);
    webRef.current?.injectJavaScript('window.clearRoute && window.clearRoute(); true;');
  };

  // Xarita yuklangach: fokus + (hotel detaldan kelgan bo'lsa) avtomatik marshrut
  const handleMapLoaded = () => {
    if (selectedId) {
      webRef.current?.injectJavaScript(
        `window.focusHotel && window.focusHotel('${selectedId}'); true;`,
      );
      scrollToCard(selectedId);
    }
    // Tema almashib xarita qayta yuklansa — mavjud marshrutni qayta chizish
    if (guidance?.status === 'ready' && guidance.data) {
      const c = guidance.data.coords;
      webRef.current?.injectJavaScript(
        `window.showRoute && window.showRoute(${JSON.stringify(c)}, ${c[0][0]}, ${c[0][1]}, '${guidance.hotel._id}'); true;`,
      );
    }
    // hotel/[id] dagi "Yo'nalishni ko'rish" dan kelingan — marshrutni ochish
    if (route === '1' && typeof hotelId === 'string' && !autoRouteDone.current) {
      const target = hotels.find((h) => h._id === hotelId);
      if (target) {
        autoRouteDone.current = true;
        drawRoute(target);
      }
    }
  };

  const handleMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data) as MapMessage;
      if (msg.type === 'select' && msg.id) {
        setSelectedId(msg.id);
        scrollToCard(msg.id);
      }
    } catch {
      // yaroqsiz xabar — e'tiborsiz
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgMain, justifyContent: 'center' }}>
        <Loader message="Xarita yuklanmoqda" />
      </View>
    );
  }

  const g = guidance;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgMain }}>
      {hotels.length > 0 ? (
        <WebView
          ref={webRef}
          key={darkMode ? 'dark' : 'light'}
          source={{ html }}
          style={{ flex: 1, backgroundColor: colors.bgMain }}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          onMessage={handleMessage}
          onLoadEnd={handleMapLoaded}
          startInLoadingState
          renderLoading={() => (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.bgMain, justifyContent: 'center' },
              ]}
            >
              <Loader message="Xarita yuklanmoqda" />
            </View>
          )}
        />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Feather name="map" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Koordinatali mehmonxona topilmadi
          </Text>
        </View>
      )}

      {/* Sarlavha pilli — marshrut paneli ochiq bo'lsa yashirinadi */}
      {!g && (
        <View
          style={[
            styles.titlePill,
            { top: insets.top + 12, backgroundColor: colors.bgCard, borderColor: colors.border },
          ]}
        >
          <Feather name="map" size={16} color={colors.primary} />
          <Text style={[styles.titleText, { color: colors.textMain }]}>
            Mehmonxonalar xaritasi
          </Text>
        </View>
      )}

      {/* ══ Marshrut paneli (web MapRouteOverlay porti) ══ */}
      {g && (
        <View
          style={[
            styles.routePanel,
            {
              // ThemeToggle (o'ng yuqori, 40px) ostidan boshlanadi
              top: insets.top + 60,
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Sarlavha */}
          <View style={[styles.routeHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.routeHeaderLeft}>
              <View
                style={[
                  styles.routeNavIcon,
                  { backgroundColor: darkMode ? 'rgba(30,58,138,0.3)' : '#eff6ff' },
                ]}
              >
                <Feather name="navigation" size={17} color="#2563eb" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.routeKicker, { color: colors.textMuted }]}>YO'NALISH</Text>
                <Text style={[styles.routeHotelName, { color: colors.textMain }]} numberOfLines={1}>
                  {g.hotel.name}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={clearGuidance}
              accessibilityLabel="Yo'nalishni yopish"
              hitSlop={8}
              style={({ pressed }) => [
                styles.routeClose,
                { backgroundColor: pressed ? colors.bgHover : 'transparent' },
              ]}
            >
              <Feather name="x" size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.routeBody}>
            {/* Holat: hisoblanmoqda */}
            {(g.status === 'locating' || g.status === 'routing') && (
              <View style={styles.routeLoading}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={styles.routeLoadingText}>
                  {g.status === 'locating' ? 'Joylashuv aniqlanmoqda...' : 'Hisoblanmoqda...'}
                </Text>
              </View>
            )}

            {/* Xato */}
            {g.status === 'error' && (
              <View style={styles.routeError}>
                <Feather name="alert-triangle" size={16} color="#ef4444" />
                <Text style={styles.routeErrorText}>{g.error}</Text>
              </View>
            )}

            {/* Statistika: Masofa | Vaqt + Google Maps */}
            {g.status === 'ready' && g.data && (
              <>
                <View style={styles.routeStats}>
                  <View style={styles.routeStatsLeft}>
                    <View>
                      <View style={styles.routeStatLabelRow}>
                        <Feather name="map-pin" size={11} color={colors.textMuted} />
                        <Text style={[styles.routeStatLabel, { color: colors.textMuted }]}>
                          MASOFA
                        </Text>
                      </View>
                      <Text style={[styles.routeStatValue, { color: colors.textMain }]}>
                        {fmtDist(g.data.distance)}
                      </Text>
                    </View>
                    <View style={[styles.routeStatDivider, { backgroundColor: colors.border }]} />
                    <View>
                      <View style={styles.routeStatLabelRow}>
                        <Feather name="clock" size={11} color={colors.textMuted} />
                        <Text style={[styles.routeStatLabel, { color: colors.textMuted }]}>
                          VAQT
                        </Text>
                      </View>
                      <Text style={[styles.routeStatValue, { color: '#16a34a' }]}>
                        {fmtTime(g.data.duration)}
                      </Text>
                    </View>
                  </View>
                  {/* Google Maps'da ochish (qo'shimcha) */}
                  <Pressable
                    onPress={() =>
                      Linking.openURL(
                        `https://www.google.com/maps/dir/?api=1&destination=${g.hotel.location?.lat},${g.hotel.location?.lng}&travelmode=driving`,
                      )
                    }
                    accessibilityLabel="Google Maps'da ochish"
                    style={({ pressed }) => [
                      styles.routeExternal,
                      {
                        backgroundColor: colors.bgHover,
                        transform: [{ scale: pressed ? 0.92 : 1 }],
                      },
                    ]}
                  >
                    <Feather name="external-link" size={17} color="#2563eb" />
                  </Pressable>
                </View>

                {/* Keyingi manevr + barcha qadamlar */}
                {g.data.steps.length > 0 && (
                  <View style={[styles.stepsBox, { borderColor: colors.border }]}>
                    <View
                      style={[
                        styles.nextStep,
                        { backgroundColor: darkMode ? 'rgba(30,58,138,0.2)' : '#eff6ff' },
                      ]}
                    >
                      <View style={[styles.stepIcon, { backgroundColor: colors.bgCard }]}>
                        {stepIcon(g.data.steps[0], colors.textMuted)}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.nextStepText, { color: colors.textMain }]}
                          numberOfLines={1}
                        >
                          {g.data.steps[0].text}
                        </Text>
                        {g.data.steps[0].distance > 0 && (
                          <Text style={[styles.stepDist, { color: colors.textMuted }]}>
                            {fmtDist(g.data.steps[0].distance)}
                          </Text>
                        )}
                      </View>
                    </View>

                    <Pressable
                      onPress={() => setShowSteps((s) => !s)}
                      style={({ pressed }) => [
                        styles.stepsToggle,
                        { backgroundColor: pressed ? colors.bgHover : 'transparent' },
                      ]}
                    >
                      <Text style={[styles.stepsToggleText, { color: colors.textMuted }]}>
                        Barcha bosqichlar ({g.data.steps.length})
                      </Text>
                      <Feather
                        name={showSteps ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color={colors.textMuted}
                      />
                    </Pressable>

                    {showSteps && (
                      <ScrollView style={styles.stepsList} nestedScrollEnabled>
                        {g.data.steps.map((s, i) => (
                          <View
                            key={i}
                            style={[styles.stepRow, { borderTopColor: colors.border }]}
                          >
                            <View style={[styles.stepIconSm, { backgroundColor: colors.bgHover }]}>
                              {stepIcon(s, colors.textMuted)}
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.stepText, { color: colors.textMain }]}>
                                {s.text}
                              </Text>
                              {s.distance > 0 && (
                                <Text style={[styles.stepDist, { color: colors.textMuted }]}>
                                  {fmtDist(s.distance)}
                                </Text>
                              )}
                            </View>
                          </View>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      )}

      {/* ══ Pastki karusel ══ */}
      {hotels.length > 0 && (
        <View style={styles.carouselWrap}>
          <ScrollView
            ref={carouselRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}
            snapToInterval={CARD_WIDTH + CARD_GAP}
            decelerationRate="fast"
          >
            {hotels.map((h) => {
              const active = selectedId === h._id;
              const isRouting =
                g?.hotel._id === h._id && (g.status === 'locating' || g.status === 'routing');
              return (
                <Pressable
                  key={h._id}
                  onPress={() => focusHotel(h._id)}
                  style={({ pressed }) => [
                    styles.card,
                    {
                      backgroundColor: colors.bgCard,
                      borderColor: active ? colors.primary : colors.border,
                      borderWidth: active ? 2 : 1,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    },
                  ]}
                >
                  <Image
                    source={{ uri: imgSrc(h.image || h.images?.[0]) }}
                    style={styles.cardImage}
                    contentFit="cover"
                    transition={200}
                  />
                  <View style={styles.cardBody}>
                    <Text style={[styles.cardName, { color: colors.textMain }]} numberOfLines={1}>
                      {h.name}
                    </Text>
                    <View style={styles.cardMeta}>
                      <View style={styles.cardLocation}>
                        <Feather name="map-pin" size={11} color={colors.textMuted} />
                        <Text
                          style={[styles.cardCity, { color: colors.textMuted }]}
                          numberOfLines={1}
                        >
                          {h.city}
                        </Text>
                      </View>
                      {typeof h.rating === 'number' && h.rating > 0 && (
                        <View style={styles.cardRating}>
                          <FontAwesome name="star" size={11} color="#f59e0b" />
                          <Text style={styles.cardRatingText}>{h.rating.toFixed(1)}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.cardActions}>
                      <Pressable
                        onPress={() => router.push(`/hotel/${h._id}`)}
                        style={({ pressed }) => [
                          { flex: 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
                        ]}
                      >
                        <LinearGradient
                          colors={colors.gradientMain}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.cardBtn}
                        >
                          <Text style={styles.cardBtnText}>Batafsil</Text>
                          <Feather name="arrow-right" size={12} color="#fff" />
                        </LinearGradient>
                      </Pressable>
                      {/* Ilova ichida marshrut chizish */}
                      <Pressable
                        onPress={() => drawRoute(h)}
                        disabled={isRouting}
                        accessibilityLabel={`${h.name} manziliga marshrut`}
                        style={({ pressed }) => [
                          styles.dirBtn,
                          {
                            backgroundColor: darkMode ? 'rgba(49,46,129,0.4)' : '#eef2ff',
                            borderColor: darkMode ? 'rgba(99,102,241,0.35)' : '#c7d2fe',
                            transform: [{ scale: pressed ? 0.92 : 1 }],
                          },
                        ]}
                      >
                        {isRouting ? (
                          <ActivityIndicator size="small" color={darkMode ? '#818cf8' : '#4f46e5'} />
                        ) : (
                          <MaterialCommunityIcons
                            name="directions"
                            size={18}
                            color={darkMode ? '#818cf8' : '#4f46e5'}
                          />
                        )}
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  titlePill: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  titleText: {
    fontSize: 14,
    fontFamily: FONT.extrabold,
  },
  /* ── Marshrut paneli ── */
  routePanel: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  routeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  routeNavIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeKicker: {
    fontSize: 10,
    fontFamily: FONT.semibold,
    letterSpacing: 1.2,
  },
  routeHotelName: {
    fontSize: 15,
    fontFamily: FONT.bold,
  },
  routeClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeBody: {
    padding: 12,
    gap: 12,
  },
  routeLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  routeLoadingText: {
    fontSize: 14,
    fontFamily: FONT.semibold,
    color: '#2563eb',
  },
  routeError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  routeErrorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#ef4444',
  },
  routeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeStatsLeft: {
    flexDirection: 'row',
    gap: 16,
  },
  routeStatLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  routeStatLabel: {
    fontSize: 10,
    fontFamily: FONT.semibold,
    letterSpacing: 0.5,
  },
  routeStatValue: {
    fontSize: 17,
    fontFamily: FONT.bold,
  },
  routeStatDivider: {
    width: 1,
    alignSelf: 'stretch',
  },
  routeExternal: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsBox: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  nextStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  nextStepText: {
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  stepsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  stepsToggleText: {
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  stepsList: {
    maxHeight: 200,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  stepIconSm: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepText: {
    fontSize: 13,
    fontFamily: FONT.medium,
    lineHeight: 18,
  },
  stepDist: {
    fontSize: 11,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  /* ── Karusel ── */
  carouselWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 12,
  },
  carousel: {
    gap: CARD_GAP,
    paddingHorizontal: 16,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardImage: {
    width: '100%',
    height: 88,
  },
  cardBody: {
    padding: 10,
  },
  cardName: {
    fontSize: 14,
    fontFamily: FONT.bold,
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  cardCity: {
    fontSize: 11,
    fontFamily: FONT.medium,
    flexShrink: 1,
  },
  cardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardRatingText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#f59e0b',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  cardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
  },
  cardBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  dirBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONT.semibold,
  },
});
