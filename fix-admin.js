#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

async function ensureAdminUser() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔧 Ensuring admin user exists with correct credentials...')
    
    const email = 'admin@perdami.com'
    const password = 'perdami123'
    const name = 'Admin Perdami'
    
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user) {
      console.log('📝 Creating admin user...')
      const hashedPassword = await bcrypt.hash(password, 12)
      
      user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'ADMIN',
          emailVerified: new Date()
        }
      })
      console.log('✅ Admin user created')
    } else {
      console.log('👤 Admin user found, updating password...')
      const hashedPassword = await bcrypt.hash(password, 12)
      
      user = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
          name: name
        }
      })
      console.log('✅ Admin user updated')
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    console.log('🔍 Password verification:', isPasswordValid ? '✅ VALID' : '❌ INVALID')
    
    console.log('📋 Admin credentials:')
    console.log('   Email:', email)
    console.log('   Password:', password)
    console.log('   Role:', user.role)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

ensureAdminUser()
