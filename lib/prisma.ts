// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Test the connection on initialization
if (process.env.NODE_ENV === 'production') {
  prisma.$connect()
    .then(() => console.log('✅ Database connected successfully'))
    .catch((e) => console.error('❌ Database connection failed:', e))
}