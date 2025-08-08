const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function ensureAdminUser() {
  try {
    console.log('🔧 Ensuring admin user exists with correct password...')
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    // Upsert admin user
    const admin = await prisma.user.upsert({
      where: { email: 'admin@perdami.com' },
      update: { 
        password: hashedPassword,
        name: 'Admin Perdami',
        role: 'ADMIN',
        phone: '081234567890',
        emailVerified: new Date(),
      },
      create: {
        id: 'admin-perdami-user',
        email: 'admin@perdami.com',
        name: 'Admin Perdami', 
        role: 'ADMIN',
        phone: '081234567890',
        password: hashedPassword,
        emailVerified: new Date(),
      }
    })
    
    console.log('✅ Admin user ensured:')
    console.log(`  ID: ${admin.id}`)
    console.log(`  Email: ${admin.email}`)
    console.log(`  Name: ${admin.name}`)
    console.log(`  Role: ${admin.role}`)
    console.log(`  Email Verified: ${admin.emailVerified ? 'YES' : 'NO'}`)
    
    // Test password
    const isValidPassword = await bcrypt.compare('admin123', admin.password)
    console.log(`\n🔐 Password verification: ${isValidPassword ? '✅ VALID' : '❌ INVALID'}`)
    
    console.log('\n💡 Anda sekarang dapat login dengan:')
    console.log('   Email: admin@perdami.com') 
    console.log('   Password: admin123')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

ensureAdminUser()
