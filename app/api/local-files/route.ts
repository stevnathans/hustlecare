// app/api/local-files/route.ts
//
// Serves files saved by the "local" storage driver, for development only.
// Every link is signed and expires, exactly like the real storage back-ends.

import { NextResponse } from 'next/server';
import { readLocalFileForLink } from '@/lib/storage/privateStorage';

export const dynamic = 'force-dynamic';

const TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const sp = new URL(request.url).searchParams;
  const rel = sp.get('path') ?? '';
  const exp = Number(sp.get('exp'));
  const name = sp.get('name') ?? '';
  const sig = sp.get('sig') ?? '';
  if (!rel || !Number.isFinite(exp) || !sig) return NextResponse.json({ error: 'Bad link' }, { status: 400 });

  const bytes = await readLocalFileForLink(rel, exp, name, sig);
  if (!bytes) return NextResponse.json({ error: 'This link is invalid or has expired.' }, { status: 403 });

  const ext = rel.split('.').pop()?.toLowerCase() ?? '';
  const headers: Record<string, string> = { 'Content-Type': TYPES[ext] ?? 'application/octet-stream' };
  if (name) headers['Content-Disposition'] = `attachment; filename="${name.replace(/"/g, '')}"`;

  return new Response(new Uint8Array(bytes), { headers });
}