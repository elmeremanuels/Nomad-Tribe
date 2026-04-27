import { create } from 'zustand';
import { 
  FamilyProfile, 
  Trip, 
  Spot, 
  MarketItem, 
  PopUpEvent, 
  LookingForRequest, 
  Kid, 
  Connection, 
  Conversation, 
  Message, 
  Activity, 
  SpotReview, 
  AppSettings, 
  AppNotification, 
  CollabAsk, 
  CollabCard, 
  CollabEndorsement, 
  Report, 
  BlockedUser, 
  AdminAlert,
  CityProfile,
  CityEvent,
  SpotCategory,
  EventCategory,
  DestinationGuidance,
  Deal,           // Added
  Advertiser,     // Added
  DealCategory,   // Added
  DealStatus,      // Added
  PlaceResult,
  PastPlace
} from './types';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { 
  collection, 
  getDocs,
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  where, 
  updateDoc, 
  deleteDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  writeBatch,
  arrayUnion,
  increment       // Added
} from 'firebase/firestore';
import { onAuthStateChanged, getRedirectResult, User as FirebaseUser, setPersistence, browserLocalPersistence, signOut } from 'firebase/auth';

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

interface NomadStore {
  currentUser: FamilyProfile | null;
  profiles: FamilyProfile[];
  trips: Trip[];
  spots: Spot[];
  marketItems: MarketItem[];
  events: PopUpEvent[];
  lookingFor: LookingForRequest[];
  connections: Connection[];
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  cities: CityProfile[];
  cityEvents: CityEvent[];
  appSettings: AppSettings;
  reports: Report[];
  blocks: BlockedUser[];
  notifications: AppNotification[];
  isAuthReady: boolean;
  collabMode: boolean;
  activeTab: 'tribe' | 'connect' | 'tribe-nearby' | 'explore' | 'profile' | 'marketplace' | 'deals' | 'admin';
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[];
  activities: Activity[];
  destinations: DestinationGuidance[];
  reviews: SpotReview[];
  collabAsks: CollabAsk[];
  collabEndorsements: CollabEndorsement[];
  deals: Deal[];
  adminDeals: Deal[];
  advertisers: Advertiser[];
  pastPlaces: PastPlace[];
  
  // Actions
  init: () => void;
  setCollabMode: (mode: boolean) => void;
  setCurrentUser: (user: FamilyProfile | null) => void;
  updateProfile: (profile: Partial<FamilyProfile>) => Promise<void>;
  updatePreferences: (prefs: Partial<FamilyProfile['preferences']>) => Promise<void>;
  updateKids: (kids: Kid[]) => Promise<void>;
  addTrip: (trip: Trip) => Promise<void>;
  updateTrip: (trip: Trip) => Promise<void>;
  removeTrip: (tripId: string) => Promise<void>;
  saveVibeCheck: (metrics: Record<string, number>) => Promise<void>;
  vouchForFamily: (vouchingId: string, targetId: string) => Promise<void>;
  reserveItem: (itemId: string, buyerId: string) => Promise<void>;
  addItem: (item: MarketItem) => Promise<void>;
  removeMarketItem: (itemId: string) => Promise<void>;
  cancelReservation: (itemId: string) => Promise<void>;
  processPayment: (itemId: string, amount: number) => Promise<boolean>;
  rsvpForEvent: (eventId: string, userId: string) => Promise<void>;
  addEvent: (event: PopUpEvent) => Promise<void>;
  removeEvent: (eventId: string) => Promise<void>;
  voteOnPost: (postId: string, collection: 'marketplace' | 'lookingFor' | 'events', delta: 1 | -1) => Promise<void>;
  addLookingFor: (request: LookingForRequest) => Promise<void>;
  removeLookingFor: (requestId: string) => Promise<void>;
  requestConnection: (targetId: string) => Promise<void>;
  acceptConnection: (connectionId: string) => Promise<void>;
  cancelConnection: (connectionId: string) => Promise<void>;
  blockUser: (targetUserId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  subscribeToMessages: (conversationId: string) => () => void;
  submitReport: (report: Omit<Report, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  reportContent: (targetId: string, targetType: 'User' | 'MarketItem' | 'Spot' | 'Message', reason: string) => Promise<void>;
  vote: (type: 'lookingFor' | 'marketplace' | 'spots', id: string, direction: 'up' | 'down') => Promise<void>;
  addSpot: (spot: Spot) => Promise<void>;
  removeSpot: (spotId: string) => Promise<void>;
  addReview: (review: SpotReview) => Promise<void>;
  addCollabAsk: (ask: CollabAsk) => Promise<void>;
  removeCollabAsk: (askId: string) => Promise<void>;
  addCollabEndorsement: (endorsement: CollabEndorsement) => Promise<void>;

  // Past Places
  addPastPlace: (place: PlaceResult, year: number) => Promise<void>;
  removePastPlace: (pastPlaceId: string) => Promise<void>;

  // Deals
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt' | 'impressions' | 'clicks' | 'reportToken'>) => Promise<void>;
  updateDeal: (dealId: string, updates: Partial<Deal>) => Promise<void>;
  trackDealClick: (dealId: string) => Promise<void>;
  trackDealImpression: (dealId: string) => Promise<void>;

  // Advertisers
  addAdvertiser: (advertiser: Omit<Advertiser, 'id' | 'createdAt'>) => Promise<void>;
  updateAdvertiser: (advertiserId: string, updates: Partial<Advertiser>) => Promise<void>;
  
  // Explore v2 Actions
  addCity: (city: CityProfile) => Promise<void>;
  updateCity: (cityId: string, updates: Partial<CityProfile>) => Promise<void>;
  addCityEvent: (event: CityEvent) => Promise<void>;
  rsvpToCityEvent: (eventId: string) => Promise<void>;

  calculateBadges: () => Promise<void>;
  verifyCityData: (destId: string, category: string, price: number) => Promise<void>;
  updateCityVibe: (destId: string, vibeScore: number) => Promise<void>;
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  setActiveTab: (tab: 'tribe' | 'connect' | 'tribe-nearby' | 'explore' | 'profile' | 'marketplace' | 'deals' | 'admin') => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  isLocationModalOpen: boolean;
  setIsLocationModalOpen: (open: boolean) => void;
  tribeRadius: number;
  setTribeRadius: (radius: number) => void;
  
  // Admin Actions
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  updateUserRole: (userId: string, role: FamilyProfile['role']) => Promise<void>;
  deleteAccount: () => Promise<void>;
  moderateReport: (reportId: string, status: Report['status'], action?: string) => Promise<void>;
  moderateUser: (userId: string, updates: Partial<FamilyProfile>) => Promise<void>;
  completeOnboarding: (profileData: Partial<FamilyProfile>, trips: Trip[]) => Promise<void>;
  fetchCities: () => Promise<void>;
}

export const useNomadStore = create<NomadStore>((set, get) => ({
  currentUser: null,
  profiles: [],
  trips: [],
  spots: [],
  marketItems: [],
  events: [],
  lookingFor: [],
  connections: [],
  conversations: [],
  activities: [],
  cities: [],
  cityEvents: [],
  destinations: [],
  notifications: [],
  reviews: [],
  collabAsks: [],
  collabEndorsements: [],
  deals: [],
  adminDeals: [],
  advertisers: [],
  pastPlaces: [],
  messages: {},
  appSettings: {
    maxUploadSizeKB: 500,
    maintenanceMode: false,
    featuredDestinations: ['d1']
  },
  reports: [],
  blocks: [],
  isAuthReady: false,
  collabMode: false,
  activeTab: 'tribe',
  toasts: [],
  isLocationModalOpen: false,
  tribeRadius: 25,

  setIsLocationModalOpen: (open) => set({ isLocationModalOpen: open }),
  setTribeRadius: (radius) => set({ tribeRadius: radius }),

  addToast: (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }));
    }, 3000);
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  },

  init: () => {
    // Force browser local persistence
    setPersistence(auth, browserLocalPersistence).catch(console.error);

    let unsubscribes: (() => void)[] = [];

    const cleanup = () => {
      unsubscribes.forEach(unsub => unsub());
      unsubscribes = [];
    };

    // Handle redirect result for mobile/iframe login
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          get().addToast(`Welkom terug, ${result.user.displayName}!`, "success");
        }
      })
      .catch((error) => {
        console.error("Redirect login error details:", {
          code: error.code,
          message: error.message,
          stack: error.stack
        });
        
        if (error.code === 'auth/unauthorized-domain') {
          get().addToast(`403 Fout: Domein '${window.location.hostname}' niet geautoriseerd. Voeg dit exact toe aan 'Authorized Domains' in de Firebase Console (onder Authentication > Settings).`, "error");
        } else if (error.message?.includes('403')) {
          get().addToast(`403 Fout bij inloggen voor '${window.location.hostname}'. Controleer je Firebase Authorized Domains of open de app in een nieuw tabblad.`, "error");
        } else if (error.code !== 'auth/cancelled-popup-request') {
          get().addToast(`Inloggen mislukt: ${error.message}`, "error");
        }
      });

    onAuthStateChanged(auth, async (firebaseUser) => {
      cleanup();

      if (firebaseUser) {
        // Fetch app settings
        unsubscribes.push(onSnapshot(doc(db, 'settings', 'global'), (doc) => {
          if (doc.exists()) {
            set({ appSettings: doc.data() as AppSettings });
          }
        }));

        // Fetch user profile with real-time updates
        unsubscribes.push(onSnapshot(doc(db, 'users', firebaseUser.uid), async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as FamilyProfile;
            
            // Check for ban
            if (data.isBanned) {
              get().addToast("Your account has been suspended for violating our Community Guidelines.", "error");
              await signOut(auth);
              set({ currentUser: null, isAuthReady: true });
              return;
            }

            console.log(`[Auth] User profile loaded for ${firebaseUser.uid}:`, {
              hasCompletedOnboarding: data.hasCompletedOnboarding,
              familyName: data.familyName,
              role: data.role
            });

            // Ensure all fields exist (migration/defensive)
            const updatedData: FamilyProfile = {
              ...data,
              id: snapshot.id, // CRITICAL: Ensure ID is always set from document ID
              parents: data.parents || [],
              kids: data.kids || [],
              vouchedBy: data.vouchedBy || [],
              badges: data.badges || [],
              isPremium: data.isPremium || false,
              premiumType: data.premiumType || 'NONE',
              premiumUntil: data.premiumUntil,
              gamification: data.gamification || { hasClaimedPioneerBonus: false, totalSpotsAdded: 0 },
              spokenLanguages: data.spokenLanguages || ['English'],
              role: data.role || 'User',
              privacySettings: data.privacySettings || { isIncognito: false },
              collabCard: data.collabCard || (data as any).professional || { occupation: '', superpowers: [], currentMission: '', linkedInUrl: '' },
              openToCollabs: data.openToCollabs || (data as any).professional?.openToNetworking || false,
              hasCompletedOnboarding: data.hasCompletedOnboarding === true || (data.familyName ? data.familyName.length >= 2 : false),
              preferences: {
                language: data.preferences?.language || 'EN',
                showNextLocationSuggestions: data.preferences?.showNextLocationSuggestions ?? true,
                privacy: {
                  showBioToNonConnects: data.preferences?.privacy?.showBioToNonConnects ?? true,
                  showKidsToNonConnects: data.preferences?.privacy?.showKidsToNonConnects ?? false,
                  showTripsToNonConnects: data.preferences?.privacy?.showTripsToNonConnects ?? true,
                }
              }
            };

            // Ensure e.emanuels@gmail.com is SuperAdmin
            if (firebaseUser.email?.toLowerCase() === 'e.emanuels@gmail.com' && updatedData.role !== 'SuperAdmin') {
              await setDoc(doc(db, 'users', firebaseUser.uid), { role: 'SuperAdmin' }, { merge: true });
              updatedData.role = 'SuperAdmin';
            }
            set({ currentUser: updatedData, isAuthReady: true });
            
            // Admin only listeners
            if (updatedData.role === 'SuperAdmin') {
              unsubscribes.push(onSnapshot(collection(db, 'reports'), (snapshot) => {
                set({ reports: snapshot.docs.map(d => d.data() as Report) });
              }));
              
              unsubscribes.push(onSnapshot(collection(db, 'deals'), (snapshot) => {
                set({ adminDeals: snapshot.docs.map(d => d.data() as Deal) });
              }));

              unsubscribes.push(onSnapshot(collection(db, 'advertisers'), (snapshot) => {
                set({ advertisers: snapshot.docs.map(d => d.data() as Advertiser) });
              }));
            }
          } else {
            // Create default profile if not exists
            const newProfile: FamilyProfile = {
              id: firebaseUser.uid,
              familyName: '',
              bio: '',
              travelReasons: [],
              nativeLanguage: 'English',
              spokenLanguages: ['English'],
              parents: [{ id: `p-${Date.now()}`, name: firebaseUser.displayName?.split(' ')[0] || 'Parent', role: 'Parent', interests: [] }],
              kids: [],
              isPremium: false,
              premiumType: 'NONE',
              verificationLevel: 1,
              vouchedBy: [],
              badges: [],
              gamification: { hasClaimedPioneerBonus: false, totalSpotsAdded: 0 },
              role: firebaseUser.email === 'e.emanuels@gmail.com' ? 'SuperAdmin' : 'User',
              collabCard: { occupation: '', superpowers: [], currentMission: '', linkedInUrl: '' },
              openToCollabs: false,
              privacySettings: { isIncognito: false },
              preferences: {
                language: 'EN',
                showNextLocationSuggestions: true,
                privacy: {
                  showBioToNonConnects: true,
                  showKidsToNonConnects: false,
                  showTripsToNonConnects: true
                }
              }
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            set({ currentUser: newProfile, isAuthReady: true });
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`)));

        // Real-time listeners
        unsubscribes.push(onSnapshot(query(collection(db, 'blocks'), where('blockerId', '==', firebaseUser.uid)), (snapshot) => {
          set({ blocks: snapshot.docs.map(d => d.data() as BlockedUser) });
        }));

        unsubscribes.push(onSnapshot(collection(db, 'destinations'), (snapshot) => {
          set({ destinations: snapshot.docs.map(d => d.data() as DestinationGuidance) });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'destinations')));

        unsubscribes.push(onSnapshot(query(collection(db, 'notifications'), where('userId', '==', firebaseUser.uid)), (snapshot) => {
          set({ notifications: snapshot.docs.map(d => d.data() as AppNotification) });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')));
        
        unsubscribes.push(onSnapshot(query(collection(db, 'pastPlaces'), where('userId', '==', firebaseUser.uid)), (snapshot) => {
          set({ pastPlaces: snapshot.docs.map(d => d.data() as PastPlace) });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'pastPlaces')));

        unsubscribes.push(onSnapshot(collection(db, 'trips'), (snapshot) => {
          set({ trips: snapshot.docs.map(d => d.data() as Trip) });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'trips')));

        unsubscribes.push(onSnapshot(collection(db, 'cities'), (snapshot) => {
          set({ cities: snapshot.docs.map(d => d.data() as CityProfile) });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'cities')));

        unsubscribes.push(onSnapshot(collection(db, 'cityEvents'), (snapshot) => {
          set({ cityEvents: snapshot.docs.map(d => d.data() as CityEvent) });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'cityEvents')));

        unsubscribes.push(onSnapshot(collection(db, 'events'), (snapshot) => {
          set({ events: snapshot.docs.map(d => d.data() as PopUpEvent) });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'events')));

        unsubscribes.push(onSnapshot(collection(db, 'marketplace'), (snapshot) => {
          set({ marketItems: snapshot.docs.map(d => d.data() as MarketItem) });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'marketplace')));

        unsubscribes.push(onSnapshot(collection(db, 'lookingFor'), (snapshot) => {
          set({ lookingFor: snapshot.docs.map(d => d.data() as LookingForRequest) });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'lookingFor')));

        unsubscribes.push(onSnapshot(collection(db, 'users'), (snapshot) => {
          const allProfiles = snapshot.docs.map(d => d.data() as FamilyProfile);
          console.log(`[Admin] Loaded ${allProfiles.length} user profiles`);
          set({ profiles: allProfiles });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'users')));

        unsubscribes.push(onSnapshot(collection(db, 'spots'), (snapshot) => {
          set({ spots: snapshot.docs.map(d => d.data() as Spot) });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'spots')));

        unsubscribes.push(onSnapshot(collection(db, 'collabAsks'), (snapshot) => {
          set({ collabAsks: snapshot.docs.map(d => d.data() as CollabAsk) });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'collabAsks')));

        unsubscribes.push(onSnapshot(collection(db, 'collabEndorsements'), (snapshot) => {
          set({ collabEndorsements: snapshot.docs.map(d => d.data() as CollabEndorsement) });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'collabEndorsements')));

        unsubscribes.push(onSnapshot(
          query(collection(db, 'deals'), where('status', '==', 'Active')),
          (snapshot) => { set({ deals: snapshot.docs.map(d => d.data() as Deal) }); },
          (err) => handleFirestoreError(err, OperationType.LIST, 'deals')
        ));

        // Only admins can see reports
        if (firebaseUser.email?.toLowerCase() === 'e.emanuels@gmail.com') {
          unsubscribes.push(onSnapshot(collection(db, 'reports'), (snapshot) => {
            set({ reports: snapshot.docs.map(d => d.data() as Report) });
          }, (err) => handleFirestoreError(err, OperationType.LIST, 'reports')));
        }

        // Connections: Use array-contains for participantIds
        unsubscribes.push(onSnapshot(query(collection(db, 'connections'), where('participantIds', 'array-contains', firebaseUser.uid)), (snapshot) => {
          set({ connections: snapshot.docs.map(d => d.data() as Connection) });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'connections')));

        // Conversations: Use array-contains for participantIds
        unsubscribes.push(onSnapshot(query(collection(db, 'conversations'), where('participantIds', 'array-contains', firebaseUser.uid)), (snapshot) => {
          set({ conversations: snapshot.docs.map(d => d.data() as Conversation) });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'conversations')));

      } else {
        set({ currentUser: null, isAuthReady: true });
      }
    });
  },

  setCurrentUser: (user) => set({ currentUser: user }),

  setCollabMode: (mode) => set({ collabMode: mode }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  saveVibeCheck: async (metrics) => {
    const user = get().currentUser;
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { 
        vibeFamilyMetrics: metrics,
        lastVibeCheck: new Date().toISOString()
      });
      get().addToast("Vibe preferences opgeslagen!", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${user.id}`);
    }
  },

  updateProfile: async (profile) => {
    const user = get().currentUser;
    if (!user) {
      console.error("updateProfile: No currentUser found in store");
      return;
    }
    
    const userId = user.id || auth.currentUser?.uid;
    if (!userId) {
      console.error("updateProfile: No userId found");
      return;
    }

    try {
      // Filter out undefined values to prevent Firestore errors
      const cleanProfile = Object.fromEntries(
        Object.entries(profile).filter(([_, v]) => v !== undefined)
      );
      
      console.log(`Updating profile for ${userId}:`, cleanProfile);
      await setDoc(doc(db, 'users', userId), cleanProfile, { merge: true });
      
      // If location changed, schedule a vibe check notification
      if (profile.currentLocation) {
        const now = new Date();
        const scheduledDate = new Date(now.getTime() + 36 * 60 * 60 * 1000);
        scheduledDate.setHours(14, 0, 0, 0);
        
        const locName = profile.currentLocation.city || profile.currentLocation.name;
        
        try {
          const notification: AppNotification = {
            id: `notif-${Date.now()}`,
            userId,
            title: 'Vibe Check! 🌍',
            message: `Hey Pioneer! Is the vibe in ${locName} still as good as we think? Help the Tribe with a quick check!`,
            type: 'VibeCheck',
            data: { cityName: locName },
            isRead: false,
            scheduledFor: scheduledDate.toISOString(),
            createdAt: now.toISOString()
          };
          await setDoc(doc(db, 'notifications', notification.id), notification);
        } catch (err) {
          console.warn('Vibe check notification failed:', err);
        }
      }

      // Update local state immediately for better UX
      const currentUser = get().currentUser;
      if (currentUser) {
        set({ currentUser: { ...currentUser, ...cleanProfile } as FamilyProfile });
      }
    } catch (err) {
      console.error("updateProfile error:", err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  },

  updatePreferences: async (prefs) => {
    const user = get().currentUser;
    if (!user) return;
    try {
      const newPrefs = { ...user.preferences, ...prefs };
      await updateDoc(doc(db, 'users', user.id), { preferences: newPrefs });
      set({ currentUser: { ...user, preferences: newPrefs } });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.id}`);
    }
  },

  updateKids: async (kids) => {
    const user = get().currentUser;
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.id), { kids }, { merge: true });
      set({ currentUser: { ...user, kids } });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.id}`);
    }
  },

  addTrip: async (trip) => {
    try {
      await setDoc(doc(db, 'trips', trip.id), trip);
      
      // Sync with Explore list (destinations)
      const destinations = get().destinations;
      const cityName = trip.place?.city || (trip.location.includes(',') ? trip.location.split(',')[0].trim() : trip.location);
      const existing = destinations.find(d => d.cityName.toLowerCase() === cityName.toLowerCase());
      
      if (!existing && cityName) {
        const country = trip.place?.country || (trip.location.includes(',') ? trip.location.split(',').pop()?.trim() : '');
        const newDest: DestinationGuidance = {
          id: `d-${Date.now()}`,
          cityName,
          country,
          costIndex: {
            coffee: 2.5,
            localMeal: 10,
            pizza: 12,
            beer: 4.5,
            gasPerLiter: 1.5,
            beachBed: 0,
            coworking: 210
          },
          vibeScore: 7.5,
          familyFriendlyScore: 8,
          internationalSchools: [],
          suggestions: {}
        };
        await setDoc(doc(db, 'destinations', newDest.id), newDest);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `trips/${trip.id}`);
    }
  },

  verifyCityData: async (destId, category, price) => {
    const user = get().currentUser;
    if (!user) return;

    try {
      const destRef = doc(db, 'destinations', destId);
      const destSnap = await getDoc(destRef);
      if (!destSnap.exists()) return;

      const dest = destSnap.data() as DestinationGuidance;
      const suggestions = dest.suggestions || {};
      const categorySuggestions = suggestions[category as keyof typeof suggestions] || [];

      // Add or update user's suggestion
      const existingIdx = categorySuggestions.findIndex(s => s.userId === user.id);
      const newSuggestion = { userId: user.id, price, timestamp: new Date().toISOString() };
      
      if (existingIdx >= 0) {
        categorySuggestions[existingIdx] = newSuggestion;
      } else {
        categorySuggestions.push(newSuggestion);
      }

      // Check if 3 people agree on the same price (including this one)
      const priceCounts: Record<number, number> = {};
      categorySuggestions.forEach(s => {
        priceCounts[s.price] = (priceCounts[s.price] || 0) + 1;
      });

      const agreedPrice = Object.entries(priceCounts).find(([_, count]) => count >= 3);

      const updates: any = {
        [`suggestions.${category}`]: categorySuggestions
      };

      if (agreedPrice) {
        updates[`costIndex.${category}`] = Number(agreedPrice[0]);
      }

      await updateDoc(destRef, updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `destinations/${destId}`);
    }
  },

  updateCityVibe: async (destId, vibeScore) => {
    try {
      await updateDoc(doc(db, 'destinations', destId), { vibeScore });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `destinations/${destId}`);
    }
  },

  addNotification: async (notification) => {
    const id = `notif-${Date.now()}`;
    const newNotif: AppNotification = {
      ...notification,
      id,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'notifications', id), newNotif);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `notifications`);
    }
  },

  markNotificationRead: async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `notifications/${notificationId}`);
    }
  },

  updateTrip: async (trip) => {
    try {
      await setDoc(doc(db, 'trips', trip.id), trip, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `trips/${trip.id}`);
    }
  },

  removeTrip: async (tripId) => {
    try {
      await deleteDoc(doc(db, 'trips', tripId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `trips/${tripId}`);
    }
  },

  vouchForFamily: async (vouchingId, targetId) => {
    try {
      const targetDoc = await getDoc(doc(db, 'users', targetId));
      if (targetDoc.exists()) {
        const data = targetDoc.data() as FamilyProfile;
        const vouchedBy = Array.from(new Set([...data.vouchedBy, vouchingId]));
        await updateDoc(doc(db, 'users', targetId), { vouchedBy });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${targetId}`);
    }
  },

  reserveItem: async (itemId, buyerId) => {
    try {
      await updateDoc(doc(db, 'marketplace', itemId), {
        status: 'Reserved',
        reservedBy: buyerId,
        reservedUntil: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `marketplace/${itemId}`);
    }
  },

  addItem: async (item) => {
    try {
      const itemWithVotes = {
        ...item,
        upvotes: [],
        downvotes: []
      };
      await setDoc(doc(db, 'marketplace', item.id), itemWithVotes);
      
      // Add activity
      const newActivity: Activity = {
        id: `a-${Date.now()}`,
        userId: item.sellerId,
        familyName: item.sellerName,
        type: 'Marketplace',
        content: `listed a new item: ${item.title}`,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'activities', newActivity.id), newActivity);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `marketplace/${item.id}`);
    }
  },

  removeMarketItem: async (itemId) => {
    try {
      await deleteDoc(doc(db, 'marketplace', itemId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `marketplace/${itemId}`);
    }
  },

  cancelReservation: async (itemId) => {
    try {
      await updateDoc(doc(db, 'marketplace', itemId), {
        status: 'Available',
        reservedBy: null,
        reservedUntil: null
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `marketplace/${itemId}`);
    }
  },

  addLookingFor: async (request) => {
    try {
      const reqWithVotes = {
        ...request,
        upvotes: [],
        downvotes: []
      };
      await setDoc(doc(db, 'lookingFor', request.id), reqWithVotes);
      
      // Add activity
      const newActivity: Activity = {
        id: `a-${Date.now()}`,
        userId: request.userId,
        familyName: request.familyName,
        type: 'LookingFor',
        content: `is looking for: ${request.title}`,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'activities', newActivity.id), newActivity);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `lookingFor/${request.id}`);
    }
  },

  addCollabAsk: async (ask) => {
    try {
      await setDoc(doc(db, 'collabAsks', ask.id), ask);
      
      const user = get().currentUser;
      const newActivity: Activity = {
        id: `a-${Date.now()}`,
        userId: ask.userId,
        familyName: user?.familyName || 'Unknown',
        type: 'Marketplace', // Using marketplace type as placeholder for generic activity color
        content: `is looking for help with ${ask.skillNeeded}`,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'activities', newActivity.id), newActivity);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `collabAsks/${ask.id}`);
    }
  },

  removeCollabAsk: async (askId) => {
    try {
      await deleteDoc(doc(db, 'collabAsks', askId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `collabAsks/${askId}`);
    }
  },

  addCollabEndorsement: async (endorsement) => {
    try {
      await setDoc(doc(db, 'collabEndorsements', endorsement.id), endorsement);
      
      const user = get().currentUser;
      const newActivity: Activity = {
        id: `a-${Date.now()}`,
        userId: endorsement.authorId,
        familyName: user?.familyName || 'Unknown',
        type: 'Friend', // Using friend type for endorsement social signal
        content: `endorsed someone for ${endorsement.skill}`,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'activities', newActivity.id), newActivity);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `collabEndorsements/${endorsement.id}`);
    }
  },

  addDeal: async (dealData) => {
    const user = get().currentUser;
    if (user?.role !== 'SuperAdmin') return;
    const id = `deal-${Date.now()}`;
    // Genereer een unieke report token
    const reportToken = `rpt-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
    const deal: Deal = {
      ...dealData,
      id,
      impressions: 0,
      clicks: 0,
      reportToken,
      createdAt: new Date().toISOString(),
      createdBy: user.id
    };
    try {
      await setDoc(doc(db, 'deals', id), deal);
      get().addToast("Deal toegevoegd!", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `deals/${id}`);
    }
  },

  updateDeal: async (dealId, updates) => {
    try {
      await updateDoc(doc(db, 'deals', dealId), updates);
      get().addToast("Deal bijgewerkt!", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `deals/${dealId}`);
    }
  },

  trackDealClick: async (dealId) => {
    try {
      await updateDoc(doc(db, 'deals', dealId), { clicks: increment(1) });
    } catch (err) {
      console.warn('[trackDealClick] non-critical:', err);
    }
  },

  trackDealImpression: async (dealId) => {
    try {
      await updateDoc(doc(db, 'deals', dealId), { impressions: increment(1) });
    } catch (err) {
      console.warn('[trackDealImpression] non-critical:', err);
    }
  },

  addAdvertiser: async (advertiserData) => {
    // In een echte productie omgeving zou dit een Cloud Function aanroepen
    // Voor deze MVP simuleren we de succesvolle aanmaak van een gebruiker
    // Aangezien we geen cloud functions kunnen deployen in deze interface die AUTH mangelt
    // zullen we de adverteerder direct als Firestore doc aanmaken.
    // In de echte wereld: roep createAdvertiserAccount Cloud Function aan.
    
    const user = get().currentUser;
    if (user?.role !== 'SuperAdmin') return;
    
    try {
      // In deze sandbox omgeving gebruiken we een willekeurige ID als we geen Cloud Function hebben
      // OF we verwachten dat de admin het account handmatig aanmaakt in Firebase Console
      // Voor nu genereren we een ID en voegen we het doc toe.
      const id = advertiserData.email.replace(/[^a-zA-Z0-9]/g, '_');
      
      const advertiser: Advertiser = {
        ...advertiserData,
        id,
        createdAt: new Date().toISOString(),
        createdBy: user.id
      };
      
      await setDoc(doc(db, 'advertisers', id), advertiser);
      get().addToast("Advertiser doc aangemaakt. Maak nu aub handmatig het Auth account aan in Firebase Console met dezelfde ID/Email.", "info");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'advertisers');
    }
  },

  updateAdvertiser: async (advertiserId, updates) => {
    try {
      await updateDoc(doc(db, 'advertisers', advertiserId), updates);
      get().addToast("Advertiser bijgewerkt!", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `advertisers/${advertiserId}`);
    }
  },

  removeLookingFor: async (requestId) => {
    try {
      await deleteDoc(doc(db, 'lookingFor', requestId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `lookingFor/${requestId}`);
    }
  },

  processPayment: async (itemId, amount) => {
    console.log(`Processing payment of ${amount} for item ${itemId}`);
    const platformFee = 0.10;
    const total = amount + platformFee;
    console.log(`Total charged: ${total} (includes ${platformFee} platform fee)`);
    return new Promise((resolve) => setTimeout(() => resolve(true), 1500));
  },

  rsvpForEvent: async (eventId, userId) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);
      if (!eventSnap.exists()) return;
      
      const event = eventSnap.data() as PopUpEvent;
      if (event.participants.length < event.maxParticipants && !event.participants.includes(userId)) {
        await updateDoc(eventRef, {
          participants: arrayUnion(userId)
        });
      } else if (!event.participants.includes(userId) && !event.waitlist.includes(userId)) {
        await updateDoc(eventRef, {
          waitlist: arrayUnion(userId)
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `events/${eventId}`);
    }
  },

  removeEvent: async (eventId) => {
    try {
      await deleteDoc(doc(db, 'events', eventId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `events/${eventId}`);
    }
  },

  voteOnPost: async (postId, collectionName, delta) => {
    const user = get().currentUser;
    if (!user) return;

    try {
      const postRef = doc(db, collectionName, postId);
      const postSnap = await getDoc(postRef);
      if (!postSnap.exists()) return;

      const data = postSnap.data();
      let upvotes = data.upvotes || [];
      let downvotes = data.downvotes || [];

      // Remove from both first to toggle/clean
      upvotes = upvotes.filter((id: string) => id !== user.id);
      downvotes = downvotes.filter((id: string) => id !== user.id);

      if (delta === 1) {
        upvotes.push(user.id);
      } else {
        downvotes.push(user.id);
      }

      await updateDoc(postRef, { upvotes, downvotes });

      // Auto-delete check
      const netScore = upvotes.length - downvotes.length;
      if (netScore <= -20) {
        await deleteDoc(postRef);
        get().addToast("Een bericht is automatisch verwijderd vanwege te veel downvotes.", "info");
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${collectionName}/${postId}`);
    }
  },

  addEvent: async (event) => {
    try {
      const eventWithVotes = {
        ...event,
        upvotes: [],
        downvotes: []
      };
      await setDoc(doc(db, 'events', event.id), eventWithVotes);
      
      const newActivity: Activity = {
        id: `a-${Date.now()}`,
        userId: event.organizerId,
        familyName: get().currentUser?.familyName || 'Unknown',
        type: 'Event',
        content: `Organized a new event: ${event.title}`,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'activities', newActivity.id), newActivity);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `events/${event.id}`);
    }
  },

  requestConnection: async (targetId, category = 'tribe') => {
    const user = get().currentUser;
    if (!user) return;
    
    // Sanitize targetId to prevent invalid characters in document paths
    // Firestore IDs cannot contain / and shouldn't contain //
    // If targetId is accidentally a URL or contains special chars, we slugify it
    const cleanTargetId = targetId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanUserId = user.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    const connectionId = `conn-${[cleanUserId, cleanTargetId].sort().join('-')}`;
    
    // Check if connection already exists
    const existing = get().connections.find(c => c.id === connectionId);
    if (existing && existing.status !== 'none') return;

    const connection: Connection = {
      id: connectionId,
      requesterId: user.id,
      recipientId: targetId,
      participantIds: [user.id, targetId],
      status: 'pending',
      category: category as any
    };

    try {
      await setDoc(doc(db, 'connections', connectionId), connection);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'connections');
      return; // stop here if connection fails
    }

    // Notification separate from connection - failure here shouldn't break the flow
    try {
      const notifId = `notif-${Date.now()}`;
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        userId: targetId,
        title: 'New Connection Request',
        message: `${user.familyName} wants to connect with you!`,
        type: 'ConnectionRequest',
        data: { connectionId, requesterId: user.id },
        isRead: false,
        scheduledFor: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Notification write failed (non-critical):', err);
      // Connection is already created - recipient will see it via onSnapshot
    }
  },

  acceptConnection: async (connectionId) => {
    const user = get().currentUser;
    if (!user) return;

    try {
      const connDoc = await getDoc(doc(db, 'connections', connectionId));
      if (!connDoc.exists()) return;
      const connData = connDoc.data() as Connection;

      await updateDoc(doc(db, 'connections', connectionId), { status: 'accepted' });
      
      // Notify requester that connection was accepted - non-blocking
      try {
        const notifId = `notif-${Date.now()}`;
        await setDoc(doc(db, 'notifications', notifId), {
          id: notifId,
          userId: connData.requesterId,
          title: 'Connection Accepted!',
          message: `${user.familyName} accepted your connection request.`,
          type: 'General',
          data: { connectionId, acceptorId: user.id },
          isRead: false,
          scheduledFor: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Notification write failed (non-critical):', err);
      }

      // Create conversation automatically
      const conversationId = `convo-${connectionId}`;
      const conversation: Conversation = {
        id: conversationId,
        connectionId: connectionId,
        participantIds: connData.participantIds,
        lastMessageSnippet: '',
        lastMessageAt: new Date().toISOString(),
        category: connData.category
      };
      await setDoc(doc(db, 'conversations', conversationId), conversation);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `connections/${connectionId}`);
    }
  },

  cancelConnection: async (connectionId: string) => {
    try {
      await deleteDoc(doc(db, 'connections', connectionId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `connections/${connectionId}`);
    }
  },

  sendMessage: async (conversationId, content) => {
    const user = get().currentUser;
    if (!user) return;

    try {
      const convoDoc = await getDoc(doc(db, 'conversations', conversationId));
      if (!convoDoc.exists()) return;
      const convoData = convoDoc.data() as Conversation;

      const messageId = `msg-${Date.now()}`;
      const newMessage: Message = {
        id: messageId,
        conversationId,
        senderId: user.id,
        participantIds: convoData.participantIds,
        content,
        createdAt: new Date().toISOString(),
        category: convoData.category
      };

      await setDoc(doc(db, 'messages', messageId), newMessage);
      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessageSnippet: content.slice(0, 50),
        lastMessageAt: newMessage.createdAt
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `messages`);
    }
  },

  subscribeToMessages: (conversationId) => {
    const user = get().currentUser;
    if (!user) return () => {};
    return onSnapshot(
      query(
        collection(db, 'messages'), 
        where('conversationId', '==', conversationId), 
        where('participantIds', 'array-contains', user.id),
        orderBy('createdAt', 'asc')
      ),
      (snapshot) => {
        const msgs = snapshot.docs.map(d => d.data() as Message);
        set((state) => ({
          messages: { ...state.messages, [conversationId]: msgs }
        }));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `messages for ${conversationId}`)
    );
  },

  addActivity: (activity) => set((state) => ({ activities: [activity, ...state.activities] })),

  addSpot: async (spot) => {
    const user = get().currentUser;
    if (!user) return;

    try {
      const cleanSpot = {
        ...spot,
        createdAt: spot.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isVetted: spot.isVetted ?? false,
        isHidden: spot.isHidden ?? false,
        reportCount: spot.reportCount ?? 0,
        viewCount: spot.viewCount ?? 0,
        saveCount: spot.saveCount ?? 0,
        dataSource: spot.dataSource || 'ugc',
        verifiedTags: spot.verifiedTags || []
      };

      const spotsInCity = get().spots.filter(s => {
        return calculateDistance(s.place.lat, s.place.lng, cleanSpot.place.lat, cleanSpot.place.lng) < 20;
      });

      await setDoc(doc(db, 'spots', cleanSpot.id), cleanSpot);
      
      const newTotalSpots = (user.gamification?.totalSpotsAdded || 0) + 1;
      const updates: any = {
        'gamification.totalSpotsAdded': newTotalSpots
      };

      if (spotsInCity.length === 0 && !user.gamification?.hasClaimedPioneerBonus) {
        const premiumUntil = addDays(new Date(), 30).toISOString();
        updates.isPremium = true;
        updates.premiumType = 'TRIAL';
        updates.premiumUntil = premiumUntil;
        updates['gamification.hasClaimedPioneerBonus'] = true;
        
        get().addToast("Pioneer Bonus Ontgrendeld! 30 dagen Tribe PRO ontvangen.", "success");
      }

      await updateDoc(doc(db, 'users', user.id), updates);

      const newActivity: Activity = {
        id: `a-${Date.now()}`,
        userId: cleanSpot.recommendedBy || 'Unknown',
        familyName: user.familyName || 'Unknown',
        type: 'Spot',
        content: `shared a new spot: ${cleanSpot.name}`,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'activities', newActivity.id), newActivity);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `spots/${spot.id}`);
    }
  },

  removeSpot: async (spotId) => {
    try {
      await deleteDoc(doc(db, 'spots', spotId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `spots/${spotId}`);
    }
  },

  addCity: async (city) => {
    try {
      await setDoc(doc(db, 'cities', city.id), city);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `cities/${city.id}`);
    }
  },

  updateCity: async (cityId, updates) => {
    try {
      await updateDoc(doc(db, 'cities', cityId), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `cities/${cityId}`);
    }
  },

  addCityEvent: async (event) => {
    try {
      await setDoc(doc(db, 'cityEvents', event.id), event);
      
      const user = get().currentUser;
      const newActivity: Activity = {
        id: `a-${Date.now()}`,
        userId: event.organizer.userId || 'system',
        familyName: user?.familyName || event.organizer.name,
        type: 'Event',
        content: `organized a new event in ${event.citySlug}: ${event.title}`,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'activities', newActivity.id), newActivity);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `cityEvents/${event.id}`);
    }
  },

  rsvpToCityEvent: async (eventId) => {
    const user = get().currentUser;
    if (!user) return;
    try {
      const eventRef = doc(db, 'cityEvents', eventId);
      const eventSnap = await getDoc(eventRef);
      if (eventSnap.exists()) {
        const data = eventSnap.data() as CityEvent;
        const rsvps = Array.from(new Set([...(data.rsvps || []), user.id]));
        await updateDoc(eventRef, { rsvps });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `cityEvents/${eventId}`);
    }
  },

  seedInitialData: async () => {
    const existing = get().cities;
    
    // Canonical list of unique destinations based on Nomad List hubs
    const baseCities = [
      { id: 'bangkok-v2', name: 'Bangkok', country: 'Thailand', countryCode: 'TH', lat: 13.7563, lng: 100.5018, continent: 'Azië', preferredImgId: '1552423814-14d60fc900c7' },
      { id: 'buenos-aires-v2', name: 'Buenos Aires', country: 'Argentinië', countryCode: 'AR', lat: -34.6037, lng: -58.3816, continent: 'Amerika', preferredImgId: '1555546258-f5424578e348' },
      { id: 'chiang-mai-v2', name: 'Chiang Mai', country: 'Thailand', countryCode: 'TH', lat: 18.7883, lng: 98.9853, continent: 'Azië', preferredImgId: '1590001158193-7903d8e70514' },
      { id: 'lissabon-v2', name: 'Lissabon', country: 'Portugal', countryCode: 'PT', lat: 38.7223, lng: -9.1393, continent: 'Europa', preferredImgId: '1512100356132-d323ad379893' },
      { id: 'mexico-stad-v2', name: 'Mexico-Stad', country: 'Mexico', countryCode: 'MX', lat: 19.4326, lng: -99.1332, continent: 'Amerika', preferredImgId: '1512813195329-36a8ac68e29a' },
      { id: 'medellin-v2', name: 'Medellin', country: 'Colombia', countryCode: 'CO', lat: 6.2442, lng: -75.5812, continent: 'Amerika', preferredImgId: '1533632359-03594f41065a' },
      { id: 'ubud-v2', name: 'Ubud', country: 'Indonesië', countryCode: 'ID', lat: -8.5069, lng: 115.2625, continent: 'Azië', preferredImgId: '1537996194471-e657df975ab4' },
      { id: 'berlijn-v2', name: 'Berlijn', country: 'Duitsland', countryCode: 'DE', lat: 52.5200, lng: 13.4050, continent: 'Europa', preferredImgId: '1528301721406-fc5a4686523c' },
      { id: 'canggu-v2', name: 'Canggu', country: 'Indonesië', countryCode: 'ID', lat: -8.6478, lng: 115.1385, continent: 'Azië', preferredImgId: '1552670288-adc3d2ef6e4d' },
      { id: 'taipei-v2', name: 'Taipei', country: 'Taiwan', countryCode: 'TW', lat: 25.0330, lng: 121.5654, continent: 'Azië', preferredImgId: '1470004922291-d3eeefeeb57f' },
      { id: 'seoul-v2', name: 'Seoul', country: 'Zuid-Korea', countryCode: 'KR', lat: 37.5665, lng: 126.9780, continent: 'Azië', preferredImgId: '1538669715516-6469c47a55c2' },
      { id: 'tokio-v2', name: 'Tokio', country: 'Japan', countryCode: 'JP', lat: 35.6895, lng: 139.6917, continent: 'Azië', preferredImgId: '1540959733332-eab4deabeeaf' },
      { id: 'praag-v2', name: 'Praag', country: 'Tsjechië', countryCode: 'CZ', lat: 50.0755, lng: 14.4378, continent: 'Europa', preferredImgId: '1541849546122-45a1b32d207f' },
      { id: 'da-nang-v2', name: 'Da Nang', country: 'Vietnam', countryCode: 'VN', lat: 16.0544, lng: 108.2022, continent: 'Azië', preferredImgId: '1559592442-7e18259f63cc' },
      { id: 'ho-chi-minh-stad-v2', name: 'Ho Chi Minh-Stad', country: 'Vietnam', countryCode: 'VN', lat: 10.7627, lng: 106.6602, continent: 'Azië', preferredImgId: '1556064354-946f0475b75f' },
      { id: 'bansko-v2', name: 'Bansko', country: 'Bulgarije', countryCode: 'BG', lat: 41.8333, lng: 23.4833, continent: 'Europa', preferredImgId: '1517400508447-f8dd518b86db' },
      { id: 'kaapstad-v2', name: 'Kaapstad', country: 'Zuid-Afrika', countryCode: 'ZA', lat: -33.9249, lng: 18.4232, continent: 'Afrika', preferredImgId: '1580619305218-8423a7ef79b4' },
      { id: 'kuala-lumpur-v2', name: 'Kuala Lumpur', country: 'Maleisië', countryCode: 'MY', lat: 3.1390, lng: 101.6869, continent: 'Azië', preferredImgId: '1512401223296-147e5b5d8487' },
      { id: 'boedapest-v2', name: 'Boedapest', country: 'Hongarije', countryCode: 'HU', lat: 47.4979, lng: 19.0402, continent: 'Europa', preferredImgId: '1551884839-16695b2496a7' },
      { id: 'warschau-v2', name: 'Warschau', country: 'Polen', countryCode: 'PL', lat: 52.2297, lng: 21.0122, continent: 'Europa', preferredImgId: '1519197924295-2f9c14ef1f30' },
      { id: 'krakau-v2', name: 'Krakau', country: 'Polen', countryCode: 'PL', lat: 50.0647, lng: 19.9450, continent: 'Europa', preferredImgId: '1516167882417-09a27c7379d8' },
      { id: 'tallinn-v2', name: 'Tallinn', country: 'Estland', countryCode: 'EE', lat: 59.4370, lng: 24.7536, continent: 'Europa', preferredImgId: '1559586612-3a3f00077523' },
      { id: 'funchal-v2', name: 'Funchal', country: 'Portugal', countryCode: 'PT', lat: 32.6669, lng: -16.9241, continent: 'Europa', preferredImgId: '1534351590666-13c7f9681abb' },
      { id: 'porto-v2', name: 'Porto', country: 'Portugal', countryCode: 'PT', lat: 41.1579, lng: -8.6291, continent: 'Europa', preferredImgId: '1555881400-74b7cb752229' },
      { id: 'las-palmas-v2', name: 'Las Palmas', country: 'Spanje', countryCode: 'ES', lat: 28.1235, lng: -15.4363, continent: 'Europa', preferredImgId: '1536431311719-398b6704d4cc' },
      { id: 'tenerife-v2', name: 'Tenerife', country: 'Spanje', countryCode: 'ES', lat: 28.2916, lng: -16.6291, continent: 'Europa', preferredImgId: '1540306145-6677ff0a2ec7' },
      { id: 'valencia-v2', name: 'Valencia', country: 'Spanje', countryCode: 'ES', lat: 39.4699, lng: -0.3763, continent: 'Europa', preferredImgId: '1511527844068-d3964d03e33f' },
      { id: 'barcelona-v2', name: 'Barcelona', country: 'Spanje', countryCode: 'ES', lat: 41.3851, lng: 2.1734, continent: 'Europa', preferredImgId: '1534351590666-13c7f9681abb' },
      { id: 'athene-v2', name: 'Athene', country: 'Griekenland', countryCode: 'GR', lat: 37.9838, lng: 23.7275, continent: 'Europa', preferredImgId: '1513635269975-59663e0ac1ad' },
      { id: 'istanbul-v2', name: 'Istanbul', country: 'Turkije', countryCode: 'TR', lat: 41.0082, lng: 28.9784, continent: 'Europa', preferredImgId: '1524231752111-3b69b02d245a' },
      { id: 'tbilisi-v2', name: 'Tbilisi', country: 'Georgië', countryCode: 'GE', lat: 41.7151, lng: 44.8271, continent: 'Europa', preferredImgId: '1554562208-e4b2d5d852a3' },
      { id: 'dubai-v2', name: 'Dubai', country: 'VA Emiraten', countryCode: 'AE', lat: 25.2048, lng: 55.2708, continent: 'Azië', preferredImgId: '1512453979798-5ea26dff827c' },
      { id: 'singapore-v2', name: 'Singapore', country: 'Singapore', countryCode: 'SG', lat: 1.3521, lng: 103.8198, continent: 'Azië', preferredImgId: '1527443224151-c67de94709ed' },
      { id: 'sydney-v2', name: 'Sydney', country: 'Australië', countryCode: 'AU', lat: -33.8688, lng: 151.2093, continent: 'Oceanië', preferredImgId: '150697333333-64903a2e3796' },
      { id: 'melbourne-v2', name: 'Melbourne', country: 'Australië', countryCode: 'AU', lat: -37.8136, lng: 144.9631, continent: 'Oceanië', preferredImgId: '1520697333333-64903a2e3796' },
      { id: 'auckland-v2', name: 'Auckland', country: 'Nieuw-Zeeland', countryCode: 'NZ', lat: -36.8485, lng: 174.7633, continent: 'Oceanië', preferredImgId: '1547924013511-28241270bc12' },
      { id: 'new-york-v2', name: 'New York', country: 'USA', countryCode: 'US', lat: 40.7128, lng: -74.0060, continent: 'Amerika', preferredImgId: '1496442226666-8d48a60a175b' },
      { id: 'san-francisco-v2', name: 'San Francisco', country: 'USA', countryCode: 'US', lat: 37.7749, lng: -122.4194, continent: 'Amerika', preferredImgId: '1501591122174-d88a443dd400' },
      { id: 'miami-v2', name: 'Miami', country: 'USA', countryCode: 'US', lat: 25.7617, lng: -80.1918, continent: 'Amerika', preferredImgId: '1450612623062-db37a24e344d' },
      { id: 'austin-v2', name: 'Austin', country: 'USA', countryCode: 'US', lat: 30.2672, lng: -97.7431, continent: 'Amerika', preferredImgId: '1531215509532-43c2e128ba70' },
      { id: 'denver-v2', name: 'Denver', country: 'USA', countryCode: 'US', lat: 39.7392, lng: -104.9903, continent: 'Amerika', preferredImgId: '1523482580672-f109ba860be5' },
      { id: 'florianopolis-v2', name: 'Florianopolis', country: 'Brazilië', countryCode: 'BR', lat: -27.5954, lng: -48.5480, continent: 'Amerika', preferredImgId: '1516962215312-d21a1b4e19d0' },
      { id: 'sao-paulo-v2', name: 'Sao Paulo', country: 'Brazilië', countryCode: 'BR', lat: -23.5505, lng: -46.6333, continent: 'Amerika', preferredImgId: '1543976040374-85c8e92cae66' },
      { id: 'rio-de-janeiro-v2', name: 'Rio de Janeiro', country: 'Brazilië', countryCode: 'BR', lat: -22.9068, lng: -43.1729, continent: 'Amerika', preferredImgId: '1483729553805-4c9100298d00' },
      { id: 'santiago-v2', name: 'Santiago', country: 'Chili', countryCode: 'CL', lat: -33.4489, lng: -70.6693, continent: 'Amerika', preferredImgId: '1480714378408-67cf0d13bc1b' },
      { id: 'lima-v2', name: 'Lima', country: 'Peru', countryCode: 'PE', lat: -12.0432, lng: -77.0282, continent: 'Amerika', preferredImgId: '1514565131-fce0801e5785' },
      { id: 'cusco-v2', name: 'Cusco', country: 'Peru', countryCode: 'PE', lat: -13.5320, lng: -71.9675, continent: 'Amerika', preferredImgId: '1526392942-1e96261c3601' },
      { id: 'antigua-v2', name: 'Antigua', country: 'Guatemala', countryCode: 'GT', lat: 14.5667, lng: -90.7333, continent: 'Amerika', preferredImgId: '1493397212122-2b85defc3095' },
      { id: 'tulum-v2', name: 'Tulum', country: 'Mexico', countryCode: 'MX', lat: 20.2114, lng: -87.4654, continent: 'Amerika', preferredImgId: '1518548419973-706509ccc5c4' },
      { id: 'sayulita-v2', name: 'Sayulita', country: 'Mexico', countryCode: 'MX', lat: 20.8689, lng: -105.4408, continent: 'Amerika', preferredImgId: '1510017803434-a899398421b3' },
      { id: 'ericeira-v2', name: 'Ericeira', country: 'Portugal', countryCode: 'PT', lat: 38.9638, lng: -9.4184, continent: 'Europa', preferredImgId: '1529604164-904033b95af5' },
      { id: 'santa-teresa-v2', name: 'Santa Teresa', country: 'Costa Rica', countryCode: 'CR', lat: 9.6429, lng: -85.1685, continent: 'Amerika', preferredImgId: '1537996194471-e657df975ab4' },
      { id: 'monterrey-v2', name: 'Monterrey', country: 'Mexico', countryCode: 'MX', lat: 25.6866, lng: -100.3161, continent: 'Amerika', preferredImgId: '1512813195329-36a8ac68e29a' },
      { id: 'split-v2', name: 'Split', country: 'Kroatië', countryCode: 'HR', lat: 43.5081, lng: 16.4402, continent: 'Europa', preferredImgId: '1555990548-641e4d35368a' },
      { id: 'dubrovnik-v2', name: 'Dubrovnik', country: 'Kroatië', countryCode: 'HR', lat: 42.6507, lng: 18.0944, continent: 'Europa', preferredImgId: '1541849546122-45a1b32d207f' },
      { id: 'siargao-v2', name: 'Siargao', country: 'Filipijnen', countryCode: 'PH', lat: 9.8500, lng: 126.0500, continent: 'Azië', preferredImgId: '1518391846015-55a9cb0008a6' },
      { id: 'boracay-v2', name: 'Boracay', country: 'Filipijnen', countryCode: 'PH', lat: 11.9712, lng: 121.9213, continent: 'Azië', preferredImgId: '1540959733332-eab4deabeeaf' },
      { id: 'belgrado-v2', name: 'Belgrado', country: 'Servië', countryCode: 'RS', lat: 44.7866, lng: 20.4489, continent: 'Europa', preferredImgId: '1513635269975-59663e0ac1ad' },
      { id: 'nairobi-v2', name: 'Nairobi', country: 'Kenia', countryCode: 'KE', lat: -1.2921, lng: 36.8219, continent: 'Afrika', preferredImgId: '1559592442-7e18259f63cc' },
      { id: 'marrakech-v2', name: 'Marrakech', country: 'Marokko', countryCode: 'MA', lat: 31.6295, lng: -7.9811, continent: 'Afrika', preferredImgId: '1580619305218-8423a7ef79b4' },
      { id: 'tel-aviv-v2', name: 'Tel Aviv', country: 'Israel', countryCode: 'IL', lat: 32.0853, lng: 34.7818, continent: 'Azië', preferredImgId: '1512401223296-147e5b5d8487' },
      { id: 'vancouver-v2', name: 'Vancouver', country: 'Canada', countryCode: 'CA', lat: 49.2827, lng: -123.1207, continent: 'Amerika', preferredImgId: '1496442226666-8d48a60a175b' },
      { id: 'toronto-v2', name: 'Toronto', country: 'Canada', countryCode: 'CA', lat: 43.6532, lng: -79.3832, continent: 'Amerika', preferredImgId: '1523482580672-f109ba860be5' },
      { id: 'montreal-v2', name: 'Montreal', country: 'Canada', countryCode: 'CA', lat: 45.5017, lng: -73.5673, continent: 'Amerika', preferredImgId: '1555881400-74b7cb752229' },
      { id: 'mexico-city-condesa-v2', name: 'Condesa (CDMX)', country: 'Mexico', countryCode: 'MX', lat: 19.4121, lng: -99.1763, continent: 'Amerika', preferredImgId: '1510017803434-a899398421b3' },
      { id: 'mexico-city-roma-v2', name: 'Roma Norte (CDMX)', country: 'Mexico', countryCode: 'MX', lat: 19.4141, lng: -99.1601, continent: 'Amerika', preferredImgId: '1512813195329-36a8ac68e29a' },
      { id: 'guadalajara-v2', name: 'Guadalajara', country: 'Mexico', countryCode: 'MX', lat: 20.6597, lng: -103.3496, continent: 'Amerika', preferredImgId: '1531215509532-43c2e128ba70' },
      { id: 'queretaro-v2', name: 'Queretaro', country: 'Mexico', countryCode: 'MX', lat: 20.5888, lng: -100.3899, continent: 'Amerika', preferredImgId: '1554562208-e4b2d5d852a3' },
      { id: 'san-miguel-v2', name: 'San Miguel de Allende', country: 'Mexico', countryCode: 'MX', lat: 20.9142, lng: -100.7437, continent: 'Amerika', preferredImgId: '1512813195329-36a8ac68e29a' },
      { id: 'merida-v2', name: 'Merida', country: 'Mexico', countryCode: 'MX', lat: 20.9674, lng: -89.5926, continent: 'Amerika', preferredImgId: '1559592442-7e18259f63cc' },
      { id: 'puerto-escondido-v2', name: 'Puerto Escondido', country: 'Mexico', countryCode: 'MX', lat: 15.8631, lng: -97.0763, continent: 'Amerika', preferredImgId: '1518391846015-55a9cb0008a6' },
      { id: 'oaxaca-v2', name: 'Oaxaca', country: 'Mexico', countryCode: 'MX', lat: 17.0732, lng: -96.7266, continent: 'Amerika', preferredImgId: '1502602898657-3e9172f29b78' },
      { id: 'antigua-guatemala-v2', name: 'La Antigua', country: 'Guatemala', countryCode: 'GT', lat: 14.5667, lng: -90.7333, continent: 'Amerika', preferredImgId: '1493397212122-2b85defc3095' },
      { id: 'panama-city-v2', name: 'Panama City', country: 'Panama', countryCode: 'PA', lat: 8.9833, lng: -79.5167, continent: 'Amerika', preferredImgId: '1512453979798-5ea26dff827c' },
      { id: 'san-jose-v2', name: 'San Jose', country: 'Costa Rica', countryCode: 'CR', lat: 9.9281, lng: -84.0907, continent: 'Amerika', preferredImgId: '1555546258-f5424578e348' },
      { id: 'krakow-city-v2', name: 'Krakow Center', country: 'Polen', countryCode: 'PL', lat: 50.0647, lng: 19.9450, continent: 'Europa', preferredImgId: '1516167882417-09a27c7379d8' },
      { id: 'wroclaw-v2', name: 'Wroclaw', country: 'Polen', countryCode: 'PL', lat: 51.1079, lng: 17.0385, continent: 'Europa', preferredImgId: '1541849546122-45a1b32d207f' },
      { id: 'gdansk-v2', name: 'Gdansk', country: 'Polen', countryCode: 'PL', lat: 54.3520, lng: 18.6466, continent: 'Europa', preferredImgId: '1512100356132-d323ad379893' },
      { id: 'bucharest-v2', name: 'Boekarest', country: 'Roemenië', countryCode: 'RO', lat: 44.4268, lng: 26.1025, continent: 'Europa', preferredImgId: '1524231752111-3b69b02d245a' },
      { id: 'cluj-v2', name: 'Cluj-Napoca', country: 'Roemenië', countryCode: 'RO', lat: 46.7712, lng: 23.6236, continent: 'Europa', preferredImgId: '1534351590666-13c7f9681abb' },
      { id: 'sofia-v2', name: 'Sofia', country: 'Bulgarije', countryCode: 'BG', lat: 42.6977, lng: 23.3219, continent: 'Europa', preferredImgId: '1513635269975-59663e0ac1ad' },
      { id: 'plovdiv-v2', name: 'Plovdiv', country: 'Bulgarije', countryCode: 'BG', lat: 42.1354, lng: 24.7453, continent: 'Europa', preferredImgId: '1554562208-e4b2d5d852a3' },
      { id: 'varna-v2', name: 'Varna', country: 'Bulgarije', countryCode: 'BG', lat: 43.2141, lng: 27.9147, continent: 'Europa', preferredImgId: '1580619305218-8423a7ef79b4' },
      { id: 'brasov-v2', name: 'Brasov', country: 'Roemenië', countryCode: 'RO', lat: 45.6427, lng: 25.5887, continent: 'Europa', preferredImgId: '1541849546122-45a1b32d207f' },
      { id: 'porto-alegre-v2', name: 'Porto Alegre', country: 'Brazilië', countryCode: 'BR', lat: -30.0346, lng: -51.2177, continent: 'Amerika', preferredImgId: '1516962215312-d21a1b4e19d0' },
      { id: 'curitiba-v2', name: 'Curitiba', country: 'Brazilië', countryCode: 'BR', lat: -25.4284, lng: -49.2733, continent: 'Amerika', preferredImgId: '1543976040374-85c8e92cae66' },
      { id: 'belo-horizonte-v2', name: 'Belo Horizonte', country: 'Brazilië', countryCode: 'BR', lat: -19.9167, lng: -43.9345, continent: 'Amerika', preferredImgId: '1516962215312-d21a1b4e19d0' },
      { id: 'salvador-v2', name: 'Salvador', country: 'Brazilië', countryCode: 'BR', lat: -12.9714, lng: -38.5014, continent: 'Amerika', preferredImgId: '1480714378408-67cf0d13bc1b' },
      { id: 'montevideo-v2', name: 'Montevideo', country: 'Uruguay', countryCode: 'UY', lat: -34.9011, lng: -56.1645, continent: 'Amerika', preferredImgId: '1555881400-74b7cb752229' },
      { id: 'asuncion-v2', name: 'Asuncion', country: 'Paraguay', countryCode: 'PY', lat: -25.2637, lng: -57.5759, continent: 'Amerika', preferredImgId: '1480714378408-67cf0d13bc1b' },
      { id: 'cordoba-v2', name: 'Cordoba', country: 'Argentinië', countryCode: 'AR', lat: -31.4135, lng: -64.1811, continent: 'Amerika', preferredImgId: '1450612623062-db37a24e344d' },
      { id: 'mendoza-v2', name: 'Mendoza', country: 'Argentinië', countryCode: 'AR', lat: -32.8895, lng: -68.8458, continent: 'Amerika', preferredImgId: '1540306145-6677ff0a2ec7' },
      { id: 'valparaiso-v2', name: 'Valparaiso', country: 'Chili', countryCode: 'CL', lat: -33.0472, lng: -71.6127, continent: 'Amerika', preferredImgId: '1512401223296-147e5b5d8487' },
      { id: 'vinya-del-mar-v2', name: 'Viña del Mar', country: 'Chili', countryCode: 'CL', lat: -33.0245, lng: -71.5518, continent: 'Amerika', preferredImgId: '1512453979798-5ea26dff827c' },
    ];

    const imgIds = [
      '1473913084451-5d10ad052831', '1496560235248-b2a41f59a1bb', '1444723121867-7a241cacace9', 
      '1514924013511-28241270bc12', '1502602898657-3e9172f29b78', '1513635269975-59663e0ac1ad',
      '1518391846015-55a9cb0008a6', '1503899036084-c55cdd92da26', '1540959733332-eab4deabeeaf',
      '1493397212122-2b85defc3095', '1480714378408-67cf0d13bc1b', '1514565131-fce0801e5785',
      '1444084316824-dc26d6657664', '1512453979798-5ea26dff827c', '1512100356132-d323ad379893',
      '1523482580672-f109ba860be5', '1493976040374-85c8e92cae66', '1537996194471-e657df975ab4',
      '1510017803434-a899398421b3', '1559592442-7e18259f63cc'
    ];

    const finalCities: CityProfile[] = [];
    
    const generateStats = (name: string, i: number, preferredImgId?: string) => {
      const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
      const randomFloat = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(1));
      
      const imgId = preferredImgId || imgIds[i % imgIds.length];

      return {
        description: `${name} biedt een unieke mix van cultuur, uitstekende wifi en een actieve gemeenschap van digitale nomaden en gezinnen.`,
        spotCount: random(20, 100),
        vettedSpotCount: random(10, 40),
        familyCount: random(30, 400),
        eventCount: random(5, 25),
        nomadScore: randomFloat(8.0, 9.8),
        vibeScore: randomFloat(8.0, 9.8),
        familyFriendlyScore: randomFloat(8.0, 9.8),
        coverImageUrl: `https://images.unsplash.com/photo-${imgId}?q=80&w=1200&auto=format&fit=crop`,
        costOfLiving: {
          source: 'numbeo',
          lastUpdated: new Date().toISOString(),
          coffee: randomFloat(1.5, 6.0),
          localMeal: randomFloat(3.0, 35.0),
          pizza: randomFloat(8.0, 25.0),
          beer: randomFloat(1.0, 10.0),
          coworking: random(100, 450),
          oneBedApartment: random(400, 4000),
          internet50mbps: random(10, 120),
          taxi1km: randomFloat(0.5, 7.0),
          currency: i % 2 === 0 ? 'EUR' : 'USD',
          exchangeRate: 1
        },
        airQuality: {
          source: 'iqair',
          lastUpdated: new Date().toISOString(),
          aqi: random(5, 150),
          status: 'Good' as any,
          pm25: random(2, 50)
        },
        climate: {
          currentTemp: random(10, 38),
          condition: ['Zonnig', 'Bewolkt', 'Tropisch', 'Helder', 'Warm'][random(0,4)],
          humidity: random(20, 90),
          season: ['Zomer', 'Lente', 'Herfst', 'Winter'][random(0,3)]
        },
        safety: {
          source: 'numbeo',
          safetyIndex: random(30, 95),
          crimeIndex: random(5, 70)
        },
        infrastructure: {
          visaFree: ['Schengen', 'US', 'UK', 'E-Visa'],
          electricityPlug: 'Type C/G',
          drivingSide: random(0, 10) > 7 ? 'left' as any : 'right' as any,
          timezone: `GMT+${random(-8, 12)}`
        },
        internationalSchools: [`${name} International School`, `${name} Global Academy`, `${name} Montessori`],
        upcomingEventIds: [],
        isPublished: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    };

    baseCities.forEach((base, i) => {
      finalCities.push({
        id: base.id,
        name: base.name,
        country: base.country,
        countryCode: base.countryCode,
        continent: base.continent,
        coordinates: { lat: base.lat, lng: base.lng },
        ...generateStats(base.name, i, base.preferredImgId)
      } as any);
    });

    const newIds = new Set(baseCities.map(c => c.id));
    const batch = writeBatch(db);

    // 1. Delete legacy entries that don't match our new unique set
    existing.forEach(city => {
      if (!newIds.has(city.id)) {
        batch.delete(doc(db, 'cities', city.id));
      }
    });

    // 2. Set new unique entries
    finalCities.forEach(city => {
      batch.set(doc(db, 'cities', city.id), city);
    });

    try {
      await batch.commit();
      set({ cities: finalCities });
      get().addToast("Explore Hubs gesynchroniseerd met Tribe hubs v2.0", "success");
    } catch (err) {
      console.error("Error seeding large city data:", err);
    }
  },

  setCities: (cities: CityProfile[]) => set({ cities }),

  addReview: async (review) => {
    try {
      await setDoc(doc(db, 'reviews', review.id), review);
      // Trigger badge calculation after review
      get().calculateBadges();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `reviews/${review.id}`);
    }
  },

  vote: async (type, id, direction) => {
    const user = get().currentUser;
    if (!user) return;

    try {
      const docRef = doc(db, type, id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;

      const data = docSnap.data();
      const votes = data.votes || { up: [], down: [] };
      
      // Calculate weight based on badges
      const userBadges = user.badges || [];
      const weight = 1 + (userBadges.length * 0.5); // Each badge adds 0.5 weight

      // Remove existing vote from both lists
      const up = (votes.up || []).filter((uid: string) => uid !== user.id);
      const down = (votes.down || []).filter((uid: string) => uid !== user.id);

      // Add new vote (conceptually weight is handled by repeating the ID or just counting differently)
      // For simplicity in this schema, we store the ID. The weight is calculated during display/aggregation.
      if (direction === 'up') {
        up.push(user.id);
      } else {
        down.push(user.id);
      }

      const newVotes = { up, down };

      // Check auto-delete rule: if difference is -20 or worse (weighted)
      // We'll keep the simple count for auto-delete to avoid complexity in rules
      if (up.length - down.length <= -20) {
        await deleteDoc(docRef);
        return;
      }

      await updateDoc(docRef, { votes: newVotes });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${type}/${id}`);
    }
  },

  calculateBadges: async () => {
    const user = get().currentUser;
    if (!user) return;

    const newBadges: string[] = [];

    // 1. Profile Completeness
    const hasBio = user.bio && user.bio.length > 20;
    const hasPhoto = !!user.photoUrl;
    const hasKids = user.kids && user.kids.length > 0;
    const hasParents = user.parents && user.parents.length > 0;
    const hasLanguages = user.spokenLanguages && user.spokenLanguages.length > 0;

    if (hasBio && hasPhoto && hasKids && hasParents && hasLanguages) {
      newBadges.push('Profile Pro');
    }

    // 2. Contributions
    const userMarketItems = get().marketItems.filter(item => item.sellerId === user.id);
    if (userMarketItems.length >= 3) {
      newBadges.push('Marketplace Hero');
    }

    const userSpots = get().spots.filter(spot => spot.recommendedBy === user.id);
    if (userSpots.length >= 2) {
      newBadges.push('Local Guide');
    }

    const userReviews = get().reviews.filter(review => review.authorId === user.id);
    if (userReviews.length >= 5) {
      newBadges.push('Top Contributor');
    }

    // 3. Community Trust
    if (user.vouchedBy && user.vouchedBy.length >= 3) {
      newBadges.push('Trusted Member');
    }

    if (user.premiumType === 'TRIAL') {
      newBadges.push('Tribe Pioneer');
    }

    // Update if changed
    const currentBadges = user.badges || [];
    if (JSON.stringify(currentBadges.sort()) !== JSON.stringify(newBadges.sort())) {
      await updateDoc(doc(db, 'users', user.id), { badges: newBadges });
      set({ currentUser: { ...user, badges: newBadges } });
    }
  },

  blockUser: async (targetUserId) => {
    const user = get().currentUser;
    if (!user) return;
    const blockId = `block_${user.id}_${targetUserId}`;
    try {
      await setDoc(doc(db, 'blocks', blockId), {
        id: blockId,
        blockerId: user.id,
        blockedId: targetUserId,
        createdAt: new Date().toISOString()
      });
      get().addToast("User blocked. They will no longer appear in your radar.", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'blocks');
    }
  },

  submitReport: async (reportData) => {
    const user = get().currentUser;
    if (!user) return;
    const reportId = `rep_${Date.now()}`;
    const report: Report = {
      ...reportData,
      id: reportId,
      createdAt: new Date().toISOString(),
      status: 'Pending'
    };
    try {
      await setDoc(doc(db, 'reports', reportId), report);
      
      // Create admin alert
      const alertId = `alert_${Date.now()}`;
      await setDoc(doc(db, 'adminAlerts', alertId), {
        id: alertId,
        type: report.category === 'IllegalContent' ? 'CRITICAL' : 'STANDARD',
        reportId,
        createdAt: new Date().toISOString(),
        isRead: false
      });

      get().addToast("Report submitted. We'll review it within 48 hours.", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'reports');
    }
  },

  reportContent: async (targetId, targetType, reason) => {
    const user = get().currentUser;
    if (!user) return;
    await get().submitReport({
      reporterId: user.id,
      targetId,
      targetType,
      category: reason as any, // mapping simple reason to category for backward compat
      description: `Quick report: ${reason}`
    });
  },

  updateAppSettings: async (settings) => {
    try {
      await setDoc(doc(db, 'settings', 'global'), settings, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/global');
    }
  },

  deleteUser: async (userId) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
    }
  },

  updateUserRole: async (userId, role) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  },

  completeOnboarding: async (profileData, onboardingTrips) => {
    const user = get().currentUser;
    if (!user) {
      console.error("[Onboarding] No current user found to complete onboarding for");
      return;
    }

    console.log(`[Onboarding] Completing for ${user.id}...`);

    try {
      // 1. Update Profile
      const premiumUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const badges = (profileData.badges || []) as string[];
      let verificationLevel: 1 | 2 | 3 = 1;

      // Award Social badge if they provided ANY social link
      if (profileData.collabCard?.linkedInUrl || (profileData.collabCard?.socialLinks && profileData.collabCard.socialLinks.length > 0)) {
        if (!badges.includes('Socially Connected')) {
          badges.push('Socially Connected');
        }
        verificationLevel = 2;
      }

      const updatedProfile: Partial<FamilyProfile> = {
        ...profileData,
        isPremium: true,
        premiumType: 'TRIAL',
        premiumUntil,
        hasCompletedOnboarding: true,
        verificationLevel,
        role: 'User',
        badges,
        vouchedBy: [],
        travelReasons: profileData.travelReasons || [],
        gamification: { hasClaimedPioneerBonus: false, totalSpotsAdded: 0 },
        privacySettings: { isIncognito: false },
        preferences: {
          language: (profileData.nativeLanguage as any) || 'EN',
          showNextLocationSuggestions: true,
          privacy: { 
            showBioToNonConnects: true, 
            showKidsToNonConnects: true, 
            showTripsToNonConnects: true 
          }
        }
      };

      await setDoc(doc(db, 'users', user.id), updatedProfile, { merge: true });

      // 2. Add Trips
      for (const trip of onboardingTrips) {
        await get().addTrip(trip);
      }

      // Update local state
      set({ 
        currentUser: { ...user, ...updatedProfile } as FamilyProfile,
        activeTab: 'tribe'
      });
      
      get().addToast("Welkom bij the Tribe! Je 30-daagse trial is geactiveerd.", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.id}`);
      throw err;
    }
  },

  deleteAccount: async () => {
    const user = get().currentUser;
    const firebaseUser = auth.currentUser;
    if (!user || !firebaseUser) return;

    try {
      // 1. Save email for trial abuse prevention (45 days)
      await setDoc(doc(db, 'deletedAccounts', user.id), {
        email: firebaseUser.email,
        deletedAt: new Date().toISOString(),
        trialUsed: user.premiumType !== 'NONE'
      });

      // 2. Delete data (Sequential for safety in this env, normally would use server-side triggers or batched writes)
      const deletePromises = [
        deleteDoc(doc(db, 'users', user.id))
      ];

      // Clean up trips
      get().trips.filter(t => t.familyId === user.id).forEach(t => {
        deletePromises.push(deleteDoc(doc(db, 'trips', t.id)));
      });

      // Clean up marketplace
      get().marketItems.filter(m => m.sellerId === user.id).forEach(m => {
        deletePromises.push(deleteDoc(doc(db, 'marketplace', m.id)));
      });

      // Clean up reviews
      get().reviews.filter(r => r.authorId === user.id).forEach(r => {
        deletePromises.push(deleteDoc(doc(db, 'reviews', r.id)));
      });

      // Clean up activities
      get().activities.filter(a => a.userId === user.id).forEach(a => {
        deletePromises.push(deleteDoc(doc(db, 'activities', a.id)));
      });

      // Clean up notifications
      get().notifications.filter(n => n.userId === user.id).forEach(n => {
        deletePromises.push(deleteDoc(doc(db, 'notifications', n.id)));
      });

      await Promise.all(deletePromises);

      // 3. Delete Auth account
      await firebaseUser.delete();

      // 4. Clear local state
      set({ currentUser: null });
      get().addToast("Account successfully deleted.", "info");
    } catch (err) {
      console.error("Scale-out deletion failed:", err);
      get().addToast("Partial account deletion occurred. Please contact support.", "error");
    }
  },

  addPastPlace: async (place, year) => {
    const user = get().currentUser;
    if (!user) return;
    const id = `pp-${user.id}-${place.placeId}-${year}`;
    const pastPlace: PastPlace = {
      id,
      userId: user.id,
      placeId: place.placeId,
      name: place.name,
      city: place.city,
      country: place.country,
      countryCode: place.countryCode,
      lat: place.lat,
      lng: place.lng,
      year,
      addedAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'pastPlaces', id), pastPlace);
      get().addToast(`Added ${place.name} to your journey!`, "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `pastPlaces/${id}`);
    }
  },

  removePastPlace: async (pastPlaceId) => {
    try {
      await deleteDoc(doc(db, 'pastPlaces', pastPlaceId));
      get().addToast("Removed from your journey.", "info");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `pastPlaces/${pastPlaceId}`);
    }
  },

  moderateReport: async (reportId, status, action) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), { 
        status, 
        action, 
        resolvedAt: new Date().toISOString() 
      });
      get().addToast("Report updated.", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reports/${reportId}`);
    }
  },

  moderateUser: async (userId, updates) => {
    try {
      await updateDoc(doc(db, 'users', userId), updates);
      get().addToast("User moderation applied.", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  },

  fetchCities: async () => {
    if (!auth.currentUser) return;
    try {
      const snap = await getDocs(
        query(
          collection(db, 'cities'),
          where('isPublished', '==', true),
          orderBy('familyScore', 'desc')
        )
      );
      
      const getContinentByCountry = (country: string) => {
        const c = country.toLowerCase();
        if (['portugal', 'netherlands', 'spain', 'bulgaria', 'croatia', 'poland', 'germany', 'greece', 'turkey', 'czech republic', 'hungary', 'estonia', 'latvia', 'lithuania', 'ukraine', 'austria', 'france', 'italy', 'switzerland', 'belgium', 'georgia', 'armenia', 'azerbaijan', 'denmark', 'sweden', 'norway', 'finland', 'ireland', 'uk', 'united kingdom'].some(x => c.includes(x))) return 'Europe';
        if (['indonesia', 'thailand', 'vietnam', 'cambodia', 'malaysia', 'taiwan', 'south korea', 'japan', 'india', 'philippines', 'singapore', 'sri lanka', 'laos', 'myanmar', 'uae', 'israel', 'jordan', 'georgia', 'nepal', 'china'].some(x => c.includes(x))) return 'Asia';
        if (['usa', 'united states', 'mexico', 'colombia', 'argentina', 'brazil', 'guatemala', 'peru', 'costa rica', 'panama', 'ecuador', 'chile', 'canada', 'bolivia', 'paraguay', 'uruguay', 'el salvador', 'honduras', 'nicaragua', 'dominican republic', 'puerto rico'].some(x => c.includes(x))) return 'Americas';
        if (['south africa', 'morocco', 'kenya', 'mauritius', 'egypt', 'ghana', 'tanzania', 'nigeria', 'namibia', 'uganda', 'rwanda'].some(x => c.includes(x))) return 'Africa';
        if (['australia', 'new zealand', 'fiji', 'bali'].some(x => c.includes(x))) return 'Oceania';
        return 'Other';
      };

      const cities = snap.docs.map(d => {
        const data = d.data() as CityProfile;
        let continent = data.continent || getContinentByCountry(data.country);
        
        // Normalize Dutch variants to English
        const normalizationMap: Record<string, string> = {
          'azië': 'Asia',
          'europa': 'Europe',
          'amerika': 'Americas',
          'afrika': 'Africa',
          'oceanië': 'Oceania'
        };
        
        const normalized = normalizationMap[continent.toLowerCase()];
        if (normalized) continent = normalized;

        return { 
          ...data, 
          id: d.id,
          continent
        } as CityProfile;
      });
      
      set({ cities });
    } catch (err) {
      console.error("Error fetching cities:", err);
    }
  }
}));
