-- AlterTable
ALTER TABLE "public"."app_settings" ADD COLUMN     "defaultBankId" TEXT,
ADD COLUMN     "singleBankMode" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "public"."app_settings" ADD CONSTRAINT "app_settings_defaultBankId_fkey" FOREIGN KEY ("defaultBankId") REFERENCES "public"."banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
