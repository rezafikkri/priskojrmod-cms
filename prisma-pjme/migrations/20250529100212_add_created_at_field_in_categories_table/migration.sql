/*
  Warnings:

  - Added the required column `created_at` to the `categories` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "created_at" BIGINT NOT NULL;
