/*
  Warnings:

  - You are about to drop the column `changelog` on the `product_translations` table. All the data in the column will be lost.
  - You are about to drop the column `released_at` on the `products` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "transaction_status" AS ENUM ('pending', 'paid', 'cancelled', 'refund');

-- CreateEnum
CREATE TYPE "share_method" AS ENUM ('download_link', 'drive_share', 'manual_required');

-- AlterTable
ALTER TABLE "product_translations" DROP COLUMN "changelog";

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "file_password" VARCHAR(100),
ALTER COLUMN "download_link" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "released_at",
ADD COLUMN     "drive_file_id" TEXT,
ADD COLUMN     "is_buy_disabled" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "download_link" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "product_versions" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "released_at" BIGINT NOT NULL,

    CONSTRAINT "product_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_version_translations" (
    "id" UUID NOT NULL,
    "product_version_id" UUID NOT NULL,
    "language" "language" NOT NULL,
    "changelog" TEXT,

    CONSTRAINT "product_version_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "customer_id" UUID,
    "status" "transaction_status" NOT NULL,
    "created_at" BIGINT NOT NULL,
    "updated_at" BIGINT NOT NULL,
    "currency_code" "currency_code" NOT NULL,
    "total_amount" INTEGER NOT NULL,
    "customer_name" VARCHAR(200) NOT NULL,
    "customer_email" VARCHAR(254) NOT NULL,
    "customer_phone_number" VARCHAR(20),

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_details" (
    "id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "product_id" UUID,
    "product_price_id" UUID,
    "product_coupon_id" SMALLINT,
    "quantity" SMALLINT NOT NULL,
    "product_name" VARCHAR(150) NOT NULL,
    "product_variant" VARCHAR(100) NOT NULL,
    "variant_download_link" TEXT,
    "variant_file_password" VARCHAR(100),
    "product_currency_code" "currency_code" NOT NULL,
    "product_price" INTEGER NOT NULL,
    "product_discount" SMALLINT,
    "product_coupon_discount" SMALLINT,
    "share_method" "share_method",
    "shared_at" BIGINT,

    CONSTRAINT "transaction_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transactions_code_key" ON "transactions"("code");

-- AddForeignKey
ALTER TABLE "product_versions" ADD CONSTRAINT "product_versions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_version_translations" ADD CONSTRAINT "product_version_translations_product_version_id_fkey" FOREIGN KEY ("product_version_id") REFERENCES "product_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_details" ADD CONSTRAINT "transaction_details_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
