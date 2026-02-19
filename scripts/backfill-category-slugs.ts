// scripts/backfill-category-slugs.ts
// Run with: npx tsx scripts/backfill-category-slugs.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  const categories = await prisma.businessCategory.findMany();
  console.log(`Found ${categories.length} categories to backfill...`);

  for (const cat of categories) {
    const slug = generateSlug(cat.name);
    await prisma.businessCategory.update({
      where: { id: cat.id },
      // @ts-expect-error — slug field exists after schema migration
      data: { slug },
    });
    console.log(`  ✓ ${cat.name} → ${slug}`);
  }

  console.log('Done.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());