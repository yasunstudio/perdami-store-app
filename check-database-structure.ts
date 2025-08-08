import { Client } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Disable Node.js TLS certificate verification for Supabase
if (typeof process !== 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is missing!');
  process.exit(1);
}

// Define expected tables from Prisma schema (with @@map names)
const expectedTables = [
  'users',                      // User model
  'accounts',                   // Account model  
  'sessions',                   // Session model
  'verificationtokens',         // VerificationToken model
  'user_notification_settings', // UserNotificationSettings model
  'stores',                     // Store model
  'product_bundles',            // ProductBundle model
  'banks',                      // Bank model
  'orders',                     // Order model
  'order_items',                // OrderItem model
  'user_activity_logs',         // UserActivityLog model
  'app_settings',               // AppSettings model
  'in_app_notifications',       // InAppNotification model
  'payments',                   // Payment model
  'contact_info',               // ContactInfo model
  'quick_actions'               // QuickAction model
];

interface TableInfo {
  table_name: string;
  table_schema: string;
}

async function checkDatabaseStructure() {
  // Create unique connection identifier
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const uniqueId = `check_db_${timestamp}_${random}`;
  
  let connectionUrl = databaseUrl;
  if (connectionUrl!.includes('?')) {
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
    
    console.log('🔍 Checking database structure...\n');
    
    // Get all tables in the public schema
    const tablesQuery = `
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    const existingTables = tablesResult.rows.map((row: TableInfo) => row.table_name);
    
    console.log('📋 EXISTING TABLES IN DATABASE:');
    console.log('===============================');
    existingTables.forEach((table: string) => {
      const isExpected = expectedTables.includes(table);
      const isSystem = ['_prisma_migrations'].includes(table);
      const status = isExpected ? '✅' : (isSystem ? '🔧' : '❌');
      const suffix = isSystem ? ' (Prisma system table)' : '';
      console.log(`${status} ${table}${suffix}`);
    });

    console.log('\n📋 EXPECTED TABLES FROM PRISMA SCHEMA:');
    console.log('=====================================');
    expectedTables.forEach(table => {
      const exists = existingTables.includes(table);
      console.log(`${exists ? '✅' : '❌'} ${table}`);
    });

    // Find differences (exclude Prisma system tables)
    const systemTables = ['_prisma_migrations'];
    const extraTables = existingTables.filter((table: string) => 
      !expectedTables.includes(table) && !systemTables.includes(table)
    );
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));

    if (extraTables.length > 0) {
      console.log('\n🚨 EXTRA TABLES (exist in database but not in Prisma schema):');
      console.log('===========================================================');
      extraTables.forEach((table: string) => {
        console.log(`❌ ${table} - should be removed`);
      });
    }

    if (missingTables.length > 0) {
      console.log('\n🚨 MISSING TABLES (defined in Prisma schema but not in database):');
      console.log('================================================================');
      missingTables.forEach(table => {
        console.log(`❌ ${table} - should be created`);
      });
    }

    if (extraTables.length === 0 && missingTables.length === 0) {
      console.log('\n✅ All tables match between Prisma schema and database!');
    }

    // Check for specific problematic tables
    const problematicTables = ['Bank', 'Product', 'Category', 'ProductCategory', 'CartItem'];
    const foundProblematic = extraTables.filter(table => problematicTables.includes(table));
    
    if (foundProblematic.length > 0) {
      console.log('\n⚠️  DETECTED LEGACY TABLES:');
      console.log('===========================');
      foundProblematic.forEach(table => {
        switch(table) {
          case 'Bank':
            console.log('❌ "Bank" table detected - should be "banks" (Prisma @@map("banks"))');
            break;
          case 'Product':
            console.log('❌ "Product" table detected - no longer used (replaced by product_bundles)');
            break;
          case 'Category':
            console.log('❌ "Category" table detected - no longer used');
            break;
          case 'ProductCategory':
            console.log('❌ "ProductCategory" table detected - no longer used');
            break;
          case 'CartItem':
            console.log('❌ "CartItem" table detected - no longer used');
            break;
          default:
            console.log(`❌ "${table}" table detected - legacy table that should be removed`);
        }
      });
    }

    // Check for _prisma_migrations table
    if (!existingTables.includes('_prisma_migrations')) {
      console.log('\n⚠️  Prisma migrations table not found - this might indicate issues with migrations');
    } else {
      console.log('\n✅ Prisma migrations table found - migration system is working');
    }

    console.log('\n📊 SUMMARY:');
    console.log('===========');
    console.log(`✅ Expected tables: ${expectedTables.length}`);
    console.log(`📋 Existing tables: ${existingTables.length}`);
    console.log(`❌ Extra tables: ${extraTables.length}`);
    console.log(`❌ Missing tables: ${missingTables.length}`);

    if (extraTables.length > 0 || missingTables.length > 0) {
      console.log('\n🔧 RECOMMENDED ACTION:');
      console.log('======================');
      console.log('Run: npx prisma migrate reset --force');
      console.log('This will recreate the database to match your Prisma schema exactly.');
      console.log('\n⚠️  WARNING: This will delete all existing data!');
      console.log('Make sure to backup important data first.');
    }

    return {
      existingTables,
      expectedTables,
      extraTables,
      missingTables,
      problematicTables: foundProblematic
    };

  } catch (error) {
    console.error('❌ Error checking database structure:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔗 Database connection closed');
  }
}

// Run the check
if (require.main === module) {
  checkDatabaseStructure()
    .then((result) => {
      console.log('\n✅ Database structure check completed!');
      
      if (result && (result.extraTables.length > 0 || result.missingTables.length > 0)) {
        console.log('\n🚨 ACTION REQUIRED: Database structure does not match Prisma schema');
        process.exit(1);
      } else {
        console.log('\n✅ Database structure matches Prisma schema perfectly!');
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}
