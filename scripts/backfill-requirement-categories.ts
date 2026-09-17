// scripts/backfill-requirement-categories.ts
//
// One-off backfill for Stage 3 Part A: creates the 8 canonical
// RequirementCategory rows (the 7 real categories currently in use, plus
// the Uncategorized fallback) and sets categoryId on every existing
// RequirementTemplate by matching its current `category` string.
//
// Fully additive — the legacy `category: String` column on
// RequirementTemplate is left untouched. Safe to re-run: categories are
// upserted by name, and templates are only updated if categoryId is
// currently null or points at a stale category.
//
//   npx tsx scripts/backfill-requirement-categories.ts

import { prisma } from '../lib/prisma';
import { NecessityScale } from '@prisma/client';

interface CategorySeed {
  name: string;
  slug: string;
  displayOrder: number;
  colorToken: string;
  excludedFromTotals: boolean;
  necessityScale: NecessityScale;
  usesLegalCountyFilter: boolean;
}

// Matches CAT_COLORS in app/admin/requirements/page.tsx and the
// CATEGORY_ORDER array in hooks/useBusinessData.ts. Scoped to the 7
// categories actually in use plus Uncategorized — don't pre-create
// categories with zero templates; add them later via the admin UI once
// there's a real need (see the SEO architecture doc, Section 20).
const CATEGORY_SEEDS: CategorySeed[] = [
  { name: 'Legal',               slug: 'legal',               displayOrder: 0, colorToken: '#f87171', excludedFromTotals: false, necessityScale: 'REQUIRED_OPTIONAL', usesLegalCountyFilter: true },
  { name: 'Equipment',           slug: 'equipment',           displayOrder: 1, colorToken: '#818cf8', excludedFromTotals: false, necessityScale: 'REQUIRED_OPTIONAL', usesLegalCountyFilter: false },
  { name: 'Software',            slug: 'software',            displayOrder: 2, colorToken: '#a78bfa', excludedFromTotals: false, necessityScale: 'REQUIRED_OPTIONAL', usesLegalCountyFilter: false },
  { name: 'Documents',           slug: 'documents',           displayOrder: 3, colorToken: '#fbbf24', excludedFromTotals: false, necessityScale: 'REQUIRED_OPTIONAL', usesLegalCountyFilter: false },
  { name: 'Branding',            slug: 'branding',            displayOrder: 4, colorToken: '#f472b6', excludedFromTotals: false, necessityScale: 'REQUIRED_OPTIONAL', usesLegalCountyFilter: false },
  { name: 'Operating Expenses',  slug: 'operating-expenses',  displayOrder: 5, colorToken: '#2dd4bf', excludedFromTotals: false, necessityScale: 'REQUIRED_OPTIONAL', usesLegalCountyFilter: false },
  { name: 'Stock',               slug: 'stock',               displayOrder: 6, colorToken: '#22d3ee', excludedFromTotals: true,  necessityScale: 'DEMAND',            usesLegalCountyFilter: false },
  { name: 'Uncategorized',       slug: 'uncategorized',       displayOrder: 7, colorToken: '#9494b0', excludedFromTotals: false, necessityScale: 'REQUIRED_OPTIONAL', usesLegalCountyFilter: false },
];

async function main() {
  console.log('Seeding RequirementCategory rows…');

  const categoryByName = new Map<string, number>();

  for (const seed of CATEGORY_SEEDS) {
    const row = await prisma.requirementCategory.upsert({
      where: { name: seed.name },
      update: {
        slug: seed.slug,
        displayOrder: seed.displayOrder,
        colorToken: seed.colorToken,
        excludedFromTotals: seed.excludedFromTotals,
        necessityScale: seed.necessityScale,
        usesLegalCountyFilter: seed.usesLegalCountyFilter,
      },
      create: seed,
    });
    categoryByName.set(seed.name, row.id);
    console.log(`  ✓ ${seed.name} → id ${row.id}`);
  }

  console.log('\nMatching RequirementTemplate.category strings to categories…');

  const templates = await prisma.requirementTemplate.findMany({
    select: { id: true, name: true, category: true, categoryId: true },
  });

  let updated = 0;
  let unmatched = 0;
  const unmatchedValues = new Set<string>();

  for (const template of templates) {
    const targetId = categoryByName.get(template.category) ?? categoryByName.get('Uncategorized')!;

    if (!categoryByName.has(template.category)) {
      unmatched++;
      unmatchedValues.add(template.category);
    }

    if (template.categoryId === targetId) continue; // already correct, skip

    await prisma.requirementTemplate.update({
      where: { id: template.id },
      data: { categoryId: targetId },
    });
    updated++;
  }

  console.log(`\nDone. ${updated} template(s) updated.`);
  if (unmatched > 0) {
    console.warn(
      `⚠ ${unmatched} template(s) had a category string not in the canonical list ` +
      `(${Array.from(unmatchedValues).join(', ')}) — mapped to Uncategorized. ` +
      `Review these in the admin UI and reassign them to a real category if needed.`
    );
  }

  const stillNull = await prisma.requirementTemplate.count({ where: { categoryId: null } });
  if (stillNull > 0) {
    console.warn(`\n⚠ ${stillNull} template(s) still have no categoryId — investigate before Part B.`);
  } else {
    console.log('\nEvery RequirementTemplate now has a categoryId.');
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