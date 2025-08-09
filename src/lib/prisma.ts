import { PrismaClient } from '@prisma/client';

// Set Node.js to ignore SSL certificate errors globally for Prisma
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client with optimized settings for Vercel and SSL bypass
const createPrismaClient = () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  // Ensure SSL mode is properly set for Vercel deployment
  let connectionUrl = databaseUrl;
  if (databaseUrl && !databaseUrl.includes('sslmode=')) {
    connectionUrl = databaseUrl.includes('?') 
      ? `${databaseUrl}&sslmode=require&sslcert=&sslkey=&sslrootcert=`
      : `${databaseUrl}?sslmode=require&sslcert=&sslkey=&sslrootcert=`;
  }
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: connectionUrl
      }
    },
    // Optimized configuration for serverless environments
    errorFormat: 'pretty',
  });
};

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
