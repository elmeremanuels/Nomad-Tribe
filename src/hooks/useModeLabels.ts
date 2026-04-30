import { useNomadStore } from '../store';
import { COLLAB_LABELS, FAMILY_LABELS } from '../lib/labels';

export function useModeLabels() {
  const collabMode = useNomadStore(s => s.collabMode);
  return collabMode ? COLLAB_LABELS : FAMILY_LABELS;
}
