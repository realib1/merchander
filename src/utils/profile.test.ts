
import { z } from 'zod';
import { normalizeGhanaPhone } from './phone';

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
});

function parseAvatarDataUri(dataUri: string) {
  if (!dataUri.startsWith('data:')) {
    return { isDataUri: false, mimeType: null, buffer: null, ext: null };
  }
  const commaIdx = dataUri.indexOf(',');
  if (commaIdx === -1) {
    return { isDataUri: true, mimeType: null, buffer: null, ext: null };
  }
  const metaPart = dataUri.substring(0, commaIdx);
  const base64Data = dataUri.substring(commaIdx + 1);
  const mimeMatch = metaPart.match(/data:([^;]+)/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
  const rawExt = mimeType.split('/')[1] || 'png';
  const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
  const buffer = Buffer.from(base64Data, 'base64');
  return { isDataUri: true, mimeType, buffer, ext };
}

describe('Profile Processing & Avatar Parsing Suite', () => {
  describe('Profile Validation Schema', () => {
    it('validates a valid profile payload', () => {
      const raw = {
        firstName: 'Ama',
        lastName: 'Kofi',
        phone: normalizeGhanaPhone('0241234567'),
        avatarUrl: 'https://xyz.supabase.co/storage/v1/object/public/product-images/avatars/u1.png',
      };
      const res = updateProfileSchema.safeParse(raw);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.firstName).toBe('Ama');
        expect(res.data.phone).toBe('+233241234567');
      }
    });

    it('rejects missing first or last name', () => {
      const invalid = {
        firstName: '',
        lastName: 'Kofi',
        phone: null,
        avatarUrl: null,
      };
      const res = updateProfileSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });

    it('allows empty or null avatarUrl for removals', () => {
      const removed = {
        firstName: 'Ama',
        lastName: 'Kofi',
        phone: null,
        avatarUrl: '',
      };
      const res = updateProfileSchema.safeParse(removed);
      expect(res.success).toBe(true);
    });
  });

  describe('Avatar Data URI Parsing', () => {
    it('correctly parses PNG data URIs', () => {
      const pngBase64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const uri = `data:image/png;base64,${pngBase64}`;
      const result = parseAvatarDataUri(uri);
      expect(result.isDataUri).toBe(true);
      expect(result.mimeType).toBe('image/png');
      expect(result.ext).toBe('png');
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer?.length).toBeGreaterThan(0);
    });

    it('correctly normalizes JPEG to jpg extension', () => {
      const jpgBase64 =
        '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
      const uri = `data:image/jpeg;base64,${jpgBase64}`;
      const result = parseAvatarDataUri(uri);
      expect(result.isDataUri).toBe(true);
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.ext).toBe('jpg');
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it('identifies regular URLs as non-data URIs', () => {
      const regularUrl = 'https://supabase.co/storage/v1/object/public/product-images/avatars/user1.png';
      const result = parseAvatarDataUri(regularUrl);
      expect(result.isDataUri).toBe(false);
      expect(result.buffer).toBeNull();
    });
  });
});
