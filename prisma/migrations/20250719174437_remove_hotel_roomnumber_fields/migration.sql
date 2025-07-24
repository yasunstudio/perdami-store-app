/*
  Warnings:

  - You are about to drop the column `hotel` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `roomNumber` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "hotel",
DROP COLUMN "roomNumber";
