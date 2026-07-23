# NavaiTour Mobile 🇺🇿

Ushbu qism NavaiTour loyihasining Android va iOS (mobil qurilmalar) uchun mo'ljallangan qismidir. React Native va Expo yordamida kross-platforma asosida yozilgan.

## Asosiy texnologiyalar
- **[React Native](https://reactnative.dev/)** - Mobil karkas
- **[Expo](https://expo.dev/)** - Dasturlashni osonlashtiruvchi platforma
- **[Tailwind CSS (Nativewind)](https://www.nativewind.dev/)** - UI dizayn (Utility-first CSS)
- **React Navigation** - Sahifalararo navigatsiya
- **Axios** - Backend API lar bilan ulanish uchun
- **Zustand / Context API** - Holat (state) ni boshqarish uchun

## Ishga tushirish (O'rnatish)

Ushbu repozitoriyni klonlagach, loyihani mahalliy (local) muhitda ishga tushirish uchun quyidagilarni bajaring:

### 1. Paketlarni o'rnatish
Terminal (CLI) orqali ushbu papkaga (`tour-app-mobile`) kiring va barcha kutubxonalarni o'rnating:
```bash
npm install
```

### 2. .env faylini yaratish
Loyiha ichida (papkada) `.env` nomli fayl yarating va unga backend manzilini kiriting. (Esda tuting, mobil emulatorda `localhost` ishlamaydi, shuning uchun shaxsiy IP manzilingizni kiriting):
```env
# Misol uchun kompyuteringiz IPv4 manzili
EXPO_PUBLIC_API_URL=http://192.168.1.10:5000/api
```

### 3. Dasturni yurgizish
Dasturni development muhitida ishga tushirish uchun:
```bash
npx expo start
# yoki
npm start
```

Terminalda chiqqan QR-kodni telefoningizdagi **Expo Go** ilovasi orqali skanerlang. Shuningdek:
- `a` harfini bosib - Android emulyatorda
- `i` harfini bosib - iOS simulatorda ochishingiz mumkin.

## Qisqacha tuzilishi
- `/app` — Expo Router yordamida yozilgan sahifalar.
- `/components` — Ko'p marta ishlatiladigan komponentlar.
- `/constants` — Ranglar, o'lchamlar va h.k.
- `/context` — Foydalanuvchi ma'lumotlarini (Auth) saqlovchi qism.
- `/services` — Backend API uchun HTTP xizmatlar.

## Litsenziya
MIT
