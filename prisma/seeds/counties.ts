// prisma/seeds/counties.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KENYAN_COUNTIES = [
  'Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita-Taveta',
  'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru',
  'Tharaka-Nithi', 'Embu', 'Kitui', 'Machakos', 'Makueni', 'Nyandarua',
  'Nyeri', 'Kirinyaga', "Murang'a", 'Kiambu', 'Turkana', 'West Pokot',
  'Samburu', 'Trans Nzoia', 'Uasin Gishu', 'Elgeyo-Marakwet', 'Nandi',
  'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado', 'Kericho',
  'Bomet', 'Kakamega', 'Vihiga', 'Bungoma', 'Busia', 'Siaya', 'Kisumu',
  'Homa Bay', 'Migori', 'Kisii', 'Nyamira', 'Nairobi',
];

function slugify(name: string): string {
  return name.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function seedCounties() {
  console.log(`Seeding ${KENYAN_COUNTIES.length} counties...`);
  for (const name of KENYAN_COUNTIES) {
    const slug = slugify(name);
    await prisma.county.upsert({ where: { slug }, update: { name }, create: { name, slug } });
  }
  console.log(`Done. ${await prisma.county.count()} counties in database.`);
}

if (require.main === module) {
  seedCounties()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
}