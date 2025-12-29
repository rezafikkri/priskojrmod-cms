/*
  Warnings:

  - Added the required column `support_email` to the `about_us` table without a default value. This is not possible if the table is not empty.
  - Added the required column `support_whatsapp` to the `about_us` table without a default value. This is not possible if the table is not empty.
  - Added the required column `office_hours` to the `about_us_translations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "about_us" ADD COLUMN     "support_email" VARCHAR(254) NOT NULL,
ADD COLUMN     "support_whatsapp" VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE "about_us_translations" ADD COLUMN     "office_hours" VARCHAR(255) NOT NULL;
