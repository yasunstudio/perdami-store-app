import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { createHash } from 'crypto';

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

// Helper function to generate CUID-like IDs
function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${prefix}${timestamp}${random}`;
}

// Helper function to hash passwords
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

async function seedAllTables() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const uniqueId = `seed_${timestamp}_${random}`;
  
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
    console.log('🌱 Starting comprehensive database seeding...\n');

    // 1. Seed Users
    console.log('1️⃣ Seeding Users...');
    const users = [
      {
        id: 'user-admin-1',
        email: 'admin@perdami.com',
        name: 'Admin Perdami',
        phone: '081234567890',
        password: hashPassword('admin123'),
        role: 'ADMIN',
        emailVerified: new Date(),
        image: '/images/avatars/admin.png'
      },
      {
        id: 'user-customer-1',
        email: 'customer1@example.com',
        name: 'Dr. Siti Nurhaliza',
        phone: '081234567891',
        password: hashPassword('password123'),
        role: 'CUSTOMER',
        emailVerified: new Date(),
        image: '/images/avatars/customer1.png'
      },
      {
        id: 'user-customer-2',
        email: 'customer2@example.com',
        name: 'Dr. Budi Santoso',
        phone: '081234567892',
        password: hashPassword('password123'),
        role: 'CUSTOMER',
        emailVerified: new Date(),
        image: '/images/avatars/customer2.png'
      },
      {
        id: 'user-customer-3',
        email: 'customer3@example.com',
        name: 'Dr. Rina Kartika',
        phone: '081234567893',
        password: hashPassword('password123'),
        role: 'CUSTOMER',
        emailVerified: null,
        image: null
      }
    ];

    for (const user of users) {
      await client.query(`
        INSERT INTO users (id, email, name, phone, password, role, "emailVerified", image, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        "updatedAt" = NOW()
      `, [user.id, user.email, user.name, user.phone, user.password, user.role, user.emailVerified, user.image]);
    }
    
    // Verify users were inserted
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    console.log(`   ✅ Seeded ${users.length} users (${userCount.rows[0].count} total in database)`);

    // 2. Seed User Notification Settings
    console.log('2️⃣ Seeding User Notification Settings...');
    
    // Get all existing user IDs to ensure we only create settings for existing users
    const existingUsers = await client.query('SELECT id FROM users');
    const existingUserIds = existingUsers.rows.map(row => row.id);
    
    for (const user of users) {
      if (existingUserIds.includes(user.id)) {
        await client.query(`
          INSERT INTO user_notification_settings (id, "userId", "orderUpdates", "paymentConfirmations", "productAnnouncements", "promotionalEmails", "securityAlerts", "accountUpdates", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          ON CONFLICT ("userId") DO NOTHING
        `, [generateId('notif_'), user.id, true, true, user.role === 'CUSTOMER', user.role === 'CUSTOMER', true, true]);
      }
    }
    console.log('   ✅ Seeded user notification settings');

    // 3. Seed Stores
    console.log('3️⃣ Seeding Stores...');
    const stores = [
      {
        id: 'store-main-venue',
        name: 'Toko Utama - Venue PIT PERDAMI',
        description: 'Toko utama yang berlokasi di venue PIT PERDAMI 2025, menyediakan berbagai oleh-oleh khas Bandung.',
        image: '/images/stores/main-venue.jpg',
        address: 'Gedung Utama PIT PERDAMI 2025',
        city: 'Bandung',
        province: 'Jawa Barat',
        isActive: true
      },
      {
        id: 'store-food-court',
        name: 'Food Court Perdami',
        description: 'Area food court dengan berbagai makanan dan minuman khas Bandung.',
        image: '/images/stores/food-court.jpg',
        address: 'Food Court PIT PERDAMI 2025',
        city: 'Bandung',
        province: 'Jawa Barat',
        isActive: true
      },
      {
        id: 'store-souvenir',
        name: 'Souvenir Corner',
        description: 'Corner khusus untuk souvenir dan merchandise PIT PERDAMI 2025.',
        image: '/images/stores/souvenir.jpg',
        address: 'Lobby PIT PERDAMI 2025',
        city: 'Bandung',
        province: 'Jawa Barat',
        isActive: true
      }
    ];

    for (const store of stores) {
      await client.query(`
        INSERT INTO stores (id, name, description, image, address, city, province, "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        image = EXCLUDED.image,
        address = EXCLUDED.address,
        "updatedAt" = NOW()
      `, [store.id, store.name, store.description, store.image, store.address, store.city, store.province, store.isActive]);
    }
    console.log(`   ✅ Seeded ${stores.length} stores`);

    // 4. Seed Product Bundles
    console.log('4️⃣ Seeding Product Bundles...');
    const bundles = [
      {
        id: 'bundle-makanan-khas',
        name: 'Paket Makanan Khas Bandung',
        description: 'Paket lengkap makanan khas Bandung pilihan terbaik untuk oleh-oleh.',
        image: '/images/bundles/makanan-khas.jpg',
        price: 150000,
        contents: JSON.stringify([
          { name: 'Brownies Kukus', quantity: 2 },
          { name: 'Keripik Singkong', quantity: 3 },
          { name: 'Dodol Garut', quantity: 1 },
          { name: 'Batagor Kering', quantity: 2 }
        ]),
        storeId: 'store-main-venue',
        isActive: true,
        isFeatured: true,
        showToCustomer: true
      },
      {
        id: 'bundle-minuman-segar',
        name: 'Paket Minuman Segar',
        description: 'Koleksi minuman segar khas Bandung untuk menyegarkan hari Anda.',
        image: '/images/bundles/minuman-segar.jpg',
        price: 85000,
        contents: JSON.stringify([
          { name: 'Bandrek Instant', quantity: 5 },
          { name: 'Bajigur Mix', quantity: 3 },
          { name: 'Es Cendol Mix', quantity: 4 }
        ]),
        storeId: 'store-food-court',
        isActive: true,
        isFeatured: true,
        showToCustomer: true
      },
      {
        id: 'bundle-souvenir-perdami',
        name: 'Paket Souvenir PIT PERDAMI 2025',
        description: 'Merchandise eksklusif dan souvenir PIT PERDAMI 2025.',
        image: '/images/bundles/souvenir-perdami.jpg',
        price: 200000,
        contents: JSON.stringify([
          { name: 'T-Shirt PIT PERDAMI 2025', quantity: 1 },
          { name: 'Totebag Canvas', quantity: 1 },
          { name: 'Pin & Sticker Set', quantity: 1 },
          { name: 'Mug Ceramic', quantity: 1 }
        ]),
        storeId: 'store-souvenir',
        isActive: true,
        isFeatured: true,
        showToCustomer: true
      },
      {
        id: 'bundle-premium-combo',
        name: 'Paket Premium Kombo',
        description: 'Paket premium yang menggabungkan makanan, minuman, dan souvenir.',
        image: '/images/bundles/premium-combo.jpg',
        price: 350000,
        contents: JSON.stringify([
          { name: 'Brownies Premium', quantity: 1 },
          { name: 'Kopi Bandung Special', quantity: 2 },
          { name: 'T-Shirt Limited Edition', quantity: 1 },
          { name: 'Keripik Mix Variant', quantity: 3 }
        ]),
        storeId: 'store-main-venue',
        isActive: true,
        isFeatured: true,
        showToCustomer: true
      },
      {
        id: 'bundle-hemat-keluarga',
        name: 'Paket Hemat Keluarga',
        description: 'Paket ekonomis untuk keluarga dengan porsi yang cukup untuk semua.',
        image: '/images/bundles/hemat-keluarga.jpg',
        price: 120000,
        contents: JSON.stringify([
          { name: 'Keripik Family Pack', quantity: 2 },
          { name: 'Minuman Tradisional', quantity: 4 },
          { name: 'Kue Kering Mix', quantity: 2 }
        ]),
        storeId: 'store-food-court',
        isActive: true,
        isFeatured: false,
        showToCustomer: true
      },
      {
        id: 'bundle-exclusive-vip',
        name: 'Paket Exclusive VIP',
        description: 'Paket eksklusif untuk tamu VIP dengan produk premium pilihan.',
        image: '/images/bundles/exclusive-vip.jpg',
        price: 500000,
        contents: JSON.stringify([
          { name: 'Premium Gift Box', quantity: 1 },
          { name: 'Batik Bandung Authentic', quantity: 1 },
          { name: 'Coffee Premium Blend', quantity: 2 },
          { name: 'Luxury Souvenir Set', quantity: 1 }
        ]),
        storeId: 'store-souvenir',
        isActive: true,
        isFeatured: true,
        showToCustomer: false // Only visible to admin
      }
    ];

    for (const bundle of bundles) {
      // Verify store exists before inserting bundle
      const storeExists = await client.query('SELECT id FROM stores WHERE id = $1', [bundle.storeId]);
      if (storeExists.rows.length > 0) {
        // Check if bundle already exists
        const bundleExists = await client.query('SELECT id FROM product_bundles WHERE id = $1', [bundle.id]);
        
        if (bundleExists.rows.length === 0) {
          await client.query(`
            INSERT INTO product_bundles (id, name, description, image, price, contents, "storeId", "isActive", "isFeatured", "showToCustomer", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          `, [bundle.id, bundle.name, bundle.description, bundle.image, bundle.price, bundle.contents, bundle.storeId, bundle.isActive, bundle.isFeatured, bundle.showToCustomer]);
        }
      }
    }
    console.log(`   ✅ Seeded ${bundles.length} product bundles`);

    // 5. Seed App Settings
    console.log('5️⃣ Seeding App Settings...');
    await client.query(`
      INSERT INTO app_settings (
        id, "appName", "appDescription", "appLogo", "businessAddress", 
        "pickupLocation", "pickupCity", "eventName", "eventYear",
        "copyrightText", "copyrightSubtext", "isMaintenanceMode", 
        "singleBankMode", "defaultBankId", "isActive", "createdAt", "updatedAt"
      )
      VALUES (
        'app-settings-main', 
        'Perdami Store - PIT PERDAMI 2025',
        'Platform pre-order oleh-oleh khas Bandung untuk peserta PIT PERDAMI 2025. Nikmati kemudahan berbelanja online dan ambil langsung di venue event.',
        '/images/logo.png',
        'Venue PIT PERDAMI 2025, Jl. Raya Bandung, Bandung, Jawa Barat',
        'Venue PIT PERDAMI 2025 - Lobby Utama',
        'Bandung, Jawa Barat',
        'PIT PERDAMI 2025',
        '2025',
        '© 2025 Perdami Store. Dibuat khusus untuk PIT PERDAMI 2025.',
        'Semua hak cipta dilindungi. Powered by Dharma Wanita Perdami.',
        false,
        false,
        'bank-bca-perdami',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
      "appDescription" = EXCLUDED."appDescription",
      "businessAddress" = EXCLUDED."businessAddress",
      "pickupLocation" = EXCLUDED."pickupLocation",
      "updatedAt" = NOW()
    `);
    console.log('   ✅ Seeded app settings');

    // 6. Seed Contact Info
    console.log('6️⃣ Seeding Contact Info...');
    const contacts = [
      {
        id: 'contact-email',
        type: 'EMAIL',
        title: 'Email Resmi',
        value: 'info@perdami-store.com',
        icon: 'mail',
        color: '#3B82F6'
      },
      {
        id: 'contact-whatsapp',
        type: 'WHATSAPP',
        title: 'WhatsApp Customer Service',
        value: '+62812-3456-7890',
        icon: 'message-circle',
        color: '#10B981'
      },
      {
        id: 'contact-phone',
        type: 'PHONE',
        title: 'Telepon Kantor',
        value: '+62-22-1234-5678',
        icon: 'phone',
        color: '#8B5CF6'
      },
      {
        id: 'contact-address',
        type: 'ADDRESS',
        title: 'Alamat Venue',
        value: 'Venue PIT PERDAMI 2025, Jl. Raya Bandung, Bandung, Jawa Barat',
        icon: 'map-pin',
        color: '#EF4444'
      },
      {
        id: 'contact-instagram',
        type: 'SOCIAL_MEDIA',
        title: 'Instagram',
        value: '@perdami_official',
        icon: 'instagram',
        color: '#F59E0B'
      }
    ];

    for (const contact of contacts) {
      await client.query(`
        INSERT INTO contact_info (id, type, title, value, icon, color, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        value = EXCLUDED.value,
        icon = EXCLUDED.icon,
        color = EXCLUDED.color,
        "updatedAt" = NOW()
      `, [contact.id, contact.type, contact.title, contact.value, contact.icon, contact.color]);
    }
    console.log(`   ✅ Seeded ${contacts.length} contact info entries`);

    // 7. Seed Quick Actions
    console.log('7️⃣ Seeding Quick Actions...');
    const quickActions = [
      {
        id: 'action-new-order',
        title: 'Pesanan Baru',
        description: 'Tambah pesanan customer baru',
        icon: 'plus-circle',
        action: '/admin/orders/new',
        color: '#10B981'
      },
      {
        id: 'action-manage-bundles',
        title: 'Kelola Produk',
        description: 'Tambah/edit paket produk',
        icon: 'package',
        action: '/admin/bundles',
        color: '#3B82F6'
      },
      {
        id: 'action-payment-verification',
        title: 'Verifikasi Pembayaran',
        description: 'Cek bukti pembayaran',
        icon: 'check-circle',
        action: '/admin/payments',
        color: '#F59E0B'
      },
      {
        id: 'action-pickup-management',
        title: 'Kelola Pickup',
        description: 'Atur jadwal pengambilan',
        icon: 'calendar',
        action: '/admin/pickup',
        color: '#8B5CF6'
      },
      {
        id: 'action-reports',
        title: 'Laporan Penjualan',
        description: 'Lihat laporan dan statistik',
        icon: 'bar-chart',
        action: '/admin/reports',
        color: '#EF4444'
      },
      {
        id: 'action-settings',
        title: 'Pengaturan',
        description: 'Konfigurasi aplikasi',
        icon: 'settings',
        action: '/admin/settings',
        color: '#6B7280'
      }
    ];

    for (const action of quickActions) {
      await client.query(`
        INSERT INTO quick_actions (id, title, description, icon, action, color, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        action = EXCLUDED.action,
        color = EXCLUDED.color,
        "updatedAt" = NOW()
      `, [action.id, action.title, action.description, action.icon, action.action, action.color]);
    }
    console.log(`   ✅ Seeded ${quickActions.length} quick actions`);

    // 8. Seed Sample Orders
    console.log('8️⃣ Seeding Sample Orders...');
    const orders = [
      {
        id: 'order-001',
        orderNumber: 'ORD-2025-001',
        userId: 'user-customer-1',
        bankId: 'bank-bca-perdami',
        subtotalAmount: 235000,
        serviceFee: 25000,
        totalAmount: 260000,
        orderStatus: 'CONFIRMED',
        paymentStatus: 'PAID',
        pickupMethod: 'VENUE',
        pickupDate: new Date('2025-08-15T10:00:00'),
        pickupStatus: 'NOT_PICKED_UP',
        paymentProofUrl: '/uploads/payment-proofs/proof-001.jpg',
        notes: 'Mohon dikemas dengan rapi untuk dibawa pulang ke Jakarta'
      },
      {
        id: 'order-002',
        orderNumber: 'ORD-2025-002',
        userId: 'user-customer-2',
        bankId: 'bank-bri-perdami',
        subtotalAmount: 150000,
        serviceFee: 25000,
        totalAmount: 175000,
        orderStatus: 'PROCESSING',
        paymentStatus: 'PAID',
        pickupMethod: 'VENUE',
        pickupDate: new Date('2025-08-16T14:00:00'),
        pickupStatus: 'NOT_PICKED_UP',
        paymentProofUrl: '/uploads/payment-proofs/proof-002.jpg',
        notes: 'Pesanan untuk keluarga besar'
      },
      {
        id: 'order-003',
        orderNumber: 'ORD-2025-003',
        userId: 'user-customer-3',
        bankId: 'bank-mandiri-perdami',
        subtotalAmount: 85000,
        serviceFee: 25000,
        totalAmount: 110000,
        orderStatus: 'PENDING',
        paymentStatus: 'PENDING',
        pickupMethod: 'VENUE',
        pickupDate: null,
        pickupStatus: 'NOT_PICKED_UP',
        paymentProofUrl: null,
        notes: null
      }
    ];

    for (const order of orders) {
      // Verify user and bank exist before inserting order
      const userExists = await client.query('SELECT id FROM users WHERE id = $1', [order.userId]);
      const bankExists = await client.query('SELECT id FROM banks WHERE id = $1', [order.bankId]);
      
      if (userExists.rows.length > 0 && bankExists.rows.length > 0) {
        // Check if order already exists
        const orderExists = await client.query('SELECT id FROM orders WHERE id = $1', [order.id]);
        
        if (orderExists.rows.length === 0) {
          await client.query(`
            INSERT INTO orders (
              id, "orderNumber", "userId", "bankId", "subtotalAmount", "serviceFee", "totalAmount",
              "orderStatus", "paymentStatus", "pickupMethod", "pickupDate", "pickupStatus",
              "paymentProofUrl", notes, "createdAt", "updatedAt"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
          `, [
            order.id, order.orderNumber, order.userId, order.bankId, 
            order.subtotalAmount, order.serviceFee, order.totalAmount,
            order.orderStatus, order.paymentStatus, order.pickupMethod,
            order.pickupDate, order.pickupStatus, order.paymentProofUrl, order.notes
          ]);
        }
      }
    }
    console.log(`   ✅ Seeded ${orders.length} orders`);

    // 9. Seed Order Items
    console.log('9️⃣ Seeding Order Items...');
    const orderItems = [
      { orderId: 'order-001', bundleId: 'bundle-makanan-khas', quantity: 1, unitPrice: 150000, totalPrice: 150000 },
      { orderId: 'order-001', bundleId: 'bundle-minuman-segar', quantity: 1, unitPrice: 85000, totalPrice: 85000 },
      { orderId: 'order-002', bundleId: 'bundle-makanan-khas', quantity: 1, unitPrice: 150000, totalPrice: 150000 },
      { orderId: 'order-003', bundleId: 'bundle-minuman-segar', quantity: 1, unitPrice: 85000, totalPrice: 85000 }
    ];

    for (const item of orderItems) {
      // Verify order and bundle exist before inserting order item
      const orderExists = await client.query('SELECT id FROM orders WHERE id = $1', [item.orderId]);
      const bundleExists = await client.query('SELECT id FROM product_bundles WHERE id = $1', [item.bundleId]);
      
      if (orderExists.rows.length > 0 && bundleExists.rows.length > 0) {
        // Check if item already exists
        const itemExists = await client.query(
          'SELECT id FROM order_items WHERE "orderId" = $1 AND "bundleId" = $2', 
          [item.orderId, item.bundleId]
        );
        
        if (itemExists.rows.length === 0) {
          await client.query(`
            INSERT INTO order_items (id, "orderId", "bundleId", quantity, "unitPrice", "totalPrice", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          `, [generateId('item_'), item.orderId, item.bundleId, item.quantity, item.unitPrice, item.totalPrice]);
        }
      }
    }
    console.log(`   ✅ Seeded ${orderItems.length} order items`);

    // 10. Seed Payments
    console.log('🔟 Seeding Payments...');
    const payments = [
      {
        orderId: 'order-001',
        amount: 260000,
        method: 'BANK_TRANSFER',
        status: 'PAID',
        proofUrl: '/uploads/payment-proofs/proof-001.jpg',
        notes: 'Transfer BCA berhasil'
      },
      {
        orderId: 'order-002',
        amount: 175000,
        method: 'BANK_TRANSFER',
        status: 'PAID',
        proofUrl: '/uploads/payment-proofs/proof-002.jpg',
        notes: 'Transfer BRI berhasil'
      }
    ];

    for (const payment of payments) {
      // Verify order exists before inserting payment
      const orderExists = await client.query('SELECT id FROM orders WHERE id = $1', [payment.orderId]);
      
      if (orderExists.rows.length > 0) {
        // Check if payment already exists
        const paymentExists = await client.query('SELECT id FROM payments WHERE "orderId" = $1', [payment.orderId]);
        
        if (paymentExists.rows.length === 0) {
          await client.query(`
            INSERT INTO payments (id, "orderId", amount, method, status, "proofUrl", notes, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          `, [generateId('pay_'), payment.orderId, payment.amount, payment.method, payment.status, payment.proofUrl, payment.notes]);
        }
      }
    }
    console.log(`   ✅ Seeded ${payments.length} payments`);

    // 11. Seed In-App Notifications
    console.log('1️⃣1️⃣ Seeding In-App Notifications...');
    const notifications = [
      {
        userId: 'user-customer-1',
        type: 'ORDER_UPDATE',
        title: 'Pesanan Dikonfirmasi',
        message: 'Pesanan ORD-2025-001 telah dikonfirmasi dan sedang diproses.',
        data: JSON.stringify({ orderId: 'order-001', orderNumber: 'ORD-2025-001' }),
        isRead: false
      },
      {
        userId: 'user-customer-2',
        type: 'PAYMENT_REMINDER',
        title: 'Pembayaran Berhasil',
        message: 'Pembayaran untuk pesanan ORD-2025-002 telah berhasil diverifikasi.',
        data: JSON.stringify({ orderId: 'order-002', orderNumber: 'ORD-2025-002' }),
        isRead: true
      },
      {
        userId: 'user-customer-3',
        type: 'GENERAL',
        title: 'Selamat Datang!',
        message: 'Selamat datang di Perdami Store. Jangan lupa untuk melengkapi pembayaran pesanan Anda.',
        data: null,
        isRead: false
      }
    ];

    for (const notif of notifications) {
      // Verify user exists before inserting notification
      const userExists = await client.query('SELECT id FROM users WHERE id = $1', [notif.userId]);
      
      if (userExists.rows.length > 0) {
        await client.query(`
          INSERT INTO in_app_notifications (id, "userId", type, title, message, data, "isRead", "readAt", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [generateId('notif_'), notif.userId, notif.type, notif.title, notif.message, notif.data, notif.isRead, notif.isRead ? new Date() : null]);
      }
    }
    console.log(`   ✅ Seeded ${notifications.length} notifications`);

    // 12. Seed User Activity Logs (simplified version)
    console.log('1️⃣2️⃣ Seeding User Activity Logs...');
    const activities = [
      {
        userId: 'user-admin-1',
        activity: 'LOGIN',
        details: 'Admin login to dashboard',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      {
        userId: 'user-customer-1',
        activity: 'ORDER_PLACED',
        details: 'Created new order ORD-2025-001',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
      },
      {
        userId: 'user-customer-2',
        activity: 'ORDER_UPDATED',
        details: 'Uploaded payment proof for order ORD-2025-002',
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        userId: 'user-customer-3',
        activity: 'PROFILE_UPDATED',
        details: 'Updated profile information',
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0 (Android; Mobile; rv:91.0) Gecko/91.0 Firefox/91.0'
      }
    ];

    for (const activity of activities) {
      // Verify user exists before inserting activity log
      const userExists = await client.query('SELECT id FROM users WHERE id = $1', [activity.userId]);
      
      if (userExists.rows.length > 0) {
        // Check if similar activity already exists
        const activityExists = await client.query(
          'SELECT id FROM user_activity_logs WHERE "userId" = $1 AND activity = $2', 
          [activity.userId, activity.activity]
        );
        
        if (activityExists.rows.length === 0) {
          await client.query(`
            INSERT INTO user_activity_logs (id, "userId", activity, details, "ipAddress", "userAgent", "createdAt")
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
          `, [generateId('log_'), activity.userId, activity.activity, activity.details, activity.ipAddress, activity.userAgent]);
        }
      }
    }
    console.log(`   ✅ Seeded ${activities.length} activity logs`);

    console.log('\n🎉 SUCCESS: All tables seeded successfully!');
    console.log('\n📊 SEEDING SUMMARY:');
    console.log('==================');
    console.log(`✅ Users: ${users.length}`);
    console.log(`✅ Stores: ${stores.length}`);
    console.log(`✅ Product Bundles: ${bundles.length}`);
    console.log(`✅ Orders: ${orders.length}`);
    console.log(`✅ Order Items: ${orderItems.length}`);
    console.log(`✅ Payments: ${payments.length}`);
    console.log(`✅ Contact Info: ${contacts.length}`);
    console.log(`✅ Quick Actions: ${quickActions.length}`);
    console.log(`✅ Notifications: ${notifications.length}`);
    console.log(`✅ Activity Logs: ${activities.length}`);
    console.log(`✅ App Settings: 1`);
    console.log(`✅ User Settings: ${users.length}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔗 Database connection closed');
  }
}

// Run the seeder
if (require.main === module) {
  seedAllTables()
    .then(() => {
      console.log('\n✅ Database seeding completed successfully!');
      console.log('\n🚀 Your APIs should now have data to display:');
      console.log('   • /api/users - User management');
      console.log('   • /api/stores - Store listings');
      console.log('   • /api/bundles - Product bundles');
      console.log('   • /api/orders - Order management');
      console.log('   • /api/banks - Bank information');
      console.log('   • /api/contact - Contact information');
      console.log('   • /api/settings - App settings');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}
