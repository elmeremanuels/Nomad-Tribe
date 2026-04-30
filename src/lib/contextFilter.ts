import { ContentContext } from '../types';

/**
 * Returns true if an item with the given context should be visible
 * in the current mode.
 *
 * - In Family Mode: show 'family' and 'both', hide 'collab'
 * - In Collab Mode: show 'collab' and 'both', hide 'family'
 */
export function isVisibleInMode(
  itemContext: ContentContext | undefined,
  collabMode: boolean
): boolean {
  const ctx = itemContext ?? 'family'; // Defensive default for legacy data
  if (ctx === 'both') return true;
  return collabMode ? ctx === 'collab' : ctx === 'family';
}
