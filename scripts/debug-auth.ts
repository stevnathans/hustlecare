// scripts/debug-auth.ts
/**
 * Debug script to check authentication setup
 * Usage: npx tsx scripts/debug-auth.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 AUTHENTICATION DEBUG REPORT');
  console.log('='.repeat(60) + '\n');

  try {
    // 1. Check database connection
    console.log('1️⃣  Checking database connection...');
    await prisma.$connect();
    console.log('   ✅ Database connected successfully\n');

    // 2. Check users table
    console.log('2️⃣  Checking users table...');
    const totalUsers = await prisma.user.count();
    console.log(`   ✅ Found ${totalUsers} users\n`);

    // 3. List all users with roles
    console.log('3️⃣  User List:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        emailVerified: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    if (users.length === 0) {
      console.log('   ⚠️  No users found!\n');
      console.log('   💡 Create a user first:');
      console.log('      npx tsx scripts/setup-admin-dashboard.ts\n');
    } else {
      users.forEach((user, index) => {
        console.log(`\n   User ${index + 1}:`);
        console.log(`   ├─ Email: ${user.email}`);
        console.log(`   ├─ Name: ${user.name}`);
        console.log(`   ├─ Role: ${user.role}`);
        console.log(`   ├─ Active: ${user.isActive ? '✅' : '❌'}`);
        console.log(`   ├─ Email Verified: ${user.emailVerified ? '✅' : '❌'}`);
        console.log(`   └─ Last Login: ${user.lastLoginAt ? user.lastLoginAt.toLocaleString() : 'Never'}`);
      });
    }

    // 4. Check admin users
    console.log('\n\n4️⃣  Admin Users:');
    const adminUsers = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { email: true, isActive: true }
    });

    if (adminUsers.length === 0) {
      console.log('   ⚠️  No admin users found!\n');
      console.log('   💡 Make a user admin:');
      console.log('      npx tsx scripts/make-user-admin.ts your-email@example.com\n');
    } else {
      adminUsers.forEach(admin => {
        console.log(`   ✅ ${admin.email} ${admin.isActive ? '(Active)' : '(Inactive)'}`);
      });
    }

    // 5. Check role distribution
    console.log('\n5️⃣  Role Distribution:');
    const roleStats = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    });

    roleStats.forEach(stat => {
      console.log(`   ${stat.role}: ${stat._count} users`);
    });

    // 6. Check sessions
    console.log('\n6️⃣  Active Sessions:');
    const activeSessions = await prisma.session.count({
      where: {
        expires: { gt: new Date() }
      }
    });
    console.log(`   ${activeSessions} active sessions\n`);

    // 7. Check accounts (OAuth)
    console.log('7️⃣  OAuth Accounts:');
    const accounts = await prisma.account.groupBy({
      by: ['provider'],
      _count: true
    });

    if (accounts.length === 0) {
      console.log('   No OAuth accounts found\n');
    } else {
      accounts.forEach(account => {
        console.log(`   ${account.provider}: ${account._count} accounts`);
      });
    }

    // 8. Environment variables check
    console.log('\n8️⃣  Environment Variables:');
    const envVars = {
      'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing',
      'NEXTAUTH_URL': process.env.NEXTAUTH_URL ? '✅ Set' : '❌ Missing',
      'DATABASE_URL': process.env.DATABASE_URL ? '✅ Set' : '❌ Missing',
      'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '⚠️  Not set (optional)',
      'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '⚠️  Not set (optional)',
    };

    for (const [key, value] of Object.entries(envVars)) {
      console.log(`   ${key}: ${value}`);
    }

    // Summary and recommendations
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY & RECOMMENDATIONS');
    console.log('='.repeat(60) + '\n');

    if (totalUsers === 0) {
      console.log('❌ No users found. Run setup script first:');
      console.log('   npx tsx scripts/setup-admin-dashboard.ts\n');
    } else if (adminUsers.length === 0) {
      console.log('⚠️  No admin users. Make someone admin:');
      console.log('   npx tsx scripts/make-user-admin.ts your-email@example.com\n');
    } else {
      console.log('✅ Setup looks good!\n');
      console.log('🚀 Next steps:');
      console.log('   1. Start your dev server: npm run dev');
      console.log('   2. Sign in with an admin account');
      console.log('   3. Navigate to http://localhost:3000/admin\n');
    }

    console.log('💡 Common Issues:');
    console.log('   • "Unauthorized" error: Sign out and sign back in');
    console.log('   • Can\'t access /admin: Check user role is not "user"');
    console.log('   • Session expired: Clear cookies and sign in again\n');

  } catch (error) {
    console.error('\n❌ Error during debug:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();