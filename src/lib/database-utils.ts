// Create a robust database connection wrapper for problematic endpoints
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Enhanced database connection with retry logic
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  backoffMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Ensure fresh connection
      await prisma.$connect();
      
      const result = await operation();
      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      // Disconnect and wait before retry
      try {
        await prisma.$disconnect();
      } catch (disconnectError) {
        console.error('Disconnect error:', disconnectError);
      }
      
      if (attempt < maxRetries) {
        console.log(`Retrying in ${backoffMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        backoffMs *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError || new Error('Database operation failed after all retries');
}

// Enhanced error response handler
export function createErrorResponse(error: unknown, context: string) {
  console.error(`Error in ${context}:`, error);
  
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const isDatabaseError = errorMessage.includes('Prisma') || 
                         errorMessage.includes('database') ||
                         errorMessage.includes('connection');
  
  if (isDatabaseError) {
    return NextResponse.json(
      { 
        error: 'Database temporarily unavailable. Please try again in a moment.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        timestamp: new Date().toISOString(),
        context
      },
      { status: 503 } // Service Unavailable
    );
  }
  
  return NextResponse.json(
    { 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString(),
      context
    },
    { status: 500 }
  );
}

// Database health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await withDatabaseRetry(async () => {
      await prisma.$queryRaw`SELECT 1 as health_check`;
    });
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Connection pool status
export async function getDatabaseStatus() {
  try {
    const result = await prisma.$queryRaw`
      SELECT 
        state,
        COUNT(*) as connection_count
      FROM pg_stat_activity 
      WHERE datname = current_database()
      GROUP BY state
    `;
    
    return {
      healthy: true,
      connections: result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}
