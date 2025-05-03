import { prisma } from "@/lib/prisma";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

async function updateBusinessSlugs() {
  const businesses = await prisma.business.findMany();

  for (const business of businesses) {
    const slug = generateSlug(business.name);

    await prisma.business.update({
      where: { id: business.id },
      data: { slug },
    });

    console.log(`Updated ${business.name} → ${slug}`);
  }

  console.log("✅ Done updating all business slugs.");
}

updateBusinessSlugs()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
