import { formatCurrency } from '@/utils/format';

interface FlyerCanvasOptions {
  name: string;
  price: number;
  imageUrl?: string | null;
  qrImageUrl: string;
  shortDisplayUrl: string;
  dynamicStockText: string;
  isPreorder: boolean;
  isOutOfStock: boolean;
  description?: string | null;
}

export async function exportFlyerToPng(options: FlyerCanvasOptions): Promise<void> {
  const {
    name,
    price,
    imageUrl,
    qrImageUrl,
    shortDisplayUrl,
    dynamicStockText,
    isPreorder,
    isOutOfStock,
    description,
  } = options;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const width = 600;
  const height = 780;
  canvas.width = width;
  canvas.height = height;

  // 1. Draw Card Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Outer Border
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, width, height);

  // Top Image Container Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(4, 4, width - 8, 360);

  // 2. Load & Draw Product Image
  if (imageUrl) {
    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = imageUrl;
      });

      const imgAspect = img.width / img.height;
      const boxWidth = 520;
      const boxHeight = 320;
      let drawW = boxWidth;
      let drawH = drawW / imgAspect;

      if (drawH > boxHeight) {
        drawH = boxHeight;
        drawW = drawH * imgAspect;
      }

      const drawX = (width - drawW) / 2;
      const drawY = 24 + (boxHeight - drawH) / 2;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    } catch {
      ctx.fillStyle = '#9ca3af';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(name, width / 2, 180);
    }
  } else {
    ctx.fillStyle = '#9ca3af';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(name, width / 2, 180);
  }

  // Separator Line
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(30, 364);
  ctx.lineTo(width - 30, 364);
  ctx.stroke();

  // 3. Draw Product Title
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  const title = name.length > 36 ? `${name.slice(0, 34)}...` : name;
  ctx.fillText(title, width / 2, 410);

  // 4. Draw Price
  ctx.fillStyle = '#d97706';
  ctx.font = '900 32px sans-serif';
  ctx.fillText(formatCurrency(price), width / 2, 455);

  // 5. Draw Dynamic Status
  ctx.font = '600 16px sans-serif';
  ctx.fillStyle = isPreorder ? '#9333ea' : isOutOfStock ? '#dc2626' : '#16a34a';
  ctx.fillText(
    isPreorder ? 'Available for Pre-Order' : isOutOfStock ? 'Out of Stock' : dynamicStockText,
    width / 2,
    490
  );

  // 6. Draw Description Snippet
  if (description) {
    ctx.fillStyle = '#6b7280';
    ctx.font = '13px sans-serif';
    const desc = description.length > 55 ? `${description.slice(0, 52)}...` : description;
    ctx.fillText(desc, width / 2, 515);
  }

  // 7. Draw QR Code
  const qrImg = new window.Image();
  qrImg.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    qrImg.onload = () => resolve();
    qrImg.onerror = () => reject();
    qrImg.src = qrImageUrl;
  });

  const qrSize = 90;
  const qrX = (width - qrSize) / 2;
  const qrY = 538;
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // 8. Draw Shortcode URL & Subtext
  ctx.fillStyle = '#1f2937';
  ctx.font = 'bold 15px monospace';
  ctx.fillText(shortDisplayUrl, width / 2, 658);

  ctx.fillStyle = '#9ca3af';
  ctx.font = '500 13px sans-serif';
  ctx.fillText('Scan / tap to view & order', width / 2, 682);

  // Footer Branding
  ctx.fillStyle = '#d1d5db';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('MERCHANDER', width / 2, 740);

  // Trigger Download
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_flyer.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
