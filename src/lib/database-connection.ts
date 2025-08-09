import { prisma } from './prisma'

const MAX_RETRIES = 3
const RETRY_DELAY = 1000

// Robust database connection helper for Vercel
export async function ensureDatabaseConnection(maxRetries = MAX_RETRIES): Promise<void> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$disconnect()
      await new Promise(resolve => setTimeout(resolve, 100))
      await prisma.$connect()
      
      // Test connection with a simple query
      await prisma.$queryRaw`SELECT 1`
      
      console.log(`✅ Database connection established (attempt ${attempt})`)
      return
    } catch (error) {
      lastError = error as Error
      console.warn(`⚠️ Database connection attempt ${attempt} failed:`, error instanceof Error ? error.message : 'Unknown error')
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt))
      }
    }
  }
  
  throw new Error(`Failed to establish database connection after ${maxRetries} attempts: ${lastError?.message}`)
}

// Execute database operation with retry logic
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      console.warn(`⚠️ Database operation attempt ${attempt} failed:`, error instanceof Error ? error.message : 'Unknown error')
      
      // If it's a connection error, try to reconnect
      if (error instanceof Error && (
        error.message.includes('prepared statement') ||
        error.message.includes('Engine is not yet connected') ||
        error.message.includes('Connection closed')
      )) {
        try {
          await ensureDatabaseConnection(1)
        } catch (reconnectError) {
          console.warn('Reconnection failed:', reconnectError)
        }
      }
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt))
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries')
}

// Wrapper for API handlers with automatic connection management
export function withDatabaseConnection<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    await ensureDatabaseConnection()
    return executeWithRetry(() => handler(...args))
  }
}
