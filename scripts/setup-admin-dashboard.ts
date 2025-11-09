/* eslint-disable @typescript-eslint/no-unused-vars */
// scripts/setup-admin-dashboard.ts
/**
 * Hustlecare Admin Dashboard Setup Script
 * 
 * This script:
 * 1. Creates the first admin user
 * 2. Seeds sample data if needed
 * 3. Verifies database schema
 * 4. Tests permissions
 * 
 * Usage:
 * npx tsx scripts/setup-admin-dashboard.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdminUser() {
  console.log('\n📝 Creating Admin User\n');
  
  const email = await question('Admin email: ') || 'admin@hustlecare.com';
  const name = await question('Admin name: ') || 'Admin User';
  const password = await question('Admin password (min 8 chars): ') || 'ChangeMe123!';

  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters long');
    process.exit(1);
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    console.log(`\n⚠️  User with email ${email} already exists`);
    const update = await question('Update to admin role? (y/n): ');
    
    if (update.toLowerCase() === 'y') {
      const updated = await prisma.user.update({
        where: { email },
        data: { 
          role: 'admin',
          isActive: true
        }
      });
      console.log(`✅ Updated ${updated.email} to admin role`);
      return updated;
    } else {
      console.log('Skipping admin user creation');
      return existingUser;
    }
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: 'admin',
      emailVerified: new Date(),
      isActive: true,
      emailNotifications: true,
      pushNotifications: false,
      marketingEmails: false,
    }
  });

  console.log('\n✅ Admin user created successfully!');
  console.log(`📧 Email: ${admin.email}`);
  console.log(`🔑 Role: ${admin.role}`);
  console.log(`🆔 ID: ${admin.id}`);
  
  return admin;
}

async function createSampleRoleUsers() {
  console.log('\n📝 Creating Sample Role Users\n');
  
  const createSample = await question('Create sample users for testing roles? (y/n): ');
  
  if (createSample.toLowerCase() !== 'y') {
    console.log('Skipping sample users');
    return;
  }

  const roles = [
    { role: 'editor', email: 'editor@hustlecare.com', name: 'Editor User' },
    { role: 'author', email: 'author@hustlecare.com', name: 'Author User' },
    { role: 'reviewer', email: 'reviewer@hustlecare.com', name: 'Reviewer User' },
  ];

  const defaultPassword = 'Test123!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 12);

  for (const roleData of roles) {
    try {
      const user = await prisma.user.create({
        data: {
          ...roleData,
          password: hashedPassword,
          emailVerified: new Date(),
          isActive: true,
        }
      });
      console.log(`✅ Created ${user.role}: ${user.email}`);
    } catch (error) {
      console.log(`⚠️  User ${roleData.email} might already exist`);
    }
  }

  console.log(`\n📝 Sample users password: ${defaultPassword}`);
}

async function verifySchema() {
  console.log('\n🔍 Verifying Database Schema\n');

  try {
    // Check if AuditLog table exists
    const auditLogCount = await prisma.auditLog.count();
    console.log(`✅ AuditLog table exists (${auditLogCount} records)`);

    // Check User fields
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
      }
    });
    
    if (user && 'role' in user && 'isActive' in user) {
      console.log('✅ User table has required fields');
    }

    // Check Business published field
    const business = await prisma.business.findFirst({
      select: { published: true }
    });
    console.log('✅ Business table has published field');

    // Check Comment/Review moderation fields
    const comment = await prisma.comment.findFirst({
      select: { isApproved: true }
    });
    console.log('✅ Comment table has isApproved field');

    console.log('\n✅ Schema verification complete');
  } catch (error) {
    console.error('\n❌ Schema verification failed:', error);
    console.log('\n💡 Run: npx prisma migrate dev');
    process.exit(1);
  }
}

async function seedSampleData() {
  console.log('\n📦 Sample Data Seeding\n');
  
  const seed = await question('Seed sample data? (y/n): ');
  
  if (seed.toLowerCase() !== 'y') {
    console.log('Skipping sample data');
    return;
  }

  try {
    // Create sample vendor
    const vendor = await prisma.vendor.upsert({
      where: { 
        name_website: { 
          name: 'Sample Vendor', 
          website: 'https://example.com' 
        } 
      },
      update: {},
      create: {
        name: 'Sample Vendor',
        website: 'https://example.com',
        logo: 'https://via.placeholder.com/150'
      }
    });
    console.log('✅ Created sample vendor');

    // Create sample business
    const business = await prisma.business.upsert({
      where: { slug: 'sample-business' },
      update: {},
      create: {
        name: 'Sample Business',
        slug: 'sample-business',
        description: 'A sample business for testing',
        image: 'https://via.placeholder.com/400',
        published: true
      }
    });
    console.log('✅ Created sample business');

    // Create sample requirement
    const requirement = await prisma.requirement.create({
      data: {
        name: 'Sample Requirement',
        description: 'A sample requirement for testing',
        category: 'Equipment',
        necessity: 'Required',
        businessId: business.id
      }
    });
    console.log('✅ Created sample requirement');

    // Create sample product
    const product = await prisma.product.create({
      data: {
        name: 'Sample Product',
        description: 'A sample product for testing',
        price: 1000,
        image: 'https://via.placeholder.com/300',
        url: 'https://example.com/product',
        vendorId: vendor.id
      }
    });
    console.log('✅ Created sample product');

    console.log('\n✅ Sample data seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

async function displaySummary() {
  console.log('\n\n' + '='.repeat(50));
  console.log('🎉 SETUP COMPLETE!');
  console.log('='.repeat(50));

  const stats = await Promise.all([
    prisma.user.count({ where: { role: 'admin' } }),
    prisma.user.count(),
    prisma.business.count(),
    prisma.product.count(),
    prisma.requirement.count(),
  ]);

  console.log('\n📊 Current Database State:');
  console.log(`   Admin users: ${stats[0]}`);
  console.log(`   Total users: ${stats[1]}`);
  console.log(`   Businesses: ${stats[2]}`);
  console.log(`   Products: ${stats[3]}`);
  console.log(`   Requirements: ${stats[4]}`);

  console.log('\n📝 Next Steps:');
  console.log('   1. Start your development server: npm run dev');
  console.log('   2. Navigate to: http://localhost:3000/admin');
  console.log('   3. Sign in with your admin credentials');
  console.log('   4. Explore the admin dashboard!');

  console.log('\n🔐 Security Reminders:');
  console.log('   - Change default passwords in production');
  console.log('   - Enable HTTPS in production');
  console.log('   - Review and adjust role permissions');
  console.log('   - Monitor audit logs regularly');
  
  console.log('\n✨ Happy managing!\n');
}

async function main() {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 HUSTLECARE ADMIN DASHBOARD SETUP');
  console.log('='.repeat(50) + '\n');

  try {
    // Step 1: Verify schema
    await verifySchema();

    // Step 2: Create admin user
    await createAdminUser();

    // Step 3: Create sample role users
    await createSampleRoleUsers();

    // Step 4: Seed sample data (optional)
    await seedSampleData();

    // Step 5: Display summary
    await displaySummary();

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

// Run the setup
main();