/*
  Warnings:

  - You are about to drop the column `admin_id` on the `donation_links` table. All the data in the column will be lost.
  - Added the required column `owner_id` to the `donation_links` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "donation_links" DROP CONSTRAINT "donation_links_admin_id_fkey";

-- AlterTable
ALTER TABLE "donation_links" DROP COLUMN "admin_id",
ADD COLUMN     "owner_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "donation_links" ADD CONSTRAINT "donation_links_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
