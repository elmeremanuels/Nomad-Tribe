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
