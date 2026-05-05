import { useNomadStore } from '../store';

export function usePostingAccess() {
  const currentUser = useNomadStore(s => (s as any).currentUser);
  const now = Date.now();
  const premiumUntil = currentUser?.premiumUntil ? new Date(currentUser.premiumUntil).getTime() : 0;

  const isTrial = currentUser?.premiumType === 'TRIAL' && premiumUntil > now;
  const isCollabPaid =
    currentUser?.premiumType === 'COLLAB_MONTHLY' ||
    currentUser?.premiumType === 'COLLAB_ANNUAL' ||
    currentUser?.premiumType === 'COLLAB_LIFETIME';

  // Family Mode posting: trial OR one-time unlock OR any Collab tier
  const canPostInFamilyMode = isTrial || currentUser?.familyPostingUnlocked === true || isCollabPaid;

  // Collab Mode access: trial OR Collab subscription
  const hasCollabAccess = isTrial || isCollabPaid;

  return {
    canPostInFamilyMode,
    hasCollabAccess,
    isTrial,
    isCollabPaid,
    daysRemainingInTrial: isTrial
      ? Math.max(0, Math.ceil((premiumUntil - now) / (1000 * 60 * 60 * 24)))
      : 0,
    premiumType: currentUser?.premiumType || 'NONE',
  };
}
