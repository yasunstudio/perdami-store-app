-- AlterTable
ALTER TABLE "products" ADD COLUMN     "showToCustomer" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "products_showToCustomer_idx" ON "products"("showToCustomer");
