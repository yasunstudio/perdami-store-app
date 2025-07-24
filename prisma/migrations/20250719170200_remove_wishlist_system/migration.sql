/*
  Warnings:

  - You are about to drop the `wishlist_bundles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `wishlists` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "wishlist_bundles" DROP CONSTRAINT "wishlist_bundles_bundleId_fkey";

-- DropForeignKey
ALTER TABLE "wishlist_bundles" DROP CONSTRAINT "wishlist_bundles_userId_fkey";

-- DropForeignKey
ALTER TABLE "wishlists" DROP CONSTRAINT "wishlists_productId_fkey";

-- DropForeignKey
ALTER TABLE "wishlists" DROP CONSTRAINT "wishlists_userId_fkey";

-- DropTable
DROP TABLE "wishlist_bundles";

-- DropTable
DROP TABLE "wishlists";
