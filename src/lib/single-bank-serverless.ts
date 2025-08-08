import { createPrismaClient } from './prisma-serverless'

export class SingleBankService {
  /**
   * Check if single bank mode is enabled
   */
  static async isSingleBankModeEnabled(): Promise<boolean> {
    const prisma = createPrismaClient()
    try {
      const appSettings = await prisma.appSettings.findFirst({
        where: { isActive: true }
      })
      return appSettings?.singleBankMode ?? false
    } catch (error) {
      console.error('Error checking single bank mode:', error)
      return false
    } finally {
      await prisma.$disconnect()
    }
  }

  /**
   * Get the default bank for single bank mode
   */
  static async getDefaultBank() {
    const prisma = createPrismaClient()
    try {
      const appSettings = await prisma.appSettings.findFirst({
        where: { 
          isActive: true,
          singleBankMode: true 
        },
        include: {
          defaultBank: true
        }
      })

      return appSettings?.defaultBank || null
    } catch (error) {
      console.error('Error getting default bank:', error)
      return null
    } finally {
      await prisma.$disconnect()
    }
  }

  /**
   * Get available banks based on single bank mode setting
   */
  static async getAvailableBanks() {
    const prisma = createPrismaClient()
    try {
      const isSingleBankMode = await this.isSingleBankModeEnabled()
      
      if (isSingleBankMode) {
        const defaultBank = await this.getDefaultBank()
        return defaultBank ? [defaultBank] : []
      } else {
        // Regular mode - return all active banks
        return await prisma.bank.findMany({
          where: { isActive: true },
          orderBy: { name: 'asc' }
        })
      }
    } catch (error) {
      console.error('Error getting available banks:', error)
      return []
    } finally {
      await prisma.$disconnect()
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
