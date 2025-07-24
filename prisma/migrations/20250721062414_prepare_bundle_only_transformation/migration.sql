-- Bundle-Only Transformation Migration
-- This migration transforms the application to bundle-only approach

-- Step 1: Add new columns to product_bundles
ALTER TABLE "product_bundles" ADD COLUMN "contents" JSONB;
ALTER TABLE "product_bundles" ADD COLUMN "stock" INTEGER NOT NULL DEFAULT 999;

-- Step 2: Migrate bundle_items data to contents JSON in product_bundles
UPDATE "product_bundles" 
SET "contents" = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', p.name,
      'description', p.description,
      'image', p.image,
      'price', p.price,
      'quantity', bi.quantity
    )
  )
  FROM "bundle_items" bi
  JOIN "products" p ON bi."productId" = p.id
  WHERE bi."bundleId" = "product_bundles".id
);

-- Step 3: Handle order_items - Convert product orders to bundle orders
-- Create temporary bundles for individual products that were ordered
-- This is a data preservation step - in bundle-only approach, all orders should be bundles

-- First, identify orders with individual products and no bundles
INSERT INTO "product_bundles" (id, name, description, price, "categoryId", contents, stock, "isActive", "isFeatured", "showToCustomer", "createdAt", "updatedAt")
SELECT 
  'temp-product-' || p.id as id,
  p.name || ' (Individual Item)' as name,
  p.description || ' - Converted from individual product order' as description,
  p.price,
  p."categoryId",
  jsonb_build_array(
    jsonb_build_object(
      'name', p.name,
      'description', p.description,
      'image', p.image,
      'price', p.price,
      'quantity', 1
    )
  ) as contents,
  p.stock,
  p."isActive",
  p."isFeatured",
  p."showToCustomer",
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM "products" p
WHERE EXISTS (
  SELECT 1 FROM "order_items" oi 
  WHERE oi."productId" = p.id AND oi."bundleId" IS NULL
);

-- Step 4: Update order_items to reference the new bundles instead of products
UPDATE "order_items" 
SET "bundleId" = 'temp-product-' || "productId"
WHERE "productId" IS NOT NULL AND "bundleId" IS NULL;

-- Step 5: Now it's safe to make bundleId required and drop productId
ALTER TABLE "order_items" ALTER COLUMN "bundleId" SET NOT NULL;

-- Step 6: Drop foreign key constraints before dropping columns/tables
ALTER TABLE "bundle_items" DROP CONSTRAINT "bundle_items_bundleId_fkey";
ALTER TABLE "bundle_items" DROP CONSTRAINT "bundle_items_productId_fkey";
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_productId_fkey";
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_bundleId_fkey";

-- Step 7: Drop the productId column and related index
DROP INDEX "order_items_productId_idx";
ALTER TABLE "order_items" DROP COLUMN "productId";

-- Step 8: Drop bundle_items table (data already migrated to contents)
DROP TABLE "bundle_items";

-- Step 9: Re-add the foreign key constraint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "product_bundles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
