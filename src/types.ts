import { format, isWithinInterval, parseISO, addDays, differenceInYears } from 'date-fns';

/**
 * DATABASE SCHEMAS & TYPES
 */

export interface Kid {
  id: string;
  age: number;
  gender?: 'Boy' | 'Girl' | 'Non-binary';
  interests: string[];
}

export interface Parent {
  id: string;
  name: string;
  role: string; // e.g., "Mom", "Dad", "Parent"
  interests: string[];
  photoUrl?: string;
  collabCard?: CollabCard;
}

export interface Trip {
  id: string;
  familyId: string;
  location: string;
  coordinates: { lat: number; lng: number };
  startDate: string;
  endDate: string;
}

export interface LookingForRequest {
  id: string;
  userId: string;
  familyName: string;
  location: string;
  category: 'Help' | 'Playdate' | 'Gear' | 'Advice' | 'Work';
  title: string;
  description: string;
  createdAt: string;
  votes?: { up: string[]; down: string[] };
}

export interface PrivacySettings {
  isIncognito: boolean; // Default: false. If true, user is hidden from all matching radars.
}

export interface Connection {
  id: string;
  requesterId: string;
  recipientId: string;
  participantIds: string[]; // [requesterId, recipientId]
  status: 'none' | 'pending' | 'accepted';
  category?: 'tribe' | 'collab';
}

export interface Conversation {
  id: string;
  connectionId: string; // Links directly to an accepted connection
  participantIds: string[]; // [requesterId, recipientId]
  lastMessageSnippet: string;
  lastMessageAt: string;
  category?: 'tribe' | 'collab';
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  participantIds: string[]; // [requesterId, recipientId]
  content: string;
  createdAt: string;
  category?: 'tribe' | 'collab';
}

export interface CollabCard {
  occupation: string; // From occupationsSeed.json
  superpowers: string[]; // Max 3 from skillsSeed.json (The "Offer")
  currentMission: string; // Short string: What they are working on
  linkedInUrl?: string;
}

export interface CollabAsk {
  id: string;
  userId: string;
  skillNeeded: string; // 1 tag from skillsSeed.json (The "Demand")
  description: string; // Max 150 chars: "I need help with..."
  locationSlug: string; // For local matching
  createdAt: string;
}

export interface CollabEndorsement {
  id: string;
  targetUserId: string;
  authorId: string;
  skill: string;
  comment: string;
  createdAt: string;
}

export interface FamilyProfile {
  id: string;
  familyName: string;
  bio: string;
  travelReason: string; // e.g., "Worldschooling", "Escaping the 9-5"
  nativeLanguage: string;
  spokenLanguages: string[];
  parents: Parent[];
  kids: Kid[];
  isPremium: boolean;
  premiumType: 'NONE' | 'MONTHLY' | 'ANNUAL' | 'LIFETIME' | 'TRIAL';
  premiumUntil?: string;
  verificationLevel: 1 | 2 | 3;
  vouchedBy: string[];
  badges: string[];
  gamification: {
    hasClaimedPioneerBonus: boolean;
    totalSpotsAdded: number;
  };
  askUsAbout?: string;
  photoUrl?: string;
  currentLocation?: {
    name: string;
    lat: number;
    lng: number;
    updatedAt: string;
  };
  role: 'User' | 'UserPlus' | 'SuperAdmin';
  collabCard?: CollabCard;
  openToCollabs: boolean;
  privacySettings: PrivacySettings;
  preferences: {
    language: 'NL' | 'EN' | 'DE' | 'RU' | 'FR';
    showNextLocationSuggestions: boolean;
    privacy: {
      showBioToNonConnects: boolean;
      showKidsToNonConnects: boolean;
      showTripsToNonConnects: boolean;
    };
  };
}

export interface City {
  id: string;
  name: string;
  country: string;
  slug: string;
}

export interface PriceSuggestion {
  userId: string;
  price: number;
  timestamp: string;
}

export interface DestinationGuidance {
  id: string;
  cityName: string;
  country: string;
  costIndex: { 
    coffee: number; 
    localMeal: number; 
    pizza: number; 
    beer: number; 
    gasPerLiter: number; 
    beachBed: number; 
    coworking?: number;
  };
  suggestions?: {
    coffee?: PriceSuggestion[];
    pizza?: PriceSuggestion[];
    beer?: PriceSuggestion[];
    coworking?: PriceSuggestion[];
  };
  vibeScore: number;
  familyFriendlyScore: number;
  internationalSchools: string[];
}

export interface Spot {
  id: string;
  name: string;
  category: 'Medical' | 'Workspace' | 'Playground' | 'Accommodation';
  coordinates: { lat: number; lng: number };
  description: string;
  imageUrl?: string;
  verifiedTags: string[];
  rating: number;
  recommendedBy?: string;
  votes?: { up: string[]; down: string[] };
  monthlyDeal?: {
    title: string;
    discount: string;
    description: string;
  };
}

export interface SpotReview {
  id: string;
  spotId: string;
  authorId: string;
  story: string; 
  whyFamilyFriendly: string; 
  suitableAges: number[]; 
  rating: number; 
  photos: string[]; // Min 1
  createdAt: string;
}

export interface Friendship {
  id: string;
  userIds: [string, string];
  status: 'Pending' | 'Accepted';
  createdAt: string;
}

export interface AppSettings {
  maxUploadSizeKB: number;
  maintenanceMode: boolean;
  featuredDestinations: string[];
}

export interface Activity {
  id: string;
  userId: string;
  familyName: string;
  type: 'Trip' | 'Spot' | 'Event' | 'LookingFor' | 'Friend' | 'Marketplace';
  content: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'VibeCheck' | 'General' | 'ConnectionRequest';
  data?: any;
  isRead: boolean;
  scheduledFor: string;
  createdAt: string;
}

export interface MarketItem {
  id: string;
  sellerId: string;
  sellerName: string;
  location: { lat: number; lng: number; name: string };
  title: string;
  category: 'Stroller' | 'Car Seat' | 'Toys' | 'Books' | 'Other' | 'Professional Services';
  price: number | 'Free';
  status: 'Available' | 'Reserved' | 'Sold';
  imageUrl?: string;
  reservedUntil?: string;
  reservedBy?: string;
  createdAt: string;
  votes?: { up: string[]; down: string[] };
}

export interface PopUpEvent {
  id: string;
  organizerId: string;
  title: string;
  location: { lat: number; lng: number; name: string };
  date: string;
  maxParticipants: number;
  participants: string[]; // User IDs
  waitlist: string[];
  targetAgeRange: { min: number; max: number };
}

// Replaced by Conversation and Message above

/**
 * ADVANCED MATCHMAKING ALGORITHM
 */

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateMatchScore(
  userProfile: FamilyProfile, 
  userTrip: Trip, 
  otherProfile: FamilyProfile, 
  otherTrip: Trip,
  collabMode: boolean = false
) {
  let score = 0;
  const reasons: string[] = [];

  if (collabMode) {
    // PROFESSIONAL SCORING
    if (userProfile.collabCard && otherProfile.collabCard) {
      // Shared Occupation
      if (userProfile.collabCard.occupation === otherProfile.collabCard.occupation) {
        score += 40;
        reasons.push(`${otherProfile.familyName} is also a ${userProfile.collabCard.occupation}!`);
      }

      // Shared Superpowers (Offer/Offer match)
      const sharedSkills = userProfile.collabCard.superpowers.filter(s => 
        otherProfile.collabCard?.superpowers.includes(s)
      );
      if (sharedSkills.length > 0) {
        score += 30;
        reasons.push(`Shared skills: ${sharedSkills.join(', ')}`);
      }
    }
    
    // Proximity still matters for networking
    const distance = calculateDistance(
      userTrip.coordinates.lat, userTrip.coordinates.lng,
      otherTrip.coordinates.lat, otherTrip.coordinates.lng
    );
    if (distance < 50) {
      score += 20;
      reasons.push("Nearby professional match");
    }

    // Languages are critical for professional collab
    if (userProfile.nativeLanguage === otherProfile.nativeLanguage) {
      score += 10;
    }
  } else {
    // FAMILY SCORING (original logic)
    if (userProfile.nativeLanguage === otherProfile.nativeLanguage) {
      score += 30;
      reasons.push(`Both speak ${userProfile.nativeLanguage} natively!`);
    }

    const sharedLanguages = userProfile.spokenLanguages.filter(l => otherProfile.spokenLanguages.includes(l) && l !== userProfile.nativeLanguage);
    if (sharedLanguages.length > 0) {
      score += 15;
      reasons.push(`Both speak ${sharedLanguages.join(', ')}`);
    }

    const userParentInterests = userProfile.parents.flatMap(p => p.interests);
    const otherParentInterests = otherProfile.parents.flatMap(p => p.interests);
    const sharedParentInterests = userParentInterests.filter(i => otherParentInterests.includes(i));
    
    if (sharedParentInterests.length > 0) {
      score += 25;
      const uniqueInterests = Array.from(new Set(sharedParentInterests));
      reasons.push(`Parents share interests: ${uniqueInterests.slice(0, 2).join(' & ')}`);
    }

    const userKidInterests = userProfile.kids.flatMap(k => k.interests);
    const otherKidInterests = otherProfile.kids.flatMap(k => k.interests);
    const sharedKidInterests = userKidInterests.filter(i => otherKidInterests.includes(i));

    if (sharedKidInterests.length > 0) {
      score += 25;
      const uniqueInterests = Array.from(new Set(sharedKidInterests));
      reasons.push(`Kids share interests: ${uniqueInterests.slice(0, 2).join(' & ')}`);
    }

    const distance = calculateDistance(
      userTrip.coordinates.lat, userTrip.coordinates.lng,
      otherTrip.coordinates.lat, otherTrip.coordinates.lng
    );
    if (distance < 30) {
      score += 20;
      reasons.push("Nearby match (within 30km)");
    }
  }

  // Date Overlap (Always matters)
  const userStart = parseISO(userTrip.startDate);
  const userEnd = parseISO(userTrip.endDate);
  const otherStart = parseISO(otherTrip.startDate);
  const otherEnd = parseISO(otherTrip.endDate);

  const overlapStart = userStart > otherStart ? userStart : otherStart;
  const overlapEnd = userEnd < otherEnd ? userEnd : otherEnd;

  if (overlapStart <= overlapEnd) {
    score += 10;
    reasons.push("Overlapping dates");
  }

  return { score: Math.min(score, 100), reasons };
}
