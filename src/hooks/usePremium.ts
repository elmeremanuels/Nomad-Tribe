import { useNomadStore } from '../store';

export function useCollabAccess() {
  const currentUser = useNomadStore(s => s.currentUser);
  const now = Date.now();
  const premiumUntil = currentUser?.premiumUntil
    ? new Date(currentUser.premiumUntil).getTime()
    : 0;

  const hasCollabAccess =
    currentUser?.premiumType === 'COLLAB_MONTHLY' ||
    currentUser?.premiumType === 'COLLAB_ANNUAL' ||
    currentUser?.premiumType === 'LIFETIME' ||
    (currentUser?.premiumType === 'TRIAL' && premiumUntil > now) ||
    currentUser?.role === 'SuperAdmin';

  return {
    hasCollabAccess,
    isTrialing: currentUser?.premiumType === 'TRIAL' && premiumUntil > now,
    daysRemaining: Math.max(0, Math.ceil((premiumUntil - now) / (1000 * 60 * 60 * 24))),
  };
}
