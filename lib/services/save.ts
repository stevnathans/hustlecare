// lib/services/save.ts
//
// Saves a service's packages and file checklist inside one transaction.
//
// Rules that protect existing orders:
//   - A package's KEY never changes once created (orders and questionnaire
//     answers refer to it).
//   - Packages are never deleted. One left out of the form is HIDDEN, so
//     old orders keep their history.
//   - Removing a file item moves files already uploaded for it to "Other".

import type { Prisma } from '@prisma/client';
import { ValidationError, type ServiceInput } from '@/lib/services/validate';

export async function saveServiceTree(tx: Prisma.TransactionClient, serviceId: number, data: ServiceInput) {
  // ── Packages ───────────────────────────────────────────────────────────────
  const existing = await tx.servicePackage.findMany({ where: { serviceId } });
  const byId = new Map(existing.map((p) => [p.id, p]));
  const keep = new Set<number>();

  for (const [index, p] of data.packages.entries()) {
    const fields = {
      name: p.name,
      tag: p.tag,
      price: p.price,
      depositPercent: p.depositPercent,
      turnaroundMinDays: p.turnaroundMinDays,
      turnaroundMaxDays: p.turnaroundMaxDays,
      revisionRounds: p.revisionRounds,
      features: p.features,
      isPopular: p.isPopular,
      isActive: p.isActive,
      displayOrder: index,
    };

    if (p.id !== undefined && byId.has(p.id)) {
      await tx.servicePackage.update({ where: { id: p.id }, data: fields }); // key is not updated
      keep.add(p.id);
    } else {
      if (existing.some((e) => e.key === p.key)) {
        throw new ValidationError(`A package with the key "${p.key}" already exists (it may be hidden).`);
      }
      await tx.servicePackage.create({ data: { serviceId, key: p.key, ...fields } });
    }
  }

  const toHide = existing.filter((e) => !keep.has(e.id) && e.isActive).map((e) => e.id);
  if (toHide.length > 0) {
    await tx.servicePackage.updateMany({ where: { id: { in: toHide } }, data: { isActive: false } });
  }

  // ── Files we ask the customer for ──────────────────────────────────────────
  const specs = await tx.serviceDocumentSpec.findMany({ where: { serviceId } });
  const specIds = new Set(specs.map((s) => s.id));
  const keepSpecs = new Set(
    data.documents.filter((d) => d.id !== undefined && specIds.has(d.id)).map((d) => d.id as number),
  );
  const removed = [...specIds].filter((id) => !keepSpecs.has(id));

  if (removed.length > 0) {
    await tx.serviceOrderFile.updateMany({ where: { specId: { in: removed } }, data: { specId: null } });
    await tx.serviceDocumentSpec.deleteMany({ where: { id: { in: removed } } });
  }

  for (const [index, d] of data.documents.entries()) {
    const fields = { label: d.label, description: d.description, isRequired: d.isRequired, displayOrder: index };
    if (d.id !== undefined && specIds.has(d.id)) {
      await tx.serviceDocumentSpec.update({ where: { id: d.id }, data: fields });
    } else {
      await tx.serviceDocumentSpec.create({ data: { serviceId, ...fields } });
    }
  }
}