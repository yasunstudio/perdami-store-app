// Direct database insertion for bank data without prepared statement conflicts
const { Pool } = require('pg');
const crypto = require('crypto');

// Create unique connection to avoid prepared statement conflicts
async function createBankDataDirect() {
  console.log('🏦 Inserting Bank Data Directly to Database...');
  console.log('===========================================');
  
  // Parse DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    return;
  }
  
  // Add unique connection parameters to avoid conflicts
  const uniqueId = crypto.randomBytes(8).toString('hex');
  const connectionUrl = databaseUrl.includes('?') 
    ? `${databaseUrl}&application_name=bank_seed_${uniqueId}`
    : `${databaseUrl}?application_name=bank_seed_${uniqueId}`;
  
  const pool = new Pool({
    connectionString: connectionUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔍 Checking database connection...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Check if Bank table exists
    console.log('📋 Checking if Bank table exists...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Bank'
      );
    `);
    
    const bankTableExists = tableCheck.rows[0].exists;
    console.log(`Bank table exists: ${bankTableExists}`);
    
    if (!bankTableExists) {
      console.log('🏗️  Creating Bank table...');
      await client.query(`
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
      
      await client.query(`CREATE INDEX "Bank_code_idx" ON "Bank"(code);`);
      await client.query(`CREATE INDEX "Bank_isActive_idx" ON "Bank"("isActive");`);
      
      console.log('✅ Bank table created successfully');
    }
    
    // Insert bank data
    console.log('📝 Inserting bank data...');
    
    const bankData = [
      {
        id: 'bank-bri-perdami',
        name: 'Bank BRI - Perdami Store',
        code: 'BRI',
        accountNumber: '1234567890123456',
        accountName: 'Dharma Wanita Perdami',
        logo: '/images/banks/bri-logo.png',
        isActive: true
      },
      {
        id: 'bank-bca-perdami',
        name: 'Bank BCA - Perdami Store',
        code: 'BCA',
        accountNumber: '9876543210987654',
        accountName: 'Dharma Wanita Perdami',
        logo: '/images/banks/bca-logo.png',
        isActive: true
      },
      {
        id: 'bank-mandiri-perdami',
        name: 'Bank Mandiri - Perdami Store',
        code: 'MANDIRI',
        accountNumber: '5556667778889999',
        accountName: 'Dharma Wanita Perdami',
        logo: '/images/banks/mandiri-logo.png',
        isActive: true
      },
      {
        id: 'bank-bni-perdami',
        name: 'Bank BNI - Perdami Store',
        code: 'BNI',
        accountNumber: '1112223334445555',
        accountName: 'Dharma Wanita Perdami',
        logo: '/images/banks/bni-logo.png',
        isActive: false
      }
    ];
    
    let insertedCount = 0;
    let updatedCount = 0;
    
    for (const bank of bankData) {
      try {
        // Check if bank already exists
        const existingBank = await client.query(
          'SELECT id FROM "Bank" WHERE id = $1',
          [bank.id]
        );
        
        if (existingBank.rows.length > 0) {
          // Update existing bank
          await client.query(`
            UPDATE "Bank" 
            SET name = $2, code = $3, "accountNumber" = $4, "accountName" = $5, 
                logo = $6, "isActive" = $7, "updatedAt" = CURRENT_TIMESTAMP
            WHERE id = $1
          `, [bank.id, bank.name, bank.code, bank.accountNumber, bank.accountName, bank.logo, bank.isActive]);
          
          console.log(`🔄 Updated: ${bank.name}`);
          updatedCount++;
        } else {
          // Insert new bank
          await client.query(`
            INSERT INTO "Bank" (id, name, code, "accountNumber", "accountName", logo, "isActive", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `, [bank.id, bank.name, bank.code, bank.accountNumber, bank.accountName, bank.logo, bank.isActive]);
          
          console.log(`✅ Created: ${bank.name}`);
          insertedCount++;
        }
      } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`⚠️  Bank ${bank.name} already exists (unique constraint)`);
        } else {
          console.error(`❌ Error with ${bank.name}:`, error.message);
        }
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${insertedCount} banks`);
    console.log(`   Updated: ${updatedCount} banks`);
    
    // Verify final result
    const allBanks = await client.query('SELECT * FROM "Bank" ORDER BY name');
    
    console.log(`\n🏦 All Banks in Database (${allBanks.rows.length} total):`);
    allBanks.rows.forEach((bank, index) => {
      const status = bank.isActive ? '🟢 Active' : '🔴 Inactive';
      console.log(`   ${index + 1}. ${bank.name} (${bank.code}) - ${status}`);
      console.log(`      Account: ${bank.accountNumber} | ${bank.accountName}`);
    });
    
    const activeBanks = allBanks.rows.filter(bank => bank.isActive);
    console.log(`\n✨ ${activeBanks.length} active banks ready in database!`);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('🔧 Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

// Also create AppSettings if needed
async function createAppSettingsDirect() {
  console.log('\n⚙️  Creating App Settings...');
  
  const databaseUrl = process.env.DATABASE_URL;
  const uniqueId = crypto.randomBytes(8).toString('hex');
  const connectionUrl = databaseUrl.includes('?') 
    ? `${databaseUrl}&application_name=settings_seed_${uniqueId}`
    : `${databaseUrl}?application_name=settings_seed_${uniqueId}`;
  
  const pool = new Pool({
    connectionString: connectionUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const client = await pool.connect();
    
    // Check if AppSettings table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'AppSettings'
      );
    `);
    
    const settingsTableExists = tableCheck.rows[0].exists;
    console.log(`AppSettings table exists: ${settingsTableExists}`);
    
    if (!settingsTableExists) {
      console.log('🏗️  Creating AppSettings table...');
      await client.query(`
        CREATE TABLE "AppSettings" (
          id TEXT PRIMARY KEY,
          "appName" TEXT NOT NULL DEFAULT 'Perdami Store',
          "appDescription" TEXT NOT NULL DEFAULT 'Platform pre-order oleh-oleh khas Bandung untuk peserta PIT PERDAMI 2025',
          "appLogo" TEXT DEFAULT '/images/logo.png',
          "businessAddress" TEXT DEFAULT 'Venue PIT PERDAMI 2025, Bandung, Jawa Barat',
          "pickupLocation" TEXT DEFAULT 'Venue PIT PERDAMI 2025',
          "pickupCity" TEXT DEFAULT 'Bandung, Jawa Barat',
          "eventName" TEXT DEFAULT 'PIT PERDAMI 2025',
          "eventYear" TEXT DEFAULT '2025',
          "copyrightText" TEXT DEFAULT '© 2025 Perdami Store. Dibuat khusus untuk PIT PERDAMI 2025.',
          "copyrightSubtext" TEXT DEFAULT 'Semua hak cipta dilindungi.',
          "isMaintenanceMode" BOOLEAN DEFAULT false,
          "maintenanceMessage" TEXT,
          "singleBankMode" BOOLEAN DEFAULT false,
          "defaultBankId" TEXT,
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ AppSettings table created');
    }
    
    // Insert/update settings
    const settingsExists = await client.query('SELECT id FROM "AppSettings" WHERE id = $1', ['main-settings']);
    
    if (settingsExists.rows.length > 0) {
      await client.query(`
        UPDATE "AppSettings" 
        SET "singleBankMode" = false, "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = 'main-settings'
      `);
      console.log('🔄 Updated AppSettings (multiple bank mode enabled)');
    } else {
      await client.query(`
        INSERT INTO "AppSettings" (id, "singleBankMode", "isActive") 
        VALUES ('main-settings', false, true)
      `);
      console.log('✅ Created AppSettings (multiple bank mode enabled)');
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ AppSettings error:', error.message);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🌱 BANK DATABASE SEED');
  console.log('====================');
  console.log('Using direct PostgreSQL connection to avoid Prisma conflicts\n');
  
  try {
    await createBankDataDirect();
    await createAppSettingsDirect();
    
    console.log('\n🎉 DATABASE SEED COMPLETED!');
    console.log('==========================');
    console.log('✅ Bank data inserted to database');
    console.log('✅ App settings configured');
    console.log('\n💡 You can now test at: /api/banks');
    console.log('💡 Check Prisma Studio to verify data');
    
  } catch (error) {
    console.error('\n❌ SEED FAILED:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
