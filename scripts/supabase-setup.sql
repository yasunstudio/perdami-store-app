-- Production Database Setup for Dharma Wanita Perdami Store
-- Execute this script in Supabase SQL Editor

-- Create enums
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'READY', 'COMPLETED', 'CANCELLED', 'FAILED');
CREATE TYPE "ContactType" AS ENUM ('EMAIL', 'PHONE', 'WHATSAPP', 'ADDRESS', 'SOCIAL_MEDIA');

-- Create users table
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "password" TEXT,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- Create banks table
CREATE TABLE "banks" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "banks_code_key" ON "banks"("code");

-- Create stores table
CREATE TABLE "stores" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- Create product_bundles table
CREATE TABLE "product_bundles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "showToCustomer" BOOLEAN NOT NULL DEFAULT true,
    "storeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "product_bundles_pkey" PRIMARY KEY ("id")
);

-- Create orders table
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" INTEGER NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "serviceFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "finalAmount" DECIMAL(65,30) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "pickupDate" TIMESTAMP(3),
    "paymentProof" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- Create order_items table
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "bundleId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "totalPrice" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- Create app_settings table
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL,
    "appName" TEXT NOT NULL DEFAULT 'Perdami Store',
    "appDescription" TEXT NOT NULL DEFAULT 'Platform pre-order oleh-oleh khas Bandung untuk peserta PIT PERDAMI 2025.',
    "eventName" TEXT NOT NULL DEFAULT 'PIT PERDAMI 2025',
    "eventYear" TEXT NOT NULL DEFAULT '2025',
    "singleBankMode" BOOLEAN NOT NULL DEFAULT true,
    "selectedBankId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- Create contact_info table
CREATE TABLE "contact_info" (
    "id" TEXT NOT NULL,
    "type" "ContactType" NOT NULL,
    "title" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "contact_info_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contact_info_type_idx" ON "contact_info"("type");

-- Add foreign key constraints
ALTER TABLE "product_bundles" ADD CONSTRAINT "product_bundles_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "product_bundles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Insert initial data
-- Admin user (password: admin123, hashed with bcrypt cost 12)
INSERT INTO "users" ("id", "name", "email", "password", "role", "emailVerified") VALUES 
('admin-001', 'Admin Perdami', 'admin@perdami.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN', NOW());

-- Banks
INSERT INTO "banks" ("code", "name", "accountNumber", "accountName", "isActive") VALUES 
('BCA', 'Bank Central Asia (BCA)', '1234567890', 'Dharma Wanita Perdami', true),
('MANDIRI', 'Bank Mandiri', '0987654321', 'Dharma Wanita Perdami', false);

-- Store
INSERT INTO "stores" ("name", "description", "address", "isActive") VALUES 
('Toko Oleh-oleh Perdami', 'Toko resmi Dharma Wanita Perdami untuk berbagai produk oleh-oleh dan merchandise eksklusif.', 'Jakarta, Indonesia', true);

-- Product bundles
INSERT INTO "product_bundles" ("name", "description", "price", "isActive", "showToCustomer", "storeId") VALUES 
('Paket Spesial', 'Paket oleh-oleh spesial untuk acara PIT PERDAMI 2025', 150000, true, true, 1),
('Paket Premium', 'Paket premium dengan merchandise eksklusif dan oleh-oleh pilihan', 250000, true, true, 1);

-- App settings
INSERT INTO "app_settings" ("id", "appName", "appDescription", "eventName", "eventYear", "singleBankMode", "selectedBankId") VALUES 
('default', 'Dharma Wanita Perdami Store', 'Platform pre-order oleh-oleh khas Bandung untuk peserta PIT PERDAMI 2025.', 'PIT PERDAMI 2025', '2025', true, 1);

-- Contact info
INSERT INTO "contact_info" ("id", "type", "title", "value", "icon", "color") VALUES 
('contact-phone', 'PHONE', 'WhatsApp', '6281234567890', 'phone', '#25D366'),
('contact-email', 'EMAIL', 'Email', 'contact@perdami.com', 'mail', '#EA4335'),
('contact-social-1', 'SOCIAL_MEDIA', 'Facebook', 'https://facebook.com/perdamistore', 'facebook', '#1877F2'),
('contact-social-2', 'SOCIAL_MEDIA', 'Instagram', 'https://instagram.com/perdamistore', 'instagram', '#E4405F');

-- Success message
SELECT 'Database setup completed successfully!' as message,
       'Admin login: admin@perdami.com' as admin_email,
       'Admin password: admin123' as admin_password,
       'Access admin at: https://dharma-wanita-perdami.vercel.app/admin' as admin_url;
