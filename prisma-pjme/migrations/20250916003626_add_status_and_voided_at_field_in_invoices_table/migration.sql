/*
  Warnings:

  - Added the required column `status` to the `invoices` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "invoice_status" AS ENUM ('active', 'void');

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "status" "invoice_status" NOT NULL,
ADD COLUMN     "voided_at" BIGINT;
