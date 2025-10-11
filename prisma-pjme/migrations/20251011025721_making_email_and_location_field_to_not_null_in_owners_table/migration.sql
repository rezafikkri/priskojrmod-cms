/*
  Warnings:

  - Made the column `email` on table `owners` required. This step will fail if there are existing NULL values in that column.
  - Made the column `location` on table `owners` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "owners" ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "location" SET NOT NULL;
