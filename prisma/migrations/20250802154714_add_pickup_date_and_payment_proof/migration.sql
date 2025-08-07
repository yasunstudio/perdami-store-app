-- CreateEnum
CREATE TYPE "PickupStatus" AS ENUM ('NOT_PICKED_UP', 'PICKED_UP');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "paymentProofUrl" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "pickupDate" TIMESTAMP(3),
ADD COLUMN     "pickupStatus" "PickupStatus" NOT NULL DEFAULT 'NOT_PICKED_UP';

-- CreateIndex
CREATE INDEX "orders_pickupDate_idx" ON "orders"("pickupDate");
