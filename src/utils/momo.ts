/**
 * MoMo / Mobile Money SMS Reference Parser
 * Ported from the ghana-social-commerce-operations python skill.
 */

export function extractMomoReference(text: string): string | null {
  if (!text) return null;

  // Matches common MoMo transaction ID patterns (typically 10-12 digits or alphanumeric ref)
  // e.g. "Payment made! Ref: 48928172901" or "Trans ID: 48928172901"
  const refRegex = /(?:ref|reference|txid|trans id|id)[\s:\-#]*([a-z0-9]{8,14})/i;
  const refMatch = text.match(refRegex);

  if (refMatch && refMatch[1]) {
    return refMatch[1].toUpperCase(); // standardize to uppercase
  }

  // Fallback: Check for standalone 10-12 digit sequence anywhere in the text
  const digitRegex = /\b\d{10,12}\b/;
  const digitMatch = text.match(digitRegex);

  if (digitMatch && digitMatch[0]) {
    return digitMatch[0];
  }

  return null;
}
