// scripts/backfill-requirement-slugs.ts
//
// One-off backfill: generates a unique slug for every existing
// RequirementTemplate that doesn't have one yet, and sets `published =
// true` on all of them — matching the de-facto behavior before this field
// existed, so nothing that was previously visible suddenly disappears.
//
// Run once after the Stage 1 schema migration, before making `slug`
// required/non-nullable in a follow-up migration:
//
//   npx tsx scripts/backfill-requirement-slugs.ts
//   (or: npx ts-node scripts/backfill-requirement-slugs.ts)

import { prisma } from '../lib/prisma';
import { slugify, resolveUniqueSlug } from '../lib/slugify';

async function main() {
  const templates = await prisma.requirementTemplate.findMany({
    where: {
      OR: [{ slug: null }, { slug: '' }],
    },
    select: { id: true, name: true },
    orderBy: { id: 'asc' },
  });

  console.log(`Found ${templates.length} requirement template(s) without a slug.`);

  let updated = 0;
  let failed = 0;

  for (const template of templates) {
    try {
      const baseSlug = slugify(template.name);

      if (!baseSlug) {
        console.warn(`  Skipping #${template.id} ("${template.name}") — name produces an empty slug.`);
        failed++;
        continue;
      }

      const slug = await resolveUniqueSlug(baseSlug, async (candidate) => {
        const existing = await prisma.requirementTemplate.findUnique({ where: { slug: candidate } });
        return existing !== null;
      });

      await prisma.requirementTemplate.update({
        where: { id: template.id },
        data: {
          slug,
          published: true,
          publishedAt: new Date(),
        },
      });

      console.log(`  #${template.id} "${template.name}" → ${slug}`);
      updated++;
    } catch (error) {
      console.error(`  Failed to backfill #${template.id} ("${template.name}"):`, error);
      failed++;
    }
  }

  console.log(`\nDone. ${updated} updated, ${failed} failed.`);

  const remaining = await prisma.requirementTemplate.count({ where: { slug: null } });
  if (remaining > 0) {
    console.warn(
      `\n⚠ ${remaining} template(s) still have no slug — resolve these manually before making the slug column required in a follow-up migration.`
    );
  } else {
    console.log(
      `\nAll requirement templates now have a slug. Safe to proceed with the follow-up migration that makes the column required.`
    );
  }
}

main()
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });