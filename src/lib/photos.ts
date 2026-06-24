import type { Database, Photo } from './types';

export function photosOf(db: Database, campId: string): Photo[] {
  return (db.photos ?? [])
    .filter((p) => p.campId === campId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Downscale a picked image to a sane size before we store it (the demo keeps
// photos in localStorage; a real build would upload the original to storage).
export function downscaleImage(file: File, max = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error('no canvas')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')); };
    img.src = url;
  });
}
