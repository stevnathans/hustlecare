// lib/applyAssistance/offering.ts
//
// Works out which RequirementTemplate an "Apply For Me" request is about,
// and whether Hustlecare currently offers assisted applications for it
// (an active ApplyServiceOffering row = yes, with a price).
//
// The "Apply For Me" link only carries the requirement NAME, so we resolve
// the template on the server. When the business is known we look inside
// that business's own requirements first — a business can't list the same
// template twice, so that match is unambiguous. Without a business we fall
// back to an exact (case-insensitive) name match.

import { prisma } from '@/lib/prisma';

export async function resolveTemplateId(opts: {
  businessId?: number | null;
  requirementName: string;
}): Promise<number | null> {
  const name = opts.requirementName.trim();
  if (!name) return null;

  if (opts.businessId) {
    const match = await prisma.businessRequirement.findFirst({
      where: {
        businessId: opts.businessId,
        isActive: true,
        template: {
          isDeprecated: false,
          name: { equals: name, mode: 'insensitive' },
        },
      },
      select: { templateId: true },
    });
    if (match) return match.templateId;
  }

  const template = await prisma.requirementTemplate.findFirst({
    where: { isDeprecated: false, name: { equals: name, mode: 'insensitive' } },
    select: { id: true },
    orderBy: { id: 'asc' },
  });
  return template?.id ?? null;
}

export async function getActiveOffering(templateId: number | null) {
  if (!templateId) return null;
  return prisma.applyServiceOffering.findFirst({
    where: { templateId, isActive: true },
    include: { documents: { orderBy: { displayOrder: 'asc' } } },
  });
}