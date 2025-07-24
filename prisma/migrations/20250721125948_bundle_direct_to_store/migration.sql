/*
  Warnings:

  - You are about to drop the column `categoryId` on the `product_bundles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,storeId]` on the table `product_bundles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `storeId` to the `product_bundles` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "product_bundles" DROP CONSTRAINT "product_bundles_categoryId_fkey";

-- DropIndex
DROP INDEX "product_bundles_categoryId_idx";

-- DropIndex
DROP INDEX "product_bundles_name_categoryId_key";

-- Add storeId column first (nullable)
ALTER TABLE "product_bundles" ADD COLUMN "storeId" TEXT;

-- Update storeId from categoryId relationship
UPDATE "product_bundles" 
SET "storeId" = (
  SELECT c."storeId" 
  FROM "categories" c 
  WHERE c."id" = "product_bundles"."categoryId"
);

-- Make storeId NOT NULL
ALTER TABLE "product_bundles" ALTER COLUMN "storeId" SET NOT NULL;

-- Drop the old categoryId column
ALTER TABLE "product_bundles" DROP COLUMN "categoryId";

-- CreateIndex
CREATE INDEX "product_bundles_storeId_idx" ON "product_bundles"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "product_bundles_name_storeId_key" ON "product_bundles"("name", "storeId");

-- AddForeignKey
ALTER TABLE "product_bundles" ADD CONSTRAINT "product_bundles_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
