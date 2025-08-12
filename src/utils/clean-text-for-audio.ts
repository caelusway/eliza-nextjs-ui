/**
 * Cleans text for text-to-speech by removing citations, links, and other non-speakable content
 */
export function cleanTextForAudio(text: string): string {
  if (!text) return '';

  const cleanText = text
    // Remove code blocks (```...```)
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code (`...`)
    .replace(/`[^`]*`/g, '')
    // Remove bold markdown (**text**)
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    // Remove italic markdown (*text*)
    .replace(/\*([^*]*)\*/g, '$1')
    // Remove headers (# ## ### etc.)
    .replace(/#{1,6}\s+/g, '')
    // Remove markdown links [text](url) - keep only the text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove academic citations in various formats
    // Format: (Author et al., 2023)
    .replace(/\([^)]*et al\.[^)]*\)/gi, '')
    // Format: (Smith, 2023; Jones, 2024)
    .replace(/\([^)]*\d{4}[^)]*\)/g, '')
    // Format: [1], [2-5], [1,2,3]
    .replace(/\[\d+(?:[-,]\d+)*\]/g, '')
    // Format: Smith et al. (2023)
    .replace(/[A-Z][a-z]+\s+et al\.\s*\(\d{4}\)/g, '')
    // Format: (Smith et al.)
    .replace(/\([^)]*et al\.[^)]*\)/gi, '')
    // Remove DOI links
    .replace(/doi:\s*[\w\-\.\/]+/gi, '')
    // Remove URLs (http/https)
    .replace(/https?:\/\/[^\s]+/g, '')
    // Remove email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
    // Remove standalone years in parentheses like (2023)
    .replace(/\(\d{4}\)/g, '')
    // Remove reference numbers like [1] or (1)
    .replace(/[\(\[]\d+[\)\]]/g, '')
    // Remove "Figure X", "Table X", "Equation X"
    .replace(/(?:Figure|Table|Equation)\s+\d+/gi, '')
    // Remove "Fig. X", "Tab. X"
    .replace(/(?:Fig|Tab)\.\s*\d+/gi, '')
    // Remove "Cited papers:" or "Referenced papers:" etc.
    .replace(/(?:Cited|Referenced|Research)\s+papers?:?/gi, '')
    // Remove page references like "p. 123" or "pp. 123-456"
    .replace(/pp?\.\s*\d+(?:-\d+)?/gi, '')
    // Remove journal volume/issue references like "Vol. 10, No. 3"
    .replace(/Vol\.\s*\d+,?\s*(?:No\.\s*\d+)?/gi, '')
    // Remove "PMID: 12345678"
    .replace(/PMID:\s*\d+/gi, '')
    // Remove "ISSN: 1234-5678"
    .replace(/ISSN:\s*\d{4}-\d{4}/gi, '')
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Remove extra punctuation (multiple periods, commas)
    .replace(/[.,]{2,}/g, '.')
    // Remove leading/trailing whitespace
    .trim();

  // If the text is too short after cleaning, return empty
  if (cleanText.length < 10) {
    return '';
  }

  return cleanText;
}
