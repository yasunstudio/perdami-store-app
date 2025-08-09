import { PrismaClient } from '@prisma/client';

// Set Node.js to ignore SSL certificate errors globally for Prisma
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client with optimized settings for Vercel and SSL bypass
import { PrismaClient } from '@prisma/client'

// Create a single Prisma Client instance for Prisma Postgres
const createPrismaClient = () => {
  return new PrismaClient({
    log: ['error', 'warn'],
    // Prisma Postgres handles connection pooling and SSL automatically
  });
};

// Create singleton instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Helper function to disconnect properly
export async function disconnectPrisma() {
  try {
    await prisma.$disconnect();
    console.log('🔌 Prisma client disconnected');
  } catch (error) {
    console.error('Error disconnecting Prisma client:', error);
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Ensure proper connection management for Vercel
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Helper function to safely disconnect
export const disconnectPrisma = async () => {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error disconnecting Prisma:', error);
  }
};
