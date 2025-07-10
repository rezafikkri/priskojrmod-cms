/*
  Warnings:

  - The primary key for the `product_coupons` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `product_coupons` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `product_discounts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `product_discounts` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "product_coupons" DROP CONSTRAINT "product_coupons_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SMALLSERIAL NOT NULL,
ADD CONSTRAINT "product_coupons_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "product_discounts" DROP CONSTRAINT "product_discounts_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SMALLSERIAL NOT NULL,
ADD CONSTRAINT "product_discounts_pkey" PRIMARY KEY ("id");
