-- Rename table
ALTER TABLE "product_coupon" RENAME TO "product_upgrade_coupon";

-- Rename primary key constraint
ALTER TABLE "product_upgrade_coupon" RENAME CONSTRAINT "product_coupon_pkey" TO "product_upgrade_coupon_pkey";

-- Rename foreign key constraint
ALTER TABLE "product_upgrade_coupon" RENAME CONSTRAINT "product_coupon_product_id_fkey" TO "product_upgrade_coupon_product_id_fkey";

-- Rename unique index
ALTER INDEX "product_coupon_product_id_key" RENAME TO "product_upgrade_coupon_product_id_key";
