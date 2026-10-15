// components/shared/prepare-file.ts
//
// Gets a chosen file ready to upload. Photos are shrunk in the browser so a
// 6 MB phone picture fits under the 4 MB upload limit; PDFs must already fit.
// Throws an Error with a customer-friendly message if the file can't be used.

const MAX_BYTES = 3_800_000; // the server limit is 4,000,000

export async function prepareFile(file: File): Promise<File> {
  if (file.type === 'application/pdf') {
    if (file.size > MAX_BYTES) throw new Error('That PDF is over 4 MB. Try a smaller scan, or send it as photos.');
    return file;
  }
  if (!file.type.startsWith('image/')) throw new Error('Upload a PDF or a photo (JPG or PNG).');

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('We could not read that photo. Try a JPG or PNG, or a PDF.');
  }

  const toBlob = (scale: number, quality: number) =>
    new Promise<Blob | null>((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(resolve, 'image/jpeg', quality);
    });

  let scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
  let quality = 0.82;
  for (let attempt = 0; attempt < 4; attempt++) {
    const blob = await toBlob(scale, quality);
    if (blob && blob.size <= MAX_BYTES) {
      const name = file.name.replace(/\.[^.]*$/, '') || 'photo';
      return new File([blob], `${name}.jpg`, { type: 'image/jpeg' });
    }
    scale *= 0.75;
    quality = Math.max(0.6, quality - 0.08);
  }
  throw new Error('That photo is too large to send. Try taking it again at a lower quality.');
}