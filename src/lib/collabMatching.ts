import { FamilyProfile, CollabAsk } from '../types';

export function calculateCollabMatch(
  me: FamilyProfile,
  other: FamilyProfile,
  myAsks: CollabAsk[],
  otherAsks: CollabAsk[]
): { score: number; reasons: string[] } {
  if (!me || !other || me.id === other.id) {
    return { score: 0, reasons: [] };
  }

  const reasons: string[] = [];
  let score = 0;

  const mySkills = new Set(me.collabCard?.superpowers || []);
  const theirSkills = new Set(other.collabCard?.superpowers || []);

  // 1. My skills match their asks
  const myMatchesTheir = otherAsks.filter(ask => mySkills.has(ask.skillNeeded));
  if (myMatchesTheir.length > 0) {
    score += myMatchesTheir.length * 30;
    reasons.push(`You can help with ${myMatchesTheir[0].skillNeeded}`);
  }

  // 2. Their skills match my asks
  const theirMatchesMy = myAsks.filter(ask => theirSkills.has(ask.skillNeeded));
  if (theirMatchesMy.length > 0) {
    score += theirMatchesMy.length * 30;
    reasons.push(`They can help with ${theirMatchesMy[0].skillNeeded}`);
  }

  // 3. Same occupation
  if (
    me.collabCard?.occupation &&
    me.collabCard.occupation === other.collabCard?.occupation
  ) {
    score += 15;
    reasons.push(`Both ${other.collabCard.occupation}`);
  }

  // 4. Skill overlap
  const sharedSkills = [...mySkills].filter(s => theirSkills.has(s));
  if (sharedSkills.length > 0) {
    score += sharedSkills.length * 5;
    if (!reasons.length) reasons.push(`Both know ${sharedSkills[0]}`);
  }

  // 5. Location
  if (
    me.currentLocation && other.currentLocation &&
    me.currentLocation.countryCode === other.currentLocation.countryCode
  ) {
    score += 10;
    reasons.push(`Both in ${other.currentLocation.country || 'same country'}`);
  }

  return { score, reasons: reasons.slice(0, 3) };
}
