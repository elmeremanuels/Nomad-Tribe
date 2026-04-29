import { Filter } from 'bad-words';

const filter = new Filter();

// Extend with app-specific blocked terms if needed
const CUSTOM_BLOCKED_TERMS = [
  'scam',
  'fake',
  // Add others as requested or needed
];

filter.addWords(...CUSTOM_BLOCKED_TERMS);

/**
 * Checks if the given text contains blocked content.
 * Returns true if blocked content is found.
 */
export function containsBlockedContent(text: string): boolean {
  if (!text) return false;
  return filter.isProfane(text);
}

/**
 * Cleans the text by replacing blocked terms with asterisks.
 */
export function cleanContent(text: string): string {
  if (!text) return '';
  try {
    return filter.clean(text);
  } catch (err) {
    // Falls back to original text if cleaning fails (e.g. bad regex)
    return text;
  }
}

// ── CRITICAL TERMS ──
// These trigger immediate admin escalation, NOT just blocking.
// Used for safety-critical issues that need human review within 2 hours.

const CRITICAL_TERMS = [
  // Self-harm indicators
  'suicide', 'kill myself', 'end my life', 'kms',
  // Child safety
  'child abuse', 'csam', 'minor sexual',
  // Imminent harm
  'going to kill', 'going to hurt',
  // Add more in coordination with safety review
];

export function containsCriticalContent(text: string): {
  isCritical: boolean;
  matchedTerm?: string;
} {
  if (!text) return { isCritical: false };
  const lower = text.toLowerCase();
  for (const term of CRITICAL_TERMS) {
    if (lower.includes(term)) {
      return { isCritical: true, matchedTerm: term };
    }
  }
  return { isCritical: false };
}
