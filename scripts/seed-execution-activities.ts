import { prisma } from '@/lib/prisma';

async function main() {
  await prisma.activity.createMany({
    data: [
      { name: 'Business Ideas', sourceType: 'AUTO_BUSINESS', cadence: 'DAILY', defaultTarget: 3, color: '#818cf8' },
      { name: 'Guides', sourceType: 'AUTO_GUIDE', cadence: 'DAILY', defaultTarget: 3, color: '#a78bfa' },
      { name: 'Products', sourceType: 'AUTO_PRODUCT', cadence: 'DAILY', defaultTarget: 10, color: '#fbbf24' },
      { name: 'Legal Schedules', sourceType: 'AUTO_LEGAL_SCHEDULE', cadence: 'DAILY', defaultTarget: 5, color: '#f472b6' },
      { name: 'TikTok', sourceType: 'MANUAL', cadence: 'DAILY', defaultTarget: 3, color: '#f87171' },
      { name: 'LinkedIn', sourceType: 'MANUAL', cadence: 'DAILY', defaultTarget: 1, weekdaysOnly: true, color: '#818cf8' },
      { name: 'Instagram', sourceType: 'MANUAL', cadence: 'DAILY', defaultTarget: 1, color: '#e879f9' },
      { name: 'Medium', sourceType: 'MANUAL', cadence: 'WEEKLY', defaultTarget: 1, color: '#34d399' },
    ],
  });
  console.log('Seeded execution activities');
}

main().finally(() => prisma.$disconnect());