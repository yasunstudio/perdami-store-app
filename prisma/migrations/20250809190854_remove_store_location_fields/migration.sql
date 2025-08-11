/*
  Warnings:

  - You are about to drop the column `price` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `stores` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `stores` table. All the data in the column will be lost.
  - You are about to drop the column `province` on the `stores` table. All the data in the column will be lost.
  - Changed the type of `type` on the `in_app_notifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `totalPrice` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitPrice` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `order_items` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('ORDER_UPDATE', 'PAYMENT_REMINDER', 'GENERAL');

-- DropForeignKey
ALTER TABLE "public"."order_items" DROP CONSTRAINT "order_items_bundleId_fkey";

-- DropIndex
DROP INDEX "public"."stores_city_idx";

-- AlterTable
ALTER TABLE "public"."in_app_notifications" DROP COLUMN "type",
ADD COLUMN     "type" "public"."NotificationType" NOT NULL;

-- AlterTable
ALTER TABLE "public"."order_items" DROP COLUMN "price",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "totalPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "unitPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "bundleId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."stores" DROP COLUMN "address",
DROP COLUMN "city",
DROP COLUMN "province";

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "public"."product_bundles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
