import { PastPlace, Trip, FamilyProfile, hasValidCoords } from '../types';

export type LocationNodeType = 'past' | 'current' | 'future';

export interface LocationNode {
  id: string;
  type: LocationNodeType;
  label: string;            // "Bali, Indonesia"
  sublabel: string;         // "2023" | "Mar 2024" | "Now" | "Apr – Jun 2025"
  lat?: number;
  lng?: number;
  sortKey: number;          // Unix timestamp voor sortering
  pastPlace?: PastPlace;
  trip?: Trip;
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function buildTimeline(
  currentUser: FamilyProfile | null,
  pastPlaces: PastPlace[],
  trips: Trip[],
  realTimeLocation: any | null = null,
  exploreLocation: any | null = null
): { nodes: LocationNode[]; currentIndex: number } {

  const nodes: LocationNode[] = [];
  const now = new Date();

  // ── VERLEDEN (pastPlaces, gesorteerd minst recent eerst -> meest recent)
  const userPastPlaces = [...pastPlaces].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return (a.month || 0) - (b.month || 0);
  });

  userPastPlaces.forEach(pp => {
    const sortKey = (pp.year * 100 + (pp.month || 0)) - 1000000;
    nodes.push({
      id: pp.id,
      type: 'past',
      label: pp.city || pp.name || 'Past Trip',
      sublabel: pp.month
        ? `${MONTH_NAMES[pp.month - 1]} ${pp.year}`
        : `${pp.year}`,
      lat: pp.lat,
      lng: pp.lng,
      sortKey,
      pastPlace: pp
    });
  });

  // ── HEDEN / EXPLORE ──
  const currentIndex = nodes.length;
  
  if (exploreLocation) {
    nodes.push({
      id: 'explore',
      type: 'current',
      label: exploreLocation.city || exploreLocation.name || 'Exploring',
      sublabel: 'Exploring Now 🔭',
      lat: exploreLocation.lat,
      lng: exploreLocation.lng,
      sortKey: 0
    });
  } else if (realTimeLocation && hasValidCoords(realTimeLocation.lat, realTimeLocation.lng)) {
    nodes.push({
      id: 'current',
      type: 'current',
      label: realTimeLocation.city || realTimeLocation.name || 'Current Location',
      sublabel: 'Live Location 🚗',
      lat: realTimeLocation.lat,
      lng: realTimeLocation.lng,
      sortKey: 0
    });
  } else if (currentUser?.currentLocation?.lat) {
    nodes.push({
      id: 'current',
      type: 'current',
      label: currentUser.currentLocation.city || currentUser.currentLocation.name,
      sublabel: 'Home Now',
      lat: currentUser.currentLocation.lat,
      lng: currentUser.currentLocation.lng,
      sortKey: 0
    });
  } else {
    nodes.push({
      id: 'current',
      type: 'current',
      label: 'Set Location',
      sublabel: 'Now',
      lat: 18.7883,
      lng: 98.9853,
      sortKey: 0
    });
  }

  // ── CURRENT TRIPS (trips happening right now) ──
  const activeTrips = trips.filter(t => {
    if (t.familyId !== currentUser?.id) return false;
    const start = new Date(t.startDate);
    const end = new Date(t.endDate);
    return start <= now && end >= now;
  });

  activeTrips.forEach(trip => {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const sublabel = `${MONTH_NAMES[start.getMonth()]} ${start.getDate()} – ${MONTH_NAMES[end.getMonth()]} ${end.getDate()}`;
    
    const rawLabel = trip.location && trip.location.trim() !== "" && trip.location !== ", " 
      ? trip.location 
      : (trip.place?.name || trip.place?.city || 'Trip Now');
    
    const placeholders = ['Selected Place', 'Selected Location', 'Adventure', 'Travel Adventure'];
    const label = placeholders.includes(rawLabel)
      ? (trip.place?.city || trip.place?.name || trip.place?.country || 'Trip Now')
      : rawLabel;
      
    nodes.push({
      id: trip.id,
      type: 'current',
      label,
      sublabel,
      lat: trip.lat,
      lng: trip.lng,
      sortKey: 1, // Higher priority than home
      trip
    });
  });

  // ── TOEKOMST (toekomstige trips, soonest first) ──
  const futureTripsSorted = trips
    .filter(t => t.familyId === currentUser?.id && new Date(t.startDate) > now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  futureTripsSorted.forEach(trip => {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const sublabel = start.getMonth() === end.getMonth()
      ? `${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}`
      : `${MONTH_NAMES[start.getMonth()]} – ${MONTH_NAMES[end.getMonth()]} ${end.getFullYear()}`;

    const rawLabel = trip.location && trip.location.trim() !== "" && trip.location !== ", " 
      ? trip.location 
      : (trip.place?.name || trip.place?.city || 'Future Trip');

    const placeholders = ['Selected Place', 'Selected Location', 'Adventure', 'Travel Adventure'];
    const label = placeholders.includes(rawLabel)
      ? (trip.place?.city || trip.place?.name || trip.place?.country || 'Future Trip')
      : rawLabel;

    nodes.push({
      id: trip.id,
      type: 'future',
      label,
      sublabel,
      lat: trip.lat,
      lng: trip.lng,
      sortKey: new Date(trip.startDate).getTime(),
      trip
    });
  });

  return {
    nodes,
    currentIndex: currentIndex
  };
}
