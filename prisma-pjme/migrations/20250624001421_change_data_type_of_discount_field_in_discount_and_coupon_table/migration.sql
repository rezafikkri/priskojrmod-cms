/*
  Warnings:

  - Changed the type of `discount` on the `product_coupon` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `discount` on the `product_discount` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "product_coupon" DROP COLUMN "discount",
ADD COLUMN     "discount" SMALLINT NOT NULL;

-- AlterTable
ALTER TABLE "product_discount" DROP COLUMN "discount",
ADD COLUMN     "discount" SMALLINT NOT NULL;
