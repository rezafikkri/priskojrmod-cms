/*
  Warnings:

  - A unique constraint covering the columns `[product_id,version]` on the table `product_versions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `product_version` to the `transaction_details` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transaction_details" ADD COLUMN     "product_coupon_code" VARCHAR(150),
ADD COLUMN     "product_download_link" TEXT,
ADD COLUMN     "product_drive_file_id" TEXT,
ADD COLUMN     "product_version" VARCHAR(50) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "product_versions_product_id_version_key" ON "product_versions"("product_id", "version");
