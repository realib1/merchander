import crypto from 'crypto';

/**
 * Standard un-ambiguous character set (omits easily confused 0, O, 1, I, l)
 */
const BACKUP_CODE_CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Normalizes a backup code by removing whitespace, hyphens, and converting to uppercase.
 */
export function normalizeBackupCode(code: string): string {
  return code.replace(/[\s-]/g, '').toUpperCase();
}

/**
 * Computes a deterministic SHA-256 hex digest of a normalized backup code.
 */
export function hashBackupCode(code: string): string {
  const normalized = normalizeBackupCode(code);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Generates a single cryptographically secure random backup code string formatted as XXXXX-XXXXX.
 */
export function generateSingleBackupCode(): string {
  const bytes = crypto.randomBytes(10);
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += BACKUP_CODE_CHARSET[bytes[i] % BACKUP_CODE_CHARSET.length];
  }
  return `${code.slice(0, 5)}-${code.slice(5)}`;
}

/**
 * Generates a batch of N unique emergency backup recovery codes along with their SHA-256 hashes.
 */
export function generateBackupCodeBatch(count = 8): {
  plaintextCodes: string[];
  hashedCodes: string[];
} {
  const codeSet = new Set<string>();
  while (codeSet.size < count) {
    codeSet.add(generateSingleBackupCode());
  }

  const plaintextCodes = Array.from(codeSet);
  const hashedCodes = plaintextCodes.map((code) => hashBackupCode(code));

  return { plaintextCodes, hashedCodes };
}
