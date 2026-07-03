/**
 * GradientText.tsx — gradientli matn (web `.text-gradient` ekvivalenti).
 *
 * Eng ishonchli usul: gradient har bir harf rangini interpolyatsiya qilish
 * orqali chiziladi. Oddiy RN <Text> ishlatiladi — native modul (masked-view,
 * svg) kerak emas, shu sababli Expo Go'da har doim, har qanday qurilmada
 * bir xil ishlaydi va haqiqiy Outfit shrift qo'llanadi.
 */
import React from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';

/** '#rgb' yoki '#rrggbb' ni [r, g, b] ga o'giradi */
const parseHex = (hex: string): [number, number, number] => {
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(h, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

/** Bir necha rang orasida t (0..1) nuqtadagi rangni hisoblaydi */
const lerpColor = (stops: readonly string[], t: number): string => {
  if (stops.length === 1) return stops[0];
  const clamped = Math.min(Math.max(t, 0), 1);
  const segCount = stops.length - 1;
  const seg = Math.min(Math.floor(clamped * segCount), segCount - 1);
  const localT = clamped * segCount - seg;
  const [r1, g1, b1] = parseHex(stops[seg]);
  const [r2, g2, b2] = parseHex(stops[seg + 1]);
  const r = Math.round(r1 + (r2 - r1) * localT);
  const g = Math.round(g1 + (g2 - g1) * localT);
  const b = Math.round(b1 + (b2 - b1) * localT);
  return `rgb(${r},${g},${b})`;
};

interface GradientTextProps {
  text: string;
  colors: readonly [string, string, ...string[]];
  style?: StyleProp<TextStyle>;
}

export function GradientText({ text, colors, style }: GradientTextProps) {
  const chars = Array.from(text);
  const denom = Math.max(chars.length - 1, 1);

  return (
    <Text style={style} accessibilityLabel={text}>
      {chars.map((ch, i) => (
        <Text key={i} style={{ color: lerpColor(colors, i / denom) }}>
          {ch}
        </Text>
      ))}
    </Text>
  );
}
