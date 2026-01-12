/*
  Warnings:

  - You are about to drop the column `auth_id` on the `admins` table. All the data in the column will be lost.
  - You are about to drop the column `oauth_id` on the `customers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[google_user_id]` on the table `admins` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[google_user_id]` on the table `customers` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "admins_auth_id_key";

-- DropIndex
DROP INDEX "customers_oauth_id_key";

-- AlterTable
ALTER TABLE "admins" DROP COLUMN "auth_id",
ADD COLUMN     "google_user_id" VARCHAR(255);

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "oauth_id",
ADD COLUMN     "google_user_id" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "admins_google_user_id_key" ON "admins"("google_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_google_user_id_key" ON "customers"("google_user_id");
