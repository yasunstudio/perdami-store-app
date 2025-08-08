-- SQL script untuk membuat tabel AppSettings di Supabase (opsional)
-- Copy paste ini ke Supabase SQL Editor jika diperlukan

-- Create AppSettings table
CREATE TABLE IF NOT EXISTS "AppSettings" (
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

-- Insert app settings (multiple bank mode enabled)
INSERT INTO "AppSettings" (
  id, "appName", "appDescription", "singleBankMode", "isActive", "createdAt", "updatedAt"
) VALUES (
  'main-config', 
  'Perdami Store', 
  'Platform pre-order oleh-oleh khas Bandung untuk peserta PIT PERDAMI 2025',
  false,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) 
DO UPDATE SET
  "singleBankMode" = false,
  "updatedAt" = NOW();

-- Verify settings
SELECT * FROM "AppSettings" WHERE id = 'main-config';
