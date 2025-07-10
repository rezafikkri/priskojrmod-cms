/*
  Warnings:

  - You are about to drop the `product_coupons` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_discounts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "product_coupons" DROP CONSTRAINT "product_coupons_product_id_fkey";

-- DropForeignKey
ALTER TABLE "product_discounts" DROP CONSTRAINT "product_discounts_product_id_fkey";

-- DropTable
DROP TABLE "product_coupons";

-- DropTable
DROP TABLE "product_discounts";

-- CreateTable
CREATE TABLE "product_discount" (
    "id" SMALLSERIAL NOT NULL,
    "product_id" UUID NOT NULL,
    "discount" VARCHAR(4) NOT NULL,
    "expired_at" BIGINT NOT NULL,

    CONSTRAINT "product_discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_coupon" (
    "id" SMALLSERIAL NOT NULL,
    "product_id" UUID NOT NULL,
    "code" VARCHAR(150) NOT NULL,
    "discount" VARCHAR(4) NOT NULL,
    "expired_at" BIGINT NOT NULL,

    CONSTRAINT "product_coupon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_discount_product_id_key" ON "product_discount"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_coupon_product_id_key" ON "product_coupon"("product_id");

-- AddForeignKey
ALTER TABLE "product_discount" ADD CONSTRAINT "product_discount_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_coupon" ADD CONSTRAINT "product_coupon_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
