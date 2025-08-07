/*
  Warnings:

  - Added the required column `subtotalAmount` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: Add serviceFee column with default
ALTER TABLE "orders" ADD COLUMN "serviceFee" DOUBLE PRECISION NOT NULL DEFAULT 25000;

-- AlterTable: Add subtotalAmount column, initially allow null
ALTER TABLE "orders" ADD COLUMN "subtotalAmount" DOUBLE PRECISION;

-- Update existing rows: set subtotalAmount to (totalAmount - 25000) for existing orders
-- For orders where totalAmount is less than 25000, set subtotalAmount to totalAmount and serviceFee to 0
UPDATE "orders" 
SET 
  "subtotalAmount" = CASE 
    WHEN "totalAmount" >= 25000 THEN "totalAmount" - 25000
    ELSE "totalAmount"
  END,
  "serviceFee" = CASE 
    WHEN "totalAmount" >= 25000 THEN 25000
    ELSE 0
  END;

-- Make subtotalAmount NOT NULL after setting values
ALTER TABLE "orders" ALTER COLUMN "subtotalAmount" SET NOT NULL;
