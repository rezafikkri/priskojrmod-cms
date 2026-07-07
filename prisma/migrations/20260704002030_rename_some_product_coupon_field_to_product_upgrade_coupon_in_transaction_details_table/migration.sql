-- AlterTable
ALTER TABLE "transaction_details" RENAME COLUMN "product_coupon_id" TO "product_upgrade_coupon_id";
ALTER TABLE "transaction_details" RENAME COLUMN "product_coupon_code" TO "product_upgrade_coupon_code";
ALTER TABLE "transaction_details"
  RENAME COLUMN "product_coupon_discount" TO "product_upgrade_coupon_discount";
