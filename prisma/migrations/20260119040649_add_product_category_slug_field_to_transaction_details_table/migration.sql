/*
  Warnings:

  - Added the required column `product_category_slug` to the `transaction_details` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transaction_details" ADD COLUMN     "product_category_slug" VARCHAR(100) NOT NULL;
