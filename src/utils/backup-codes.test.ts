
import {
  normalizeBackupCode,
  hashBackupCode,
  generateSingleBackupCode,
  generateBackupCodeBatch,
} from './backup-codes';

const CODE_PATTERN = /^[2-9A-HJ-NP-Z]{5}-[2-9A-HJ-NP-Z]{5}$/;
// The charset drops 0, O, 1, I (lowercase l is moot since codes are upper-case).
const AMBIGUOUS = /[01OI]/;

describe('normalizeBackupCode', () => {
  it('strips spaces and hyphens and upper-cases', () => {
    expect(normalizeBackupCode(' ab cd-ef ')).toBe('ABCDEF');
    expect(normalizeBackupCode('a b\tc')).toBe('ABC');
  });

  it('is idempotent', () => {
    const once = normalizeBackupCode('7h3k9-p2m4n');
    expect(normalizeBackupCode(once)).toBe(once);
  });
});

describe('hashBackupCode', () => {
  it('returns a stable 64-char lowercase hex SHA-256 digest', () => {
    const hash = hashBackupCode('ABCDE-FGHJK');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashBackupCode('ABCDE-FGHJK')).toBe(hash);
  });

  it('is invariant under formatting differences that normalize to the same code', () => {
    expect(hashBackupCode('ab cd-ef')).toBe(hashBackupCode('ABCDEF'));
    expect(hashBackupCode('A-B-C-D-E-F')).toBe(hashBackupCode('abcdef'));
  });

  it('differs for different codes', () => {
    expect(hashBackupCode('ABCDE-FGHJK')).not.toBe(hashBackupCode('ABCDE-FGHJL'));
  });
});

describe('generateSingleBackupCode', () => {
  it('matches the XXXXX-XXXXX unambiguous-charset format', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateSingleBackupCode();
      expect(code).toMatch(CODE_PATTERN);
      expect(code).not.toMatch(AMBIGUOUS);
    }
  });
});

describe('generateBackupCodeBatch', () => {
  it('defaults to 8 codes', () => {
    const { plaintextCodes, hashedCodes } = generateBackupCodeBatch();
    expect(plaintextCodes).toHaveLength(8);
    expect(hashedCodes).toHaveLength(8);
  });

  it('returns the requested count of unique codes', () => {
    const { plaintextCodes } = generateBackupCodeBatch(12);
    expect(plaintextCodes).toHaveLength(12);
    expect(new Set(plaintextCodes).size).toBe(12);
  });

  it('pairs each plaintext code with its own hash', () => {
    const { plaintextCodes, hashedCodes } = generateBackupCodeBatch(6);
    plaintextCodes.forEach((code, i) => {
      expect(hashedCodes[i]).toBe(hashBackupCode(code));
    });
    expect(new Set(hashedCodes).size).toBe(6);
  });
});
