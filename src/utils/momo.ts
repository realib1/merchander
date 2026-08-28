/**
 * MoMo / Mobile Money SMS Reference & Amount Parser
 * Ported from the ghana-social-commerce-operations skill.
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

export function extractMomoAmount(text: string): number | null {
  if (!text) return null;

  // Matches GHS / GHc / GHC / GHS. followed by numbers: e.g. "GHS 150.00", "GHc50", "GHS 1,250.50"
  const amountRegex = /(?:ghs|ghc|gh¢)[\s.:]*([0-9,]+(?:\.[0-9]{1,2})?)/i;
  const match = text.match(amountRegex);

  if (match && match[1]) {
    const cleanNumber = match[1].replace(/,/g, '');
    const parsed = parseFloat(cleanNumber);
    return isNaN(parsed) ? null : parsed;
  }

  return null;
}

export function extractMomoSender(text: string): { phone?: string; name?: string } {
  if (!text) return {};

  const result: { phone?: string; name?: string } = {};

  // Matches "from 0244123456 - Kwesi Mensah" or "from 233244123456"
  const senderRegex = /from\s+([0-9+]{10,15})(?:\s*[-–]\s*([a-zA-Z\s]+))?/i;
  const match = text.match(senderRegex);

  if (match) {
    if (match[1]) result.phone = match[1].trim();
    if (match[2]) result.name = match[2].trim();
  }

  return result;
}
