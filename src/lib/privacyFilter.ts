import { FamilyProfile } from '../types';

/**
 * Returns true if this user should be visible to *other* users on radars,
 * counts, lists, and matching algorithms.
 *
 * Ghost Mode hides the user from all of these.
 * Banned users are also hidden.
 */
export function isPubliclyVisible(profile: FamilyProfile | undefined | null): boolean {
  if (!profile) return false;
  if (profile.privacySettings?.isGhostMode) return false;
  if (profile.isBanned) return false;
  return true;
}

/**
 * Returns true if a third-party user can see a specific field on this profile.
 * Used by the Profile view and family cards when shown to non-connections.
 */
export function canShowFieldToPublic(
  profile: FamilyProfile,
  field: 'bio' | 'kids' | 'trips',
  isConnection: boolean
): boolean {
  // Connections always see everything
  if (isConnection) return true;

  // Ghost mode: don't even render
  if (profile.privacySettings?.isGhostMode) return false;

  const prefMap = {
    bio: 'showBioToNonConnects',
    kids: 'showKidsToNonConnects',
    trips: 'showTripsToNonConnects',
  } as const;

  // Use optional chaining and default to true if the preference doesn't exist
  const preferences = (profile as any).preferences?.privacy;
  if (!preferences) return true;
  
  return preferences[prefMap[field]] !== false;
}
