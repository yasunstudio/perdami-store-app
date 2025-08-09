const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function setupAdminUser() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking admin user...');
    
    // Check if admin exists
    let admin = await prisma.user.findUnique({
      where: { email: 'admin@perdami.com' }
    });
    
    if (!admin) {
      console.log('🆕 Creating new admin user...');
      
      // Create admin user
      const hashedPassword = await bcrypt.hash('perdami123', 12);
      
      admin = await prisma.user.create({
        data: {
          id: `admin_${Date.now()}`,
          email: 'admin@perdami.com',
          name: 'Admin Perdami',
          password: hashedPassword,
          role: 'ADMIN',
          emailVerified: new Date(),
        }
      });
      
      console.log('✅ Admin user created successfully!');
    } else {
      console.log('👤 Admin user exists, updating password...');
      
      // Update password to ensure it's correct
      const hashedPassword = await bcrypt.hash('perdami123', 12);
      
      admin = await prisma.user.update({
        where: { email: 'admin@perdami.com' },
        data: { 
          password: hashedPassword,
          role: 'ADMIN' // Ensure role is correct
        }
      });
      
      console.log('✅ Admin password updated successfully!');
    }
    
    // Verify password
    const isPasswordCorrect = await bcrypt.compare('perdami123', admin.password);
    console.log('🔑 Password verification:', isPasswordCorrect ? '✅ Correct' : '❌ Incorrect');
    
    console.log('👤 Admin details:', {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      hasPassword: !!admin.password
    });
    
    console.log('\n🎯 Login credentials:');
    console.log('📧 Email: admin@perdami.com');
    console.log('🔒 Password: perdami123');
    console.log('🌐 URL: http://localhost:3000/auth/login');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdminUser();
