import { PrismaClient, UserRole, OrderStatus, PaymentStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed for Prisma Postgres...')

  try {
    // Clear existing data
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.productBundle.deleteMany()
    await prisma.store.deleteMany()
    await prisma.user.deleteMany()

    console.log('🧹 Cleared existing data')

    // Seed Users
    const users = [
      {
        id: 'cm0a1b2c3d4e5f6g7h8i9j0k',
        name: 'Admin Perdami',
        email: 'admin@perdami.com',
        phone: '081234567890',
        role: UserRole.ADMIN,
        emailVerified: new Date('2025-08-08T07:16:12.848Z'),
        createdAt: new Date('2025-08-07T09:34:04.869Z'),
        updatedAt: new Date('2025-08-08T07:16:14.148Z')
      },
      {
        id: 'user-customer-1',
        name: 'Dr. Siti Nurhaliza',
        email: 'customer1@example.com',
        phone: '081234567891',
        role: UserRole.CUSTOMER,
        image: '/images/avatars/customer1.png',
        emailVerified: new Date('2025-08-08T11:51:19.307Z'),
        createdAt: new Date('2025-08-08T04:51:19.404Z'),
        updatedAt: new Date('2025-08-08T05:01:22.729Z')
      },
      {
        id: 'user-customer-2',
        name: 'Dr. Budi Santoso',
        email: 'customer2@example.com',
        phone: '081234567892',
        role: UserRole.CUSTOMER,
        image: '/images/avatars/customer2.png',
        emailVerified: new Date('2025-08-08T11:51:19.307Z'),
        createdAt: new Date('2025-08-08T04:51:19.434Z'),
        updatedAt: new Date('2025-08-08T05:01:22.756Z')
      },
      {
        id: 'user-customer-3',
        name: 'Dr. Rina Kartika',
        email: 'customer3@example.com',
        phone: '081234567893',
        role: UserRole.CUSTOMER,
        createdAt: new Date('2025-08-08T04:51:19.463Z'),
        updatedAt: new Date('2025-08-08T05:01:22.783Z')
      },
      {
        id: 'cme1i6qwt0000jl04jfogt2rg',
        name: 'Customer',
        email: 'customer@example.com',
        phone: '081234567890',
        role: UserRole.CUSTOMER,
        createdAt: new Date('2025-08-07T14:39:36.894Z'),
        updatedAt: new Date('2025-08-07T14:39:36.894Z')
      }
    ]

    for (const user of users) {
      await prisma.user.create({ data: user })
    }

    console.log('👥 Created users:', users.length)

    // Seed Stores
    const stores = [
      {
        id: 'store-main-venue',
        name: 'Toko Utama - Venue PIT PERDAMI',
        description: 'Toko utama di venue PIT PERDAMI 2025',
        isActive: true,
        createdAt: new Date('2025-08-08T04:54:09.101Z'),
        updatedAt: new Date('2025-08-08T04:54:09.101Z')
      },
      {
        id: 'store-food-court',
        name: 'Food Court Perdami',
        description: 'Area makanan dan minuman',
        isActive: true,
        createdAt: new Date('2025-08-08T04:54:09.122Z'),
        updatedAt: new Date('2025-08-08T04:54:09.122Z')
      },
      {
        id: 'store-souvenir',
        name: 'Souvenir Corner',
        description: 'Toko souvenir dan merchandise',
        isActive: true,
        createdAt: new Date('2025-08-08T04:54:09.143Z'),
        updatedAt: new Date('2025-08-08T04:54:09.143Z')
      },
      {
        id: 'cm0a1b2c3d4e5f6g7h8i9j6k',
        name: 'Toko Perdami Jakarta',
        description: 'Toko cabang Jakarta',
        isActive: true,
        createdAt: new Date('2025-08-07T09:34:05.007Z'),
        updatedAt: new Date('2025-08-07T09:34:05.007Z')
      }
    ]

    for (const store of stores) {
      await prisma.store.create({ data: store })
    }

    console.log('🏪 Created stores:', stores.length)

    // Seed Product Bundles
    const bundles = [
      {
        id: 'bundle-makanan-khas',
        name: 'Paket Makanan Khas Bandung',
        description: 'Paket lengkap makanan khas Bandung pilihan terbaik untuk oleh-oleh.',
        price: 150000,
        image: '/images/bundles/makanan-khas.jpg',
        isActive: true,
        isFeatured: true,
        showToCustomer: true,
        storeId: 'store-main-venue',
        createdAt: new Date('2025-08-08T04:54:09.257Z'),
        updatedAt: new Date('2025-08-08T04:54:09.257Z')
      },
      {
        id: 'bundle-minuman-segar',
        name: 'Paket Minuman Segar',
        description: 'Koleksi minuman segar khas Bandung untuk menyegarkan hari Anda.',
        price: 85000,
        image: '/images/bundles/minuman-segar.jpg',
        isActive: true,
        isFeatured: true,
        showToCustomer: true,
        storeId: 'store-food-court',
        createdAt: new Date('2025-08-08T04:54:09.340Z'),
        updatedAt: new Date('2025-08-08T04:54:09.340Z')
      },
      {
        id: 'bundle-souvenir-perdami',
        name: 'Paket Souvenir PIT PERDAMI 2025',
        description: 'Merchandise eksklusif dan souvenir PIT PERDAMI 2025.',
        price: 200000,
        image: '/images/bundles/souvenir-perdami.jpg',
        isActive: true,
        isFeatured: true,
        showToCustomer: true,
        storeId: 'store-souvenir',
        createdAt: new Date('2025-08-08T04:54:09.426Z'),
        updatedAt: new Date('2025-08-08T04:54:09.426Z')
      },
      {
        id: 'bundle-premium-combo',
        name: 'Paket Premium Kombo',
        description: 'Paket premium yang menggabungkan makanan, minuman, dan souvenir.',
        price: 350000,
        image: '/images/bundles/premium-combo.jpg',
        isActive: true,
        isFeatured: true,
        showToCustomer: true,
        storeId: 'store-main-venue',
        createdAt: new Date('2025-08-08T04:54:09.509Z'),
        updatedAt: new Date('2025-08-08T04:54:09.509Z')
      },
      {
        id: 'bundle-hemat-keluarga',
        name: 'Paket Hemat Keluarga',
        description: 'Paket ekonomis untuk keluarga dengan porsi yang cukup untuk semua.',
        price: 120000,
        image: '/images/bundles/hemat-keluarga.jpg',
        isActive: true,
        isFeatured: false,
        showToCustomer: true,
        storeId: 'store-food-court',
        createdAt: new Date('2025-08-08T04:54:09.596Z'),
        updatedAt: new Date('2025-08-08T04:54:09.596Z')
      },
      {
        id: 'bundle-exclusive-vip',
        name: 'Paket Exclusive VIP',
        description: 'Paket eksklusif untuk tamu VIP dengan produk premium pilihan.',
        price: 500000,
        image: '/images/bundles/exclusive-vip.jpg',
        isActive: true,
        isFeatured: true,
        showToCustomer: false,
        storeId: 'store-souvenir',
        createdAt: new Date('2025-08-08T04:54:09.684Z'),
        updatedAt: new Date('2025-08-08T04:54:09.684Z')
      },
      {
        id: 'cm0a1b2c3d4e5f6g7h8i9j8k',
        name: 'Paket Perdami Basic',
        description: 'Paket dasar untuk anggota Dharma Wanita',
        price: 150000,
        isActive: true,
        isFeatured: true,
        showToCustomer: true,
        storeId: 'cm0a1b2c3d4e5f6g7h8i9j6k',
        createdAt: new Date('2025-08-07T09:34:05.007Z'),
        updatedAt: new Date('2025-08-07T09:34:05.007Z')
      },
      {
        id: 'cm0a1b2c3d4e5f6g7h8i9j9k',
        name: 'Paket Perdami Premium',
        description: 'Paket lengkap untuk pengurus',
        price: 250000,
        isActive: true,
        isFeatured: true,
        showToCustomer: true,
        storeId: 'cm0a1b2c3d4e5f6g7h8i9j6k',
        createdAt: new Date('2025-08-07T09:34:05.007Z'),
        updatedAt: new Date('2025-08-07T09:34:05.007Z')
      }
    ]

    for (const bundle of bundles) {
      await prisma.productBundle.create({ data: bundle })
    }

    console.log('📦 Created bundles:', bundles.length)

    // Seed Orders
    const orders = [
      {
        id: 'order-001',
        orderNumber: 'ORD-2025-001',
        userId: 'user-customer-1',
        subtotalAmount: 240000,
        totalAmount: 260000,
        orderStatus: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        createdAt: new Date('2025-08-08T04:58:23.976Z'),
        updatedAt: new Date('2025-08-08T04:58:23.976Z')
      },
      {
        id: 'order-002',
        orderNumber: 'ORD-2025-002',
        userId: 'user-customer-2',
        subtotalAmount: 160000,
        totalAmount: 175000,
        orderStatus: OrderStatus.PROCESSING,
        paymentStatus: PaymentStatus.PAID,
        createdAt: new Date('2025-08-08T04:58:24.089Z'),
        updatedAt: new Date('2025-08-08T04:58:24.089Z')
      },
      {
        id: 'order-003',
        orderNumber: 'ORD-2025-003',
        userId: 'user-customer-3',
        subtotalAmount: 100000,
        totalAmount: 110000,
        orderStatus: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        createdAt: new Date('2025-08-08T04:58:24.202Z'),
        updatedAt: new Date('2025-08-08T04:58:24.202Z')
      }
    ]

    for (const order of orders) {
      await prisma.order.create({ data: order })
    }

    console.log('🛒 Created orders:', orders.length)

    console.log('✅ Seed completed successfully!')

  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
