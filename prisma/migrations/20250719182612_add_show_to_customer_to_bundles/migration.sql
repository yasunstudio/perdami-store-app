-- AlterTable
ALTER TABLE "product_bundles" ADD COLUMN     "showToCustomer" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "product_bundles_showToCustomer_idx" ON "product_bundles"("showToCustomer");
