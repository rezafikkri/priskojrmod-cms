/*
  Warnings:

  - The primary key for the `product_coupon` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `product_coupon_id` column on the `transaction_details` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `id` on the `product_coupon` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "product_coupon" DROP CONSTRAINT "product_coupon_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "product_coupon_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "transaction_details" DROP COLUMN "product_coupon_id",
ADD COLUMN     "product_coupon_id" UUID;
