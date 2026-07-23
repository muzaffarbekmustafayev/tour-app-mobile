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
import { type LocationSubscription } from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '@/services/api';
import { useTheme } from '@/hooks/useTheme';
import { FONT } from '@/constants/theme';
import { imgSrc } from '@/constants/config';
import { Loader } from '@/components/ui/Loader';
import type { Hotel, Attraction } from '@/types/models';

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
const stepIcon = (step: any, muted: string, size = 16) => {
  if (!step?.modifier) return <Feather name="navigation" size={size} color={muted} />;
  const mod = step.modifier.toLowerCase();
  if (mod.includes('left')) return <Feather name="corner-up-left" size={size} color={muted} />;
  if (mod.includes('right')) return <Feather name="corner-up-right" size={size} color={muted} />;
  return <Feather name="arrow-up" size={size} color={muted} />;
};

/* ══════════ Leaflet HTML ══════════ */

const buildMapHtml = (places: any[], darkMode: boolean): string => {
  const points = places.map((p) => ({
    id: p._id,
    name: (p.name || '').replace(/["\\]/g, ''),
    lat: p.location!.lat!,
    lng: p.location!.lng!,
    mapType: p.mapType,
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

  /* Attraction pin rangi */
  .pin-wrap.pin-attraction .pin-body { background: #d97706; }
  .pin-wrap.pin-attraction.active .pin-body { background: #f59e0b; }

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
  var places = ${JSON.stringify(points)};
  var map = L.map('map', { zoomControl: false, attributionControl: true })
    .setView([40.0842, 65.3791], 10);
  L.tileLayer('${tileUrl}', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(map);

  var markers = {};
  places.forEach(function (p) {
    var cls = p.mapType === 'attraction' ? 'pin-attraction' : '';
    var icon = L.divIcon({
      className: '',
      html: '<div class="pin-wrap ' + cls + '" id="pin-' + p.id + '"><div class="pin-body"></div><div class="pin-dot"></div></div>',
      iconSize: [30, 38],
      iconAnchor: [15, 38]
    });
    var m = L.marker([p.lat, p.lng], { icon: icon, title: p.name }).addTo(map);
    m.on('click', function () {
      selectPin(p.id);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'select', id: p.id }));
      }
    });
    markers[p.id] = m;
  });

  function selectPin(id) {
    var pins = document.querySelectorAll('.pin-wrap');
    for (var i = 0; i < pins.length; i++) pins[i].classList.remove('active');
    var el = document.getElementById('pin-' + id);
    if (el) el.classList.add('active');
    Object.keys(markers).forEach(function (k) { markers[k].setZIndexOffset(k === id ? 1000 : 0); });
  }

  function focusHotel(id) {
    var p = null;
    for (var i = 0; i < places.length; i++) if (places[i].id === id) p = places[i];
    if (!p) return;
    selectPin(id);
    map.flyTo([p.lat, p.lng], 13, { duration: 0.6 });
  }
  window.focusHotel = focusHotel;

  /* ── Marshrut chizish (RN tarafdan chaqiriladi) ── */
  var routeCasing = null, routeLine = null, userMarker = null;

  window.showRoute = function (coords, fromLat, fromLng, hotelId) {
    window.clearRoute();
    if (hotelId) {
      selectPin(hotelId);
      // Boshqa pinlarni xaritadan olib tashlash
      Object.keys(markers).forEach(function (k) {
        if (k !== hotelId) map.removeLayer(markers[k]);
      });
    }
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
      paddingTopLeft: [30, 120],
      paddingBottomRight: [30, 260] // Marshrut paneli uchun ko'proq joy
    });
  };

  window.clearRoute = function () {
    if (routeCasing) { map.removeLayer(routeCasing); routeCasing = null; }
    if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
    if (userMarker) { map.removeLayer(userMarker); userMarker = null; }
    // Barcha pinlarni xaritaga qaytarish
    Object.keys(markers).forEach(function (k) {
      if (!map.hasLayer(markers[k])) map.addLayer(markers[k]);
    });
  };

  window.updateUserLocation = function (lat, lng) {
    if (userMarker) {
      userMarker.setLatLng([lat, lng]);
    }
  };

  if (places.length > 1) {
    var group = L.featureGroup(Object.keys(markers).map(function (k) { return markers[k]; }));
    map.fitBounds(group.getBounds().pad(0.25));
  } else if (places.length === 1) {
    map.setView([places[0].lat, places[0].lng], 12);
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
  const locationSub = useRef<LocationSubscription | null>(null);

  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [guidance, setGuidance] = useState<Guidance | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/hotels'), api.get('/attractions')])
      .then(([hRes, aRes]) => {
        const hData: Hotel[] = Array.isArray(hRes.data) ? hRes.data : hRes.data.data || [];
        const aData: Attraction[] = Array.isArray(aRes.data) ? aRes.data : aRes.data.data || [];
        
        const validHotels = hData.filter((h) => h.location?.lat && h.location?.lng).map((h) => ({ ...h, mapType: 'hotel' }));
        const validAttractions = aData.filter((a) => a.location?.lat && a.location?.lng).map((a) => ({ ...a, mapType: 'attraction' }));
        
        setPlaces([...validHotels, ...validAttractions]);
      })
      .catch(() => setPlaces([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (typeof hotelId === 'string' && hotelId) setSelectedId(hotelId);
  }, [hotelId]);

  const html = useMemo(
    () => (places.length ? buildMapHtml(places, darkMode) : ''),
    [places, darkMode],
  );

  const scrollToCard = (id: string) => {
    const idx = places.findIndex((p) => p._id === id);
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

      // 5. Haqiqiy vaqtda manzilni kuzatish (offline bo'lganda ham marshrut davom etishi uchun)
      if (locationSub.current) {
        locationSub.current.remove();
      }
      locationSub.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
          distanceInterval: 5,
        },
        (loc) => {
          webRef.current?.injectJavaScript(
            `window.updateUserLocation && window.updateUserLocation(${loc.coords.latitude}, ${loc.coords.longitude}); true;`,
          );
        }
      );

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
    if (locationSub.current) {
      locationSub.current.remove();
      locationSub.current = null;
    }
    setGuidance(null);
    setShowSteps(false);
    webRef.current?.injectJavaScript('window.clearRoute && window.clearRoute(); true;');
  };

  useEffect(() => {
    return () => {
      if (locationSub.current) {
        locationSub.current.remove();
      }
    };
  }, []);

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
      const target = places.find((p) => p._id === hotelId);
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
      {places.length > 0 ? (
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
            Koordinatali maskanlar topilmadi
          </Text>
        </View>
      )}

      {/* ── TOP BAR: Idle (xarita sarlavhasi) ── */}
      {!g && (
        <View
          style={[
            styles.topBar,
            {
              top: insets.top + 12,
              backgroundColor: darkMode ? 'rgba(15,23,42,0.82)' : 'rgba(255,255,255,0.88)',
              borderColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
            },
          ]}
        >
          <View style={[styles.topBarIconWrap, { backgroundColor: darkMode ? 'rgba(99,102,241,0.2)' : '#eef2ff' }]}>
            <Feather name="map" size={15} color="#6366f1" />
          </View>
          <Text style={[styles.topBarText, { color: colors.textMain }]}>Maskanlar xaritasi</Text>
          <View style={[styles.topBarBadge, { backgroundColor: darkMode ? 'rgba(99,102,241,0.15)' : '#eef2ff' }]}>
            <Text style={[styles.topBarBadgeText, { color: '#6366f1' }]}>{places.length}</Text>
          </View>
        </View>
      )}

      {/* ── TOP BAR: Route aktiv (manzil + yopish) ── */}
      {g && (
        <View
          style={[
            styles.topBar,
            {
              top: insets.top + 12,
              backgroundColor: darkMode ? 'rgba(15,23,42,0.88)' : 'rgba(255,255,255,0.92)',
              borderColor: darkMode ? 'rgba(37,99,235,0.3)' : 'rgba(37,99,235,0.2)',
            },
          ]}
        >
          <View style={[styles.topBarIconWrap, { backgroundColor: darkMode ? 'rgba(37,99,235,0.25)' : '#dbeafe' }]}>
            <Feather name="navigation" size={15} color="#2563eb" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.topBarKicker, { color: '#2563eb' }]}>YO'NALISH</Text>
            <Text style={[styles.topBarText, { color: colors.textMain }]} numberOfLines={1}>
              {g.hotel.name}
            </Text>
          </View>
          <Pressable
            onPress={clearGuidance}
            hitSlop={10}
            style={({ pressed }) => [
              styles.topBarClose,
              { backgroundColor: pressed ? colors.bgHover : (darkMode ? 'rgba(255,255,255,0.08)' : '#f1f5f9') },
            ]}
          >
            <Feather name="x" size={14} color={colors.textMuted} />
          </Pressable>
        </View>
      )}

      {/* ── LOADING overlay (markazda kichik glass karta) ── */}
      {g && (g.status === 'locating' || g.status === 'routing') && (
        <View style={styles.loadingOverlay}>
          <View
            style={[
              styles.loadingCard,
              {
                backgroundColor: darkMode ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.95)',
                borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              },
            ]}
          >
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={[styles.loadingTitle, { color: colors.textMain }]}>
              {g.status === 'locating' ? 'GPS aniqlanmoqda' : 'Marshrut hisoblanmoqda'}
            </Text>
            <Text style={[styles.loadingSub, { color: colors.textMuted }]}>
              {g.status === 'locating' ? 'Joylashuv kutilmoqda...' : 'Eng qisqa yo\'l topilmoqda...'}
            </Text>
          </View>
        </View>
      )}

      {/* ── ERROR toast (tepada) ── */}
      {g && g.status === 'error' && (
        <View
          style={[
            styles.errorToast,
            {
              top: insets.top + 80,
              backgroundColor: darkMode ? 'rgba(30,10,10,0.9)' : 'rgba(255,255,255,0.95)',
              borderColor: 'rgba(239,68,68,0.3)',
            },
          ]}
        >
          <Feather name="alert-circle" size={16} color="#ef4444" />
          <View style={{ flex: 1 }}>
            <Text style={styles.errorToastTitle}>Xatolik</Text>
            <Text style={[styles.errorToastText, { color: colors.textMuted }]} numberOfLines={2}>
              {g.error}
            </Text>
          </View>
          <Pressable onPress={clearGuidance} hitSlop={8}>
            <Feather name="x" size={14} color={colors.textMuted} />
          </Pressable>
        </View>
      )}

      {/* ── ROUTE STATS STRIP (karusel ustida, faqat ready) ── */}
      {g && g.status === 'ready' && g.data && (
        <View
          style={[
            styles.routeStrip,
            {
              backgroundColor: darkMode ? 'rgba(10,15,35,0.94)' : 'rgba(255,255,255,0.96)',
              borderColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
            },
          ]}
        >
          {/* 3 ta stat pill */}
          <View style={styles.statsRow}>
            <View style={[styles.statPill, { backgroundColor: darkMode ? 'rgba(37,99,235,0.15)' : '#eff6ff' }]}>
              <Feather name="map-pin" size={12} color="#2563eb" />
              <Text style={[styles.statVal, { color: colors.textMain }]}>{fmtDist(g.data.distance)}</Text>
              <Text style={[styles.statLbl, { color: '#2563eb' }]}>masofa</Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: darkMode ? 'rgba(22,163,74,0.15)' : '#f0fdf4' }]}>
              <Feather name="clock" size={12} color="#16a34a" />
              <Text style={[styles.statVal, { color: '#16a34a' }]}>{fmtTime(g.data.duration)}</Text>
              <Text style={[styles.statLbl, { color: '#16a34a' }]}>vaqt</Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: darkMode ? 'rgba(245,158,11,0.15)' : '#fffbeb' }]}>
              <Feather name="corner-up-right" size={12} color="#d97706" />
              <Text style={[styles.statVal, { color: '#d97706' }]}>{g.data.steps.length}</Text>
              <Text style={[styles.statLbl, { color: '#d97706' }]}>burilish</Text>
            </View>
          </View>

          {/* Keyingi qadam satri */}
          {g.data.steps.length > 0 && (
            <View style={[styles.nextStepRow, { borderTopColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
              <View style={[styles.nextStepDot, { backgroundColor: '#2563eb' }]}>
                {stepIcon(g.data.steps[0], '#fff', 18)}
              </View>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.nextStepLabel, { color: '#2563eb' }]}>KEYINGI QADAM</Text>
                <Text style={[styles.nextStepText, { color: colors.textMain }]} numberOfLines={1}>
                  {g.data.steps[0].text}
                </Text>
              </View>
              {g.data.steps[0].distance > 0 && (
                <Text style={[styles.nextStepDist, { color: colors.textMuted }]}>
                  {fmtDist(g.data.steps[0].distance)}
                </Text>
              )}
            </View>
          )}

          {/* Bosqichlar accordion */}
          <Pressable
            onPress={() => setShowSteps((s) => !s)}
            style={({ pressed }) => [
              styles.stepsToggle,
              {
                borderTopColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                backgroundColor: pressed ? (darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)') : 'transparent',
              },
            ]}
          >
            <View style={styles.stepsToggleLeft}>
              <Feather name="list" size={13} color={colors.textMuted} />
              <Text style={[styles.stepsToggleText, { color: colors.textMuted }]}>
                Barcha bosqichlar ({g.data.steps.length})
              </Text>
            </View>
            <Feather name={showSteps ? 'chevron-up' : 'chevron-down'} size={15} color={colors.textMuted} />
          </Pressable>

          {showSteps && (
            <ScrollView
              style={[styles.stepsList, { borderColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {g.data.steps.map((s, i) => (
                <View
                  key={i}
                  style={[
                    styles.stepRow,
                    { borderTopColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                  ]}
                >
                  <View style={styles.stepNumWrap}>
                    <Text style={styles.stepNum}>{i + 1}</Text>
                  </View>
                  <View style={[styles.stepIconSm, { backgroundColor: darkMode ? 'rgba(255,255,255,0.07)' : '#f8fafc' }]}>
                    {stepIcon(s, colors.textMuted)}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.stepText, { color: colors.textMain }]}>{s.text}</Text>
                    {s.distance > 0 && (
                      <Text style={[styles.stepDist, { color: colors.textMuted }]}>{fmtDist(s.distance)}</Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* ══ Pastki karusel (transparent wrap) ══ */}
      {places.length > 0 && !g && (
        <View style={styles.carouselWrap}>
          <ScrollView
            ref={carouselRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}
            snapToInterval={CARD_WIDTH + CARD_GAP}
            decelerationRate="fast"
          >
            {places.map((p) => {
              const active = selectedId === p._id;
              const isRouting = g?.hotel._id === p._id && (g.status === 'locating' || g.status === 'routing');
              const isHotel = p.mapType === 'hotel';
              const accentColor = isHotel ? '#6366f1' : '#d97706';

              return (
                <Pressable
                  key={p._id}
                  onPress={() => focusHotel(p._id)}
                  style={({ pressed }) => [
                    styles.card,
                    {
                      backgroundColor: darkMode ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.97)',
                      borderColor: active ? accentColor : (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.09)'),
                      borderWidth: active ? 2 : 1,
                      transform: [{ scale: pressed ? 0.97 : active ? 1.02 : 1 }],
                    },
                  ]}
                >
                  {/* Karta tepasida rasm */}
                  <View style={{ position: 'relative' }}>
                    <Image
                      source={{ uri: imgSrc(p.image || p.images?.[0]) }}
                      style={styles.cardImage}
                      contentFit="cover"
                      transition={200}
                    />
                    {/* Tur badge */}
                    <View style={[styles.cardTypeBadge, { backgroundColor: active ? accentColor : 'rgba(0,0,0,0.55)' }]}>
                      {isHotel
                        ? <Feather name="home" size={10} color="#fff" />
                        : <MaterialCommunityIcons name="bank" size={10} color="#fff" />}
                    </View>
                    {/* Active indikator (yuqori chiziq) */}
                    {active && (
                      <View style={[styles.cardActiveLine, { backgroundColor: accentColor }]} />
                    )}
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={[styles.cardName, { color: colors.textMain }]} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <View style={styles.cardMeta}>
                      <Text style={[styles.cardCity, { color: colors.textMuted }]} numberOfLines={1}>
                        {p.city || p.district || ''}
                      </Text>
                      {typeof p.rating === 'number' && p.rating > 0 && (
                        <View style={styles.cardRating}>
                          <FontAwesome name="star" size={10} color="#f59e0b" />
                          <Text style={styles.cardRatingText}>{p.rating.toFixed(1)}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardActions}>
                      {/* Batafsil */}
                      <Pressable
                        onPress={() => router.push(isHotel ? `/hotel/${p._id}` : `/attraction/${p._id}`)}
                        style={({ pressed }) => [styles.cardDetailBtn, {
                          backgroundColor: accentColor,
                          opacity: pressed ? 0.85 : 1,
                          flex: 1,
                        }]}
                      >
                        <Text style={styles.cardDetailBtnText}>Ko'rish</Text>
                        <Feather name="arrow-right" size={11} color="#fff" />
                      </Pressable>

                      {/* Marshrut */}
                      <Pressable
                        onPress={() => drawRoute(p)}
                        disabled={isRouting}
                        style={({ pressed }) => [
                          styles.dirBtn,
                          {
                            backgroundColor: darkMode ? 'rgba(255,255,255,0.08)' : '#f8fafc',
                            borderColor: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                            transform: [{ scale: pressed ? 0.92 : 1 }],
                          },
                        ]}
                      >
                        {isRouting
                          ? <ActivityIndicator size="small" color={accentColor} />
                          : <MaterialCommunityIcons name="directions" size={18} color={accentColor} />}
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
  /* ── TOP BAR ── */
  topBar: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '92%',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  topBarIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarText: {
    fontSize: 13,
    fontFamily: FONT.extrabold,
    flex: 1,
    marginRight: 4,
  },
  topBarKicker: {
    fontSize: 9,
    fontFamily: FONT.semibold,
    letterSpacing: 1.2,
  },
  topBarBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  topBarBadgeText: {
    fontSize: 11,
    fontFamily: FONT.black,
  },
  topBarClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── LOADING overlay ── */
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  loadingCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 28,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  loadingTitle: {
    fontSize: 16,
    fontFamily: FONT.bold,
  },
  loadingSub: {
    fontSize: 12,
    fontFamily: FONT.medium,
  },

  /* ── ERROR toast ── */
  errorToast: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  errorToastTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ef4444',
  },
  errorToastText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    marginTop: 1,
  },

  /* ── ROUTE STATS STRIP ── */
  routeStrip: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 16,
    borderRadius: 24,
    borderWidth: 1,
    paddingTop: 16,
    paddingHorizontal: 14,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 10,
    borderRadius: 14,
  },
  statVal: {
    fontSize: 15,
    fontFamily: FONT.black,
  },
  statLbl: {
    fontSize: 9,
    fontFamily: FONT.semibold,
    letterSpacing: 0.5,
  },
  nextStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 14,
    paddingBottom: 10,
    borderTopWidth: 1,
  },
  nextStepDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextStepLabel: {
    fontSize: 9,
    fontFamily: FONT.semibold,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  nextStepText: {
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  nextStepDist: {
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  stepsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderTopWidth: 1,
  },
  stepsToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  stepsToggleText: {
    fontSize: 12,
    fontFamily: FONT.semibold,
  },
  stepsList: {
    maxHeight: 180,
    borderTopWidth: 1,
    marginBottom: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 9,
    borderTopWidth: 1,
  },
  stepNumWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(99,102,241,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNum: {
    fontSize: 9,
    fontFamily: FONT.black,
    color: '#6366f1',
  },
  stepIconSm: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    lineHeight: 17,
  },
  stepDist: {
    fontSize: 10,
    fontFamily: FONT.regular,
    marginTop: 1,
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
    height: 96,
  },
  cardTypeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActiveLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  cardBody: {
    padding: 10,
  },
  cardName: {
    fontSize: 13,
    fontFamily: FONT.bold,
    marginBottom: 3,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardCity: {
    fontSize: 11,
    fontFamily: FONT.medium,
    flex: 1,
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
  },
  cardDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 10,
  },
  cardDetailBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  /* keep old ones for compat */
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
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONT.semibold,
  },
});

