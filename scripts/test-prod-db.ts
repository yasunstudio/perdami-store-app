#!/usr/bin/env tsx

async function testProductionDatabase() {
  try {
    console.log('🔍 Testing production database...')
    
    const response = await fetch('https://dharma-wanita-perdami.vercel.app/api/banks', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const banks = await response.json()
      console.log('✅ Database connection successful!')
      console.log('🏦 Banks found:', banks.length)
      
      if (banks.length > 0) {
        console.log('📋 Bank list:')
        banks.forEach((bank: any) => {
          console.log(`  - ${bank.name} (${bank.code}) - ${bank.isActive ? 'Active' : 'Inactive'}`)
        })
      }
      
      // Test admin user
      const authResponse = await fetch('https://dharma-wanita-perdami.vercel.app/api/users', {
        method: 'GET'
      })
      
      if (authResponse.ok) {
        const users = await authResponse.json()
        const adminUser = users.find((user: any) => user.role === 'ADMIN')
        
        if (adminUser) {
          console.log('👤 Admin user found:', adminUser.email)
          console.log('🎉 Database setup verification completed successfully!')
          console.log('')
          console.log('📧 Admin login: admin@perdami.com')
          console.log('🔑 Admin password: admin123')
          console.log('🌐 Access admin at: https://dharma-wanita-perdami.vercel.app/admin')
        } else {
          console.log('❌ Admin user not found')
        }
      }
      
    } else {
      console.log('❌ Database connection failed:', await response.text())
    }
    
  } catch (error) {
    console.error('❌ Error testing database:', error)
  }
}

testProductionDatabase()
