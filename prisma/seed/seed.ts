import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedBanks() {
  console.log('🏦 Seeding banks...')

  const banks = [
    {
      name: 'Bank Central Asia (BCA)',
      code: 'BCA',
      accountNumber: '1234567890',
      accountName: 'Perdami Store',
      logo: '/images/banks/bca-logo.png',
    },
    {
      name: 'Bank Mandiri',
      code: 'MANDIRI',
      accountNumber: '9876543210',
      accountName: 'Perdami Store',
      logo: '/images/banks/mandiri-logo.png',
    },
    {
      name: 'Bank Negara Indonesia (BNI)',
      code: 'BNI',
      accountNumber: '1122334455',
      accountName: 'Perdami Store',
      logo: '/images/banks/bni-logo.png',
    },
    {
      name: 'Bank Rakyat Indonesia (BRI)',
      code: 'BRI',
      accountNumber: '5566778899',
      accountName: 'Perdami Store',
      logo: '/images/banks/bri-logo.png',
    },
  ]

  for (const bankData of banks) {
    await prisma.bank.upsert({
      where: { code: bankData.code },
      update: {},
      create: bankData,
    })
  }

  console.log('✅ Banks seeded successfully')
}

async function seedUsers() {
  console.log('👤 Seeding users...')

  const hashedPassword = await bcrypt.hash('admin123', 10)

  // Create admin user
  await prisma.user.upsert({
    where: { email: 'admin@perdami.com' },
    update: {},
    create: {
      email: 'admin@perdami.com',
      name: 'Admin Perdami',
      phone: '+6281234567890',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  })

  // Create sample customer
  const customerPassword = await bcrypt.hash('customer123', 10)
  await prisma.user.upsert({
    where: { email: 'customer@perdami.com' },
    update: {},
    create: {
      email: 'customer@perdami.com',
      name: 'Customer Test',
      phone: '+6281234567891',
      password: customerPassword,
      role: 'CUSTOMER',
      emailVerified: new Date(),
    },
  })

  console.log('✅ Users seeded successfully')
}

async function seedStoresAndCategories() {
  console.log('🏪 Seeding stores and categories...')

  // Create stores
  const store1 = await prisma.store.upsert({
    where: { name: 'Toko Oleh-oleh Bandung' },
    update: {},
    create: {
      name: 'Toko Oleh-oleh Bandung',
      description: 'Toko oleh-oleh khas Bandung terlengkap',
      image: '/images/stores/toko-bandung.jpg',
      isActive: true,
    },
  })

  const store2 = await prisma.store.upsert({
    where: { name: 'Warung Khas Sunda' },
    update: {},
    create: {
      name: 'Warung Khas Sunda',
      description: 'Makanan dan jajanan khas Sunda',
      image: '/images/stores/warung-sunda.jpg',
      isActive: true,
    },
  })

  console.log('✅ Stores seeded successfully')
  return { store1, store2 }
}

async function seedBundles(stores: any) {
  console.log('📦 Seeding bundles...')

  const bundles = [
    {
      name: 'Paket Keripik Bandung Special',
      description: 'Paket keripik khas Bandung dengan berbagai rasa',
      image: '/images/bundles/keripik-special.jpg',
      price: 75000,
      contents: [
        { item: 'Keripik Singkong Original', quantity: 2 },
        { item: 'Keripik Singkong Balado', quantity: 2 },
        { item: 'Keripik Pisang Madu', quantity: 3 },
        { item: 'Keripik Tempe', quantity: 2 }
      ],
      isActive: true,
      isFeatured: true,
      showToCustomer: true,
      storeId: stores.store1.id,
    },
    {
      name: 'Bundle Dodol & Wajit',
      description: 'Kombinasi manis dodol dan wajit khas Bandung',
      image: '/images/bundles/dodol-wajit.jpg',
      price: 55000,
      contents: [
        { item: 'Dodol Garut Original', quantity: 3 },
        { item: 'Dodol Garut Durian', quantity: 2 },
        { item: 'Wajit Cililin', quantity: 4 }
      ],
      isActive: true,
      isFeatured: true,
      showToCustomer: true,
      storeId: stores.store1.id,
    },
    {
      name: 'Paket Batagor & Siomay',
      description: 'Paket makanan khas Bandung siap saji',
      image: '/images/bundles/batagor-siomay.jpg',
      price: 65000,
      contents: [
        { item: 'Batagor Kingsley (10 pcs)', quantity: 1 },
        { item: 'Siomay Bandung (8 pcs)', quantity: 1 },
        { item: 'Sambal Kacang', quantity: 2 }
      ],
      isActive: true,
      isFeatured: false,
      showToCustomer: true,
      storeId: stores.store2.id,
    },
    {
      name: 'Bundle Surabi Lengkap',
      description: 'Paket surabi dengan berbagai topping',
      image: '/images/bundles/surabi-lengkap.jpg',
      price: 45000,
      contents: [
        { item: 'Surabi Oncom', quantity: 4 },
        { item: 'Surabi Keju', quantity: 3 },
        { item: 'Surabi Coklat', quantity: 3 }
      ],
      isActive: true,
      isFeatured: true,
      showToCustomer: true,
      storeId: stores.store2.id,
    },
    {
      name: 'Paket Oleh-oleh Komplit',
      description: 'Paket lengkap oleh-oleh khas Bandung',
      image: '/images/bundles/oleh-oleh-komplit.jpg',
      price: 125000,
      contents: [
        { item: 'Brownies Kukus', quantity: 2 },
        { item: 'Bolu Susu', quantity: 2 },
        { item: 'Keripik Singkong Mix', quantity: 3 },
        { item: 'Dodol Garut', quantity: 2 },
        { item: 'Wajit Cililin', quantity: 3 }
      ],
      isActive: true,
      isFeatured: true,
      showToCustomer: true,
      storeId: stores.store1.id,
    },
  ]

  for (const bundleData of bundles) {
    await prisma.productBundle.upsert({
      where: { name_storeId: { name: bundleData.name, storeId: bundleData.storeId } },
      update: {},
      create: bundleData,
    })
  }

  console.log('✅ Bundles seeded successfully')
}

async function seedAppSettings() {
  console.log('⚙️ Seeding app settings...')

  await prisma.appSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      appName: 'Perdami Store',
      appDescription: 'Platform pre-order oleh-oleh khas Bandung untuk peserta PIT PERDAMI 2025. Nikmati kemudahan berbelanja online dan ambil langsung di venue event.',
      appLogo: '/images/logo.png',
      businessAddress: 'Venue PIT PERDAMI 2025, Bandung, Jawa Barat',
      pickupLocation: 'Venue PIT PERDAMI 2025',
      pickupCity: 'Bandung, Jawa Barat',
      eventName: 'PIT PERDAMI 2025',
      eventYear: '2025',
      copyrightText: '© 2025 Perdami Store. Dibuat khusus untuk PIT PERDAMI 2025.',
      copyrightSubtext: 'Semua hak cipta dilindungi.',
      isMaintenanceMode: false,
      isActive: true,
    },
  })

  console.log('✅ App settings seeded successfully')
}

async function seedContactInfo() {
  console.log('📞 Seeding contact info...')

  const contacts = [
    {
      id: 'whatsapp',
      type: 'WHATSAPP' as any, // Using type casting to satisfy Prisma's enum requirement
      title: 'WhatsApp',
      value: '+6281234567890',
      icon: 'MessageCircle',
      color: 'green',
      updatedAt: new Date(),
    },
    {
      id: 'email',
      type: 'EMAIL' as any, // Using type casting to satisfy Prisma's enum requirement
      title: 'Email',
      value: 'contact@perdami.store',
      icon: 'Mail',
      color: 'blue',
      updatedAt: new Date(),
    },
    {
      id: 'phone',
      type: 'PHONE' as any, // Using type casting to satisfy Prisma's enum requirement
      title: 'Telepon',
      value: '+6281234567890',
      icon: 'Phone',
      color: 'red',
      updatedAt: new Date(),
    },
  ]

  for (const contact of contacts) {
    await prisma.contactInfo.upsert({
      where: { id: contact.id },
      update: {},
      create: contact,
    })
  }

  console.log('✅ Contact info seeded successfully')
}

async function seedQuickActions() {
  console.log('⚡ Seeding quick actions...')

  const actions = [
    {
      id: 'browse-bundles',
      title: 'Lihat Paket',
      description: 'Jelajahi paket bundle kami',
      icon: 'Package',
      action: '/bundles',
      color: 'blue',
      updatedAt: new Date(), // Add required updatedAt field
    },
    {
      id: 'my-orders',
      title: 'Pesanan Saya',
      description: 'Lihat status pesanan Anda',
      icon: 'ShoppingBag',
      action: '/orders',
      color: 'green',
      updatedAt: new Date(), // Add required updatedAt field
    },
    {
      id: 'help-center',
      title: 'Bantuan',
      description: 'Dapatkan bantuan dan informasi',
      icon: 'HelpCircle',
      action: '/help',
      color: 'orange',
      updatedAt: new Date(), // Add required updatedAt field
    },
  ]

  for (const action of actions) {
    await prisma.quickAction.upsert({
      where: { id: action.id },
      update: {},
      create: action,
    })
  }

  console.log('✅ Quick actions seeded successfully')
}

async function main() {
  console.log('🌱 Starting seed process...')

  try {
    await seedBanks()
    await seedUsers()
    const stores = await seedStoresAndCategories()
    await seedBundles(stores)
    await seedAppSettings()
    await seedContactInfo()
    await seedQuickActions()

    console.log('🎉 Database seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
