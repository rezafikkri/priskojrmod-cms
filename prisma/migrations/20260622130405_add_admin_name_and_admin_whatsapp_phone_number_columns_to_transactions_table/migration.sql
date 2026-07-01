/*
  Warnings:

  - Added the required column `admin_name` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `admin_whatsapp_phone_number` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "admin_name" VARCHAR(200) NOT NULL,
ADD COLUMN     "admin_whatsapp_phone_number" VARCHAR(20) NOT NULL;
