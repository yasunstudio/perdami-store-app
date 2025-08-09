import { PrismaClient } from '@prisma/client';

// Alternative Prisma client for SSL issues
const createAlternativePrismaClient = () => {
  // Force SSL disable for problematic connections
  const originalUrl = process.env.DATABASE_URL;
  let modifiedUrl = originalUrl;
  
  if (originalUrl) {
    // Remove existing SSL parameters and add sslmode=disable
    modifiedUrl = originalUrl
      .replace(/[?&]sslmode=[^&]*/g, '')
      .replace(/[?&]sslcert=[^&]*/g, '')
      .replace(/[?&]sslkey=[^&]*/g, '')
      .replace(/[?&]sslrootcert=[^&]*/g, '');
    
    // Add new SSL configuration
    modifiedUrl += modifiedUrl.includes('?') 
      ? '&sslmode=disable' 
      : '?sslmode=disable';
  }
  
  console.log('🔗 Using modified database URL with SSL disabled');
  
  return new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: modifiedUrl
      }
    },
    // Minimal configuration for maximum compatibility
  });
};

// Create singleton instance
const globalForAltPrisma = globalThis as unknown as {
  altPrisma: PrismaClient | undefined;
};

export const altPrisma = globalForAltPrisma.altPrisma ?? createAlternativePrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForAltPrisma.altPrisma = altPrisma;
}

// Helper function to disconnect properly
export async function disconnectAltPrisma() {
  try {
    await altPrisma.$disconnect();
  } catch (error) {
    console.warn('Error disconnecting alternative Prisma client:', error);
  }
}
