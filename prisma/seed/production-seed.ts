import { PrismaClient } from '@prisma/client'
import { clearDatabase, createHashedPassword, generateRandomDate, logProgress } from './helpers/seed-helpers'
import { storesData } from './data/stores.data'
import { bundlesData } from './data/bundles.data'
import { usersData } from './data/users.data'
import { ordersData } from './data/orders.data'
import { appSettingsData } from './data/app-settings.data'
import { contactInfoData } from './data/contact-info.data'
import { banksData } from './data/banks.data'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting production seed for PERDAMI Store...')
  console.log('='.repeat(60))

  logProgress('Database already reset and ready for seeding...')

  // 1. Create Banks first
  logProgress('Creating bank accounts...')
  const bankPromises = banksData.map(bank => 
    prisma.bank.create({ data: bank })
  )
  const banks = await Promise.all(bankPromises)
  console.log(`✅ ${banks.length} bank accounts created`)

  // 2. Create App Settings with default bank
  logProgress('Creating app settings...')
  const appSettings = await prisma.appSettings.create({
    data: {
      ...appSettingsData,
      defaultBankId: banks[0].id // Set first bank as default
    }
  })
  console.log(`✅ App settings created`)

  // 3. Create Contact Info
  logProgress('Creating contact information...')
  const contactInfoPromises = contactInfoData.map(contact => 
    prisma.contactInfo.create({ data: contact })
  )
  await Promise.all(contactInfoPromises)
  console.log(`✅ ${contactInfoData.length} contact info entries created`)

  // 4. Create Stores
  logProgress('Creating stores...')
  const storePromises = storesData.map(store => 
    prisma.store.create({ data: store })
  )
  const stores = await Promise.all(storePromises)
  console.log(`✅ ${stores.length} stores created`)

  // 5. Create Users
  logProgress('Creating users...')
  const userPromises = usersData.map(async user => {
    const hashedPassword = await createHashedPassword(user.password)
    return prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role as any,
        emailVerified: user.isEmailVerified ? new Date() : null,
        phone: user.profile.phone
      }
    })
  })
  const users = await Promise.all(userPromises)
  console.log(`✅ ${users.length} users created`)

  // 6. Create Product Bundles
  logProgress('Creating product bundles...')
  let allBundles: any[] = []
  
  for (const storeBundle of bundlesData) {
    const store = stores[storeBundle.storeIndex]
    
    for (const bundleData of storeBundle.bundles) {
      const bundle = await prisma.productBundle.create({
        data: {
          name: bundleData.name,
          description: bundleData.description,
          price: bundleData.price,
          image: bundleData.image,
          contents: bundleData.contents,
          isActive: bundleData.isActive,
          isFeatured: bundleData.isFeatured,
          showToCustomer: bundleData.showToCustomer,
          storeId: store.id
        }
      })
      allBundles.push(bundle)
    }
  }
  console.log(`✅ ${allBundles.length} product bundles created`)

  // 7. Create Sample Orders
  logProgress('Creating sample orders...')
  for (const orderData of ordersData) {
    const user = users[orderData.userIndex]
    const orderDate = generateRandomDate(orderData.daysAgo)
    
    // Calculate total
    let totalAmount = 0
    const orderItems = []
    
    for (const bundleOrder of orderData.bundles) {
      const bundle = allBundles[bundleOrder.bundleIndex]
      const itemTotal = bundle.price * bundleOrder.quantity
      totalAmount += itemTotal
      
      orderItems.push({
        bundleId: bundle.id,
        quantity: bundleOrder.quantity,
        unitPrice: bundle.price,
        totalPrice: itemTotal
      })
    }
    
    totalAmount += orderData.serviceFee

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        subtotalAmount: totalAmount - orderData.serviceFee,
        serviceFee: orderData.serviceFee,
        totalAmount: totalAmount,
        orderStatus: orderData.status as any,
        paymentStatus: orderData.paymentStatus as any,
        pickupDate: orderData.pickupDate,
        notes: orderData.customerNotes,
        createdAt: orderDate,
        updatedAt: orderDate,
        orderItems: {
          create: orderItems
        }
      }
    })

    // Create payment record if paid
    if (orderData.paymentStatus === 'PAID') {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          method: orderData.paymentMethod as any,
          status: 'PAID',
          createdAt: orderDate,
          updatedAt: orderDate
        }
      })
    }
  }
  console.log(`✅ ${ordersData.length} sample orders created`)

  // 8. Create User Activity Logs
  logProgress('Creating user activity logs...')
  for (const user of users) {
    await prisma.userActivityLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        resource: 'USER',
        resourceId: user.id,
        details: `User ${user.name} registered successfully`,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Production Seed Script)',
        createdAt: generateRandomDate(30)
      }
    })

    if (user.role === 'CUSTOMER') {
      await prisma.userActivityLog.create({
        data: {
          userId: user.id,
          action: 'USER_LOGIN',
          resource: 'AUTH',
          details: `User ${user.name} logged in`,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0 (Production Seed Script)',
          createdAt: generateRandomDate(15)
        }
      })
    }
  }
  console.log(`✅ User activity logs created`)

  console.log('='.repeat(60))
  console.log('🎉 Production seed completed successfully!')
  console.log('')
  console.log('📊 Summary:')
  console.log(`   • ${stores.length} stores`)
  console.log(`   • ${allBundles.length} product bundles`)
  console.log(`   • ${users.length} users (1 admin, ${users.length - 1} customers)`)
  console.log(`   • ${ordersData.length} sample orders`)
  console.log(`   • ${banks.length} bank accounts`)
  console.log(`   • ${contactInfoData.length} contact info entries`)
  console.log('')
  console.log('🚀 Database is now production-ready for Vercel deployment!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
