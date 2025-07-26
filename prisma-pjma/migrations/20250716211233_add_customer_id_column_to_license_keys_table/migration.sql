/*
  Warnings:

  - A unique constraint covering the columns `[customer_id,secret_key_id]` on the table `license_keys` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customer_id` to the `license_keys` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "license_keys_email_secret_key_id_key";

-- AlterTable
ALTER TABLE "license_keys" ADD COLUMN     "customer_id" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "license_keys_customer_id_secret_key_id_key" ON "license_keys"("customer_id", "secret_key_id");
