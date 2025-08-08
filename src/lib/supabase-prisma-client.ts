import { PrismaClient } from '@prisma/client'

/**
 * Advanced Prisma Client for Supabase + Vercel
 * Mengatasi prepared statement conflicts dengan multiple strategies
 */
class SupabasePrismaClient {
  private static instance: PrismaClient | null = null
  private static connectionCounter = 0

  /**
   * Create a completely isolated Prisma client instance
   * Each instance gets unique connection parameters to avoid conflicts
   */
  static createIsolatedClient(): PrismaClient {
    // Increment counter untuk unique connection
    this.connectionCounter++
    
    // Generate unique connection identifiers
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const processId = process.pid || Math.floor(Math.random() * 10000)
    const instanceId = `perdami_${this.connectionCounter}_${timestamp}_${processId}_${random}`
    
    // Build connection string dengan unique parameters
    let connectionUrl = process.env.DATABASE_URL!
    
    // Add multiple unique parameters to force new connection pool
    const uniqueParams = [
      `application_name=${instanceId}`,
      `connect_timeout=30`,
      `statement_timeout=30000`,
      `idle_in_transaction_session_timeout=30000`,
      // Force new connection by varying these parameters
      `tcp_user_timeout=30000`,
      `keepalives_idle=30`,
      `keepalives_interval=10`,
      `keepalives_count=3`
    ]
    
    // Append unique parameters
    if (connectionUrl.includes('?')) {
      connectionUrl += '&' + uniqueParams.join('&')
    } else {
      connectionUrl += '?' + uniqueParams.join('&')
    }
    
    console.log(`🔗 Creating isolated Prisma client #${this.connectionCounter} with ID: ${instanceId}`)
    
    return new PrismaClient({
      datasources: {
        db: {
          url: connectionUrl
        }
      },
      log: ['error', 'warn']
    })
  }

  /**
   * Execute database operation with automatic retry and cleanup
   */
  static async executeWithRetry<T>(
    operation: (prisma: PrismaClient) => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const prisma = this.createIsolatedClient()
      
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries}`)
        
        // Execute the operation
        const result = await operation(prisma)
        
        console.log(`✅ Operation successful on attempt ${attempt}`)
        return result
        
      } catch (error: any) {
        lastError = error
        console.warn(`⚠️  Attempt ${attempt} failed:`, error.message)
        
        // Check if it's a prepared statement conflict
        if (error.message?.includes('prepared statement') || 
            error.message?.includes('already exists') ||
            error.message?.includes('does not exist')) {
          console.log(`🔧 Prepared statement conflict detected, retrying with new client...`)
          
          // Wait before retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          // Non-prepared statement error, don't retry
          throw error
        }
        
      } finally {
        try {
          await prisma.$disconnect()
        } catch (disconnectError) {
          console.warn('⚠️  Disconnect warning:', disconnectError)
        }
      }
    }
    
    throw lastError || new Error('Operation failed after all retries')
  }

  /**
   * Execute raw SQL with conflict resolution
   */
  static async executeRawSQL(
    sql: string,
    params: any[] = [],
    maxRetries = 3
  ): Promise<any> {
    return this.executeWithRetry(async (prisma) => {
      if (params.length > 0) {
        return await prisma.$executeRawUnsafe(sql, ...params)
      } else {
        return await prisma.$executeRawUnsafe(sql)
      }
    }, maxRetries)
  }

  /**
   * Query raw SQL with conflict resolution
   */
  static async queryRawSQL<T = any>(
    sql: string,
    params: any[] = [],
    maxRetries = 3
  ): Promise<T[]> {
    return this.executeWithRetry(async (prisma) => {
      if (params.length > 0) {
        return await prisma.$queryRawUnsafe(sql, ...params) as T[]
      } else {
        return await prisma.$queryRawUnsafe(sql) as T[]
      }
    }, maxRetries)
  }

  /**
   * Execute Prisma model operations with conflict resolution
   */
  static async executeModelOperation<T>(
    operation: (prisma: PrismaClient) => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    return this.executeWithRetry(operation, maxRetries)
  }

  /**
   * Cleanup any lingering connections
   */
  static async cleanup(): Promise<void> {
    if (this.instance) {
      try {
        await this.instance.$disconnect()
      } catch (error) {
        console.warn('Cleanup warning:', error)
      }
      this.instance = null
    }
    this.connectionCounter = 0
    console.log('🧹 Prisma connections cleaned up')
  }
}

export { SupabasePrismaClient }

// Utility functions untuk common operations
export const supabaseDB = {
  /**
   * Create or update records with conflict resolution
   */
  async upsert<T>(
    tableName: string,
    data: Record<string, any>,
    conflictField = 'id'
  ): Promise<T> {
    const fields = Object.keys(data).map(key => `"${key}"`).join(', ')
    const values = Object.values(data).map((_, index) => `$${index + 1}`).join(', ')
    const updateFields = Object.keys(data)
      .filter(key => key !== conflictField)
      .map(key => `"${key}" = EXCLUDED."${key}"`)
      .join(', ')

    const sql = `
      INSERT INTO "${tableName}" (${fields})
      VALUES (${values})
      ON CONFLICT ("${conflictField}")
      DO UPDATE SET ${updateFields}, "updatedAt" = NOW()
      RETURNING *
    `

    const result = await SupabasePrismaClient.queryRawSQL(sql, Object.values(data))
    return result[0] as T
  },

  /**
   * Bulk insert with conflict resolution
   */
  async bulkUpsert<T>(
    tableName: string,
    records: Record<string, any>[],
    conflictField = 'id'
  ): Promise<T[]> {
    if (records.length === 0) return []

    const results: T[] = []
    
    // Process in batches to avoid large queries
    const batchSize = 10
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      
      for (const record of batch) {
        try {
          const result = await this.upsert<T>(tableName, record, conflictField)
          results.push(result)
          console.log(`✅ Upserted record: ${record[conflictField]}`)
        } catch (error: any) {
          console.error(`❌ Failed to upsert ${record[conflictField]}:`, error.message)
        }
      }
      
      // Small delay between batches
      if (i + batchSize < records.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return results
  },

  /**
   * Check if table exists
   */
  async tableExists(tableName: string): Promise<boolean> {
    try {
      const result = await SupabasePrismaClient.queryRawSQL(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [tableName])
      
      return result[0]?.exists === true
    } catch (error) {
      console.error(`Error checking table ${tableName}:`, error)
      return false
    }
  },

  /**
   * Create table from schema if not exists
   */
  async createTableIfNotExists(tableName: string, schema: string): Promise<boolean> {
    try {
      await SupabasePrismaClient.executeRawSQL(`
        CREATE TABLE IF NOT EXISTS "${tableName}" ${schema}
      `)
      console.log(`✅ Table "${tableName}" ready`)
      return true
    } catch (error: any) {
      console.error(`❌ Failed to create table "${tableName}":`, error.message)
      return false
    }
  }
}

export default SupabasePrismaClient
