// Check database structure and create Bank table if needed
const { createPrismaClient } = require('./src/lib/prisma-serverless.ts');

async function checkAndCreateBankTable() {
  console.log('🔍 Checking Database Structure...');
  
  const prisma = createPrismaClient();
  
  try {
    // List all tables in the database
    console.log('📋 Listing all tables...');
    
    const tables = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Available Tables:');
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });
    
    // Check if Bank table exists
    const bankTableExists = tables.some(table => table.table_name === 'Bank');
    
    if (!bankTableExists) {
      console.log('\n🏗️  Bank table does not exist. Creating it...');
      
      // Create Bank table based on the schema
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "Bank" (
          id TEXT PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          code TEXT UNIQUE NOT NULL,
          "accountNumber" TEXT NOT NULL,
          "accountName" TEXT NOT NULL,
          logo TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Create indexes
      await prisma.$executeRawUnsafe(`
        CREATE INDEX "Bank_code_idx" ON "Bank"(code);
      `);
      
      await prisma.$executeRawUnsafe(`
        CREATE INDEX "Bank_isActive_idx" ON "Bank"("isActive");
      `);
      
      console.log('✅ Bank table created successfully!');
      
      // Now insert the bank data
      console.log('📝 Inserting bank data...');
      
      await prisma.$executeRawUnsafe(`
        INSERT INTO "Bank" (id, name, code, "accountNumber", "accountName", "isActive", "createdAt", "updatedAt")
        VALUES 
          ('bank-bri-perdami', 'Bank BRI - Perdami Store', 'BRI', '1234567890123456', 'Dharma Wanita Perdami', true, NOW(), NOW()),
          ('bank-bca-perdami', 'Bank BCA - Perdami Store', 'BCA', '9876543210987654', 'Dharma Wanita Perdami', true, NOW(), NOW()),
          ('bank-mandiri-perdami', 'Bank Mandiri - Perdami Store', 'MANDIRI', '5556667778889999', 'Dharma Wanita Perdami', true, NOW(), NOW()),
          ('bank-bni-perdami', 'Bank BNI - Perdami Store', 'BNI', '1112223334445555', 'Dharma Wanita Perdami', false, NOW(), NOW());
      `);
      
      console.log('✅ Bank data inserted successfully!');
      
    } else {
      console.log('\n✅ Bank table already exists!');
      
      // Just insert data with conflict handling
      console.log('📝 Inserting/updating bank data...');
      
      await prisma.$executeRawUnsafe(`
        INSERT INTO "Bank" (id, name, code, "accountNumber", "accountName", "isActive", "createdAt", "updatedAt")
        VALUES 
          ('bank-bri-perdami', 'Bank BRI - Perdami Store', 'BRI', '1234567890123456', 'Dharma Wanita Perdami', true, NOW(), NOW()),
          ('bank-bca-perdami', 'Bank BCA - Perdami Store', 'BCA', '9876543210987654', 'Dharma Wanita Perdami', true, NOW(), NOW()),
          ('bank-mandiri-perdami', 'Bank Mandiri - Perdami Store', 'MANDIRI', '5556667778889999', 'Dharma Wanita Perdami', true, NOW(), NOW()),
          ('bank-bni-perdami', 'Bank BNI - Perdami Store', 'BNI', '1112223334445555', 'Dharma Wanita Perdami', false, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          "accountNumber" = EXCLUDED."accountNumber",
          "accountName" = EXCLUDED."accountName",
          "updatedAt" = NOW();
      `);
      
      console.log('✅ Bank data updated successfully!');
    }
    
    // Verify the final result
    const banks = await prisma.$queryRawUnsafe(`
      SELECT id, name, code, "accountNumber", "accountName", "isActive" 
      FROM "Bank" 
      ORDER BY name;
    `);
    
    console.log('\n🏦 All Banks in Database:');
    banks.forEach((bank, index) => {
      const status = bank.isActive ? '🟢 Active' : '🔴 Inactive';
      console.log(`${index + 1}. ${bank.name} (${bank.code}) - ${status}`);
      console.log(`   Account: ${bank.accountNumber} | ${bank.accountName}`);
    });
    
    const activeBanks = banks.filter(bank => bank.isActive);
    console.log(`\n✨ ${activeBanks.length} active banks ready for the API!`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateBankTable().catch(console.error);
