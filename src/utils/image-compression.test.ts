import { describe, it, expect } from 'vitest';
import { compressImageForUpload } from './image-compression';

describe('image-compression utility', () => {
  it('returns file unchanged if size is under 500KB', async () => {
    const fakeFile = new File(['hello content'], 'test.png', { type: 'image/png' });
    const result = await compressImageForUpload(fakeFile);
    expect(result).toBe(fakeFile);
  });

  it('returns file unchanged for svg or gif images', async () => {
    const svgFile = new File(['<svg></svg>'], 'icon.svg', { type: 'image/svg+xml' });
    const result = await compressImageForUpload(svgFile);
    expect(result).toBe(svgFile);
  });
});
