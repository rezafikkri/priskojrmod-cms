/*
  Warnings:

  - Made the column `product_id` on table `transaction_details` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `admin_email` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `admin_id` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transaction_details" ALTER COLUMN "product_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "admin_email" VARCHAR(254) NOT NULL,
ADD COLUMN     "admin_id" VARCHAR(255) NOT NULL;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_details" ADD CONSTRAINT "transaction_details_product_price_id_fkey" FOREIGN KEY ("product_price_id") REFERENCES "product_prices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
