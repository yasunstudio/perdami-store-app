import { PrismaClient } from '@prisma/client';

// Serverless-optimized Prisma configuration - create unique connection each time
export const createPrismaClient = () => {
  // Add random suffix to force new connection pool
  const connectionUrl = process.env.DATABASE_URL + `&app_name=perdami_app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: connectionUrl
      }
    }
  });
};
