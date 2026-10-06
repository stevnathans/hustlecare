// lib/storage/privateStorage.ts
//
// Private file storage for customer documents. One interface, three
// back-ends, chosen by STORAGE_DRIVER:
//
//   local     — files saved in ./.private-uploads on your own computer.
//               For development only (production refuses to use it).
//               Zero setup: it is the default when running `next dev`.
//   s3        — any S3-compatible service. Cloudflare R2 and Backblaze B2
//               both have a free allowance. Needs the two AWS packages:
//                 npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
//   supabase  — Supabase Storage (needs a private bucket).
//
// Files are never public. Customers and admin only ever get short-lived
// signed links. Add  .private-uploads  to your .gitignore.
//
// ENV VARS
//   STORAGE_DRIVER              local | s3 | supabase
//                               (default: local in development, supabase in production)
//
//   s3:
//   S3_ENDPOINT                 R2: https://<account-id>.r2.cloudflarestorage.com
//                               B2: https://s3.<region>.backblazeb2.com
//   S3_REGION                   R2: auto     B2: e.g. us-west-004
//   S3_BUCKET                   your bucket name (keep it private)
//   S3_ACCESS_KEY_ID
//   S3_SECRET_ACCESS_KEY
//
//   supabase:
//   SUPABASE_URL                (NEXT_PUBLIC_SUPABASE_URL also works)
//   SUPABASE_SERVICE_ROLE_KEY   server only
//   APPLY_DOCS_BUCKET           optional, defaults to "apply-documents"

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

type Driver = 'local' | 's3' | 'supabase';

function driver(): Driver {
  const d = process.env.STORAGE_DRIVER;
  if (d === 'local' || d === 's3' || d === 'supabase') return d;
  return process.env.NODE_ENV === 'production' ? 'supabase' : 'local';
}

const encodePath = (p: string) => p.split('/').map(encodeURIComponent).join('/');

// ── Local (development) ──────────────────────────────────────────────────────

const LOCAL_ROOT = path.join(process.cwd(), '.private-uploads');

function assertLocalAllowed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local file storage is for development only. Set STORAGE_DRIVER to s3 or supabase.');
  }
}

function localFullPath(rel: string): string {
  const full = path.resolve(LOCAL_ROOT, rel);
  if (!full.startsWith(LOCAL_ROOT + path.sep)) throw new Error('Invalid file path.');
  return full;
}

function localSignature(rel: string, exp: number, name: string): string {
  const secret = process.env.NEXTAUTH_SECRET || 'dev-only-secret';
  return crypto.createHmac('sha256', secret).update(`${rel}|${exp}|${name}`).digest('hex');
}

/** Used by /api/local-files to check a link and read the file. */
export async function readLocalFileForLink(rel: string, exp: number, name: string, sig: string) {
  assertLocalAllowed();
  const expected = localSignature(rel, exp, name);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  if (Date.now() / 1000 > exp) return null;
  try {
    return await fs.readFile(localFullPath(rel));
  } catch {
    return null;
  }
}

// ── Supabase ─────────────────────────────────────────────────────────────────

function supabaseConfig() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const bucket = process.env.APPLY_DOCS_BUCKET || 'apply-documents';
  if (!url || !key) throw new Error('Supabase file storage is not configured on the server.');
  return { url, key, bucket };
}

// ── S3-compatible (Cloudflare R2, Backblaze B2, ...) ─────────────────────────

async function s3Client() {
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const bucket = process.env.S3_BUCKET;
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('S3 file storage is not configured on the server.');
  }
  const { S3Client } = await import('@aws-sdk/client-s3');
  const client = new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
  return { client, bucket };
}

// ── Public interface ─────────────────────────────────────────────────────────

export async function uploadPrivateFile(filePath: string, bytes: Uint8Array, contentType: string): Promise<void> {
  const d = driver();

  if (d === 'local') {
    assertLocalAllowed();
    const full = localFullPath(filePath);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, bytes);
    return;
  }

  if (d === 's3') {
    const { client, bucket } = await s3Client();
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: filePath, Body: bytes, ContentType: contentType }));
    return;
  }

  const { url, key, bucket } = supabaseConfig();
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${encodePath(filePath)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, apikey: key, 'Content-Type': contentType, 'x-upsert': 'false' },
    body: new Blob([new Uint8Array(bytes)], { type: contentType }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Upload failed (HTTP ${res.status}) ${detail.slice(0, 200)}`);
  }
}

export async function createSignedDownloadUrl(
  filePath: string,
  expiresInSeconds = 3600,
  downloadName?: string,
): Promise<string> {
  const d = driver();

  if (d === 'local') {
    assertLocalAllowed();
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const name = downloadName ?? '';
    const sig = localSignature(filePath, exp, name);
    return `/api/local-files?path=${encodeURIComponent(filePath)}&exp=${exp}&name=${encodeURIComponent(name)}&sig=${sig}`;
  }

  if (d === 's3') {
    const { client, bucket } = await s3Client();
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    return getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: bucket,
        Key: filePath,
        ...(downloadName
          ? { ResponseContentDisposition: `attachment; filename="${downloadName.replace(/"/g, '')}"` }
          : {}),
      }),
      { expiresIn: expiresInSeconds },
    );
  }

  const { url, key, bucket } = supabaseConfig();
  const res = await fetch(`${url}/storage/v1/object/sign/${bucket}/${encodePath(filePath)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn: expiresInSeconds }),
  });
  if (!res.ok) throw new Error(`Could not create a download link (HTTP ${res.status}).`);
  const data = (await res.json()) as { signedURL?: string };
  if (!data.signedURL) throw new Error('Storage returned no download link.');
  const full = `${url}/storage/v1${data.signedURL}`;
  return downloadName ? `${full}&download=${encodeURIComponent(downloadName)}` : full;
}

export async function deletePrivateFile(filePath: string): Promise<void> {
  const d = driver();

  if (d === 'local') {
    assertLocalAllowed();
    await fs.rm(localFullPath(filePath), { force: true });
    return;
  }

  if (d === 's3') {
    const { client, bucket } = await s3Client();
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: filePath }));
    return;
  }

  const { url, key, bucket } = supabaseConfig();
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${encodePath(filePath)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${key}`, apikey: key },
  });
  if (!res.ok && res.status !== 404) throw new Error(`Delete failed (HTTP ${res.status}).`);
}