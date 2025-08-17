/*
  Warnings:

  - You are about to drop the column `price` on the `product_bundles` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."product_bundles_price_idx";

-- AlterTable
ALTER TABLE "public"."product_bundles" DROP COLUMN "price",
ADD COLUMN     "costPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "sellingPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "product_bundles_sellingPrice_idx" ON "public"."product_bundles"("sellingPrice");

-- CreateIndex
CREATE INDEX "product_bundles_costPrice_idx" ON "public"."product_bundles"("costPrice");
