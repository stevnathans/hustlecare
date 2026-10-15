// app/api/admin/services/import/route.ts
//
// One-click "Import current services": puts today's hard-coded services,
// packages and prices (lib/services/seed-data.ts) into the database.
// Safe to press more than once — it only ADDS what is missing and never
// overwrites anything you have edited.

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { SEED_SERVICES } from '@/lib/services/seed-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    let servicesCreated = 0;
    let packagesCreated = 0;

    for (const s of SEED_SERVICES) {
      const existing = await prisma.service.findUnique({
        where: { slug: s.slug },
        include: { _count: { select: { packages: true, documents: true } } },
      });

      let serviceId = existing?.id;
      if (!existing) {
        const created = await prisma.service.create({
          data: {
            slug: s.slug,
            name: s.name,
            shortDescription: s.shortDescription,
            emoji: s.emoji,
            category: s.category,
            ctaLabel: s.ctaLabel,
            displayOrder: s.displayOrder,
          },
        });
        serviceId = created.id;
        servicesCreated += 1;
      }
      if (!serviceId) continue;

      if (!existing || existing._count.packages === 0) {
        for (const [index, p] of s.packages.entries()) {
          await prisma.servicePackage.create({
            data: {
              serviceId,
              key: p.key,
              name: p.name,
              tag: p.tag,
              price: p.price,
              depositPercent: p.depositPercent,
              turnaroundMinDays: p.turnaroundMinDays,
              turnaroundMaxDays: p.turnaroundMaxDays,
              revisionRounds: p.revisionRounds,
              features: p.features,
              isPopular: p.isPopular,
              displayOrder: index,
            },
          });
          packagesCreated += 1;
        }
      }

      if (!existing || existing._count.documents === 0) {
        for (const [index, d] of s.documents.entries()) {
          await prisma.serviceDocumentSpec.create({
            data: { serviceId, label: d.label, description: d.description, isRequired: d.isRequired, displayOrder: index },
          });
        }
      }
    }

    revalidatePath('/services');
    return NextResponse.json({ servicesCreated, packagesCreated });
  } catch (error) {
    console.error('Error importing services:', error);
    return NextResponse.json({ error: 'The import failed.' }, { status: 500 });
  }
}