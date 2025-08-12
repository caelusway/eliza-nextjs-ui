/**
 * Utility functions for cleaning citation text from messages
 */

/**
 * Removes citation patterns from message text while preserving the rest of the content
 * @param text - The original message text
 * @returns The cleaned text without citation patterns
 */
export function removeCitationsFromText(text: string): string {
  if (!text) return text;

  // Pattern to match citation blocks starting with "Citated papers:" or "Cited papers:"
  // followed by DOI URLs
  const citationPattern =
    /\s*Cit(?:at)?ed papers:\s*https:\/\/doi\.org\/[^\s,]+(?:\s*,\s*https:\/\/doi\.org\/[^\s,]+)*\s*/gi;

  // Remove citation patterns
  let cleanedText = text.replace(citationPattern, '');

  // Clean up any extra whitespace that might be left
  cleanedText = cleanedText.trim();

  // Remove any trailing punctuation that might be left hanging
  cleanedText = cleanedText.replace(/[,\s]+$/, '');

  return cleanedText;
}

/**
 * Extracts citation DOIs from message text
 * @param text - The original message text
 * @returns Array of DOI URLs found in citations
 */
export function extractCitationsFromText(text: string): string[] {
  if (!text) return [];

  // Pattern to match DOI URLs in citation blocks
  const doiPattern = /https:\/\/doi\.org\/[^\s,]+/g;

  // Find all DOI URLs in the text
  const matches = text.match(doiPattern);

  return matches || [];
}

/**
 * Checks if text contains citation patterns
 * @param text - The text to check
 * @returns True if citations are found
 */
export function hasCitations(text: string): boolean {
  if (!text) return false;

  const citationPattern = /Cit(?:at)?ed papers:\s*https:\/\/doi\.org\/[^\s,]+/i;
  return citationPattern.test(text);
}
