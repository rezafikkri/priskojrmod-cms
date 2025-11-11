/*
  Warnings:

  - Added the required column `created_at` to the `admins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `admins` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "created_at" INTEGER NOT NULL,
ADD COLUMN     "updated_at" INTEGER NOT NULL;
