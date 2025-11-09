/*
  Warnings:

  - The primary key for the `admins` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `admins` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `auth_id` to the `admins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `admins` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `admin_id` on the `donation_links` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `admin_id` on the `products` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "admin_role" AS ENUM ('owner', 'staff');

-- DropForeignKey
ALTER TABLE "public"."donation_links" DROP CONSTRAINT "donation_links_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."products" DROP CONSTRAINT "products_admin_id_fkey";

-- AlterTable
ALTER TABLE "admins" DROP CONSTRAINT "admins_pkey",
ADD COLUMN     "auth_id" VARCHAR(255) NOT NULL,
ADD COLUMN     "role" "admin_role" NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SMALLSERIAL NOT NULL,
ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "donation_links" DROP COLUMN "admin_id",
ADD COLUMN     "admin_id" SMALLINT NOT NULL;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "admin_id",
ADD COLUMN     "admin_id" SMALLINT NOT NULL;

-- AddForeignKey
ALTER TABLE "donation_links" ADD CONSTRAINT "donation_links_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
