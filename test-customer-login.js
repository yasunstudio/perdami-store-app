const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function testCustomerLogin() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing login untuk customer@example.com...');
    
    const user = await prisma.user.findUnique({
      where: { email: 'customer@example.com' }
    });
    
    if (!user) {
      console.log('❌ User tidak ditemukan');
      return;
    }
    
    console.log('✅ User ditemukan:', user.email);
    console.log('📋 User details:');
    console.log('- Role:', user.role);
    console.log('- Email Verified:', user.emailVerified);
    console.log('- Has Password:', !!user.password);
    
    // Test password comparison
    const testPasswords = ['Customer123', 'customer123', 'password', 'admin123'];
    
    console.log('\n🔑 Testing passwords...');
    for (const password of testPasswords) {
      try {
        const isValid = await bcrypt.compare(password, user.password);
        console.log(`- "${password}": ${isValid ? '✅ VALID' : '❌ Invalid'}`);
      } catch (error) {
        console.log(`- "${password}": ❌ Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCustomerLogin();
