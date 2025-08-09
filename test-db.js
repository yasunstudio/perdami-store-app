const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔌 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Get user count
    const userCount = await prisma.user.count();
    console.log('👥 Total users:', userCount);
    
    // Get admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@perdami.com' },
      select: {
        id: true,
        email: true,
        role: true,
        password: true
      }
    });
    
    console.log('👤 Admin user:', {
      found: !!admin,
      email: admin?.email,
      role: admin?.role,
      hasPassword: !!admin?.password,
      passwordLength: admin?.password?.length
    });
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database disconnected');
  }
}

testConnection();
