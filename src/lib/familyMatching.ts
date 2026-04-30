import { FamilyProfile } from '../types';

export function calculateFamilyMatch(
  me: FamilyProfile,
  other: FamilyProfile
): { score: number; reasons: string[] } {
  if (!me || !other || me.id === other.id) {
    return { score: 0, reasons: [] };
  }

  const reasons: string[] = [];
  let score = 0;

  // 1. Kid age overlap
  const myKidAges = (me.kids || []).map(k => k.age);
  const theirKidAges = (other.kids || []).map(k => k.age);
  for (const myAge of myKidAges) {
    for (const theirAge of theirKidAges) {
      if (Math.abs(myAge - theirAge) <= 2) {
        score += 25;
        reasons.push(`Kids age ${theirAge}`);
        break;
      }
    }
    if (reasons.length > 0) break;
  }

  // 2. Kid interest overlap
  const myKidInterests = new Set((me.kids || []).flatMap(k => k.interests || []));
  const theirKidInterests = new Set((other.kids || []).flatMap(k => k.interests || []));
  const sharedKidInterests = [...myKidInterests].filter(i => theirKidInterests.has(i));
  if (sharedKidInterests.length > 0) {
    score += sharedKidInterests.length * 8;
    reasons.push(`Kids both into ${sharedKidInterests.slice(0, 2).join(' & ')}`);
  }

  // 3. Travel reasons overlap
  const myReasons = new Set(me.travelReasons || []);
  const theirReasons = new Set(other.travelReasons || []);
  const sharedReasons = [...myReasons].filter(r => theirReasons.has(r));
  if (sharedReasons.length > 0) {
    score += sharedReasons.length * 10;
    reasons.push(sharedReasons[0]);
  }

  // 4. Language overlap
  const myLangs = new Set([me.nativeLanguage, ...(me.spokenLanguages || [])]);
  const theirLangs = new Set([other.nativeLanguage, ...(other.spokenLanguages || [])]);
  const sharedLangs = [...myLangs].filter(l => theirLangs.has(l));
  if (sharedLangs.length > 0) {
    score += sharedLangs.length * 3;
    if (sharedLangs.length > 1) reasons.push(`Speaks ${sharedLangs[0]}`);
  }

  // 5. Currently in same location
  if (
    me.currentLocation && other.currentLocation &&
    me.currentLocation.countryCode === other.currentLocation.countryCode
  ) {
    score += 15;
    reasons.push(`Both in ${other.currentLocation.country || 'same country'}`);
  }

  return { score, reasons: reasons.slice(0, 3) };
}
