const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function debugAuthorize() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Starting authorize debug...');
    
    // Test credentials
    const email = 'admin@perdami.com';
    const password = 'perdami123';
    
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    
    // Find user
    console.log('\n🔍 Looking up user in database...');
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      hasPassword: !!user.password,
      passwordLength: user.password?.length
    });
    
    if (!user.password) {
      console.log('❌ User has no password');
      return;
    }
    
    // Test password comparison
    console.log('\n🔑 Testing password comparison...');
    
    // Test 1: Direct bcrypt compare
    const directCompare = await bcrypt.compare(password, user.password);
    console.log('1. Direct bcrypt.compare:', directCompare ? '✅' : '❌');
    
    // Test 2: Dynamic import like in auth
    try {
      const bcryptModule = await import('bcryptjs');
      const dynamicCompare = await bcryptModule.compare(password, user.password);
      console.log('2. Dynamic import compare:', dynamicCompare ? '✅' : '❌');
    } catch (error) {
      console.log('2. Dynamic import error:', error.message);
    }
    
    // Test 3: Simulate exact auth flow
    console.log('\n🔄 Simulating exact auth flow...');
    
    const { z } = require('zod');
    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    });
    
    const credentials = { email, password };
    const validatedFields = loginSchema.safeParse(credentials);
    
    if (!validatedFields.success) {
      console.log('❌ Validation failed:', validatedFields.error);
      return;
    }
    
    console.log('✅ Validation passed');
    
    const { email: validEmail, password: validPassword } = validatedFields.data;
    
    const dbUser = await prisma.user.findUnique({
      where: { email: validEmail },
    });
    
    if (!dbUser || !dbUser.password) {
      console.log('❌ Auth flow: User or password not found');
      return;
    }
    
    // Use the same password comparison function
    const bcryptAuth = await import('bcryptjs');
    const passwordsMatch = await bcryptAuth.compare(validPassword, dbUser.password);
    
    console.log('3. Auth flow simulation:', passwordsMatch ? '✅' : '❌');
    
    if (passwordsMatch) {
      console.log('\n✅ All tests passed! Should return user object:', {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        image: dbUser.image,
        role: dbUser.role,
        phone: dbUser.phone,
      });
    } else {
      console.log('\n❌ Password comparison failed in auth flow simulation');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAuthorize();
