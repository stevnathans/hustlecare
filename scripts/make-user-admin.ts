// scripts/make-user-admin.ts
/**
 * Quick script to make an existing user an admin
 * Usage: npx tsx scripts/make-user-admin.ts your-email@example.com
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get email from command line argument
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: npx tsx scripts/make-user-admin.ts your-email@example.com');
    process.exit(1);
  }

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      }
    });

    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      console.log('\nAvailable users:');
      
      const allUsers = await prisma.user.findMany({
        select: { email: true, role: true },
        take: 10
      });
      
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.role})`);
      });
      
      process.exit(1);
    }

    console.log('\n📝 Current User Details:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Current Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}`);

    // Update user to admin
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        role: 'admin',
        isActive: true,
      }
    });

    console.log('\n✅ User updated successfully!');
    console.log(`   New Role: ${updatedUser.role}`);
    console.log(`   Active: ${updatedUser.isActive}`);
    console.log('\n💡 You can now access the admin dashboard at /admin');
    console.log('   Please sign out and sign back in for changes to take effect.');

  } catch (error) {
    console.error('❌ Error updating user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();