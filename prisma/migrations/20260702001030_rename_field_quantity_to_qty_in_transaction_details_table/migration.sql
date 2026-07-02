/*
  Warnings:

  - You are about to drop the column `quantity` on the `transaction_details` table. All the data in the column will be lost.
  - Added the required column `qty` to the `transaction_details` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transaction_details" DROP COLUMN "quantity",
ADD COLUMN     "qty" SMALLINT NOT NULL;
