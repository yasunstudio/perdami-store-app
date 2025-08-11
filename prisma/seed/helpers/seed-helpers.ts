import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

export async function createHashedPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10)
}

export function generateRandomDate(daysAgo: number = 30): Date {
  const now = new Date()
  const randomDays = Math.floor(Math.random() * daysAgo)
  return new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000)
}

export function generateRandomPrice(min: number = 50000, max: number = 500000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export async function clearDatabase(prisma: PrismaClient) {
  console.log('🗑️  Clearing existing data...')
  
  // Delete in correct order to respect foreign key constraints
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.productBundle.deleteMany()
  await prisma.store.deleteMany()
  await prisma.userActivityLog.deleteMany()
  await prisma.inAppNotification.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.verificationToken.deleteMany()
  await prisma.userNotificationSettings.deleteMany()
  await prisma.user.deleteMany()
  await prisma.contactInfo.deleteMany()
  await prisma.bank.deleteMany()
  await prisma.appSettings.deleteMany()
  await prisma.quickAction.deleteMany()
  
  console.log('✅ Database cleared')
}

export function logProgress(message: string) {
  console.log(`🌱 ${message}`)
}
