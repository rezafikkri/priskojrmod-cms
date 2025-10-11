/*
  Warnings:

  - You are about to drop the column `email` on the `owners` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `owners` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "owners" DROP COLUMN "email",
DROP COLUMN "location";
