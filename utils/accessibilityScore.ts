/**
 * accessibilityScore.ts — Inklyuziv qulayliklar darajasi (0–100%).
 * (web `src/utils/accessibilityScore.js` porti — hisoblash bir xil)
 */
import type { Hotel } from '@/types/models';

export const calcAccessibilityScore = (hotel?: Hotel | null): number => {
  if (!hotel) return 0;

  const checks = [
    hotel.accessibility?.mobility?.wheelchairAccessible,
    hotel.accessibility?.mobility?.stepFreeRoute,
    hotel.accessibility?.mobility?.accessibleParking,
    hotel.accessibility?.mobility?.accessibleToilet,
    hotel.accessibility?.mobility?.accessibleRooms,
    hotel.accessibility?.visual?.brailleSigns,
    hotel.accessibility?.visual?.tactilePaving,
    hotel.accessibility?.visual?.highContrastSignage,
    hotel.accessibility?.auditory?.audioGuides,
    hotel.accessibility?.auditory?.hearingLoop,
    hotel.accessibility?.auditory?.signLanguageStaff,
    hotel.accessibility?.cognitive?.quietZones,
    hotel.accessibility?.cognitive?.easyToReadSignage,
    hotel.accessibility?.support?.serviceAnimalFriendly,
    hotel.familyAndElderly?.strollerAccessible,
    hotel.familyAndElderly?.medicalServiceOnSite,
  ];

  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
};

export interface ScoreStyle {
  color: string;
  bg: string;
  label: string;
}

/** Skorga mos rang qaytaradi (web bilan bir xil qiymatlar) */
export const getScoreStyle = (score: number): ScoreStyle => {
  if (score >= 75) return { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Juda qulay' };
  if (score >= 50) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Qisman qulay' };
  return { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: "Ma'lumot yetarli emas" };
};
