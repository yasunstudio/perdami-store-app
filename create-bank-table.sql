-- SQL script untuk membuat tabel Bank di Supabase
-- Copy paste ini ke Supabase SQL Editor

-- Create Bank table
CREATE TABLE IF NOT EXISTS "Bank" (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS "Bank_code_idx" ON "Bank"(code);
CREATE INDEX IF NOT EXISTS "Bank_isActive_idx" ON "Bank"("isActive");

-- Insert bank data
INSERT INTO "Bank" (id, name, code, "accountNumber", "accountName", logo, "isActive", "createdAt", "updatedAt")
VALUES 
  ('bank-bri-perdami', 'Bank BRI - Perdami Store', 'BRI', '1234567890123456', 'Dharma Wanita Perdami', '/images/banks/bri-logo.png', true, NOW(), NOW()),
  ('bank-bca-perdami', 'Bank BCA - Perdami Store', 'BCA', '9876543210987654', 'Dharma Wanita Perdami', '/images/banks/bca-logo.png', true, NOW(), NOW()),
  ('bank-mandiri-perdami', 'Bank Mandiri - Perdami Store', 'MANDIRI', '5556667778889999', 'Dharma Wanita Perdami', '/images/banks/mandiri-logo.png', true, NOW(), NOW()),
  ('bank-bni-perdami', 'Bank BNI - Perdami Store', 'BNI', '1112223334445555', 'Dharma Wanita Perdami', '/images/banks/bni-logo.png', false, NOW(), NOW())
ON CONFLICT (id) 
DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  "accountNumber" = EXCLUDED."accountNumber",
  "accountName" = EXCLUDED."accountName",
  logo = EXCLUDED.logo,
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

-- Verify data
SELECT id, name, code, "accountNumber", "accountName", "isActive" 
FROM "Bank" 
ORDER BY name;
