/*
  Warnings:

  - The values [DELIVERY] on the enum `PickupMethod` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PickupMethod_new" AS ENUM ('VENUE');
ALTER TABLE "orders" ALTER COLUMN "pickupMethod" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "pickupMethod" TYPE "PickupMethod_new" USING ("pickupMethod"::text::"PickupMethod_new");
ALTER TYPE "PickupMethod" RENAME TO "PickupMethod_old";
ALTER TYPE "PickupMethod_new" RENAME TO "PickupMethod";
DROP TYPE "PickupMethod_old";
ALTER TABLE "orders" ALTER COLUMN "pickupMethod" SET DEFAULT 'VENUE';
COMMIT;
