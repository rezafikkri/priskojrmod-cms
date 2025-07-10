/*
  Warnings:

  - Added the required column `created_at` to the `licenses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "licenses" ADD COLUMN     "created_at" BIGINT NOT NULL;
