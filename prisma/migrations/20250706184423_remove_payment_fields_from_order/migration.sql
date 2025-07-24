/*
  Warnings:

  - You are about to drop the column `paymentMethod` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `paymentProof` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `orders` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "orders_paymentMethod_idx";

-- DropIndex
DROP INDEX "orders_paymentStatus_idx";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "paymentMethod",
DROP COLUMN "paymentProof",
DROP COLUMN "paymentStatus";

-- CreateIndex
CREATE INDEX "payments_method_idx" ON "payments"("method");
