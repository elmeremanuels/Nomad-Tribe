import { format, isWithinInterval, parseISO, addDays, differenceInYears } from 'date-fns';

/**
 * DATABASE SCHEMAS & TYPES
 */

export interface PlaceResult {
  placeId: string;          // Google place_id — unieke identifier
  name: string;             // Naam van het bedrijf of de stad
  address: string;          // Volledig geformatteerd adres
  city: string;             // Stad (extracted uit address_components)
  country: string;          // Land
  countryCode: string;      // ISO 3166-1 alpha-2, bijv. 'ID', 'NL'
  lat: number;
  lng: number;
  types: string[];          // Google place types, bijv. ['restaurant', 'food']
}

export interface PastPlace {
  id: string;
  userId: string;
  placeId: string;          // Google place_id
  name: string;             // Naam van de plek
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  year: number;             // Jaar van bezoek (geen exacte datum — privacy + geheugen)
  linkedSpotId?: string;    // Als deze plek ook een Spot is in de spots-collectie
  addedAt: string;          // ISO — wanneer toegevoegd aan de journey
}

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
  lat: number;
  lng: number;
  place?: PlaceResult;
  citySlug?: string;
  countryCode?: string;
  startDate: string;
  endDate: string;
}

export interface LookingForRequest {
  id: string;
  userId: string;
  familyName: string;
  location: string;
  lat: number;
  lng: number;
  place?: PlaceResult;
  category: 'Help' | 'Playdate' | 'Gear' | 'Advice' | 'Work' | 'Transport' | 'Care';
  title: string;
  description: string;
  date?: string;
  createdAt: string;
  upvotes?: string[];
  downvotes?: string[];
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
  socialLinks?: { platform: string; url: string }[];
  isRemote?: boolean;
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
  travelReasons: string[]; // Changed from travelReason: string
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
  currentLocation?: PlaceResult & { updatedAt: string };
  hasCompletedOnboarding?: boolean; // Added
  role: 'User' | 'UserPlus' | 'SuperAdmin' | 'Advertiser';
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
  // Safety & Moderation
  ugcPrivilegesRevoked?: boolean;
  warnings?: { reason: string; issuedAt: string; issuedBy: string }[];
  coolDownUntil?: string;       // ISO string, gebruiker is beperkt tot deze datum
  isBanned?: boolean;
}

export interface Report {
  id: string;
  reporterId: string;
  targetId: string;
  targetType: 'User' | 'Message' | 'Spot' | 'MarketItem' | 'CollabAsk';
  category: 'Harassment' | 'Spam' | 'IllegalContent' | 'FakeProfile' | 'DangerousLocation';
  description?: string;
  status: 'Pending' | 'Reviewed' | 'Resolved' | 'Dismissed';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  action?: string;
}

export interface BlockedUser {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

export interface DeletedAccount {
  email: string;
  deletedAt: string;
  trialUsed: boolean;
  // Auto-verwijderd na 45 dagen via Cloud Function
}

export interface AdminAlert {
  id: string;
  type: 'CRITICAL' | 'STANDARD' | 'UGC';
  reportId: string;
  createdAt: string;
  isRead: boolean;
}

export type SpotCategory = 
  | 'Playground' 
  | 'Workspace' 
  | 'Medical' 
  | 'Accommodation' 
  | 'Cafe'
  | 'Restaurant'
  | 'School'
  | 'Library'
  | 'Beach'
  | 'Park'
  | 'Museum'
  | 'Supermarket'
  | 'Pharmacy'
  | 'Gym'
  | 'Pool'
  | 'Event Venue';

export interface OpeningHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
  isAlwaysOpen?: boolean;
}

export interface Spot {
  // --- EXISTING ---
  id: string;
  name: string;
  category: SpotCategory;
  description: string;
  imageUrl?: string;
  photoAttributions?: string[];
  rating: number;
  recommendedBy?: string;
  votes?: { up: string[]; down: string[] };

  // --- NEW: Locatie & Geo ---
  place: PlaceResult;
  citySlug: string; 
  countryCode: string; 
  osmId?: string; 
  googlePlaceId?: string; 
  lat?: number;
  lng?: number;

  // --- NEW: Kwaliteit & Moderatie ---
  isVetted: boolean; 
  vettedBy?: string; 
  vettedAt?: string; 
  reportCount: number; 
  isHidden: boolean; 

  // --- NEW: Rijke Content ---
  tags: string[]; 
  ageRange?: { min: number; max: number }; 
  openingHours?: OpeningHours; 
  priceLevel?: 0 | 1 | 2 | 3; 
  monthlyDeal?: {
    discount: string;
    description: string;
    promoCode?: string;
    expiresAt?: string;
  };
  website?: string;
  phoneNumber?: string;
  verifiedTags: string[]; 

  // --- NEW: Data Source ---
  dataSource: 'ugc' | 'osm_import' | 'numbeo' | 'admin_seed';
  importedAt?: string;

  // --- NEW: Statistieken ---
  viewCount: number;
  saveCount: number;
  createdAt: string;
  updatedAt: string;
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
    coworking: number;
  };
  vibeScore: number;
  familyFriendlyScore: number;
  internationalSchools: string[];
  suggestions: Record<string, { userId: string; price: number; timestamp: string }[]>;
}

export interface CityProfile {
  id: string; // citySlug
  name: string;
  country: string;
  continent: string;
  coordinates: { lat: number; lng: number };
  nomadScore: number;
  familyScore: number;
  safetyScore: number;
  internetScore: number;
  costIndex: number;
  language: string;
  currency: string;
  timezone: string;
  tags: string[];
  coverImageUrl: string;
  spotCount: number;
  familyCount: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EventCategory = 
  | 'Playdate'
  | 'Workshop'
  | 'Worldschooling'
  | 'Language Exchange'
  | 'Networking'
  | 'Outdoor Activity'
  | 'Cultural'
  | 'Sports'
  | 'Co-working Day'
  | 'Market'
  | 'Festival';

export interface CityEvent {
  id: string;
  citySlug: string;
  title: string;
  description: string;
  category: EventCategory;
  tags: string[];
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location: {
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
    spotId?: string;
  };
  organizer: {
    userId?: string;
    name: string;
    isVerified: boolean;
  };
  imageUrl?: string;
  price: number | 'Free';
  currency?: string;
  maxParticipants?: number;
  rsvps: string[];
  isVetted: boolean;
  dataSource: 'ugc' | 'eventbrite_import' | 'facebook_import' | 'admin_seed';
  relevanceScore?: number;
  isRecurring: boolean;
  recurrencePattern?: 'weekly' | 'monthly';
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
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
  location: string;
  lat: number;
  lng: number;
  place?: PlaceResult;
  title: string;
  description: string;
  category: 'Stroller' | 'Car Seat' | 'Toys' | 'Books' | 'Gear' | 'Vehicle' | 'Clothes' | 'Services' | 'Other' | 'Professional Services';
  mode: 'Sell' | 'Swap';
  price: number | 'Free';
  status: 'Available' | 'Reserved' | 'Sold';
  imageUrl?: string;
  reservedUntil?: string;
  reservedBy?: string;
  createdAt: string;
  upvotes?: string[];
  downvotes?: string[];
}

export interface PopUpEvent {
  id: string;
  organizerId: string;
  organizerName?: string;
  title: string;
  description?: string;
  location: string;
  lat: number;
  lng: number;
  place?: PlaceResult;
  date: string;
  time?: string;
  category?: string;
  imageUrl?: string;
  maxParticipants: number;
  participants: string[]; // User IDs
  waitlist: string[];
  targetAgeRange?: { min: number; max: number };
  isVerified?: boolean;
  isCollaborative?: boolean;
  upvotes?: string[];
  downvotes?: string[];
}

// ── DEALS ──────────────────────────────────────────────

export type DealCategory =
  | 'Hotel'
  | 'Restaurant'
  | 'VPN'
  | 'Creditcard'
  | 'Vluchten'
  | 'Verzekering'
  | 'SIM-kaart'
  | 'Coworking'
  | 'Activiteiten'
  | 'Overig';

export type DealStatus = 'Active' | 'Paused' | 'Expired';

export interface Deal {
  id: string;

  // Content
  name: string;
  advertiserId: string;         // FK naar advertisers/{id}
  advertiserName: string;       // Denormalized voor display
  category: DealCategory;
  description: string;
  imageUrl: string;
  logoUrl?: string;
  disclaimer?: string;          // "Geldig t/m 31 dec · excl. belastingen"

  // Pricing
  originalPrice?: number;
  dealPrice?: number;
  currency: string;             // 'EUR' | 'USD' | 'GBP' — default 'EUR'
  discountLabel?: string;       // "20% OFF" / "FREE 1 maand"

  // CTA
  affiliateUrl: string;
  promoCode?: string;
  ctaText: string;              // "Book Now" | "Get Deal" | "Claim Code" | "Apply Now"

  // Targeting
  isGlobal: boolean;
  location?: string;
  lat?: number;
  lng?: number;
  place?: PlaceResult;
  radiusKm: number;             // Default 25

  // Scheduling
  startDate: string;            // ISO
  endDate: string;              // ISO

  // Status
  status: DealStatus;
  isFeatured: boolean;
  targetPremiumOnly: boolean;

  // Tracking (atomaire updates via increment())
  impressions: number;
  clicks: number;

  // Meta
  createdAt: string;
  createdBy: string;            // Super Admin uid
  reportToken: string;          // Unieke token voor publieke rapport-link
}

// ── ADVERTISER ─────────────────────────────────────────

export interface Advertiser {
  id: string;                   // Firebase Auth uid van het adverteerder-account
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  notes?: string;               // Intern — bijv. "betaalt per kwartaal"
  isActive: boolean;
  createdAt: string;
  createdBy: string;            // Super Admin uid die het account aanmaakte
}

// Replaced by Conversation and Message above

/**
 * ADVANCED MATCHMAKING ALGORITHM
 */

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 999999;
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return 999999;
  
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
      userTrip.lat || 0, userTrip.lng || 0,
      otherTrip.lat || 0, otherTrip.lng || 0
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
      userTrip.lat || 0, userTrip.lng || 0,
      otherTrip.lat || 0, otherTrip.lng || 0
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
