const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function testAuth() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing complete auth flow...');
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@perdami.com' }
    });
    
    if (!user) {
      console.log('❌ No user found');
      return;
    }
    
    console.log('👤 User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      hasPassword: !!user.password
    });
    
    if (!user.password) {
      console.log('❌ No password found');
      return;
    }
    
    // Test password comparison
    const testPassword = 'perdami123';
    console.log('🔑 Testing password:', testPassword);
    
    const isValid = await bcrypt.compare(testPassword, user.password);
    console.log('✅ Password valid:', isValid);
    
    // Test what authorize function should return
    if (isValid) {
      const authResult = {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        phone: user.phone,
      };
      console.log('🎯 Authorize should return:', authResult);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();
