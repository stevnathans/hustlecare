/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// components/ImageUploader.tsx
import { useState } from 'react';
import Image from 'next/image';
import { supabase } from '../lib/supabase';

export default function ImageUploader() {
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple helper to make a unique filename.
  const makeFilename = (origName: string) => {
    const ext = origName.split('.').pop() ?? 'png';
    // Use crypto.randomUUID if available, otherwise fallback
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? (crypto as any).randomUUID()
      : `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    return `images/${id}.${ext}`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const filePath = makeFilename(file.name);

      // Upload the file to 'uploads' bucket at path filePath
      const { data, error: uploadError } = await supabase
        .storage
        .from('uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL (works because bucket is public)
      const { data: publicData } = supabase
        .storage
        .from('uploads')
        .getPublicUrl(filePath);

      setPublicUrl(publicData.publicUrl ?? null);
    } catch (err: any) {
      console.error('Upload error', err);
      setError(err.message ?? 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <label style={{ display: 'block', marginBottom: 8 }}>
        Choose an image:
      </label>

      <input type="file" accept="image/*" onChange={handleFileChange} />

      {loading && <p>Uploading…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {publicUrl && (
        <div style={{ marginTop: 12 }}>
          <p>Uploaded image (served from Supabase):</p>

          {/* next/image requires width and height OR 'fill' layout. Using width/height here. */}
          <div style={{ position: 'relative', width: 400, height: 300 }}>
            <Image
              src={publicUrl}
              alt="uploaded"
              fill={false}
              width={400}
              height={300}
              style={{ objectFit: 'cover' }}
            />
          </div>

          <p style={{ fontSize: 12, marginTop: 8 }}>
            Public URL: <a href={publicUrl} target="_blank" rel="noreferrer">{publicUrl}</a>
          </p>
        </div>
      )}
    </div>
  );
}
