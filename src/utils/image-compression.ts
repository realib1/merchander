/**
 * Client-side browser image compression utility.
 * Resizes large high-resolution photos (e.g. from smartphones) to a maximum dimension
 * and compresses them to stay well within Server Action payload limits (e.g. < 1MB).
 */
export async function compressImageForUpload(
  file: File,
  maxDimension = 1920,
  quality = 0.85
): Promise<File> {
  // If not in a browser environment or already SVG or very small, return as-is
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file;
  }

  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  // If file is already smaller than 500KB, no compression needed
  if (file.size <= 500 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Determine clean output mime type: prefer WebP for best compression, or JPEG
      const outputType = 'image/jpeg';
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file); // If compression didn't reduce size, keep original
          } else {
            const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: outputType,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          }
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
