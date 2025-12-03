/*
  Warnings:

  - You are about to drop the column `download_link` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `download_link` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `product_download_link` on the `transaction_details` table. All the data in the column will be lost.
  - You are about to drop the column `variant_download_link` on the `transaction_details` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "product_variants" DROP COLUMN "download_link",
ADD COLUMN     "download_url" TEXT;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "download_link",
ADD COLUMN     "download_url" TEXT;

-- AlterTable
ALTER TABLE "transaction_details" DROP COLUMN "product_download_link",
DROP COLUMN "variant_download_link",
ADD COLUMN     "product_download_url" TEXT,
ADD COLUMN     "variant_download_url" TEXT;
