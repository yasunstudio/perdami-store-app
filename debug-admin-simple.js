const { PrismaClient } = require('@prisma/client');

async function checkAdminSimple() {
  console.log('🔍 Checking Admin User (Simple)...\n');
  
  const prisma = new PrismaClient();
  try {
    // Check if admin exists
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
      console.log('   Password length:', admin.password ? admin.password.length : 0);
    } else {
      console.log('❌ Admin user not found');
    }
    
    console.log('\n📋 All users in database:');
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true }
    });
    allUsers.forEach(user => {
      console.log(`   ${user.email} - ${user.name} (${user.role})`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminSimple();
