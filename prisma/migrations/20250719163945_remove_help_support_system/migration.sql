/*
  Warnings:

  - You are about to drop the `faq_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `help_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `help_sections` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "help_items" DROP CONSTRAINT "help_items_sectionId_fkey";

-- DropTable
DROP TABLE "faq_items";

-- DropTable
DROP TABLE "help_items";

-- DropTable
DROP TABLE "help_sections";

-- DropEnum
DROP TYPE "FaqCategory";

-- DropEnum
DROP TYPE "HelpItemType";
