// prisma/seed-house-vendor.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

await prisma.vendor.upsert({
  where: { slug: 'hustlecare-direct' },
  update: {},
  create: {
    name: 'HustleCare Direct',
    slug: 'hustlecare-direct',
    status: 'ACTIVE',
    isVerified: true,
    description: 'Products sourced and managed directly by the HustleCare team.',
  },
});