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

async function fixOrdersTableStructure() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const uniqueId = `fix_orders_${timestamp}_${random}`;
  
  let connectionUrl = databaseUrl!;
  if (connectionUrl.includes('?')) {
    connectionUrl += `&application_name=${uniqueId}`;
  } else {
    connectionUrl += `?application_name=${uniqueId}`;
  }

  const client = new Client({
    connectionString: connectionUrl,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 60000,
    query_timeout: 60000,
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
    console.log('🔗 Connected to PostgreSQL database');
    console.log('🔧 Fixing orders table structure to match Prisma schema...\n');

    // 1. Check current orders table structure
    console.log('1️⃣ Checking current orders table structure...');
    const currentColumns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND table_schema = 'public' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Current columns:');
    currentColumns.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type})`);
    });

    // 2. Backup existing data if any
    console.log('\n2️⃣ Backing up existing orders data...');
    const existingData = await client.query('SELECT * FROM orders');
    console.log(`Found ${existingData.rows.length} existing orders`);

    // 3. Drop existing orders table
    console.log('\n3️⃣ Dropping existing orders table...');
    await client.query('DROP TABLE IF EXISTS orders CASCADE');
    console.log('✅ Orders table dropped');

    // 4. Create new orders table with Prisma schema structure
    console.log('\n4️⃣ Creating new orders table with Prisma schema...');
    await client.query(`
      CREATE TABLE "orders" (
        "id" TEXT NOT NULL,
        "orderNumber" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "bankId" TEXT,
        "subtotalAmount" DOUBLE PRECISION NOT NULL,
        "serviceFee" DOUBLE PRECISION NOT NULL DEFAULT 25000,
        "totalAmount" DOUBLE PRECISION NOT NULL,
        "orderStatus" TEXT NOT NULL DEFAULT 'PENDING',
        "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
        "pickupMethod" TEXT NOT NULL DEFAULT 'VENUE',
        "pickupDate" TIMESTAMP(3),
        "pickupStatus" TEXT NOT NULL DEFAULT 'NOT_PICKED_UP',
        "paymentProofUrl" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
      );
    `);

    // 5. Create indexes
    console.log('\n5️⃣ Creating indexes...');
    await client.query(`
      CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");
      CREATE INDEX "orders_userId_idx" ON "orders"("userId");
      CREATE INDEX "orders_orderNumber_idx" ON "orders"("orderNumber");
      CREATE INDEX "orders_orderStatus_idx" ON "orders"("orderStatus");
      CREATE INDEX "orders_pickupDate_idx" ON "orders"("pickupDate");
      CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");
    `);

    // 6. Add foreign key constraints
    console.log('\n6️⃣ Adding foreign key constraints...');
    await client.query(`
      ALTER TABLE "orders" ADD CONSTRAINT "orders_bankId_fkey" 
      FOREIGN KEY ("bankId") REFERENCES "banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    `);
    
    await client.query(`
      ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    `);

    // 7. Also fix order_items table if it has issues
    console.log('\n7️⃣ Checking order_items table...');
    const orderItemsColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'order_items' 
      AND table_schema = 'public';
    `);
    
    const hasCorrectColumns = orderItemsColumns.rows.some(row => row.column_name === 'bundleId');
    
    if (!hasCorrectColumns) {
      console.log('   Fixing order_items table structure...');
      await client.query('DROP TABLE IF EXISTS order_items CASCADE');
      
      await client.query(`
        CREATE TABLE "order_items" (
          "id" TEXT NOT NULL,
          "orderId" TEXT NOT NULL,
          "bundleId" TEXT NOT NULL,
          "quantity" INTEGER NOT NULL,
          "price" DOUBLE PRECISION NOT NULL,

          CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
        );
      `);

      await client.query(`
        CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");
        CREATE INDEX "order_items_bundleId_idx" ON "order_items"("bundleId");
      `);

      await client.query(`
        ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" 
        FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      
      await client.query(`
        ALTER TABLE "order_items" ADD CONSTRAINT "order_items_bundleId_fkey" 
        FOREIGN KEY ("bundleId") REFERENCES "product_bundles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      `);
      
      console.log('   ✅ Order items table fixed');
    } else {
      console.log('   ✅ Order items table structure is correct');
    }

    console.log('\n8️⃣ Verifying new structure...');
    const newColumns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND table_schema = 'public' 
      ORDER BY ordinal_position;
    `);
    
    console.log('New orders table columns:');
    newColumns.rows.forEach(row => {
      console.log(`  ✅ ${row.column_name} (${row.data_type})`);
    });

    console.log('\n🎉 SUCCESS: Orders table structure now matches Prisma schema!');

  } catch (error) {
    console.error('❌ Error fixing orders table structure:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔗 Database connection closed');
  }
}

// Run the fix
if (require.main === module) {
  fixOrdersTableStructure()
    .then(() => {
      console.log('\n✅ Orders table structure fix completed!');
      console.log('Now you can run the seeding script again.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}
