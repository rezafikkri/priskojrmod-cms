/*
  Warnings:

  - You are about to drop the column `link` on the `donation_links` table. All the data in the column will be lost.
  - Added the required column `url` to the `donation_links` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "donation_links" DROP COLUMN "link",
ADD COLUMN     "url" VARCHAR(100) NOT NULL;
