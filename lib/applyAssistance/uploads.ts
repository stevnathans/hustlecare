// lib/applyAssistance/uploads.ts
//
// Shared rules for uploaded documents. The type is detected from the file's
// own first bytes — the browser-reported type and the file extension are
// never trusted.

// Vercel functions reject request bodies over ~4.5 MB, so uploads are capped
// below that. The form shrinks photos before sending; PDFs must already fit.
export const MAX_UPLOAD_BYTES = 4_000_000;
export const MAX_DOCUMENTS_PER_REQUEST = 30;
export const MAX_DOCUMENTS_PER_ITEM = 3;

export interface DetectedFile {
  mime: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp';
  ext: 'pdf' | 'jpg' | 'png' | 'webp';
}

export function detectFileType(b: Uint8Array): DetectedFile | null {
  if (b.length < 12) return null;
  const ascii = (from: number, to: number) => String.fromCharCode(...Array.from(b.subarray(from, to)));
  if (ascii(0, 4) === '%PDF') return { mime: 'application/pdf', ext: 'pdf' };
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (b[0] === 0x89 && ascii(1, 4) === 'PNG') return { mime: 'image/png', ext: 'png' };
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return { mime: 'image/webp', ext: 'webp' };
  return null;
}

/** A safe display/storage name: letters, numbers, spaces, dashes; correct extension. */
export function safeFileName(original: string, ext: string): string {
  const base =
    original
      .replace(/\.[^.]*$/, '')
      .replace(/[^a-zA-Z0-9\-_ ]/g, '')
      .trim()
      .slice(0, 60) || 'document';
  return `${base}.${ext}`;
}