const { PrismaClient } = require('@prisma/client');
const { comparePasswords } = require('./src/lib/password.ts');

async function checkAdmin() {
  console.log('🔍 Checking Admin User...\n');
  
  const prisma = new PrismaClient();
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
      select: { id: true, email: true, name: true, role: true, password: true }
    });
    
    if (admin) {
      console.log('✅ Admin user found:');
      console.log('   ID:', admin.id);
      console.log('   Email:', admin.email);
      console.log('   Name:', admin.name);
      console.log('   Role:', admin.role);
      console.log('   Has password:', !!admin.password);
      
      if (admin.password) {
        const passwordMatch = await comparePasswords('Admin123', admin.password);
        console.log('   Password "Admin123" matches:', passwordMatch);
        
        // Test different possible passwords
        const possiblePasswords = ['admin123', 'ADMIN123', 'admin', 'Admin123!'];
        console.log('\n🔐 Testing alternative passwords:');
        for (const pwd of possiblePasswords) {
          const match = await comparePasswords(pwd, admin.password);
          if (match) {
            console.log(`   ✅ "${pwd}" MATCHES!`);
          } else {
            console.log(`   ❌ "${pwd}" does not match`);
          }
        }
      }
    } else {
      console.log('❌ Admin user not found');
      
      // Check all users
      console.log('\n📋 All users in database:');
      const allUsers = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true }
      });
      allUsers.forEach(user => {
        console.log(`   ${user.email} - ${user.name} (${user.role})`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
