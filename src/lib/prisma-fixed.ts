import { PrismaClient } from '@prisma/client';

// Set Node.js to ignore SSL certificate errors globally for Prisma
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Enhanced Prisma configuration to fix connection pooling issues
export const prisma = globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Enhanced connection management for serverless
export async function connectToDatabase() {
  try {
    await prisma.$connect();
    return prisma;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

export async function disconnectFromDatabase() {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Database disconnection failed:', error);
  }
}
