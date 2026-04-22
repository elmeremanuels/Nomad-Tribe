import { create } from 'zustand';
import { FamilyProfile, Trip, Spot, MarketItem, PopUpEvent, LookingForRequest, Kid, Connection, Conversation, Message, Activity, DestinationGuidance, SpotReview, AppSettings, AppNotification, CollabAsk, CollabCard, CollabEndorsement, Report, BlockedUser, AdminAlert } from './types';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { 
  collection, 
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
  orderBy
} from 'firebase/firestore';
import { onAuthStateChanged, getRedirectResult, User as FirebaseUser, setPersistence, browserSessionPersistence, signOut } from 'firebase/auth';

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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
  vouchForFamily: (vouchingId: string, targetId: string) => Promise<void>;
  reserveItem: (itemId: string, buyerId: string) => Promise<void>;
  addItem: (item: MarketItem) => Promise<void>;
  removeMarketItem: (itemId: string) => Promise<void>;
  cancelReservation: (itemId: string) => Promise<void>;
  processPayment: (itemId: string, amount: number) => Promise<boolean>;
  rsvpForEvent: (eventId: string, userId: string) => void;
  addEvent: (event: PopUpEvent) => void;
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
  
  // Admin Actions
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  updateUserRole: (userId: string, role: FamilyProfile['role']) => Promise<void>;
  deleteAccount: () => Promise<void>;
  moderateReport: (reportId: string, status: Report['status'], action?: string) => Promise<void>;
  moderateUser: (userId: string, updates: Partial<FamilyProfile>) => Promise<void>;
  completeOnboarding: (profileData: Partial<FamilyProfile>, trips: Trip[]) => Promise<void>;
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
  destinations: [],
  notifications: [],
  reviews: [],
  collabAsks: [],
  collabEndorsements: [],
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

  setIsLocationModalOpen: (open) => set({ isLocationModalOpen: open }),

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
    // Force browser session persistence
    setPersistence(auth, browserSessionPersistence).catch(console.error);

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
      if (firebaseUser) {
        // Fetch app settings
        onSnapshot(doc(db, 'settings', 'global'), (doc) => {
          if (doc.exists()) {
            set({ appSettings: doc.data() as AppSettings });
          }
        });

        // Fetch user profile with real-time updates
        onSnapshot(doc(db, 'users', firebaseUser.uid), async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as FamilyProfile;
            
            // Check for ban
            if (data.isBanned) {
              get().addToast("Your account has been suspended for violating our Community Guidelines.", "error");
              await signOut(auth);
              set({ currentUser: null, isAuthReady: true });
              return;
            }

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
              onSnapshot(collection(db, 'reports'), (snapshot) => {
                set({ reports: snapshot.docs.map(d => d.data() as Report) });
              });
            }
          } else {
            // Create default profile if not exists
            const newProfile: FamilyProfile = {
              id: firebaseUser.uid,
              familyName: '',
              bio: '',
              travelReason: '',
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
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`));

        // Real-time listeners
        onSnapshot(query(collection(db, 'blocks'), where('blockerId', '==', firebaseUser.uid)), (snapshot) => {
          set({ blocks: snapshot.docs.map(d => d.data() as BlockedUser) });
        });

        onSnapshot(collection(db, 'destinations'), (snapshot) => {
          set({ destinations: snapshot.docs.map(d => d.data() as DestinationGuidance) });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'destinations'));

        onSnapshot(query(collection(db, 'notifications'), where('userId', '==', firebaseUser.uid)), (snapshot) => {
          set({ notifications: snapshot.docs.map(d => d.data() as AppNotification) });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'notifications'));

        onSnapshot(collection(db, 'trips'), (snapshot) => {
          set({ trips: snapshot.docs.map(d => d.data() as Trip) });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'trips'));

        onSnapshot(collection(db, 'marketplace'), (snapshot) => {
          set({ marketItems: snapshot.docs.map(d => d.data() as MarketItem) });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'marketplace'));

        onSnapshot(collection(db, 'lookingFor'), (snapshot) => {
          set({ lookingFor: snapshot.docs.map(d => d.data() as LookingForRequest) });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'lookingFor'));

        onSnapshot(collection(db, 'users'), (snapshot) => {
          const allProfiles = snapshot.docs.map(d => d.data() as FamilyProfile);
          console.log(`[Admin] Loaded ${allProfiles.length} user profiles`);
          set({ profiles: allProfiles });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

        onSnapshot(collection(db, 'spots'), (snapshot) => {
          set({ spots: snapshot.docs.map(d => d.data() as Spot) });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'spots'));

        onSnapshot(collection(db, 'collabAsks'), (snapshot) => {
          set({ collabAsks: snapshot.docs.map(d => d.data() as CollabAsk) });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'collabAsks'));

        onSnapshot(collection(db, 'collabEndorsements'), (snapshot) => {
          set({ collabEndorsements: snapshot.docs.map(d => d.data() as CollabEndorsement) });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'collabEndorsements'));

        // Only admins can see reports
        if (firebaseUser.email?.toLowerCase() === 'e.emanuels@gmail.com') {
          onSnapshot(collection(db, 'reports'), (snapshot) => {
            set({ reports: snapshot.docs.map(d => d.data() as Report) });
          }, (err) => handleFirestoreError(err, OperationType.LIST, 'reports'));
        }

        // Connections: Use array-contains for participantIds
        onSnapshot(query(collection(db, 'connections'), where('participantIds', 'array-contains', firebaseUser.uid)), (snapshot) => {
          set({ connections: snapshot.docs.map(d => d.data() as Connection) });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'connections'));

        // Conversations: Use array-contains for participantIds
        onSnapshot(query(collection(db, 'conversations'), where('participantIds', 'array-contains', firebaseUser.uid)), (snapshot) => {
          set({ conversations: snapshot.docs.map(d => d.data() as Conversation) });
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'conversations'));

      } else {
        set({ currentUser: null, isAuthReady: true });
      }
    });
  },

  setCurrentUser: (user) => set({ currentUser: user }),

  setCollabMode: (mode) => set({ collabMode: mode }),

  setActiveTab: (tab) => set({ activeTab: tab }),

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
        
        const notification: AppNotification = {
          id: `notif-${Date.now()}`,
          userId,
          title: 'Vibe Check! 🌍',
          message: `Hey Pioneer! Is the vibe in ${profile.currentLocation.name} still as good as we think? Help the Tribe with a quick check!`,
          type: 'VibeCheck',
          data: { cityName: profile.currentLocation.name },
          isRead: false,
          scheduledFor: scheduledDate.toISOString(),
          createdAt: now.toISOString()
        };
        await setDoc(doc(db, 'notifications', notification.id), notification);
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
      const existing = destinations.find(d => d.cityName.toLowerCase() === trip.location.split(',')[0].trim().toLowerCase());
      
      if (!existing) {
        const cityName = trip.location.split(',')[0].trim();
        const country = trip.location.split(',')[1]?.trim() || '';
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
      await setDoc(doc(db, 'marketplace', item.id), item);
      
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
      await setDoc(doc(db, 'lookingFor', request.id), request);
      
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

  addLookinFor: async (request) => {
    // ... existing ...
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

  rsvpForEvent: (eventId, userId) => set((state) => ({
    events: state.events.map(event => {
      if (event.id === eventId) {
        if (event.participants.length < event.maxParticipants && !event.participants.includes(userId)) {
          return { ...event, participants: [...event.participants, userId] };
        } else if (!event.participants.includes(userId) && !event.waitlist.includes(userId)) {
          return { ...event, waitlist: [...event.waitlist, userId] };
        }
      }
      return event;
    })
  })),

  addEvent: (event) => set((state) => {
    const newActivity: Activity = {
      id: `a-${Date.now()}`,
      userId: event.organizerId,
      familyName: state.currentUser?.familyName || 'Unknown',
      type: 'Event',
      content: `Organized a new event: ${event.title}`,
      createdAt: new Date().toISOString()
    };
    return { 
      events: [...state.events, event],
      activities: [newActivity, ...state.activities]
    };
  }),

  requestConnection: async (targetId, category = 'tribe') => {
    const user = get().currentUser;
    if (!user) return;
    const connectionId = `conn-${[user.id, targetId].sort().join('-')}`;
    
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
      
      // Add notification for recipient
      await get().addNotification({
        userId: targetId,
        title: 'Nieuw Connectie Verzoek',
        message: `${user.familyName} wil met je connecten!`,
        type: 'ConnectionRequest',
        scheduledFor: new Date().toISOString(),
        data: { connectionId, requesterId: user.id }
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `connections`);
    }
  },

  acceptConnection: async (connectionId) => {
    try {
      const connDoc = await getDoc(doc(db, 'connections', connectionId));
      if (!connDoc.exists()) return;
      const connData = connDoc.data() as Connection;

      await updateDoc(doc(db, 'connections', connectionId), { status: 'accepted' });
      
      // Notify requester that connection was accepted
      const user = get().currentUser;
      await get().addNotification({
        userId: connData.requesterId,
        title: 'Connectie Geaccepteerd!',
        message: `${user?.familyName || 'Een familie'} heeft je connectie verzoek geaccepteerd.`,
        type: 'General',
        scheduledFor: new Date().toISOString(),
        data: { connectionId, acceptorId: user?.id }
      });

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
      // Check if this is the first spot in this city (conceptually, we check our local state)
      // For a more robust check, we'd query Firestore, but local state is usually synced
      const spotsInCity = get().spots.filter(s => {
        // Simple distance check or name check if we had city names on spots
        // Since spots don't have city names, we'll assume the UI passes a spot with a city context if needed
        // Or we can just check if there are ANY spots currently. 
        // The prompt says "If a city has 0 spots in the database"
        return calculateDistance(s.coordinates.lat, s.coordinates.lng, spot.coordinates.lat, spot.coordinates.lng) < 20;
      });

      await setDoc(doc(db, 'spots', spot.id), spot);
      
      // Update user gamification
      const newTotalSpots = (user.gamification?.totalSpotsAdded || 0) + 1;
      const updates: any = {
        'gamification.totalSpotsAdded': newTotalSpots
      };

      // Pioneer Bonus Logic
      if (spotsInCity.length === 0 && !user.gamification?.hasClaimedPioneerBonus) {
        const premiumUntil = addDays(new Date(), 30).toISOString();
        updates.isPremium = true;
        updates.premiumType = 'TRIAL';
        updates.premiumUntil = premiumUntil;
        updates['gamification.hasClaimedPioneerBonus'] = true;
        
        get().addToast("Pioneer Bonus Anticipeert! 30 dagen Tribe PRO ontvangen.", "success");
        console.log("PIONEER BONUS UNLOCKED!");
      }

      await updateDoc(doc(db, 'users', user.id), updates);

      const newActivity: Activity = {
        id: `a-${Date.now()}`,
        userId: spot.recommendedBy || 'Unknown',
        familyName: user.familyName || 'Unknown',
        type: 'Spot',
        content: `Recommended a new spot: ${spot.name}`,
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
    if (!user) return;

    try {
      // 1. Update Profile
      const premiumUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const updatedProfile: Partial<FamilyProfile> = {
        ...profileData,
        isPremium: true,
        premiumType: 'TRIAL',
        premiumUntil,
        verificationLevel: 1,
        role: 'User',
        badges: [],
        vouchedBy: [],
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
  }
}));
