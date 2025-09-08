/*
  Warnings:

  - You are about to drop the column `file_password` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `variant_file_password` on the `transaction_details` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "product_variants" DROP COLUMN "file_password",
ADD COLUMN     "file_access_password" VARCHAR(100);

-- AlterTable
ALTER TABLE "transaction_details" DROP COLUMN "variant_file_password",
ADD COLUMN     "variant_file_access_password" VARCHAR(100);
