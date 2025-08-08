// Simple seed script that directly creates bank data using serverless approach
const { createPrismaClient } = require('./src/lib/prisma-serverless.ts');

async function createBankData() {
  console.log('🏦 Creating Bank Data with Serverless Client...');
  
  const prisma = createPrismaClient();
  
  try {
    // Check if we can access any table first
    console.log('🔍 Checking database connection...');
    
    // Try to create banks using raw SQL to bypass model issues
    console.log('📝 Inserting bank data...');
    
    // Use raw SQL to avoid prepared statement conflicts
    const insertResult = await prisma.$executeRawUnsafe(`
      INSERT INTO "Bank" (id, name, code, "accountNumber", "accountName", "isActive", "createdAt", "updatedAt")
      VALUES 
        ('bank-bri-perdami', 'Bank BRI - Perdami Store', 'BRI', '1234567890123456', 'Dharma Wanita Perdami', true, NOW(), NOW()),
        ('bank-bca-perdami', 'Bank BCA - Perdami Store', 'BCA', '9876543210987654', 'Dharma Wanita Perdami', true, NOW(), NOW()),
        ('bank-mandiri-perdami', 'Bank Mandiri - Perdami Store', 'MANDIRI', '5556667778889999', 'Dharma Wanita Perdami', true, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        "accountNumber" = EXCLUDED."accountNumber",
        "accountName" = EXCLUDED."accountName",
        "updatedAt" = NOW();
    `);
    
    console.log('✅ Bank data inserted/updated successfully');
    
    // Verify the data was created
    const banks = await prisma.$queryRawUnsafe(`
      SELECT id, name, code, "accountNumber", "accountName", "isActive" 
      FROM "Bank" 
      WHERE "isActive" = true 
      ORDER BY name;
    `);
    
    console.log('\n🏦 Active Banks Created:');
    banks.forEach((bank, index) => {
      console.log(`${index + 1}. ${bank.name} (${bank.code})`);
      console.log(`   Account: ${bank.accountNumber} | ${bank.accountName}`);
    });
    
    console.log(`\n✨ ${banks.length} active banks ready for use!`);
    
  } catch (error) {
    if (error.message.includes('relation "Bank" does not exist')) {
      console.log('❌ Bank table does not exist in database');
      console.log('💡 This means the database schema is different from expected');
      console.log('🔧 Please check your database schema or run migrations');
    } else if (error.message.includes('already exists')) {
      console.log('✅ Banks might already exist, this is OK');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createBankData().catch(console.error);
