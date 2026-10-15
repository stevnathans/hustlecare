// app/api/admin/services/route.ts
//
// GET  → every service with its packages and file checklist
// POST → create a new service (slug is permanent)

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { parseServiceInput, SLUG_RE } from '@/lib/services/validate';
import { saveServiceTree } from '@/lib/services/save';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const services = await prisma.service.findMany({
      orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
      include: {
        packages: { orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }] },
        documents: { orderBy: { displayOrder: 'asc' } },
      },
    });
    return NextResponse.json({ services });
  } catch (error) {
    console.error('Error loading services:', error);
    return NextResponse.json({ error: 'Failed to load services.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => null);
    const slug = typeof body?.slug === 'string' ? body.slug.trim().toLowerCase() : '';
    if (!SLUG_RE.test(slug)) {
      return NextResponse.json(
        { error: 'The address must be 3–60 lowercase letters, numbers or dashes, e.g. social-media-setup.' },
        { status: 400 },
      );
    }

    const parsed = parseServiceInput(body);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    if (await prisma.service.findUnique({ where: { slug }, select: { id: true } })) {
      return NextResponse.json({ error: 'A service with that address already exists.' }, { status: 409 });
    }

    const d = parsed.data;
    const created = await prisma.$transaction(async (tx) => {
      const service = await tx.service.create({
        data: {
          slug,
          name: d.name,
          shortDescription: d.shortDescription,
          emoji: d.emoji,
          category: d.category,
          ctaLabel: d.ctaLabel,
          isActive: d.isActive,
          displayOrder: d.displayOrder,
        },
      });
      await saveServiceTree(tx, service.id, d);
      return service;
    });

    revalidatePath('/services');
    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Failed to create the service.' }, { status: 500 });
  }
}