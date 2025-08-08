import { PrismaClient } from '@prisma/client';

// Set Node.js to ignore SSL certificate errors globally for Prisma
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Serverless-optimized Prisma configuration
export const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
};

// For serverless environments, create a new client for each request to avoid prepared statement conflicts
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Export prisma client based on environment
let prismaClient: PrismaClient;

// In production serverless environment, always create new client to avoid prepared statement issues
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  // Force new client creation for each request in serverless
  prismaClient = createPrismaClient();
} else {
  // Development: reuse client
  prismaClient = globalForPrisma.prisma ?? createPrismaClient();
  globalForPrisma.prisma = prismaClient;
}

export const prisma = prismaClient;
