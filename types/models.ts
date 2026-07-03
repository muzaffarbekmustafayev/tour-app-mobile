/**
 * models.ts — Backend modellariga mos TypeScript tiplari.
 * (tour-app-backend/models/Hotel.js va Attraction.js asosida)
 */

export interface Room {
  _id: string;
  name: string;
  capacity: number;
  areaSqMeters?: number;
  bedType?: string;
  bathroomType?: 'private' | 'shared';
  amenities?: string[];
}

export interface Accessibility {
  mobility?: {
    wheelchairAccessible?: boolean;
    stepFreeRoute?: boolean;
    elevator?: boolean;
    accessibleParking?: boolean;
    accessibleToilet?: boolean;
    accessibleRooms?: boolean;
  };
  visual?: {
    brailleSigns?: boolean;
    tactilePaving?: boolean;
    highContrastSignage?: boolean;
  };
  auditory?: {
    audioGuides?: boolean;
    hearingLoop?: boolean;
    hearingAssistance?: boolean;
    signLanguageStaff?: boolean;
    vibrationAlerts?: boolean;
  };
  cognitive?: {
    quietZones?: boolean;
    easyToReadSignage?: boolean;
  };
  support?: {
    serviceAnimalFriendly?: boolean;
  };
}

export interface Atmosphere {
  mood?: string;
  soundscape?: string;
  bestTimeOfDay?: string;
  localTip?: string;
}

export interface Hotel {
  _id: string;
  name: string;
  description?: string;
  descriptionShort?: string;
  image?: string;
  images?: string[];
  city?: string;
  country?: string;
  address?: string;
  category?: 'hotel' | 'resort' | 'hostel' | string;
  stars?: number;
  rating?: number;
  reviewsCount?: number;
  amenities?: string[];
  nearbyPlaces?: string[];
  checkIn?: string;
  checkOut?: string;
  rooms?: Room[];
  accessibility?: Accessibility;
  familyAndElderly?: {
    strollerAccessible?: boolean;
    medicalServiceOnSite?: boolean;
    nursingRoom?: boolean;
  };
  digitalInclusion?: {
    screenReaderDescription?: string;
    offlineDataSupport?: boolean;
    lowDataMode?: boolean;
  };
  atmosphere?: Atmosphere;
  location?: { lat?: number; lng?: number };
  contact?: { phone?: string; email?: string };
  owner?: { _id?: string; phone?: string; email?: string } | string;
  videoTour?: { url?: string; captioned?: boolean };
  panoramas?: { url: string; caption?: string; room?: string }[];
  distanceKm?: number;
}

export interface AttractionReview {
  _id?: string;
  name?: string;
  rating: number;
  comment?: string;
  createdAt?: string;
}

export interface ThingToSee {
  title: string;
  type?: string;
  description?: string;
  walkingMinutes?: number;
}

export interface Attraction {
  _id: string;
  name: string;
  description?: string;
  descriptionShort?: string;
  images?: string[];
  district?: string;
  address?: string;
  rating?: number;
  reviewsCount?: number;
  entryFee?: string;
  bestSeason?: string;
  video360?: { url?: string; type?: 'file' | 'youtube' | string; captioned?: boolean };
  accessibility?: Record<string, boolean>;
  atmosphere?: Atmosphere;
  thingsToSeeAround?: ThingToSee[];
  reviews?: AttractionReview[];
  location?: { lat?: number; lng?: number };
}

export interface Review {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: { name?: string };
}

export type UserRole = 'GUEST' | 'CUSTOMER' | 'HOTEL_OWNER' | 'ADMIN';

export interface User {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  createdAt?: string;
  blocked?: boolean;
}
