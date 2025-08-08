/**
 * Enhanced Bank Service with Direct PostgreSQL Access
 * Bypasses Prisma to avoid prepared statement conflicts
 */

import { Client } from 'pg'
import * as dotenv from 'dotenv'

// Load environment variables for Node.js applications
if (typeof window === 'undefined') {
  dotenv.config({ path: '.env.local' })
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

interface BankData {
  id: string
  name: string
  code: string
  accountNumber: string
  accountName: string
  logo: string | null
  isActive: boolean
}

/**
 * Direct PostgreSQL client for Supabase (embedded version)
 */
class DirectSupabaseClient {
  private static createUniqueClient(): Client {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const uniqueId = `direct_bank_${timestamp}_${random}`
    
    let connectionUrl = process.env.DATABASE_URL!
    
    if (connectionUrl.includes('?')) {
      connectionUrl += `&application_name=${uniqueId}`
    } else {
      connectionUrl += `?application_name=${uniqueId}`
    }
    
    return new Client({
      connectionString: connectionUrl,
      ssl: { rejectUnauthorized: false },
      statement_timeout: 30000,
      query_timeout: 30000,
      connectionTimeoutMillis: 10000
    })
  }

  static async execute<T = any>(operation: (client: Client) => Promise<T>): Promise<T> {
    const client = this.createUniqueClient()
    
    try {
      await client.connect()
      return await operation(client)
    } finally {
      await client.end()
    }
  }

  static async getAllBanks(): Promise<BankData[]> {
    return this.execute(async (client) => {
      const result = await client.query(
        `SELECT id, name, code, "accountNumber", "accountName", logo, "isActive"
         FROM "banks" 
         ORDER BY name`
      )
      return result.rows
    })
  }

  static async getActiveBanks(): Promise<BankData[]> {
    return this.execute(async (client) => {
      const result = await client.query(
        `SELECT id, name, code, "accountNumber", "accountName", logo, "isActive"
         FROM "banks" 
         WHERE "isActive" = true
         ORDER BY name`
      )
      return result.rows
    })
  }
}

// Static fallback data (same as before)
const STATIC_BANKS: BankData[] = [
  {
    id: 'bank-bri-perdami',
    name: 'Bank BRI - Perdami Store',
    code: 'BRI',
    accountNumber: '1234567890123456',
    accountName: 'Dharma Wanita Perdami',
    logo: '/images/banks/bri-logo.png',
    isActive: true,
  },
  {
    id: 'bank-bca-perdami',
    name: 'Bank BCA - Perdami Store',
    code: 'BCA',
    accountNumber: '9876543210987654',
    accountName: 'Dharma Wanita Perdami',
    logo: '/images/banks/bca-logo.png',
    isActive: true,
  },
  {
    id: 'bank-mandiri-perdami',
    name: 'Bank Mandiri - Perdami Store',
    code: 'MANDIRI',
    accountNumber: '5556667778889999',
    accountName: 'Dharma Wanita Perdami',
    logo: '/images/banks/mandiri-logo.png',
    isActive: true,
  }
]

class DirectBankService {
  /**
   * Get all available banks (Active and Inactive)
   */
  static async getAllBanks(): Promise<BankData[]> {
    try {
      console.log('🏦 DirectBankService: Fetching all banks from database...')
      
      const banks = await DirectSupabaseClient.getAllBanks()
      
      if (banks && banks.length > 0) {
        console.log(`✅ DirectBankService: Found ${banks.length} banks in database`)
        return banks
      } else {
        console.log('⚠️ DirectBankService: No banks found in database, using static fallback')
        return STATIC_BANKS
      }
      
    } catch (error: any) {
      console.error('❌ DirectBankService: Database error, using static fallback:', error.message)
      return STATIC_BANKS
    }
  }

  /**
   * Get only active banks for frontend
   */
  static async getActiveBanks(): Promise<BankData[]> {
    try {
      console.log('🏦 DirectBankService: Fetching active banks from database...')
      
      const banks = await DirectSupabaseClient.getActiveBanks()
      
      if (banks && banks.length > 0) {
        console.log(`✅ DirectBankService: Found ${banks.length} active banks in database`)
        return banks
      } else {
        console.log('⚠️ DirectBankService: No active banks found in database, using static fallback')
        return STATIC_BANKS.filter(bank => bank.isActive)
      }
      
    } catch (error: any) {
      console.error('❌ DirectBankService: Database error, using static fallback:', error.message)
      return STATIC_BANKS.filter(bank => bank.isActive)
    }
  }

  /**
   * Get specific bank by ID
   */
  static async getBankById(id: string): Promise<BankData | null> {
    try {
      const allBanks = await this.getAllBanks()
      return allBanks.find(bank => bank.id === id) || null
    } catch (error: any) {
      console.error('❌ DirectBankService: Error getting bank by ID:', error.message)
      return STATIC_BANKS.find(bank => bank.id === id) || null
    }
  }

  /**
   * Get specific bank by code
   */
  static async getBankByCode(code: string): Promise<BankData | null> {
    try {
      const allBanks = await this.getAllBanks()
      return allBanks.find(bank => bank.code === code) || null
    } catch (error: any) {
      console.error('❌ DirectBankService: Error getting bank by code:', error.message)
      return STATIC_BANKS.find(bank => bank.code === code) || null
    }
  }

  /**
   * Test database connectivity
   */
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const banks = await DirectSupabaseClient.getAllBanks()
      return {
        success: true,
        message: `Database connected successfully. Found ${banks.length} banks.`
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Database connection failed: ${error.message}`
      }
    }
  }
}

export default DirectBankService
export { DirectBankService }
export type { BankData }
