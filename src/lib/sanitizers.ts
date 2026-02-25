/**
 * Sanitizes text by removing HTML and special characters.
 * Preserves: alphanumeric characterss, spaces, hyphens, periods, commas.
 *
 * @param text - Raw input text to sanitize
 * @returns Sanitized text with HTML and special characters removed
 *
 * @example
 *   sanitizeText('<script>alert("xss")</script>')
 *   // → 'scriptalertxssscript'
 *
 *   sanitizeText('Hello, world! How are you?')
 *   // → 'Hello, world How are you'
 *
 *   sanitizeText('Process-Improvement: Cost & Efficiency')
 *   // → 'Process-Improvement Cost  Efficiency'
 */
export function sanitizeText(text: string): string {
  return text.replace(/[^a-zA-Z0-9\s\-.,]/g, '');
}
