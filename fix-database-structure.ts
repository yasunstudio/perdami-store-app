import { Client } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Disable Node.js TLS certificate verification for Supabase
if (typeof process !== 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is missing!');
  process.exit(1);
}

async function fixDatabaseStructure() {
  // Create unique connection identifier
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const uniqueId = `fix_db_${timestamp}_${random}`;
  
  let connectionUrl = databaseUrl!;
  if (connectionUrl.includes('?')) {
    connectionUrl += `&application_name=${uniqueId}`;
  } else {
    connectionUrl += `?application_name=${uniqueId}`;
  }

  const client = new Client({
    connectionString: connectionUrl,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 30000,
    query_timeout: 30000,
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
    console.log('🔗 Connected to PostgreSQL database');
    
    console.log('🔧 Starting database structure fixes...\n');

    // 1. Drop the old AppSettings table (keep data if any)
    console.log('1️⃣ Checking for old AppSettings table...');
    
    const appSettingsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'AppSettings'
      );
    `);
    
    if (appSettingsCheck.rows[0].exists) {
      console.log('   Found old AppSettings table');
      
      // Check if there's data to migrate
      const dataCheck = await client.query('SELECT COUNT(*) FROM "AppSettings"');
      const rowCount = parseInt(dataCheck.rows[0].count);
      
      if (rowCount > 0) {
        console.log(`   📊 Found ${rowCount} rows in AppSettings`);
        
        // Try to migrate data to app_settings if it doesn't exist there
        const appSettingsNewCheck = await client.query('SELECT COUNT(*) FROM app_settings');
        const newRowCount = parseInt(appSettingsNewCheck.rows[0].count);
        
        if (newRowCount === 0) {
          console.log('   🔄 Migrating data from AppSettings to app_settings...');
          
          // Get column names to match
          const oldColumns = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'AppSettings' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
          `);
          
          const newColumns = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'app_settings' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
          `);
          
          console.log('   📋 Old columns:', oldColumns.rows.map(r => r.column_name));
          console.log('   📋 New columns:', newColumns.rows.map(r => r.column_name));
          
          // Find common columns
          const oldCols = oldColumns.rows.map(r => r.column_name);
          const newCols = newColumns.rows.map(r => r.column_name);
          const commonCols = oldCols.filter(col => newCols.includes(col));
          
          if (commonCols.length > 0) {
            const colList = commonCols.map(col => `"${col}"`).join(', ');
            console.log(`   🔄 Migrating columns: ${commonCols.join(', ')}`);
            
            await client.query(`
              INSERT INTO app_settings (${colList})
              SELECT ${colList}
              FROM "AppSettings"
            `);
            
            console.log('   ✅ Data migration completed');
          }
        } else {
          console.log('   ℹ️  app_settings already has data, skipping migration');
        }
      }
      
      // Drop the old table
      console.log('   🗑️  Dropping old AppSettings table...');
      await client.query('DROP TABLE "AppSettings" CASCADE');
      console.log('   ✅ Old AppSettings table dropped');
    } else {
      console.log('   ✅ No old AppSettings table found');
    }

    // 2. Create missing tables using Prisma migrations
    console.log('\n2️⃣ Creating missing tables...');
    
    // Check what tables are missing
    const missingTables = ['verificationtokens', 'payments', 'quick_actions'];
    
    for (const tableName of missingTables) {
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [tableName]);
      
      if (!tableExists.rows[0].exists) {
        console.log(`   🔨 Creating ${tableName} table...`);
        
        switch (tableName) {
          case 'verificationtokens':
            await client.query(`
              CREATE TABLE "verificationtokens" (
                "identifier" TEXT NOT NULL,
                "token" TEXT NOT NULL,
                "expires" TIMESTAMP(3) NOT NULL
              );
              
              CREATE UNIQUE INDEX "verificationtokens_identifier_token_key" ON "verificationtokens"("identifier", "token");
              CREATE UNIQUE INDEX "verificationtokens_token_key" ON "verificationtokens"("token");
            `);
            break;
            
          case 'payments':
            await client.query(`
              CREATE TABLE "payments" (
                "id" TEXT NOT NULL,
                "orderId" TEXT NOT NULL,
                "amount" DOUBLE PRECISION NOT NULL,
                "method" TEXT NOT NULL DEFAULT 'BANK_TRANSFER',
                "status" TEXT NOT NULL DEFAULT 'PENDING',
                "proofUrl" TEXT,
                "notes" TEXT,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,
                
                CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
              );
              
              CREATE UNIQUE INDEX "payments_orderId_key" ON "payments"("orderId");
              CREATE INDEX "payments_status_idx" ON "payments"("status");
              CREATE INDEX "payments_method_idx" ON "payments"("method");
              CREATE INDEX "payments_createdAt_idx" ON "payments"("createdAt");
              
              ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" 
              FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            `);
            break;
            
          case 'quick_actions':
            await client.query(`
              CREATE TABLE "quick_actions" (
                "id" TEXT NOT NULL,
                "title" TEXT NOT NULL,
                "description" TEXT NOT NULL,
                "icon" TEXT NOT NULL,
                "action" TEXT NOT NULL,
                "color" TEXT NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,
                
                CONSTRAINT "quick_actions_pkey" PRIMARY KEY ("id")
              );
            `);
            break;
        }
        
        console.log(`   ✅ ${tableName} table created`);
      } else {
        console.log(`   ✅ ${tableName} table already exists`);
      }
    }

    console.log('\n3️⃣ Final verification...');
    
    // Run the structure check again
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    const finalTables = tablesResult.rows.map(row => row.table_name);
    
    const expectedTables = [
      'users', 'accounts', 'sessions', 'verificationtokens',
      'user_notification_settings', 'stores', 'product_bundles',
      'banks', 'orders', 'order_items', 'user_activity_logs',
      'app_settings', 'in_app_notifications', 'payments',
      'contact_info', 'quick_actions'
    ];
    
    console.log('\n📋 FINAL TABLE STATUS:');
    console.log('======================');
    
    let allMatched = true;
    expectedTables.forEach(table => {
      const exists = finalTables.includes(table);
      console.log(`${exists ? '✅' : '❌'} ${table}`);
      if (!exists) allMatched = false;
    });
    
    // Check for any extra tables
    const extraTables = finalTables.filter(table => 
      !expectedTables.includes(table) && 
      table !== '_prisma_migrations'
    );
    
    if (extraTables.length > 0) {
      console.log('\n⚠️  Extra tables still present:');
      extraTables.forEach(table => {
        console.log(`❌ ${table}`);
        allMatched = false;
      });
    }
    
    if (allMatched) {
      console.log('\n🎉 SUCCESS: Database structure now matches Prisma schema perfectly!');
    } else {
      console.log('\n⚠️  Some issues remain - you may need to run: npx prisma migrate reset --force');
    }

  } catch (error) {
    console.error('❌ Error fixing database structure:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔗 Database connection closed');
  }
}

// Run the fix
if (require.main === module) {
  fixDatabaseStructure()
    .then(() => {
      console.log('\n✅ Database structure fix completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}
