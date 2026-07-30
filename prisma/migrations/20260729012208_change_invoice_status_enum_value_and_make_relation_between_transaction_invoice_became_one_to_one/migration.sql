/*
  Warnings:

  - The values [active,void] on the enum `invoice_status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `voided_at` on the `invoices` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[transaction_id]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "invoice_status_new" AS ENUM ('unpaid', 'paid', 'cancelled', 'refund');
ALTER TABLE "invoices" ALTER COLUMN "status" TYPE "invoice_status_new" USING ("status"::text::"invoice_status_new");
ALTER TYPE "invoice_status" RENAME TO "invoice_status_old";
ALTER TYPE "invoice_status_new" RENAME TO "invoice_status";
DROP TYPE "public"."invoice_status_old";
COMMIT;

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "voided_at";

-- CreateIndex
CREATE UNIQUE INDEX "invoices_transaction_id_key" ON "invoices"("transaction_id");
