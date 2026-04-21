import { STANDARDIZED_INTERESTS } from '../constants/interests';

/**
 * Standardizes an interest string by checking against the predefined list and its synonyms.
 * If no match is found, it returns the original string (trimmed and capitalized).
 */
export function standardizeInterest(input: string): string {
  const normalizedInput = input.trim().toLowerCase();
  if (!normalizedInput) return '';

  // 1. Check for exact match with standardized name
  const exactMatch = STANDARDIZED_INTERESTS.find(
    item => item.standardizedName.toLowerCase() === normalizedInput
  );
  if (exactMatch) return exactMatch.standardizedName;

  // 2. Check for match with synonyms
  const synonymMatch = STANDARDIZED_INTERESTS.find(item =>
    item.synonyms.some(synonym => synonym.toLowerCase() === normalizedInput)
  );
  if (synonymMatch) return synonymMatch.standardizedName;

  // 3. Fallback: Return the original input with first letter capitalized
  return input.trim().charAt(0).toUpperCase() + input.trim().slice(1);
}

/**
 * Returns a list of standardized interests that match a search query.
 */
export function searchInterests(query: string) {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  return STANDARDIZED_INTERESTS.filter(item => 
    item.standardizedName.toLowerCase().includes(normalizedQuery) ||
    item.synonyms.some(synonym => synonym.toLowerCase().includes(normalizedQuery))
  ).slice(0, 10); // Limit to 10 results
}
