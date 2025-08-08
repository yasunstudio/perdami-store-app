import SupabasePrismaClient from './supabase-prisma-client'
import { STATIC_BANKS, STATIC_APP_SETTINGS } from './static-bank-data'

export class SingleBankService {
  /**
   * Check if single bank mode is enabled
   */
  static async isSingleBankModeEnabled(): Promise<boolean> {
    try {
      const result = await SupabasePrismaClient.executeModelOperation(async (prisma) => {
        return await prisma.appSettings.findFirst({
          where: { isActive: true }
        })
      })
      
      return result?.singleBankMode ?? STATIC_APP_SETTINGS.singleBankMode
    } catch (error: any) {
      console.warn('AppSettings not found, using static settings:', error?.message || error)
      return STATIC_APP_SETTINGS.singleBankMode // Default from static data
    }
  }

  /**
   * Get the default bank for single bank mode
   */
  static async getDefaultBank() {
    try {
      const result = await SupabasePrismaClient.executeModelOperation(async (prisma) => {
        const appSettings = await prisma.appSettings.findFirst({
          where: { 
            isActive: true,
            defaultBankId: { not: null }
          }
        })

        if (!appSettings?.defaultBankId) return null

        return await prisma.bank.findUnique({
          where: { 
            id: appSettings.defaultBankId,
            isActive: true 
          }
        })
      })
      
      return result
    } catch (error: any) {
      console.warn('Default bank lookup failed:', error?.message || error)
      return null
    }
  }

  /**
   * Get available banks based on single bank mode setting
   */
  static async getAvailableBanks() {
    try {
      const isSingleBankMode = await this.isSingleBankModeEnabled()
      
      if (isSingleBankMode) {
        const defaultBank = await this.getDefaultBank()
        return defaultBank ? [defaultBank] : []
      } else {
        // Regular mode - return all active banks
        try {
          const banks = await SupabasePrismaClient.executeModelOperation(async (prisma) => {
            return await prisma.bank.findMany({
              where: { isActive: true },
              orderBy: { name: 'asc' }
            })
          })
          return banks
        } catch (bankError: any) {
          console.warn('Bank table not found, using static banks:', bankError?.message || bankError)
          return STATIC_BANKS.filter(bank => bank.isActive)
        }
      }
    } catch (error) {
      console.error('Error getting available banks:', error)
      // Return static banks as fallback
      const activeBanks = STATIC_BANKS.filter(bank => bank.isActive)
      console.log('Using static bank data as fallback:', activeBanks.length, 'banks')
      return activeBanks
    }
  }

  /**
   * Toggle single bank mode
   */
  static async toggleSingleBankMode(enabled: boolean, defaultBankId?: string) {
    const prisma = createPrismaClient()
    try {
      const appSettings = await prisma.appSettings.findFirst({
        where: { isActive: true }
      })

      if (!appSettings) {
        throw new Error('App settings not found')
      }

      // If enabling single bank mode, ensure we have a default bank
      if (enabled && !defaultBankId && !appSettings.defaultBankId) {
        const firstBank = await prisma.bank.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: 'asc' }
        })
        
        if (!firstBank) {
          throw new Error('No active banks found. Cannot enable single bank mode.')
        }
        
        defaultBankId = firstBank.id
      }

      return await prisma.appSettings.update({
        where: { id: appSettings.id },
        data: {
          singleBankMode: enabled,
          ...(defaultBankId && { defaultBankId })
        },
        include: {
          defaultBank: true
        }
      })
    } catch (error) {
      console.error('Error toggling single bank mode:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }

  /**
   * Set default bank for single bank mode
   */
  static async setDefaultBank(bankId: string) {
    const prisma = createPrismaClient()
    try {
      // Verify bank exists and is active
      const bank = await prisma.bank.findFirst({
        where: { 
          id: bankId,
          isActive: true 
        }
      })

      if (!bank) {
        throw new Error('Bank not found or inactive')
      }

      const appSettings = await prisma.appSettings.findFirst({
        where: { isActive: true }
      })

      if (!appSettings) {
        throw new Error('App settings not found')
      }

      return await prisma.appSettings.update({
        where: { id: appSettings.id },
        data: {
          defaultBankId: bankId
        },
        include: {
          defaultBank: true
        }
      })
    } catch (error) {
      console.error('Error setting default bank:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }

  /**
   * Get single bank mode configuration
   */
  static async getConfiguration() {
    const prisma = createPrismaClient()
    try {
      const appSettings = await prisma.appSettings.findFirst({
        where: { isActive: true },
        include: {
          defaultBank: true
        }
      })

      if (!appSettings) {
        return null
      }

      return {
        singleBankMode: appSettings.singleBankMode,
        defaultBank: appSettings.defaultBank,
        allBanks: await prisma.bank.findMany({
          where: { isActive: true },
          orderBy: { name: 'asc' }
        })
      }
    } catch (error) {
      console.error('Error getting single bank configuration:', error)
      return null
    } finally {
      await prisma.$disconnect()
    }
  }
}
