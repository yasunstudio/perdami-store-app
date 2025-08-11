/*
  Warnings:

  - A unique constraint covering the columns `[pickupVerificationToken]` on the table `orders` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "pickupVerificationToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "orders_pickupVerificationToken_key" ON "public"."orders"("pickupVerificationToken");

-- CreateIndex
CREATE INDEX "orders_pickupVerificationToken_idx" ON "public"."orders"("pickupVerificationToken");
