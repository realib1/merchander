import crypto from 'crypto';

const PREFIX = 'enc:gcm:';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/**
 * Derives a consistent 32-byte key for AES-256-GCM.
 */
function getEncryptionKey(): Buffer {
  const rawKey =
    process.env.ENCRYPTION_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'merchander-fallback-dev-secret-key-32b';
  return crypto.createHash('sha256').update(rawKey).digest();
}

/**
 * Checks if a string is already encrypted with our format.
 */
export function isEncrypted(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  return val.startsWith(PREFIX);
}

/**
 * Encrypts a plaintext secret using AES-256-GCM.
 * If already encrypted or empty, returns input directly.
 */
export function encryptSecret(plainText: string | null | undefined): string {
  if (!plainText || typeof plainText !== 'string') return '';
  const trimmed = plainText.trim();
  if (!trimmed) return '';
  if (isEncrypted(trimmed)) return trimmed;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

  let encrypted = cipher.update(trimmed, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a ciphertext string encrypted with encryptSecret.
 * If not in encrypted format, returns input directly (fallback for unmigrated legacy secrets).
 */
export function decryptSecret(cipherText: string | null | undefined): string {
  if (!cipherText || typeof cipherText !== 'string') return '';
  const trimmed = cipherText.trim();
  if (!trimmed) return '';
  if (!isEncrypted(trimmed)) return trimmed;

  try {
    const parts = trimmed.slice(PREFIX.length).split(':');
    if (parts.length !== 3) return trimmed;

    const [ivHex, tagHex, dataHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(dataHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Failed to decrypt secret:', err);
    throw new Error('Secret decryption failed');
  }
}

/**
 * Masks a secret string for display in client UI (e.g., sk_live_••••••1234).
 */
export function maskSecret(secret: string | null | undefined): string {
  if (!secret || typeof secret !== 'string') return '';
  let plain = secret;
  try {
    plain = isEncrypted(secret) ? decryptSecret(secret) : secret;
  } catch {
    return '••••••••';
  }
  if (!plain) return '';
  if (plain.length <= 8) return '••••••••';
  const prefix = plain.slice(0, 4);
  const suffix = plain.slice(-4);
  return `${prefix}••••••••${suffix}`;
}
