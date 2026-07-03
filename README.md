# tour-app-mobile — NavaiTour mobil ilovasi

`tour-app-frontend` (web) dizaynining **birga-bir mobil nusxasi**.
**Expo SDK 54** + **Expo Router v6** + **TypeScript (strict)**.

Ranglar, gradientlar, shrift (Outfit), kartalar, badge'lar, bottom nav —
hammasi webdagi `index.css` CSS variablelaridan birga-bir ko'chirilgan
(`constants/theme.ts`). Light/Dark tema ham webdagi kabi ishlaydi.

---

## O'rnatish

```bash
cd tour-app-mobile

# 1. Kutubxonalarni o'rnatish (versiyalar package.json da SDK 54 ga moslangan)
npm install

# 2. Ishga tushirish
npx expo start
```

> Telefonda **Expo Go** ilovasi orqali QR kodni skanerlang (telefon va kompyuter
> bitta Wi-Fi tarmog'ida bo'lishi kerak).

Agar biror paket versiyasi nomos deb ogohlantirsa:

```bash
npx expo install --fix
```

## Backend bilan ulanish

Telefon `localhost` ni ko'rmaydi. Shu sababli dev rejimda API manzili
**Expo hostUri orqali avtomatik** aniqlanadi (kompyuteringiz IP : 5000).
Backend'ni tashqi interfeysda ishga tushiring:

```bash
cd ../tour-app-backend
npm run dev   # server 0.0.0.0:5000 da tinglashi kerak
```

Qo'lda belgilash kerak bo'lsa — `tour-app-mobile/.env` fayl yarating:

```
EXPO_PUBLIC_API_URL=http://192.168.1.xx:5000/api
```

## Struktura

```
app/
├── _layout.tsx          # Root: fontlar, AuthProvider, ThemeToggle, Stack
├── (tabs)/
│   ├── _layout.tsx      # Maxsus BottomNav (webdagi mobil nav birga-bir)
│   ├── index.tsx        # Bosh sahifa (hero, tumanlar, kategoriyalar...)
│   ├── attractions.tsx  # Tarixiy joylar
│   ├── search.tsx       # Qidiruv + filtr drawer
│   ├── map.tsx          # Xarita (WebView + Leaflet — Expo Go'da ishlaydi)
│   ├── favorites.tsx    # Sevimlilar (login talab qilinadi)
│   └── profile.tsx      # Profil (login talab qilinadi)
├── hotel/[id].tsx       # Mehmonxona detali (galereya, TTS, video, panorama)
├── attraction/[id].tsx  # Tarixiy joy detali (360°, sharh formasi, yaqin joylar)
├── login.tsx            # Kirish
└── register.tsx         # Ro'yxatdan o'tish

components/    # HotelCard, AttractionCard, BottomNav, bannerlar, ui/*
constants/     # config.ts (API, fallback), theme.ts (dizayn tokenlari)
context/       # AuthContext (auth + favorites + dark mode)
services/      # api.ts (axios interceptorlar), attractions.ts
utils/         # accessibilityScore.ts
```

## Versiyalar (SDK 54 ga moslangan)

| Paket | Versiya |
|---|---|
| expo | ~54.0.0 |
| react-native | 0.81.4 |
| react | 19.1.0 |
| expo-router | ~6.0.10 |
| react-native-webview | 13.15.0 |
| react-native-svg | 15.12.1 |
| @react-native-async-storage/async-storage | 2.2.0 |
| axios | ^1.13.6 (web bilan bir xil) |

## Google bilan kirish

Google OAuth `expo-auth-session` orqali ulangan (backend `POST /auth/google` ga
`access_token` yuboriladi — web bilan bir xil).

> ⚠️ **Google login Expo Go'da ishlamaydi** — Google xavfsizlik siyosati
> `exp://` redirect manzilini qabul qilmaydi (Expo'ning eski auth.expo.io
> proxysi ham o'chirilgan). **Development build** kerak.

### 1. Kutubxonalarni o'rnatish

```bash
npx expo install expo-auth-session expo-crypto expo-web-browser
```

### 2. Google Cloud Console'da Client ID yaratish

[console.cloud.google.com](https://console.cloud.google.com) → APIs & Services →
Credentials → **Create Credentials → OAuth client ID**:

- **Android** turini tanlang:
  - Package name: `com.navaitour.app`
  - SHA-1 (debug keystore'dan):
    ```bash
    keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android
    ```
- (ixtiyoriy) **iOS** turi: bundle `com.navaitour.app`
- **Web** turi allaqachon bor bo'lsa (webdagi VITE loyihaniki) — o'shanikini ishlating

### 3. `.env` fayliga yozish

```
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=xxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=xxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxxx.apps.googleusercontent.com
```

### 4. Development build bilan ishga tushirish

```bash
# Telefon USB orqali ulangan yoki emulator ochiq bo'lsin
npx expo run:android
```

Shundan keyin login sahifasidagi "Google bilan kirish" haqiqiy Google oynasini
ochadi. Expo Go'da esa tugma nima uchun ishlamasligi haqida xabar ko'rsatadi.

## Hozircha kiritilmagan (keyingi bosqich)

- **Chat** (web ChatContext + socket.io) — hotel detaldagi "Egasi bilan suhbat"
  hozircha ogohlantirish ko'rsatadi
- **Admin / Owner dashboardlari** — bu rollar hozircha mijoz nav'ini ko'radi
