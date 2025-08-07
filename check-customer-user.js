const { PrismaClient } = require('@prisma/client');

async function checkCustomerUser() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Mencari user customer@example.com...');
    
    const user = await prisma.user.findUnique({
      where: { email: 'customer@example.com' }
    });
    
    if (user) {
      console.log('✅ User ditemukan:');
      console.log('- ID:', user.id);
      console.log('- Email:', user.email);
      console.log('- Name:', user.name);
      console.log('- Role:', user.role);
      console.log('- Email Verified:', user.emailVerified);
      console.log('- Created:', user.createdAt);
      console.log('- Password Hash Length:', user.password ? user.password.length : 'No password');
    } else {
      console.log('❌ User customer@example.com tidak ditemukan di database');
      
      console.log('\n📋 Daftar semua users:');
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true
        }
      });
      
      allUsers.forEach((u, index) => {
        console.log(`${index + 1}. ${u.email} (${u.role}) - Verified: ${u.emailVerified ? 'Yes' : 'No'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCustomerUser();
